import { defaultClasses } from "./default-classes";
import { supabase, studentSupabase, teacherSupabase } from "./supabase";

export type ReviewStatus = "draft" | "recheck_pending" | "finalized";
export type AttendanceStatus =
  | "pending"
  | "present"
  | "left_after_punch"
  | "absent"
  | "late_present";

type DbClass = {
  id: string;
  code: string;
  name: string;
  room: string | null;
  schedule_text: string | null;
  expected_students: number | null;
  color_start: string | null;
  color_end: string | null;
  allowed_wifi_name: string | null;
  allowed_wifi_public_ip: string | null;
  allowed_latitude: number | null;
  allowed_longitude: number | null;
  allowed_radius: number | null;
  quiz_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type DbSession = {
  id: string;
  class_id: string;
  session_date: string;
  source_file_name: string | null;
  upload_count: number;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

type DbRecord = {
  id: string;
  session_id: string;
  roll_number: string;
  student_name: string;
  punched_at: string | null;
  status: AttendanceStatus;
  note: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbStudentMark = {
  id: string;
  session_id: string;
  roll_number: string;
  student_name: string;
  marked_at: string;
  created_at: string;
  updated_at: string;
};

export type ImportedPunchRow = {
  rollNumber: string;
  studentName: string;
  punchedAt: string | null;
};

export type DashboardStats = {
  score: number;
  activeClasses: number;
  verifiedPresent: number;
  flaggedToday: number;
  totalStudents: number;
  enrollmentTrend: number;
  breakdown: {
    verified: number;
    questionable: number;
    absent: number;
  };
};

export type SessionChartData = {
  day: string;
  present: number;
  questionable: number;
  absent: number;
};

export type StudentCheckIn = {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl: string;
  time: string;
  status: "verified" | "questionable" | "absent";
  className: string;
};

export type ActiveSession = {
  sessionId: string | null;
  classId: string | null;
  className: string;
  room: string;
  studentsCount: number;
  markedCount: number;
  timeElapsed: string;
  isActive: boolean;
};

export type DashboardResponse = {
  stats: DashboardStats;
  chart: SessionChartData[];
  recentStudents: StudentCheckIn[];
  activeSession: ActiveSession;
};

export type QuizQuestion = {
  id?: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
};

export type Quiz = {
  id: string;
  class_id: string;
  title: string;
  questions: QuizQuestion[];
};

export type ClassSummary = {
  id: string;
  code: string;
  name: string;
  room: string;
  scheduleText: string;
  expectedStudents: number;
  colorStart: string;
  colorEnd: string;
  latestSessionId: string | null;
  latestSessionDate: string | null;
  reviewStatus: ReviewStatus | null;
  allowedWifiName: string | null;
  allowedWifiPublicIp: string | null;
  allowedLatitude: number | null;
  allowedLongitude: number | null;
  allowedRadius: number | null;
  quizEnabled: boolean;
  status: "active" | "scheduled" | "ended";
  uploadedCount: number;
  verifiedCount: number;
  questionableCount: number;
  absentCount: number;
  attendanceRate: number;
};

export type SessionPayload = {
  session: {
    id: string;
    classId: string;
    className: string;
    classCode: string;
    room: string;
    quizEnabled: boolean;
    allowedWifiName: string | null;
    allowedWifiPublicIp: string | null;
    allowedLatitude: number | null;
    allowedLongitude: number | null;
    allowedRadius: number | null;
    sessionDate: string;
    sourceFileName: string;
    uploadCount: number;
    reviewStatus: ReviewStatus;
    createdAt: string;
    updatedAt: string;
    studentMarkedCount: number;
    matchedCount: number;
    punchOnlyCount: number;
    markOnlyCount: number;
    uploadedCount: number;
    verifiedCount: number;
    questionableCount: number;
    absentCount: number;
    pendingCount: number;
    attendanceRate: number;
  };
  records: Array<{
    id: string;
    rollNumber: string;
    studentName: string;
    punchedAt: string | null;
    studentMarked: boolean;
    markedAt: string | null;
    markedName: string | null;
    status: AttendanceStatus;
    note: string | null;
    normalizedStatus: "present" | "questionable" | "absent";
    avatarUrl: string;
    updatedAt: string;
  }>;
  unmatchedStudentMarks: Array<{
    id: string;
    rollNumber: string;
    studentName: string;
    markedAt: string;
    avatarUrl: string;
  }>;
};

export type UploadedWorkbookHistoryItem = {
  id: string;
  classId: string;
  classCode: string;
  className: string;
  sessionDate: string;
  sourceFileName: string;
  uploadCount: number;
  reviewStatus: ReviewStatus;
  importedAt: string;
  updatedAt: string;
};

export type ReportsResponse = {
  summary: {
    total: number;
    present: number;
    questionable: number;
    absent: number;
  };
  classOptions: Array<{
    id: string;
    label: string;
  }>;
  records: Array<{
    id: string;
    student: string;
    rollNo: string;
    classId: string;
    classLabel: string;
    date: string;
    checkIn: string;
    reviewedAt: string | null;
    status: "present" | "questionable" | "absent";
    rawStatus: AttendanceStatus;
    note: string | null;
  }>;
};

export type AnalyticsResponse = {
  kpis: Array<{
    label: string;
    value: string;
    change: string;
    up: boolean;
    tone: "primary" | "warning" | "destructive" | "success";
  }>;
  weeklyTrend: Array<{
    week: string;
    present: number;
    questionable: number;
    absent: number;
  }>;
  dailyCheckins: Array<{
    time: string;
    count: number;
  }>;
  classComparison: Array<{
    name: string;
    rate: number;
  }>;
  pieData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  atRiskStudents: Array<{
    name: string;
    rollNo: string;
    cls: string;
    absences: number;
    rate: number;
    trend: "up" | "down";
  }>;
};

let seedPromise: Promise<void> | null = null;

function getErrorMessage(error: { message?: string } | null): string {
  return error?.message ?? "Unknown Supabase error";
}

function getStudentMarkErrorMessage(error: { message?: string } | null): string {
  const message = getErrorMessage(error);

  if (/student login is required before marking attendance/i.test(message)) {
    return "Please log in with your student account before marking attendance.";
  }

  if (/student profile not found for this login/i.test(message)) {
    return "Your student profile could not be loaded. Please log out and log in again.";
  }

  if (/attendance session not found/i.test(message)) {
    return "This attendance session is no longer available. Ask the teacher to reopen it.";
  }

  if (/this class only allows attendance from public ip/i.test(message)) {
    const match = message.match(/public ip\s+(.+?)[\.\n]?$/i);
    const ip = match?.[1]?.replace(/^["']|["']$/g, "") ?? null;
    return ip
      ? `Attendance can only be marked from public IP ${ip}.`
      : "Attendance can only be marked from the approved class network.";
  }

  return message;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeStatus(
  status: AttendanceStatus,
): "present" | "questionable" | "absent" {
  if (status === "present" || status === "late_present") {
    return "present";
  }

  if (status === "absent" || status === "pending") {
    return "absent";
  }

  return "questionable";
}

function summarizeRecords(records: DbRecord[]) {
  let verifiedCount = 0;
  let questionableCount = 0;
  let absentCount = 0;
  let pendingCount = 0;

  for (const record of records) {
    const status = record.status;
    if (status === "present" || status === "late_present") {
      verifiedCount++;
    } else if (status === "left_after_punch" || status === "pending") {
      questionableCount++;
      if (status === "pending") pendingCount++;
    } else if (status === "absent") {
      absentCount++;
    }
  }

  const uploadedCount = records.length;
  const attendanceRate =
    uploadedCount === 0 ? 0 : roundPercentage((verifiedCount / uploadedCount) * 100);

  return {
    uploadedCount,
    verifiedCount,
    questionableCount,
    absentCount,
    pendingCount,
    attendanceRate,
  };
}

function timeElapsedSince(isoString: string): string {
  const startedAt = new Date(isoString).getTime();
  const diff = Math.max(Date.now() - startedAt, 0);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function buildAvatarUrl(rollNumber: string): string {
  const avatars = [
    "/images/avatar-1.png",
    "/images/avatar-2.png",
    "/images/avatar-3.png",
    "/images/avatar-4.png",
  ];
  const sum = [...rollNumber].reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatars[sum % avatars.length] ?? avatars[0];
}

function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
}

async function ensureDefaultClasses(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const { error } = await supabase
        .from("classes")
        .upsert(defaultClasses, { onConflict: "code" });

      if (error) {
        throw new Error(`Unable to seed classes: ${getErrorMessage(error)}`);
      }
    })();
  }

  await seedPromise;
}

async function loadClasses(): Promise<DbClass[]> {
  await ensureDefaultClasses();

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    throw new Error(`Unable to fetch classes: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as DbClass[];
}

async function loadClassOrThrow(classId: string): Promise<DbClass> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch class: ${getErrorMessage(error)}`);
  }

  return requireValue(data as DbClass | null, "Class not found");
}

async function loadSessionsForClassIds(classIds: string[]): Promise<DbSession[]> {
  if (classIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .in("class_id", classIds)
    .order("session_date", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch attendance sessions: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as DbSession[];
}

async function loadRecordsForSessionIds(sessionIds: string[], columns = "*"): Promise<DbRecord[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("attendance_records")
    .select(columns)
    .in("session_id", sessionIds)
    .order("student_name", { ascending: true });

  if (error) {
    throw new Error(`Unable to fetch attendance records: ${getErrorMessage(error)}`);
  }

  // The previous cast (`as DbRecord[]`) errored when supabase returns `data` that typescript infers weirdly.
  // Casting to `unknown` first resolves this TS complaint.
  return (data ?? []) as unknown as DbRecord[];
}

async function loadStudentMarksForSessionIds(
  sessionIds: string[],
): Promise<DbStudentMark[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("attendance_student_marks")
    .select("*")
    .in("session_id", sessionIds)
    .order("marked_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch student marks: ${getErrorMessage(error)}`);
  }

  return (data ?? []) as DbStudentMark[];
}

async function loadLatestSessionForClass(classId: string): Promise<DbSession | null> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("class_id", classId)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch latest session: ${getErrorMessage(error)}`);
  }

  return (data ?? null) as DbSession | null;
}

function buildClassSummaries(
  classes: DbClass[],
  sessions: DbSession[],
  records: DbRecord[],
) {
  const today = todayIsoDate();
  const latestSessionByClass = new Map<string, DbSession>();
  const recordsBySession = new Map<string, DbRecord[]>();

  for (const session of sessions) {
    if (!latestSessionByClass.has(session.class_id)) {
      latestSessionByClass.set(session.class_id, session);
    }
  }

  for (const record of records) {
    const bucket = recordsBySession.get(record.session_id);
    if (bucket) {
      bucket.push(record);
    } else {
      recordsBySession.set(record.session_id, [record]);
    }
  }

  return classes.map((classItem) => {
    const latestSession = latestSessionByClass.get(classItem.id) ?? null;
    const latestRecords = latestSession
      ? (recordsBySession.get(latestSession.id) ?? [])
      : [];
    const summary = summarizeRecords(latestRecords);

    let status: "active" | "scheduled" | "ended" = "scheduled";
    if (latestSession) {
      status =
        latestSession.session_date === today &&
        latestSession.review_status !== "finalized"
          ? "active"
          : "ended";
    }

    return {
      id: classItem.id,
      code: classItem.code,
      name: classItem.name,
      room: classItem.room ?? "Room not set",
      scheduleText: classItem.schedule_text ?? "Schedule not set",
      expectedStudents: classItem.expected_students ?? 0,
      colorStart: classItem.color_start ?? "#6366f1",
      colorEnd: classItem.color_end ?? "#7c3aed",
      latestSessionId: latestSession?.id ?? null,
      latestSessionDate: latestSession?.session_date ?? null,
      reviewStatus: latestSession?.review_status ?? null,
      allowedWifiName: classItem.allowed_wifi_name ?? null,
      allowedWifiPublicIp: classItem.allowed_wifi_public_ip ?? null,
      allowedLatitude: classItem.allowed_latitude ?? null,
      allowedLongitude: classItem.allowed_longitude ?? null,
      allowedRadius: classItem.allowed_radius ?? null,
      quizEnabled: classItem.quiz_enabled ?? false,
      status,
      ...summary,
    } satisfies ClassSummary;
  });
}

function cleanPunchRows(rows: ImportedPunchRow[]): ImportedPunchRow[] {
  const deduped = new Map<string, ImportedPunchRow>();

  for (const row of rows) {
    const rollNumber = row.rollNumber.trim().toUpperCase();
    const studentName = row.studentName.trim();
    const punchedAt = row.punchedAt?.trim() ? row.punchedAt.trim() : null;

    if (!rollNumber || !studentName) {
      continue;
    }

    deduped.set(rollNumber, { rollNumber, studentName, punchedAt });
  }

  const cleaned = [...deduped.values()];
  if (cleaned.length === 0) {
    throw new Error(
      "The upload did not contain usable rows. Make sure the sheet has roll number and student name columns.",
    );
  }

  return cleaned;
}

function formatSessionPayload(
  classItem: DbClass,
  session: DbSession,
  records: DbRecord[],
  studentMarks: DbStudentMark[],
): SessionPayload {
  const summary = summarizeRecords(records);
  const markByRoll = new Map(
    studentMarks.map((mark) => [mark.roll_number.toUpperCase(), mark]),
  );
  const uploadedRolls = new Set(records.map((record) => record.roll_number.toUpperCase()));
  const markedRolls = new Set(studentMarks.map((mark) => mark.roll_number.toUpperCase()));
  const matchedCount = [...markedRolls].filter((roll) => uploadedRolls.has(roll)).length;
  const punchOnlyCount = [...uploadedRolls].filter((roll) => !markedRolls.has(roll)).length;
  const markOnlyCount = [...markedRolls].filter((roll) => !uploadedRolls.has(roll)).length;

  return {
    session: {
      id: session.id,
      classId: classItem.id,
      className: classItem.name,
      classCode: classItem.code,
      room: classItem.room ?? "Room not set",
      allowedWifiName: classItem.allowed_wifi_name ?? null,
      allowedWifiPublicIp: classItem.allowed_wifi_public_ip ?? null,
      allowedLatitude: classItem.allowed_latitude ?? null,
      allowedLongitude: classItem.allowed_longitude ?? null,
      allowedRadius: classItem.allowed_radius ?? null,
      quizEnabled: classItem.quiz_enabled ?? false,
      sessionDate: session.session_date,
      sourceFileName: session.source_file_name ?? "Imported file",
      uploadCount: session.upload_count,
      reviewStatus: session.review_status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      studentMarkedCount: studentMarks.length,
      matchedCount,
      punchOnlyCount,
      markOnlyCount,
      ...summary,
    },
    records: records.map((record) => ({
      id: record.id,
      rollNumber: record.roll_number,
      studentName: record.student_name,
      punchedAt: record.punched_at,
      studentMarked: markByRoll.has(record.roll_number.toUpperCase()),
      markedAt: markByRoll.get(record.roll_number.toUpperCase())?.marked_at ?? null,
      markedName: markByRoll.get(record.roll_number.toUpperCase())?.student_name ?? null,
      status: record.status,
      note: record.note,
      normalizedStatus: normalizeStatus(record.status),
      avatarUrl: buildAvatarUrl(record.roll_number),
      updatedAt: record.updated_at,
    })),
    unmatchedStudentMarks: studentMarks
      .filter((mark) => !uploadedRolls.has(mark.roll_number.toUpperCase()))
      .map((mark) => ({
        id: mark.id,
        rollNumber: mark.roll_number,
        studentName: mark.student_name,
        markedAt: mark.marked_at,
        avatarUrl: buildAvatarUrl(mark.roll_number),
      })),
  };
}

async function getSessionDetails(
  sessionId: string,
  classItem?: DbClass,
  session?: DbSession,
): Promise<SessionPayload> {
  let resolvedSession = session;
  if (!resolvedSession) {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to fetch attendance session: ${getErrorMessage(error)}`);
    }
    resolvedSession = requireValue(data as DbSession | null, "Attendance session not found");
  }

  const classItemPromise = classItem ? Promise.resolve(classItem) : loadClassOrThrow(resolvedSession.class_id);

  const [resolvedClass, records, studentMarks] = await Promise.all([
    classItemPromise,
    loadRecordsForSessionIds([resolvedSession.id]),
    loadStudentMarksForSessionIds([resolvedSession.id])
  ]);

  return formatSessionPayload(resolvedClass, resolvedSession, records, studentMarks);
}

async function loadOperationalDataset(daysBack = 30) {
  const classes = await loadClasses();
  if (classes.length === 0) return { classes: [], sessions: [], records: [], studentMarks: [] };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data: sessions, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("*")
    .gte("session_date", cutoffIso)
    .order("session_date", { ascending: false });

  if (sessionError) throw new Error(getErrorMessage(sessionError));
  
  const fetchedSessions = (sessions ?? []) as DbSession[];
  const sessionIds = fetchedSessions.map((session) => session.id);

  if (sessionIds.length === 0) {
    return { classes, sessions: fetchedSessions, records: [], studentMarks: [] };
  }

  const [records, studentMarks] = await Promise.all([
    loadRecordsForSessionIds(sessionIds),
    loadStudentMarksForSessionIds(sessionIds),
  ]);

  return { classes, sessions: fetchedSessions, records, studentMarks };
}

export async function getClasses(): Promise<ClassSummary[]> {
  const classes = await loadClasses();
  if (classes.length === 0) return [];

  const classIds = classes.map((item) => item.id);

  // Optimization: Instead of fetching ALL sessions for ALL classes,
  // we fetch ONLY the latest session for each class by using a smarter query.
  // Although Supabase JS doesn't support DISTINCT ON, we can limit the data
  // by only fetching sessions from the last 30 days for the summary, 
  // which covers 99% of active use cases.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45); // 45 days is plenty for a dashboard summary
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const [sessionsResult, recentlyMarkedResult] = await Promise.all([
    supabase
      .from("attendance_sessions")
      .select("*")
      .in("class_id", classIds)
      .gte("session_date", cutoffIso)
      .order("session_date", { ascending: false }),
    supabase
      .from("attendance_student_marks")
      .select("session_id, roll_number")
      .gte("created_at", cutoffIso)
  ]);

  const sessions = (sessionsResult.data ?? []) as DbSession[];
  
  // Get the absolute latest session ID for each class to fetch their records
  const latestSessionIds = classes.map(c => 
    sessions.find(s => s.class_id === c.id)?.id
  ).filter(Boolean) as string[];

  // Only fetch records for the LATEST sessions
  // Optimization: Select only status and session_id since we only need counts for the summary
  const records = await loadRecordsForSessionIds(latestSessionIds, "id, session_id, status");

  return buildClassSummaries(classes, sessions, records);
}

export async function getLatestSession(classId: string): Promise<SessionPayload | null> {
  // Ultra-fast single trip query for latest session and all related records
  const { data: session, error } = await supabase
    .from("attendance_sessions")
    .select(`
      *,
      classes (*),
      attendance_records (*),
      attendance_student_marks (*)
    `)
    .eq("class_id", classId)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch latest session: ${getErrorMessage(error)}`);
  }

  if (!session) {
    return null;
  }

  // Use JS sort to replicate the DB sorting
  const records = ((session as any).attendance_records ?? []).sort((a: any, b: any) => 
    a.student_name.localeCompare(b.student_name)
  );
  
  const studentMarks = ((session as any).attendance_student_marks ?? []).sort((a: any, b: any) => 
    new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime()
  );

  const resolvedClass = Array.isArray((session as any).classes) 
    ? (session as any).classes[0] 
    : (session as any).classes;

  return formatSessionPayload(
    resolvedClass as DbClass, 
    session as DbSession, 
    records as DbRecord[], 
    studentMarks as DbStudentMark[]
  );
}

export async function getClassUploadHistory(
  classId: string,
): Promise<UploadedWorkbookHistoryItem[]> {
  const classItem = await loadClassOrThrow(classId);
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("class_id", classId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Unable to fetch upload history: ${getErrorMessage(error)}`);
  }

  return ((data ?? []) as DbSession[]).map((session) => ({
    id: session.id,
    classId: classItem.id,
    classCode: classItem.code,
    className: classItem.name,
    sessionDate: session.session_date,
    sourceFileName: session.source_file_name ?? "Imported file",
    uploadCount: session.upload_count,
    reviewStatus: session.review_status,
    importedAt: session.created_at,
    updatedAt: session.updated_at,
  }));
}

export async function deleteUploadedWorkbook(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("attendance_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Unable to delete uploaded workbook: ${getErrorMessage(error)}`);
  }
}

export async function clearClassUploadHistory(classId: string): Promise<void> {
  const { error } = await supabase
    .from("attendance_sessions")
    .delete()
    .eq("class_id", classId);

  if (error) {
    throw new Error(`Unable to clear upload history: ${getErrorMessage(error)}`);
  }
}

export async function createClass(payload: {
  code: string;
  name: string;
  room?: string | null;
  scheduleText?: string | null;
  expectedStudents?: number;
  colorStart?: string;
  colorEnd?: string;
  allowedWifiName?: string | null;
  allowedWifiPublicIp?: string | null;
}) {
  const { data, error } = await supabase
    .from("classes")
    .insert({
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      room: payload.room ?? null,
      schedule_text: payload.scheduleText ?? null,
      expected_students: payload.expectedStudents ?? 0,
      color_start: payload.colorStart ?? "#6366f1",
      color_end: payload.colorEnd ?? "#7c3aed",
      allowed_wifi_name: null,
      allowed_wifi_public_ip: payload.allowedWifiPublicIp?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to create class: ${getErrorMessage(error)}`);
  }

  return data;
}

export async function updateClassGateways(
  classId: string,
  payload: {
    allowedWifiName?: string | null;
    allowedWifiPublicIp?: string | null;
    allowedLatitude?: number | null;
    allowedLongitude?: number | null;
    allowedRadius?: number | null;
  },
): Promise<ClassSummary> {
  const { error } = await supabase
    .from("classes")
    .update({
      allowed_wifi_name: payload.allowedWifiName || null,
      allowed_wifi_public_ip: payload.allowedWifiPublicIp?.trim() || null,
      allowed_latitude: payload.allowedLatitude ?? null,
      allowed_longitude: payload.allowedLongitude ?? null,
      allowed_radius: payload.allowedRadius ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId);

  if (error) {
    throw new Error(`Unable to update class boundary settings: ${getErrorMessage(error)}`);
  }

  const classes = await getClasses();
  const updatedClass = classes.find((item) => item.id === classId);
  return requireValue(updatedClass, "Updated class not found after saving gateway settings.");
}

export async function resetStudentDeviceBinding(enrollmentNo: string): Promise<{
  enrollmentNo: string;
}> {
  const normalizedEnrollment = enrollmentNo.trim().toUpperCase();

  if (!normalizedEnrollment) {
    throw new Error("Enter an enrollment number before resetting device binding.");
  }

  const { data: existingProfile, error: selectError } = await supabase
    .from("student_profiles")
    .select("id, enrollment_no")
    .eq("enrollment_no", normalizedEnrollment)
    .maybeSingle();

  if (selectError) {
    const message = getErrorMessage(selectError);

    if (/row-level security/i.test(message) || /permission denied/i.test(message)) {
      throw new Error(
        "Device reset needs the latest Supabase SQL access rules. Run the latest SQL, then try again.",
      );
    }

    throw new Error(`Unable to find student binding: ${message}`);
  }

  if (!existingProfile) {
    throw new Error(
      `No registered device binding was found for enrollment ${normalizedEnrollment}.`,
    );
  }

  const { error: updateError } = await supabase
    .from("student_profiles")
    .update({
      current_ip: null,
      device_fingerprint: null,
      device_label: null,
      device_bound_at: null,
      last_logout_at: new Date().toISOString(),
    })
    .eq("enrollment_no", normalizedEnrollment);

  if (updateError) {
    const message = getErrorMessage(updateError);

    if (/row-level security/i.test(message) || /permission denied/i.test(message)) {
      throw new Error(
        "Device reset needs the latest Supabase SQL access rules. Run the latest SQL, then try again.",
      );
    }

    throw new Error(`Unable to reset device binding: ${message}`);
  }

  const resolvedEnrollment =
    (existingProfile as { enrollment_no?: string } | null)?.enrollment_no ??
    normalizedEnrollment;

  return {
    enrollmentNo: resolvedEnrollment,
  };
}

export async function importPunches(
  classId: string,
  payload: {
    sessionDate: string;
    sourceFileName: string;
    rows: ImportedPunchRow[];
  },
): Promise<SessionPayload> {
  const classItem = await loadClassOrThrow(classId);
  const rows = cleanPunchRows(payload.rows);

  const { data: sessionData, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert(
      {
        class_id: classId,
        session_date: payload.sessionDate,
        source_file_name: payload.sourceFileName,
        upload_count: rows.length,
        review_status: "recheck_pending",
      },
      { onConflict: "class_id,session_date" },
    )
    .select("*")
    .single();

  if (sessionError) {
    throw new Error(`Unable to create attendance session: ${getErrorMessage(sessionError)}`);
  }

  const session = requireValue(sessionData as DbSession | null, "Attendance session not found");

  const { error: deleteRecordsError } = await supabase
    .from("attendance_records")
    .delete()
    .eq("session_id", session.id);

  if (deleteRecordsError) {
    throw new Error(
      `Unable to replace previous upload rows: ${getErrorMessage(deleteRecordsError)}`,
    );
  }

  const { error: deleteMarksError } = await supabase
    .from("attendance_student_marks")
    .delete()
    .eq("session_id", session.id);

  if (deleteMarksError) {
    throw new Error(
      `Unable to clear previous student marks: ${getErrorMessage(deleteMarksError)}`,
    );
  }

  const { error: insertError } = await supabase.from("attendance_records").insert(
    rows.map((row) => ({
      session_id: session.id,
      roll_number: row.rollNumber,
      student_name: row.studentName,
      punched_at: row.punchedAt ?? null,
      status: "pending" as const,
      note: null,
      last_verified_at: null,
    })),
  );

  if (insertError) {
    throw new Error(`Unable to save uploaded rows: ${getErrorMessage(insertError)}`);
  }

  return getSessionDetails(session.id, classItem);
}

export async function saveSessionRecheck(
  sessionId: string,
  payload: {
    reviewerName?: string | null;
    updates: Array<{
      recordId: string;
      status: AttendanceStatus;
      note?: string | null;
    }>;
  },
): Promise<SessionPayload> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch attendance session: ${getErrorMessage(error)}`);
  }

  const session = requireValue(data as DbSession | null, "Attendance session not found");
  const classItem = await loadClassOrThrow(session.class_id);
  const targetIds = payload.updates.map((update) => update.recordId);

  const { data: existingData, error: existingError } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("session_id", sessionId)
    .in("id", targetIds);

  if (existingError) {
    throw new Error(`Unable to load records for recheck: ${getErrorMessage(existingError)}`);
  }

  const existingRecords = (existingData ?? []) as DbRecord[];
  const existingById = new Map(existingRecords.map((record) => [record.id, record]));
  const auditRows: Array<{
    attendance_record_id: string;
    previous_status: AttendanceStatus;
    next_status: AttendanceStatus;
    note: string | null;
    verified_by: string | null;
  }> = [];

  const upsertRows: DbRecord[] = [];

  for (const update of payload.updates) {
    const existing = existingById.get(update.recordId);
    if (!existing) {
      throw new Error(`Attendance record ${update.recordId} was not found.`);
    }

    upsertRows.push({
      ...existing,
      status: update.status,
      note: update.note ?? null,
      last_verified_at: new Date().toISOString(),
    });

    if (existing.status !== update.status || existing.note !== (update.note ?? null)) {
      auditRows.push({
        attendance_record_id: update.recordId,
        previous_status: existing.status,
        next_status: update.status,
        note: update.note ?? null,
        verified_by: payload.reviewerName ?? null,
      });
    }
  }

  if (upsertRows.length > 0) {
    const { error: updateError } = await supabase
      .from("attendance_records")
      .upsert(upsertRows, { onConflict: "id" });

    if (updateError) {
      throw new Error(`Unable to save recheck updates: ${getErrorMessage(updateError)}`);
    }
  }

  if (auditRows.length > 0) {
    const { error: auditError } = await supabase
      .from("attendance_rechecks")
      .insert(auditRows);

    if (auditError) {
      throw new Error(`Unable to save recheck history: ${getErrorMessage(auditError)}`);
    }
  }

  const refreshedRecords = await loadRecordsForSessionIds([sessionId]);
  const nextReviewStatus: ReviewStatus = refreshedRecords.some(
    (record) => record.status === "pending",
  )
    ? "recheck_pending"
    : "finalized";

  const { error: sessionUpdateError } = await supabase
    .from("attendance_sessions")
    .update({
      review_status: nextReviewStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (sessionUpdateError) {
    throw new Error(`Unable to update session status: ${getErrorMessage(sessionUpdateError)}`);
  }

  return getSessionDetails(sessionId, classItem);
}

export async function submitStudentMark(
  sessionId: string,
  payload: {
    currentIp?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
): Promise<SessionPayload> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch attendance session: ${getErrorMessage(error)}`);
  }

  const session = requireValue(data as DbSession | null, "Attendance session not found");
  const classItem = await loadClassOrThrow(session.class_id);

  const { error: markError } = await studentSupabase.rpc("submit_student_mark_for_session", {
    p_session_id: sessionId,
    p_wifi_name: null,
    p_public_ip: payload.currentIp?.trim() || null,
    p_latitude: payload.latitude ?? null,
    p_longitude: payload.longitude ?? null,
  });

  if (markError) {
    throw new Error(getStudentMarkErrorMessage(markError));
  }

  return getSessionDetails(sessionId, classItem);
}

export async function getMonthlyActivity(date: Date): Promise<Record<string, "low" | "medium" | "high">> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("session_date, upload_count")
    .gte("session_date", start)
    .lt("session_date", end);

  if (error) return {};

  const counts: Record<string, number> = {};
  (data ?? []).forEach((s) => {
    const d = s.session_date;
    counts[d] = (counts[d] || 0) + (s.upload_count || 0);
  });

  const activity: Record<string, "low" | "medium" | "high"> = {};
  Object.entries(counts).forEach(([d, count]) => {
    if (count > 400) activity[d] = "high";
    else if (count > 100) activity[d] = "medium";
    else if (count > 0) activity[d] = "low";
  });

  return activity;
}

export async function getDashboard(): Promise<DashboardResponse> {
  // Optimization: 14 days is all we need for the dashboard charts and trends
  const { classes, sessions, records, studentMarks } = await loadOperationalDataset(14);
  const classSummaries = buildClassSummaries(classes, sessions, records);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));
  const latestRecordsByClassSession = new Map<string, DbRecord[]>();

  for (const classSummary of classSummaries) {
    if (!classSummary.latestSessionId) continue;
    latestRecordsByClassSession.set(
      classSummary.latestSessionId,
      records.filter((record) => record.session_id === classSummary.latestSessionId),
    );
  }

  const sessionMarksBySession = new Map<string, Set<string>>();
  for (const mark of studentMarks) {
    const set = sessionMarksBySession.get(mark.session_id) ?? new Set();
    set.add(mark.roll_number.toUpperCase());
    sessionMarksBySession.set(mark.session_id, set);
  }

  const latestRecords = Array.from(latestRecordsByClassSession.values()).flat();
  const verifiedPresentMatched = latestRecords.filter((record: DbRecord) => {
    const marks = sessionMarksBySession.get(record.session_id);
    const hasMark = marks?.has(record.roll_number.toUpperCase());
    return record.status === "present" || record.status === "late_present" || hasMark;
  }).length;

  const latestSessionIds = new Set(latestRecordsByClassSession.keys());
  const unmatchedLatestMarks = studentMarks.filter((mark) => {
    if (!latestSessionIds.has(mark.session_id)) return false;
    const sessionRecords = latestRecordsByClassSession.get(mark.session_id) ?? [];
    return !sessionRecords.some((r: DbRecord) => r.roll_number.toUpperCase() === mark.roll_number.toUpperCase());
  }).length;

  const verifiedPresent = verifiedPresentMatched + unmatchedLatestMarks;

  const flaggedToday = latestRecords.filter((record: DbRecord) => {
    const marks = sessionMarksBySession.get(record.session_id);
    const hasMark = marks?.has(record.roll_number.toUpperCase());
    return (record.status === "left_after_punch" || record.status === "pending") && !hasMark;
  }).length;

  const totalStudents = classSummaries.reduce(
    (sum, classItem) => sum + classItem.uploadedCount,
    0,
  );

  const totalPossible = latestRecords.length + unmatchedLatestMarks;
  const score = totalPossible === 0 ? 0 : Math.round((verifiedPresent / totalPossible) * 100);

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const isoDate = date.toISOString().slice(0, 10);
    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
    const dailyRecords = records.filter((r) => {
      const s = sessionMap.get(r.session_id);
      return s?.session_date === isoDate;
    });

    const dailySessions = sessions.filter((s) => s.session_date === isoDate);
    const dailySessionIds = new Set(dailySessions.map((s) => s.id));
    const dayMarks = studentMarks.filter((m) => dailySessionIds.has(m.session_id));
    const marksBySession = new Map<string, Set<string>>();
    for (const m of dayMarks) {
      const set = marksBySession.get(m.session_id) ?? new Set();
      set.add(m.roll_number.toUpperCase());
      marksBySession.set(m.session_id, set);
    }

    const verified = dailyRecords.filter((r) => {
      const marks = marksBySession.get(r.session_id);
      return (
        r.status === "present" ||
        r.status === "late_present" ||
        marks?.has(r.roll_number.toUpperCase())
      );
    }).length;

    const unmatched = dayMarks.filter((m) => {
      const sessionRecords = dailyRecords.filter((r) => r.session_id === m.session_id);
      return !sessionRecords.some(
        (r) => r.roll_number.toUpperCase() === m.roll_number.toUpperCase(),
      );
    }).length;

    const questionable = dailyRecords.filter((r) => {
      const marks = marksBySession.get(r.session_id);
      const hasMark = marks?.has(r.roll_number.toUpperCase());
      return (r.status === "left_after_punch" || r.status === "pending") && !hasMark;
    }).length;

    const absent = dailyRecords.filter(
      (r) =>
        r.status === "absent" &&
        !marksBySession.get(r.session_id)?.has(r.roll_number.toUpperCase()),
    ).length;

    return {
      day: dayLabel,
      present: verified + unmatched,
      questionable,
      absent,
    };
  });

  const previousWeekVerified = records.filter((record) => {
    const session = sessionMap.get(record.session_id);
    if (!session) return false;
    const ageInDays =
      (Date.now() - new Date(session.session_date).getTime()) / 86_400_000;
    return ageInDays > 7 && ageInDays <= 14 && normalizeStatus(record.status) === "present";
  }).length;

  const currentWeekVerified = records.filter((record) => {
    const session = sessionMap.get(record.session_id);
    if (!session) return false;
    const ageInDays =
      (Date.now() - new Date(session.session_date).getTime()) / 86_400_000;
    return ageInDays >= 0 && ageInDays <= 7 && normalizeStatus(record.status) === "present";
  }).length;

  const enrollmentTrend =
    previousWeekVerified === 0
      ? currentWeekVerified > 0
        ? 100
        : 0
      : roundPercentage(
          ((currentWeekVerified - previousWeekVerified) / previousWeekVerified) * 100,
        );

  const recentStudents = [...records]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, 6)
    .map((record) => {
      const session = sessionMap.get(record.session_id);
      const classItem = session ? classMap.get(session.class_id) : null;
      return {
        id: record.id,
        name: record.student_name,
        rollNumber: record.roll_number,
        avatarUrl: buildAvatarUrl(record.roll_number),
        time:
          record.punched_at ??
          session?.session_date ??
          new Date(record.updated_at).toLocaleString("en-US"),
        status:
          record.status === "present" || record.status === "late_present"
            ? "verified"
            : record.status === "absent"
              ? "absent"
              : "questionable",
        className: classItem?.name ?? "Unknown class",
      } satisfies StudentCheckIn;
    });

  const activeSession = sessions.find(
    (session) =>
      session.session_date === todayIsoDate() && session.review_status !== "finalized",
  );
  const activeClass = activeSession ? classMap.get(activeSession.class_id) : null;
  const activeSessionRecords = activeSession
    ? records.filter((record) => record.session_id === activeSession.id)
    : [];
  const latestSummary = summarizeRecords(latestRecords);

  return {
    stats: {
      score,
      activeClasses: classSummaries.filter((classItem) => classItem.status === "active").length,
      verifiedPresent,
      flaggedToday,
      totalStudents,
      enrollmentTrend,
      breakdown: {
        verified: totalPossible === 0 ? 0 : Math.round((verifiedPresent / totalPossible) * 100),
        questionable: totalPossible === 0 ? 0 : Math.round((flaggedToday / totalPossible) * 100),
        absent:
          totalPossible === 0
            ? 0
            : Math.round(
                (Math.max(0, totalPossible - verifiedPresent - flaggedToday) / totalPossible) * 100,
              ),
      },
    },
    chart: last7Days,
    recentStudents,
    activeSession: activeSession && activeClass
      ? {
          sessionId: activeSession.id,
          classId: activeClass.id,
          className: `${activeClass.code} - ${activeClass.name}`,
          room: activeClass.room ?? "Room not set",
          studentsCount: activeSessionRecords.length,
          markedCount: studentMarks.filter((mark) => mark.session_id === activeSession.id).length,
          timeElapsed: timeElapsedSince(activeSession.created_at),
          isActive: true,
        }
      : {
          sessionId: null,
          classId: null,
          className: "No live session yet",
          room: "Upload a morning punch sheet to begin recheck",
          studentsCount: 0,
          markedCount: 0,
          timeElapsed: "00:00:00",
          isActive: false,
        },
  };
}

function resolveRangeStart(range: string | null | undefined): string | null {
  if (!range || range === "all") return null;

  const today = new Date();
  const normalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (range === "today") return normalized.toISOString().slice(0, 10);
  if (range === "yesterday") {
    normalized.setDate(normalized.getDate() - 1);
    return normalized.toISOString().slice(0, 10);
  }
  if (range === "last7") {
    normalized.setDate(normalized.getDate() - 6);
    return normalized.toISOString().slice(0, 10);
  }
  if (range === "last30") {
    normalized.setDate(normalized.getDate() - 29);
    return normalized.toISOString().slice(0, 10);
  }

  throw new Error(`Unsupported date range: ${range}`);
}

export async function getReports(params: {
  search?: string;
  status?: string;
  classId?: string;
  range?: string;
}): Promise<ReportsResponse> {
  const rangeStart = resolveRangeStart(params.range);
  const searchTerm = params.search?.trim() ?? "";

  // Optimization: Use server-side filtering instead of loadOperationalDataset(120)
  // This avoids fetching thousands of irrelevant rows.
  
  // 1. Fetch filtered sessions first
  let sessionsQuery = supabase
    .from("attendance_sessions")
    .select("*")
    .order("session_date", { ascending: false });

  if (params.classId) sessionsQuery = sessionsQuery.eq("class_id", params.classId);
  if (rangeStart) sessionsQuery = sessionsQuery.gte("session_date", rangeStart);
  
  const { data: sessions, error: sessionError } = await sessionsQuery;
  if (sessionError) throw new Error(getErrorMessage(sessionError));
  if (!sessions || sessions.length === 0) {
    const classes = await loadClasses();
    return {
      summary: { total: 0, present: 0, questionable: 0, absent: 0 },
      classOptions: classes.map(c => ({ id: c.id, label: `${c.code} • ${c.name}` })),
      records: []
    };
  }

  const sessionIds = sessions.map(s => s.id);
  const sessionMap = new Map(sessions.map(s => [s.id, s]));

  // 2. Fetch classes, records and student marks in parallel for the filtered session IDs
  const [classes, recordsResult, studentMarksResult] = await Promise.all([
    loadClasses(),
    supabase
      .from("attendance_records")
      .select("*")
      .in("session_id", sessionIds)
      .order("student_name", { ascending: true }),
    supabase
      .from("attendance_student_marks")
      .select("session_id, roll_number")
      .in("session_id", sessionIds)
  ]);

  if (recordsResult.error) throw new Error(getErrorMessage(recordsResult.error));
  
  const allRecords = (recordsResult.data ?? []) as DbRecord[];
  const classMap = new Map(classes.map(c => [c.id, c]));
  const markedBySessionRoll = new Set(
    (studentMarksResult.data ?? []).map((m: any) => `${m.session_id}:${m.roll_number.toUpperCase()}`)
  );

  // 3. Process and further filter by status and search term (since text search is easier in JS for small datasets)
  const processedRecords = allRecords.map((record) => {
    const session = sessionMap.get(record.session_id);
    const classItem = session ? classMap.get(session.class_id) : null;
    const isMarked = markedBySessionRoll.has(`${record.session_id}:${record.roll_number.toUpperCase()}`);
    let computedStatus = normalizeStatus(record.status);
    if (isMarked) computedStatus = 'present';

    return {
      id: record.id,
      student: record.student_name,
      rollNo: record.roll_number,
      classId: classItem?.id ?? "",
      classLabel: classItem ? `${classItem.code} • ${classItem.name}` : "Unknown class",
      date: session?.session_date ?? "",
      checkIn: record.punched_at ?? "No punch time",
      reviewedAt: record.last_verified_at,
      status: computedStatus,
      rawStatus: record.status,
      note: (record.note ?? "") + (isMarked && record.status === 'pending' ? ' (Marked by student)' : ''),
    };
  }).filter(r => {
    if (params.status && params.status !== "all" && r.status !== params.status) return false;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return r.student.toLowerCase().includes(lowerSearch) || r.rollNo.toLowerCase().includes(lowerSearch);
    }
    return true;
  });

  const totals = {
    total: processedRecords.length,
    present: processedRecords.filter(r => r.status === "present").length,
    questionable: processedRecords.filter(r => r.status === "questionable").length,
    absent: processedRecords.filter(r => r.status === "absent").length,
  };

  return {
    summary: totals,
    classOptions: classes.map(c => ({ id: c.id, label: `${c.code} • ${c.name}` })),
    records: processedRecords.sort((a, b) => b.date.localeCompare(a.date) || a.student.localeCompare(b.student))
  };
}

export async function getAnalytics(): Promise<AnalyticsResponse> {
  // Optimization: Fetch only 60 days of data for analytics instead of 180 to avoid large payloads.
  // This is enough for the weekly trend and KPI calculations.
  const { classes, sessions, records } = await loadOperationalDataset(60);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));

  const totalCount = records.length;
  const presentCount = records.filter(
    (record) => normalizeStatus(record.status) === "present",
  ).length;
  const questionableCount = records.filter(
    (record) => normalizeStatus(record.status) === "questionable",
  ).length;
  const absentCount = records.filter((record) => normalizeStatus(record.status) === "absent")
    .length;
  const verifiedRate = totalCount === 0 ? 0 : roundPercentage((presentCount / totalCount) * 100);

  const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (7 * (7 - index + 1)));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const label = `W${index + 1}`;
    const weekRecords = records.filter((record) => {
      const session = sessionMap.get(record.session_id);
      if (!session) return false;
      const date = new Date(session.session_date);
      return date >= weekStart && date <= weekEnd;
    });
    const summary = summarizeRecords(weekRecords);
    const total = Math.max(summary.uploadedCount, 1);
    return {
      week: label,
      present: Math.round((summary.verifiedCount / total) * 100),
      questionable: Math.round((summary.questionableCount / total) * 100),
      absent: Math.round((summary.absentCount / total) * 100),
    };
  });

  const dailyCheckins = sessions
    .slice()
    .sort((left, right) => left.session_date.localeCompare(right.session_date))
    .slice(-10)
    .map((session) => ({
      time: new Date(session.session_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: records.filter((record) => record.session_id === session.id).length,
    }));

  const classComparison = classes
    .map((classItem) => {
      const classSessions = sessions.filter((session) => session.class_id === classItem.id);
      const sessionIds = new Set(classSessions.map((session) => session.id));
      const classRecords = records.filter((record) => sessionIds.has(record.session_id));
      const summary = summarizeRecords(classRecords);
      return {
        name: classItem.code,
        rate: summary.attendanceRate,
      };
    })
    .sort((left, right) => right.rate - left.rate);

  const pieData = [
    { name: "Verified Present", value: presentCount, color: "hsl(240,73%,62%)" },
    { name: "Needs Review", value: questionableCount, color: "hsl(38,94%,55%)" },
    { name: "Absent", value: absentCount, color: "hsl(4,80%,58%)" },
  ];

  const studentGroups = new Map<
    string,
    {
      name: string;
      rollNo: string;
      className: string;
      total: number;
      present: number;
      absences: number;
      recentStatuses: AttendanceStatus[];
    }
  >();

  for (const record of records) {
    const session = sessionMap.get(record.session_id);
    if (!session) continue;
    const classItem = classMap.get(session.class_id);
    const key = `${session.class_id}:${record.roll_number}`;
    const current = studentGroups.get(key) ?? {
      name: record.student_name,
      rollNo: record.roll_number,
      className: classItem ? classItem.code : "Unknown",
      total: 0,
      present: 0,
      absences: 0,
      recentStatuses: [] as AttendanceStatus[],
    };

    current.total += 1;
    if (normalizeStatus(record.status) === "present") current.present += 1;
    if (normalizeStatus(record.status) === "absent") current.absences += 1;
    current.recentStatuses.unshift(record.status);
    current.recentStatuses = current.recentStatuses.slice(0, 3);
    studentGroups.set(key, current);
  }

  const atRiskStudents = [...studentGroups.values()]
    .map((student) => {
      const rate = student.total === 0 ? 0 : Math.round((student.present / student.total) * 100);
      const recentPresentCount = student.recentStatuses.filter(
        (status) => normalizeStatus(status) === "present",
      ).length;
      return {
        name: student.name,
        rollNo: student.rollNo,
        cls: student.className,
        absences: student.absences,
        rate,
        trend: recentPresentCount >= 2 ? "up" : "down",
      } as const;
    })
    .filter((student) => student.rate < 80)
    .sort((left, right) => left.rate - right.rate)
    .slice(0, 5);

  return {
    kpis: [
      {
        label: "Verified Attendance Rate",
        value: `${verifiedRate}%`,
        change: `${presentCount} confirmed`,
        up: verifiedRate >= 80,
        tone: "primary",
      },
      {
        label: "Punch-And-Leave Flags",
        value: questionableCount.toString(),
        change: `${questionableCount} need review`,
        up: questionableCount === 0,
        tone: "warning",
      },
      {
        label: "At-Risk Students",
        value: atRiskStudents.length.toString(),
        change: "Below 80% attendance",
        up: atRiskStudents.length === 0,
        tone: "destructive",
      },
      {
        label: "Tracked Sessions",
        value: sessions.length.toString(),
        change: `${classes.length} active classes`,
        up: true,
        tone: "success",
      },
    ],
    weeklyTrend,
    dailyCheckins,
    classComparison,
    pieData,
    atRiskStudents,
  };
}

export async function fetchQuiz(classId: string): Promise<Quiz | null> {
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*, quiz_questions(*)")
    .eq("class_id", classId)
    .maybeSingle();

  if (quizError) throw quizError;
  if (!quiz) return null;

  return {
    id: quiz.id,
    class_id: quiz.class_id,
    title: quiz.title,
    questions: (quiz as any).quiz_questions ?? [],
  } as Quiz;
}

export async function upsertQuiz(
  classId: string,
  title: string,
  questions: QuizQuestion[],
) {
  const { data: existingQuiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("class_id", classId)
    .maybeSingle();

  const quizId = existingQuiz?.id || crypto.randomUUID();

  // 1. Delete old questions first to avoid foreign key issues or duplicates
  await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);

  // 2. Upsert quiz
  const { error: quizError } = await supabase.from("quizzes").upsert({
    id: quizId,
    class_id: classId,
    title,
    updated_at: new Date().toISOString(),
  });

  if (quizError) throw quizError;

  // 3. Insert new questions
  const { error: questionsError } = await supabase.from("quiz_questions").insert(
    questions.map((q) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      options: q.options,
      correct_option_index: q.correct_option_index,
    })),
  );

  if (questionsError) throw questionsError;

  return quizId;
}

export async function submitQuizAndMarkAttendance(input: {
  sessionId: string;
  quizId: string;
  answers: number[];
  publicIp?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ score: number; maxScore: number }> {
  const { data, error } = await studentSupabase.rpc("submit_quiz_and_mark_attendance", {
    p_session_id: input.sessionId,
    p_quiz_id: input.quizId,
    p_answers: input.answers,
    p_public_ip: input.publicIp || null,
    p_latitude: input.latitude || null,
    p_longitude: input.longitude || null,
  });

  if (error) throw error;
  const result = (data as any)?.[0];
  if (!result) return { score: 0, maxScore: 0 };
  return {
    score: result.score,
    maxScore: result.max_score || result.max_questions || 0,
  };
}

export async function updateClassQuizEnabled(classId: string, enabled: boolean) {
  const { error } = await supabase
    .from("classes")
    .update({ quiz_enabled: enabled })
    .eq("id", classId);

  if (error) throw error;
}

export async function verifyTeacherLogin(username: string, password_plaintext: string): Promise<string | null> {
  try {
    // Production-ready: Authenticate via Supabase Auth
    // Use username + internal domain as identifier for teachers
    const email = `${username.toLowerCase()}@brahmastra.internal`;
    const { data, error } = await teacherSupabase.auth.signInWithPassword({
      email,
      password: password_plaintext,
    });
    
    if (error || !data.session) {
      console.error("Auth failed:", error?.message);
      return null;
    }

    // Verify they have a teacher profile
    const { data: profile } = await teacherSupabase
      .from('teacher_profiles')
      .select('id')
      .eq('auth_user_id', data.session.user.id)
      .maybeSingle();

    if (!profile) {
      await teacherSupabase.auth.signOut();
      console.error("User is not a registered teacher.");
      return null;
    }

    return data.session.access_token;
  } catch (err) {
    console.error("Server-less Teacher auth failed:", err);
    return null;
  }
}

export async function deleteClass(classId: string) {
  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId);

  if (error) {
    throw new Error(`Unable to delete class: ${getErrorMessage(error)}`);
  }
  return true;
}
