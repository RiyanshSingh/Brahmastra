import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Globe,
  GraduationCap,
  KeyRound,
  LogOut,
  MapPin,
  QrCode,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useClassesData, useLatestSessionData } from "@/hooks/use-attendance-data";
import { submitStudentMark } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/providers/student-auth-provider";

function buildStudentToastError(
  error: Error,
  context: "login" | "signup" | "mark",
): { title: string; description: string } {
  const message = error.message;

  if (/device is already registered with another enrollment/i.test(message)) {
    return {
      title: "Device Already Registered",
      description: message,
    };
  }

  if (/enrollment is already registered on another device/i.test(message)) {
    return {
      title: "Enrollment Already Bound",
      description: message,
    };
  }

  if (/enrollment number has already been used/i.test(message)) {
    return {
      title: "Enrollment Already Used",
      description: message,
    };
  }

  if (/incorrect/i.test(message)) {
    return {
      title: "Invalid Credentials",
      description: message,
    };
  }

  if (/wi-?fi/i.test(message)) {
    return {
      title: "Wi-Fi Verification Failed",
      description: message,
    };
  }

  if (/public ip/i.test(message) || /network/i.test(message)) {
    return {
      title: "Network Verification Failed",
      description: message,
    };
  }

  if (/student profile/i.test(message) || /device storage/i.test(message)) {
    return {
      title: "Setup Error",
      description: message,
    };
  }

  if (context === "mark") {
    return {
      title: "Attendance Not Marked",
      description: message,
    };
  }

  return {
    title: context === "login" ? "Login Failed" : "Signup Failed",
    description: message,
  };
}

export default function MarkAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, profile, currentIp, loading: authLoading, signIn, signOut, signUp } =
    useStudentAuth();
  const { data: classes = [], isLoading } = useClassesData();
  const queryClassId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("classId") ?? ""
      : "";
  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === "active" && item.latestSessionId),
    [classes],
  );
  const [selectedClassId, setSelectedClassId] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [formEnrollment, setFormEnrollment] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const { data: latestSession, isLoading: isSessionLoading } = useLatestSessionData(
    selectedClassId || null,
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setLocationLoading(true);
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLocationLoading(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 
        },
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (
      !selectedClassId &&
      queryClassId &&
      activeClasses.some((item) => item.id === queryClassId)
    ) {
      setSelectedClassId(queryClassId);
      return;
    }

    if (!selectedClassId && activeClasses[0]) {
      setSelectedClassId(activeClasses[0].id);
    }
  }, [activeClasses, queryClassId, selectedClassId]);

  const selectedClass =
    activeClasses.find((item) => item.id === selectedClassId) ?? null;
  const requiredWifiPublicIp =
    latestSession?.session.allowedWifiPublicIp ?? selectedClass?.allowedWifiPublicIp ?? null;
  const requiresPublicIpMatch = Boolean(requiredWifiPublicIp);
  const wifiIpMatches =
    !requiresPublicIpMatch || currentIp?.trim() === requiredWifiPublicIp?.trim();
  
  const requiredLat = latestSession?.session.allowedLatitude ?? selectedClass?.allowedLatitude ?? null;
  const requiredLng = latestSession?.session.allowedLongitude ?? selectedClass?.allowedLongitude ?? null;
  const requiredRadius = latestSession?.session.allowedRadius ?? selectedClass?.allowedRadius ?? 100;
  const requiresLocation = requiredLat !== null && requiredLng !== null;
  
  const canMarkAttendance =
    Boolean(latestSession) && 
    (!requiresPublicIpMatch || (Boolean(currentIp) && wifiIpMatches)) &&
    (!requiresLocation || Boolean(location));

  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === "login") {
        await signIn({
          enrollmentNo: formEnrollment,
          password: formPassword,
        });
        return;
      }

      await signUp({
        enrollmentNo: formEnrollment,
        fullName: formName,
        password: formPassword,
      });
    },
    onSuccess: () => {
      setFormPassword("");
      toast({
        title: authMode === "login" ? "Logged in" : "Student account created",
        description:
          authMode === "login"
            ? "Your enrollment is now signed in for attendance marking."
            : "You can now mark attendance from this device.",
      });
    },
    onError: (error: Error) => {
      const toastCopy = buildStudentToastError(error, authMode);
      toast({
        title: toastCopy.title,
        description: toastCopy.description,
        variant: "destructive",
      });
    },
  });

  const markMutation = useMutation({
    mutationFn: async () => {
      if (!latestSession || !profile) {
        throw new Error("Log in as a student and select an active class first.");
      }

      if (requiresPublicIpMatch && !currentIp) {
        throw new Error("Your current public IP could not be detected.");
      }

      if (requiresPublicIpMatch && !wifiIpMatches) {
        throw new Error(
          `This class only allows attendance from public IP ${requiredWifiPublicIp}. Your current public IP is ${currentIp}.`,
        );
      }

      if (requiresLocation && !location) {
        throw new Error("Your current geolocation could not be detected. Please enable GPS permissions.");
      }

      return submitStudentMark(latestSession.session.id, {
        currentIp,
        latitude: location?.lat,
        longitude: location?.lng,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.setQueryData(["classes", "latest-session", selectedClassId], data);
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Attendance marked",
        description: "Your attendance has been shared with the teacher for verification.",
      });
    },
    onError: (error: Error) => {
      const toastCopy = buildStudentToastError(error, "mark");
      toast({
        title: toastCopy.title,
        description: toastCopy.description,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out. This device stays bound to your enrollment unless the teacher resets it.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AppLayout
      title="Student Mark"
      subtitle="Students sign in with enrollment number, the account stays bound to one device, and classes can optionally require a matching public IP."
    >
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="xl:col-span-4 dark-card rounded-[2rem] overflow-hidden"
          >
            <div className="relative p-8 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
              <div className="absolute -top-20 -right-20 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex rounded-2xl bg-white/20 p-3 backdrop-blur-sm border border-white/20">
                  <QrCode className="w-6 h-6" />
                </div>
                <h2 className="mt-6 text-3xl font-bold leading-tight">
                  Enrollment login with device binding.
                </h2>
                <p className="mt-3 text-sm text-white/80">
                  One enrollment stays bound to one device, and teachers can optionally gate attendance by classroom public IP rules.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label="Active Classes"
                  value={activeClasses.length}
                  icon={GraduationCap}
                  tone="text-emerald-400"
                />
                <SummaryCard
                  label="Your IP"
                  value={currentIp ?? "Fetching..."}
                  icon={Globe}
                  tone="text-cyan-400"
                />
              </div>
              <div className="rounded-2xl border border-card-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  Enrollment-to-device lock
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once a student account is created on one device, another enrollment cannot use that same device, and the same enrollment cannot move to a different device without a teacher reset.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="xl:col-span-8 dark-card rounded-[2rem] p-5 md:p-6"
          >
            {authLoading ? (
              <div className="h-[520px] rounded-2xl bg-muted/30 animate-pulse" />
            ) : !session || !profile ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setAuthMode("login")}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                      authMode === "login"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    Student Login
                  </button>
                  <button
                    onClick={() => setAuthMode("signup")}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                      authMode === "signup"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    Create Student Account
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {authMode === "login" ? "Student Login" : "Student Signup"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {authMode === "login"
                          ? "Sign in with your enrollment number and password."
                          : "Create a student account linked to your enrollment number and bind it to this device."}
                      </p>
                    </div>

                    {authMode === "signup" && (
                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Full Name
                        </span>
                        <input
                          value={formName}
                          onChange={(event) => setFormName(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-card-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none"
                          placeholder="ABHINAV SINGH CHAUHAN"
                        />
                      </label>
                    )}

                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Enrollment Number
                      </span>
                      <input
                        value={formEnrollment}
                        onChange={(event) => setFormEnrollment(event.target.value.toUpperCase())}
                        className="mt-2 w-full rounded-xl border border-card-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none"
                        placeholder="0111CS231011"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Password
                      </span>
                      <input
                        type="password"
                        value={formPassword}
                        onChange={(event) => setFormPassword(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-card-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none"
                        placeholder="Create a strong password"
                      />
                    </label>

                    <button
                      onClick={() => authMutation.mutate()}
                      disabled={
                        authMutation.isPending ||
                        !formEnrollment.trim() ||
                        !formPassword.trim() ||
                        (authMode === "signup" && !formName.trim())
                      }
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {authMutation.isPending
                        ? authMode === "login"
                          ? "Logging in..."
                          : "Creating account..."
                        : authMode === "login"
                          ? "Login"
                          : "Create Student Account"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <InfoPanel
                      icon={UserRound}
                      title="Enrollment-first login"
                      description="The login form hides the underlying auth email mapping and lets students use enrollment number plus password only."
                    />
                    <InfoPanel
                      icon={Globe}
                      title="Current public IP"
                      description={`Detected IP: ${currentIp ?? "fetching..."}. This is no longer used for login binding.`}
                    />
                    <InfoPanel
                      icon={KeyRound}
                      title="One device, one enrollment"
                      description="If this device already belongs to another enrollment, or this enrollment is already bound to another device, signup and login will be blocked."
                    />
                  </div>
                </div>
              </div>
            ) : activeClasses.length === 0 ? (
              <div className="h-[520px] flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-card-border bg-muted/20 px-8">
                <Clock3 className="w-10 h-10 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-semibold text-foreground">No active recheck right now</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Ask your teacher to upload the punch sheet and open the attendance session first.
                </p>
                <button
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Mark Your Attendance</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Logged in as {profile.full_name} with enrollment {profile.enrollment_no}.
                    </p>
                  </div>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-semibold text-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Active Class
                      </span>
                      <select
                        value={selectedClassId}
                        onChange={(event) => setSelectedClassId(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-card-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none"
                      >
                        {activeClasses.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.code} • {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoPill label="Enrollment" value={profile.enrollment_no} />
                      <InfoPill label="Current IP" value={currentIp ?? "Fetching..."} />
                    </div>

                    <div className="rounded-2xl border border-card-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        Geolocation gate
                      </div>
                      {requiresLocation ? (
                        <div className="mt-4 space-y-4">
                          <InfoPill label="Target Radius" value={`${requiredRadius} meters`} />
                          <GateStatus
                            label="GPS link"
                            matched={Boolean(location)}
                            pending={locationLoading && !location}
                          />
                          {location?.accuracy && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                location.accuracy < 30 ? "bg-success" : "bg-warning"
                              )} />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                GPS Accuracy: {location.accuracy.toFixed(0)}m
                              </span>
                            </div>
                          )}
                          {!location && !locationLoading && (
                            <p className="text-xs text-destructive">
                              Please enable location access in your browser settings to mark attendance.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No GPS location lock is configured for this class.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-card-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ShieldCheck className="w-4 h-4 text-success" />
                        Network gate
                      </div>
                      {requiresPublicIpMatch ? (
                        <div className="mt-4 space-y-4">
                          <InfoPill label="Required Public IP" value={requiredWifiPublicIp ?? "Not set"} />
                          <GateStatus
                            label="Public IP match"
                            matched={Boolean(currentIp) && wifiIpMatches}
                            pending={!currentIp}
                          />
                          <p className="text-xs text-muted-foreground">
                            Attendance tabhi mark hogi jab current public IP teacher ke configured class IP se match karegi.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No public IP lock is configured for this class yet.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-card-border bg-muted/20 p-4">
                      <div className="text-sm font-semibold text-foreground">
                        Logged-in student
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {profile.full_name}
                      </div>
                    </div>

                    <button
                      onClick={() => markMutation.mutate()}
                      disabled={markMutation.isPending || !canMarkAttendance}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {markMutation.isPending ? "Submitting..." : "Mark Attendance"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedClass && (
                      <div
                        className="rounded-[1.75rem] p-6 text-white"
                        style={{
                          background: `linear-gradient(135deg, ${selectedClass.colorStart}, ${selectedClass.colorEnd})`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.28em] text-white/70 font-bold">
                              {selectedClass.code}
                            </div>
                            <h4 className="mt-1 text-2xl font-bold">{selectedClass.name}</h4>
                          </div>
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                            Live
                          </span>
                        </div>
                        <div className="mt-6 space-y-3 text-sm text-white/85">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {selectedClass.room}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock3 className="w-4 h-4" />
                            {selectedClass.scheduleText}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {latestSession?.session.studentMarkedCount ?? 0} students have marked so far
                          </div>
                        </div>
                      </div>
                    )}

                    {isSessionLoading ? (
                      <div className="h-28 rounded-2xl bg-muted/30 animate-pulse" />
                    ) : latestSession ? (
                      <div className="rounded-2xl border border-card-border bg-muted/20 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          Active session details
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <InfoPill label="Punch rows" value={latestSession.session.uploadedCount} />
                          <InfoPill label="Matched already" value={latestSession.session.matchedCount} />
                          <InfoPill label="Session date" value={latestSession.session.sessionDate} />
                          <InfoPill label="Status" value={latestSession.session.reviewStatus.replace(/_/g, " ")} />
                          <InfoPill label="Allowed IP" value={requiredWifiPublicIp ?? "Open access"} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof GraduationCap;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-muted/20 p-4">
      <div className={cn("inline-flex rounded-xl bg-background p-2.5", tone)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="mt-4 text-2xl font-bold text-foreground break-all">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-background/70 border border-card-border px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground break-all">{value}</div>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-muted/20 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function GateStatus({
  label,
  matched,
  pending = false,
}: {
  label: string;
  matched: boolean;
  pending?: boolean;
}) {
  const tone = pending
    ? "bg-warning/15 text-warning"
    : matched
      ? "bg-success/15 text-success"
      : "bg-destructive/15 text-destructive";

  return (
    <div className="rounded-xl border border-card-border bg-background/70 px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
        {pending ? "Waiting" : matched ? "Matched" : "Mismatch"}
      </div>
    </div>
  );
}
