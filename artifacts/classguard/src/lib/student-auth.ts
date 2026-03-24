import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type StudentProfile = {
  id: string;
  auth_user_id: string;
  enrollment_no: string;
  full_name: string;
  current_ip: string | null;
  device_fingerprint: string | null;
  device_label: string | null;
  device_bound_at: string | null;
  last_login_at: string | null;
  last_logout_at: string | null;
  created_at: string;
  updated_at: string;
};

const STUDENT_EMAIL_DOMAIN = "student.classguard.app";
const STUDENT_DEVICE_TOKEN_KEY = "classguard.student.device-token";

function normalizeEnrollment(enrollment: string): string {
  return enrollment.trim().toUpperCase();
}

function enrollmentToEmail(enrollment: string): string {
  return `${normalizeEnrollment(enrollment)}@${STUDENT_EMAIL_DOMAIN}`;
}

function extractAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      error_description?: string;
    };

    const parts = [
      record.message,
      record.details && record.details !== record.message ? record.details : null,
      record.hint,
      record.error_description,
      record.code ? `code ${record.code}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return "Student authentication failed.";
}

function toStudentAuthError(error: unknown): Error {
  const message = extractAuthErrorMessage(error);

  if (/invalid login credentials/i.test(message)) {
    return new Error(
      "Enrollment number or password is incorrect. Please check both and try again.",
    );
  }

  if (/email not confirmed/i.test(message)) {
    return new Error(
      "This student account cannot log in until email confirmation is disabled in Supabase Auth for enrollment-based login.",
    );
  }

  if (
    /student_profiles_device_fingerprint_unique_idx/i.test(message) ||
    /this device is already linked to another student account/i.test(message)
  ) {
    return new Error(
      "This device is already registered with another enrollment. Ask the teacher to reset device binding before using a different enrollment here.",
    );
  }

  if (/this enrollment is already bound to another device/i.test(message)) {
    return new Error(
      "This enrollment is already registered on another device. Ask the teacher to reset that enrollment before logging in here.",
    );
  }

  if (/this enrollment number is already linked to another student account/i.test(message)) {
    return new Error(
      "This enrollment number has already been used to create another student account. Please log in with that account or ask the teacher to reset it.",
    );
  }

  if (/unable to fetch your public ip address/i.test(message)) {
    return new Error(
      "Your network details could not be detected right now. Check your internet connection and try again.",
    );
  }

  if (/device storage is unavailable/i.test(message)) {
    return new Error(
      "This browser is blocking device storage, so secure student login cannot continue here.",
    );
  }

  return new Error(message);
}

async function fetchPublicIp(): Promise<string> {
  const endpoints = [
    "https://api.ipify.org?format=json",
    "https://api64.ipify.org?format=json",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) continue;
      const payload = (await response.json()) as { ip?: string };
      if (payload.ip) return payload.ip;
    } catch {
      continue;
    }
  }

  throw new Error("Unable to fetch your public IP address right now.");
}

function getStoredDeviceToken(): string {
  if (typeof window === "undefined") {
    throw new Error("Device storage is unavailable outside the browser.");
  }

  const existingToken = window.localStorage.getItem(STUDENT_DEVICE_TOKEN_KEY);
  if (existingToken) {
    return existingToken;
  }

  const nextToken =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(STUDENT_DEVICE_TOKEN_KEY, nextToken);
  return nextToken;
}

async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return value;
  }

  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((chunk) => chunk.toString(16).padStart(2, "0"))
    .join("");
}

async function getCurrentDeviceContext(): Promise<{
  currentIp: string | null;
  deviceFingerprint: string;
  deviceLabel: string;
}> {
  const token = getStoredDeviceToken();
  const currentIpResult = await Promise.allSettled([fetchPublicIp()]);
  const currentIp =
    currentIpResult[0]?.status === "fulfilled" ? currentIpResult[0].value : null;

  const fingerprintSeed = [
    token,
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    String(screen.width),
    String(screen.height),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ""),
    String(navigator.maxTouchPoints ?? ""),
  ].join("|");

  const deviceFingerprint = await sha256Hex(fingerprintSeed);
  const deviceLabel = [
    navigator.platform || "Unknown Platform",
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join(" | ");

  return {
    currentIp,
    deviceFingerprint,
    deviceLabel,
  };
}

async function getProfileByUserId(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load student profile: ${error.message}`);
  }

  return (data ?? null) as StudentProfile | null;
}

async function assertStudentAccessAvailable(input: {
  enrollmentNo: string;
  deviceFingerprint: string;
}): Promise<void> {
  const { error } = await supabase.rpc("assert_student_access_available", {
    p_current_ip: null,
    p_device_fingerprint: input.deviceFingerprint,
    p_enrollment_no: normalizeEnrollment(input.enrollmentNo),
  });

  if (error) {
    throw toStudentAuthError(error);
  }
}

async function claimStudentAccessLock(input: {
  user: User;
  enrollmentNo: string,
  fullName: string;
  currentIp: string | null;
  deviceFingerprint: string;
  deviceLabel: string;
}): Promise<StudentProfile> {
  const { data, error } = await supabase.rpc("claim_student_access_lock", {
    p_auth_user_id: input.user.id,
    p_enrollment_no: normalizeEnrollment(input.enrollmentNo),
    p_full_name: input.fullName.trim(),
    p_current_ip: input.currentIp,
    p_device_fingerprint: input.deviceFingerprint,
    p_device_label: input.deviceLabel,
  });

  if (error) {
    throw toStudentAuthError(error);
  }

  if (!data) {
    throw toStudentAuthError(
      "Device binding could not be completed for this enrollment. Please try again.",
    );
  }

  return data as StudentProfile;
}

async function finalizeStudentSession(input: {
  session: Session;
  user: User;
  enrollmentNo: string;
  fullName: string;
  currentIp: string | null;
  deviceFingerprint: string;
  deviceLabel: string;
}): Promise<{ session: Session; profile: StudentProfile; currentIp: string | null }> {
  try {
    const profile = await claimStudentAccessLock({
      user: input.user,
      enrollmentNo: input.enrollmentNo,
      fullName: input.fullName,
      currentIp: input.currentIp,
      deviceFingerprint: input.deviceFingerprint,
      deviceLabel: input.deviceLabel,
    });

    return {
      session: input.session,
      profile,
      currentIp: input.currentIp,
    };
  } catch (error) {
    await supabase.auth.signOut();
    throw toStudentAuthError(error);
  }
}

export async function signUpStudent(input: {
  enrollmentNo: string;
  fullName: string;
  password: string;
}): Promise<{ session: Session; profile: StudentProfile; currentIp: string | null }> {
  const deviceContext = await getCurrentDeviceContext();
  const enrollmentNo = normalizeEnrollment(input.enrollmentNo);
  const email = enrollmentToEmail(enrollmentNo);

  await assertStudentAccessAvailable({
    enrollmentNo,
    deviceFingerprint: deviceContext.deviceFingerprint,
  });

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        enrollment_no: enrollmentNo,
        full_name: input.fullName.trim(),
      },
    },
  });

  if (signUpError && !/already registered/i.test(signUpError.message)) {
    throw new Error(signUpError.message);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (signInError) {
    throw new Error(
      `${signInError.message}. If you enabled email confirmation in Supabase Auth, disable it for enrollment-based logins.`,
    );
  }

  const session = signInData.session;
  const user = signInData.user;

  if (!session || !user) {
    throw new Error("Unable to create a student session.");
  }

  return finalizeStudentSession({
    session,
    user,
    enrollmentNo,
    fullName: input.fullName,
    currentIp: deviceContext.currentIp,
    deviceFingerprint: deviceContext.deviceFingerprint,
    deviceLabel: deviceContext.deviceLabel,
  });
}

export async function signInStudent(input: {
  enrollmentNo: string;
  password: string;
}): Promise<{ session: Session; profile: StudentProfile; currentIp: string | null }> {
  const deviceContext = await getCurrentDeviceContext();
  const enrollmentNo = normalizeEnrollment(input.enrollmentNo);
  const email = enrollmentToEmail(enrollmentNo);

  await assertStudentAccessAvailable({
    enrollmentNo,
    deviceFingerprint: deviceContext.deviceFingerprint,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error("Unable to create a student session.");
  }

  const existingProfile = await getProfileByUserId(data.user.id);

  return finalizeStudentSession({
    session: data.session,
    user: data.user,
    enrollmentNo,
    fullName:
      existingProfile?.full_name ??
      (data.user.user_metadata["full_name"] as string | undefined) ??
      enrollmentNo,
    currentIp: deviceContext.currentIp,
    deviceFingerprint: deviceContext.deviceFingerprint,
    deviceLabel: deviceContext.deviceLabel,
  });
}

export async function releaseStudentIpLock(userId: string): Promise<void> {
  const { error } = await supabase.rpc("release_student_ip_lock", {
    p_auth_user_id: userId,
  });

  if (error) {
    throw toStudentAuthError(error);
  }
}

export async function signOutStudent(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await releaseStudentIpLock(data.user.id);
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function loadCurrentStudentState(): Promise<{
  session: Session | null;
  profile: StudentProfile | null;
  currentIp: string | null;
}> {
  const [sessionResult, deviceContextResult] = await Promise.allSettled([
    supabase.auth.getSession(),
    getCurrentDeviceContext(),
  ]);

  const session =
    sessionResult.status === "fulfilled"
      ? sessionResult.value.data.session
      : null;
  const currentIp =
    deviceContextResult.status === "fulfilled"
      ? deviceContextResult.value.currentIp
      : null;
  const deviceContext =
    deviceContextResult.status === "fulfilled" ? deviceContextResult.value : null;

  if (!session?.user) {
    return {
      session: null,
      profile: null,
      currentIp,
    };
  }

  const profile = await getProfileByUserId(session.user.id);

  if (profile && deviceContext) {
    try {
      await claimStudentAccessLock({
        user: session.user,
        enrollmentNo: profile.enrollment_no,
        fullName: profile.full_name,
        currentIp: deviceContext.currentIp,
        deviceFingerprint: deviceContext.deviceFingerprint,
        deviceLabel: deviceContext.deviceLabel,
      });
    } catch {
      await supabase.auth.signOut();
      return {
        session: null,
        profile: null,
        currentIp,
      };
    }
  }

  return {
    session,
    profile,
    currentIp,
  };
}

export { fetchPublicIp, normalizeEnrollment };
