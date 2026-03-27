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
  HelpCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useClassesData, useLatestSessionData } from "@/hooks/use-attendance-data";
import { submitStudentMark, fetchQuiz, submitQuizAndMarkAttendance, type QuizQuestion } from "@/lib/api";
import { cn, calculateDistance } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/providers/student-auth-provider";
import { getEnrollmentByDevice } from "@/lib/student-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
  const [isDeviceBound, setIsDeviceBound] = useState(false);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number } | null>(null);
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
    async function checkDeviceBinding() {
      const boundEnrollment = await getEnrollmentByDevice();
      if (boundEnrollment) {
        setFormEnrollment(boundEnrollment);
        setIsDeviceBound(true);
        setAuthMode("login");
      }
    }
    void checkDeviceBinding();
  }, []);

  useEffect(() => {
    if (latestSession?.session.id && latestSession.session.quizEnabled) {
      setQuizResult(null);
      setQuizAnswers([]);
      fetchQuiz(latestSession.session.classId).then((q) => {
        if (q) setQuizQuestions(q.questions);
      });
    }
  }, [latestSession?.session.id]);

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

  const distance = useMemo(() => {
    if (!requiresLocation || !location || requiredLat === null || requiredLng === null) return null;
    return calculateDistance(location.lat, location.lng, requiredLat, requiredLng);
  }, [location, requiredLat, requiredLng, requiresLocation]);

  const locationInRadius =
    !requiresLocation || (distance !== null && distance <= requiredRadius);

  const canMarkAttendance =
    Boolean(latestSession) &&
    (
      (!requiresPublicIpMatch && !requiresLocation) ||
      (requiresPublicIpMatch && wifiIpMatches) ||
      (requiresLocation && location && locationInRadius)
    );

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

  const quizMutation = useMutation({
    mutationFn: async () => {
      if (!latestSession || !latestSession.session.id || quizQuestions.length === 0) return;
      const res = await submitQuizAndMarkAttendance({
        sessionId: latestSession.session.id,
        quizId: (quizQuestions[0] as any).quiz_id || "",
        answers: quizAnswers,
        publicIp: currentIp ?? undefined,
        latitude: location?.lat,
        longitude: location?.lng,
      });
      return res;
    },
    onSuccess: (data) => {
      if (data) setQuizResult(data);
      toast({
        title: "Assessment Submitted",
        description: `Score: ${data?.score}/${data?.maxScore}. Attendance verified.`,
      });
      queryClient.invalidateQueries({ queryKey: ["latest-session"] });
    },
    onError: (error: Error) => {
      const err = buildStudentToastError(error, "mark");
      toast({ ...err, variant: "destructive" });
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
    <>
      <div className="p-0 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="xl:col-span-4 dark-card rounded-[2rem] overflow-hidden"
          >
            <div className="relative p-6 sm:p-8 text-white min-h-[320px] sm:min-h-[360px] flex flex-col justify-end items-center text-center overflow-hidden group">
              {/* Background Video Layer */}
              <div className="absolute inset-0 z-0">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out"
                >
                  <source src="/enrollment-demo.mp4" type="video/mp4" />
                </video>
              </div>

              <div className="relative z-10">
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <ShieldCheck className="w-4 h-4 text-[#15803d] dark:text-success" />
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
            className="xl:col-span-8 dark-card rounded-[2rem] p-6 sm:p-10"
          >
            {authLoading ? (
              <div className="h-[520px] rounded-2xl bg-muted/30 animate-pulse" />
            ) : !session || !profile ? (
              <div className="space-y-6">
                {!isDeviceBound && (
                  <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setAuthMode("login")}
                      className={cn(
                        "w-full rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200",
                        authMode === "login"
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:bg-muted/20",
                      )}
                    >
                      Student Login
                    </button>
                    <button
                      onClick={() => setAuthMode("signup")}
                      className={cn(
                        "w-full rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200",
                        authMode === "signup"
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:bg-muted/20",
                      )}
                    >
                      Signup
                    </button>
                  </div>
                )}

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
                          onChange={(event) => setFormName(event.target.value.toUpperCase())}
                          className="mt-2 w-full rounded-xl border border-card-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none"
                          placeholder="ENTER YOUR FULL NAME"
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
                        disabled={isDeviceBound}
                        className="mt-2 w-full rounded-xl border border-card-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="ENTER YOUR ENROLLMENT NUMBER"
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
                        placeholder={authMode === "login" ? "Enter your password" : "Create a secure password"}
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
                    <h3 className="text-2xl font-black text-foreground tracking-tight">
                      Welcome, <span className="text-emerald-500">{profile.full_name}</span>
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                      Student Dashboard • {profile.enrollment_no}
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
                      <Select
                        value={selectedClassId}
                        onValueChange={setSelectedClassId}
                      >
                        <SelectTrigger className="mt-2 w-full h-12 rounded-xl border border-border bg-muted/20 px-4 text-sm font-semibold text-foreground focus:ring-primary/40 transition-all">
                          <SelectValue placeholder="Choose a class" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border border-border bg-card">
                          {activeClasses.map((item) => (
                            <SelectItem key={item.id} value={item.id} className="rounded-xl focus:bg-primary">
                              {item.code} • {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoPill label="Target Radius" value={`${requiredRadius} meters`} />
                            <GateStatus
                              label="GPS Link"
                              matched={requiresLocation ? Boolean(location && locationInRadius) : Boolean(location)}
                              pending={locationLoading && !location}
                            />
                          </div>
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
                        <ShieldCheck className="w-4 h-4 text-[#15803d] dark:text-success" />
                        Network gate
                      </div>
                      {requiresPublicIpMatch ? (
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoPill label="Required Public IP" value={requiredWifiPublicIp ?? "Not set"} />
                            <GateStatus
                              label="Public IP Match"
                              matched={Boolean(currentIp) && wifiIpMatches}
                              pending={!currentIp}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-[10px] leading-tight opacity-70">
                            Attendance can only be marked when your current public IP matches the teacher's configured classroom IP.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No public IP lock is configured for this class yet.
                        </p>
                      )}
                    </div>
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
                    {latestSession?.session.quizEnabled && !quizResult ? (
                      <div className="space-y-6">
                        {!isQuizzing ? (
                          <div className="py-8 text-center space-y-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <HelpCircle className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">Attendance Quiz Required</h3>
                              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto mt-2">
                                Your teacher has enabled a quiz gate for this session. Complete the assessment to verify your presence.
                              </p>
                            </div>
                            <div className="px-6 pb-2">
                              <button
                                onClick={() => setIsQuizzing(true)}
                                disabled={!canMarkAttendance}
                                className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 disabled:opacity-50"
                              >
                                Start Assessment
                              </button>
                              {!canMarkAttendance && (
                                <p className="text-[10px] text-destructive mt-3 font-bold uppercase tracking-widest text-center">
                                  Verify Geo/WiFi first
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between pb-4 border-b border-card-border">
                              <h3 className="text-lg font-bold text-foreground">Class Quiz</h3>
                              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{quizAnswers.filter(a => a !== undefined).length} / {quizQuestions.length} Answered</span>
                            </div>

                            <div className="space-y-8">
                              {quizQuestions.map((q, qIdx) => (
                                <div key={qIdx} className="space-y-4">
                                  <div className="flex gap-3">
                                    <span className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{qIdx + 1}</span>
                                    <h4 className="text-sm font-bold text-foreground leading-relaxed">
                                      {q.question_text}
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2.5 pl-9">
                                    {q.options.map((opt, oIdx) => (
                                      <button
                                        key={oIdx}
                                        onClick={() => {
                                          const newAnsw = [...quizAnswers];
                                          newAnsw[qIdx] = oIdx;
                                          setQuizAnswers(newAnsw);
                                        }}
                                        className={cn(
                                          "w-full text-left px-5 py-3.5 rounded-xl border text-sm transition-all duration-300",
                                          quizAnswers[qIdx] === oIdx
                                            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "bg-muted/40 border-card-border text-muted-foreground hover:bg-muted/60"
                                        )}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => quizMutation.mutate()}
                              disabled={quizAnswers.length < quizQuestions.length || quizMutation.isPending}
                              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-500/20 disabled:opacity-50 mt-4 h-14"
                            >
                              {quizMutation.isPending ? "Submitting Assessment..." : "Complete & Mark Attendance"}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {quizResult && (
                          <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-center animate-in zoom-in-95 duration-500">
                            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-[#15803d] dark:text-success mx-auto mb-3">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-[#15803d] dark:text-success/80 mb-1">Assessment Complete</div>
                            <div className="text-4xl font-black text-foreground tracking-tight">
                              {quizResult.score} / {quizResult.maxScore}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Your attendance has been automatically verified.</p>
                          </div>
                        )}
                        <button
                          onClick={() => markMutation.mutate()}
                          disabled={markMutation.isPending || !canMarkAttendance || Boolean(quizResult)}
                          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 h-14"
                        >
                          {markMutation.isPending ? "Submitting..." : quizResult ? "Attendance Marked" : "Finalize Attendance"}
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
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
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between group hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          {label}
        </div>
        <Icon className={cn("w-4 h-4", tone)} />
      </div>
      <div className="mt-4 text-2xl font-black text-foreground tracking-tight truncate leading-none">
        {value}
      </div>
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
      <div className="mt-2 text-sm font-bold text-foreground truncate">{value}</div>
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
    ? "bg-warning/15 text-[#92400e] dark:text-warning"
    : matched
      ? "bg-success/15 text-[#15803d] dark:text-success"
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
