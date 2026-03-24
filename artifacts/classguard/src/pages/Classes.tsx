import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Play,
  Search,
  ShieldCheck,
  Upload,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import {
  importPunches,
  resetStudentDeviceBinding,
  saveSessionRecheck,
  updateClassNetworkCredentials,
  type AttendanceStatus,
  type ClassSummary,
  type SessionPayload,
} from "@/lib/api";
import { getStatusLabel, parsePunchWorkbook } from "@/lib/attendance";
import { fetchPublicIp } from "@/lib/student-auth";
import { useClassesData, useLatestSessionData } from "@/hooks/use-attendance-data";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS: AttendanceStatus[] = [
  "pending",
  "present",
  "late_present",
  "left_after_punch",
  "absent",
];

const CLASS_STATUS_CONFIG = {
  active: { label: "Recheck active", dot: "bg-success", text: "text-success bg-success/15" },
  scheduled: { label: "Waiting for upload", dot: "bg-warning", text: "text-warning bg-warning/15" },
  ended: { label: "Reviewed", dot: "bg-muted-foreground", text: "text-muted-foreground bg-muted" },
} as const;

export default function Classes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: classes = [], isLoading } = useClassesData();
  const queryClassId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("classId") ?? ""
      : "";
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [reviewerName, setReviewerName] = useState("Teacher");
  const [allowedWifiName, setAllowedWifiName] = useState("");
  const [allowedWifiPublicIp, setAllowedWifiPublicIp] = useState("");
  const [detectedPublicIp, setDetectedPublicIp] = useState("");
  const [resetEnrollmentNo, setResetEnrollmentNo] = useState("");
  const { data: latestSession, isLoading: isSessionLoading } = useLatestSessionData(
    selectedClassId || null,
  );
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const currentClass = classes.find((item) => item.id === selectedClassId) ?? null;

  useEffect(() => {
    if (!selectedClassId && queryClassId && classes.some((item) => item.id === queryClassId)) {
      setSelectedClassId(queryClassId);
      return;
    }

    if (!selectedClassId && classes[0]) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, queryClassId, selectedClassId]);

  useEffect(() => {
    if (!latestSession) {
      setDraftStatuses({});
      setDraftNotes({});
      return;
    }

    setDraftStatuses(
      Object.fromEntries(
        latestSession.records.map((record) => [record.id, record.status]),
      ),
    );
    setDraftNotes(
      Object.fromEntries(
        latestSession.records.map((record) => [record.id, record.note ?? ""]),
      ),
    );
  }, [latestSession]);

  useEffect(() => {
    setAllowedWifiName(currentClass?.allowedWifiName ?? "");
    setAllowedWifiPublicIp(currentClass?.allowedWifiPublicIp ?? "");
  }, [currentClass?.allowedWifiName, currentClass?.allowedWifiPublicIp]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetectedIp() {
      try {
        const ip = await fetchPublicIp();
        if (!cancelled) {
          setDetectedPublicIp(ip);
        }
      } catch {
        if (!cancelled) {
          setDetectedPublicIp("");
        }
      }
    }

    void loadDetectedIp();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const haystack = `${item.code} ${item.name}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [classes, search]);

  const unmatchedStudentMarks = latestSession?.unmatchedStudentMarks ?? [];
  const summaryStrip = useMemo(() => {
    return [
      {
        label: "Tracked Classes",
        value: classes.length,
        icon: BookOpen,
        color: "text-primary bg-primary/15",
      },
      {
        label: "Recheck Active",
        value: classes.filter((item) => item.status === "active").length,
        icon: Play,
        color: "text-success bg-success/15",
      },
      {
        label: "Expected Students",
        value: classes.reduce((sum, item) => sum + item.expectedStudents, 0).toLocaleString(),
        icon: Users,
        color: "text-blue-400 bg-blue-400/15",
      },
      {
        label: "Avg Verified Rate",
        value:
          classes.length === 0
            ? "0%"
            : `${Math.round(
              classes.reduce((sum, item) => sum + item.attendanceRate, 0) / classes.length,
            )}%`,
        icon: CheckCircle2,
        color: "text-warning bg-warning/15",
      },
    ];
  }, [classes]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) {
        throw new Error("Choose a class before importing a punch sheet.");
      }

      if (!selectedFile) {
        throw new Error("Choose an Excel file first.");
      }

      const rows = await parsePunchWorkbook(selectedFile);
      return importPunches(selectedClassId, {
        sessionDate,
        sourceFileName: selectedFile.name,
        rows,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.setQueryData(["classes", "latest-session", selectedClassId], data);
      toast({
        title: "Punch sheet imported",
        description: `Loaded ${data.records.length} students for ${data.session.sessionDate}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!latestSession) {
        throw new Error("There is no uploaded session to review yet.");
      }

      return saveSessionRecheck(latestSession.session.id, {
        reviewerName,
        updates: latestSession.records.map((record) => ({
          recordId: record.id,
          status: draftStatuses[record.id] ?? record.status,
          note: draftNotes[record.id]?.trim() || null,
        })),
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.setQueryData(["classes", "latest-session", selectedClassId], data);
      toast({
        title: "Recheck saved",
        description: "Supabase has been updated with the latest classroom review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to save recheck",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const networkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) {
        throw new Error("Choose a class before saving Wi-Fi credentials.");
      }

      if (!allowedWifiName.trim() && allowedWifiPublicIp.trim()) {
        throw new Error("Add the Wi-Fi name first. Public IP is optional, but it cannot be saved alone.");
      }

      return updateClassNetworkCredentials(selectedClassId, {
        allowedWifiName,
        allowedWifiPublicIp,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["classes", "latest-session", selectedClassId] });
      toast({
        title: "Wi-Fi rule saved",
        description: allowedWifiPublicIp.trim()
          ? "Students will need the matching Wi-Fi name and public IP for this class."
          : "Students will need the matching Wi-Fi name for this class.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to save Wi-Fi rule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetDeviceMutation = useMutation({
    mutationFn: async () => resetStudentDeviceBinding(resetEnrollmentNo),
    onSuccess: ({ enrollmentNo }) => {
      setResetEnrollmentNo("");
      toast({
        title: "Device binding reset",
        description: `Enrollment ${enrollmentNo} can now log in on a new phone or browser device.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to reset device binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AppLayout
      title="Classes"
      subtitle="Match the morning punch sheet with student self-marked attendance, then finalize the review."
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summaryStrip.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="dark-card backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-5 flex items-center gap-4 group transition-all duration-300 hover:shadow-2xl hover:shadow-black/20"
            >
              <div className={cn("p-3 rounded-2xl relative overflow-hidden", item.color)}>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                <item.icon className="w-5 h-5 relative z-10" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{item.value}</div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="dark-card relative overflow-hidden rounded-[2rem] p-6 xl:col-span-4 group"
          >
            {/* Mesh Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4 mb-6">
              <div className="p-4 rounded-[1.25rem] bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">Morning Punch Import</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Load the teacher’s Excel sheet to begin.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Target Class
                </span>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                >
                  <option value="">Select a class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} • {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Session Date
                </span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md px-4 py-3.5 focus-within:border-primary/40 focus-within:bg-white/[0.05] transition-all">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(event) => setSessionDate(event.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Record Reviewer
                </span>
                <input
                  value={reviewerName}
                  onChange={(event) => setReviewerName(event.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                  placeholder="Enter name"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Excel Workbook
                </span>
                <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-primary/30 transition-all group/upload">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover/upload:scale-110 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">
                      {selectedFile ? selectedFile.name : "Select punch sheet"}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                      .xlsx or .xls required
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
                className="w-full rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] hover:bg-right px-4 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {importMutation.isPending ? "Processing..." : "Import & Initialize Recheck"}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="dark-card relative overflow-hidden rounded-[2rem] p-6 xl:col-span-4"
          >
            {/* Mesh Glow */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 mb-6">
              <h3 className="text-xl font-bold text-foreground tracking-tight">Student Live Mark</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Real-time self-attendance matching system.
              </p>
            </div>

            <div className="relative z-10">
              {!latestSession ? (
                <div className="rounded-[1.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-foreground font-bold">Session required</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                    Upload a punch sheet to activate live student marking.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {latestSession.session.classCode} • {latestSession.session.className}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1 opacity-60">
                        {latestSession.session.sessionDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-bold text-success uppercase tracking-wider">Active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 group/wifi">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <Wifi className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Wi-Fi rule</span>
                      </div>
                      <div className="text-sm font-bold text-foreground break-all group-hover:text-primary transition-colors">
                        {currentClass?.allowedWifiName ?? "None"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 group/ip">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">IP Lock</span>
                      </div>
                      <div className="text-sm font-bold text-foreground break-all group-hover:text-indigo-400 transition-colors">
                        {currentClass?.allowedWifiPublicIp ?? "Any"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">Device Reset</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          value={resetEnrollmentNo}
                          onChange={(event) => setResetEnrollmentNo(event.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-white/5 bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-amber-500/30 transition-all"
                          placeholder="Enrollment #"
                        />
                      </div>
                      <button
                        onClick={() => resetDeviceMutation.mutate()}
                        disabled={resetDeviceMutation.isPending || !resetEnrollmentNo.trim()}
                        className="w-full rounded-xl bg-amber-500/10 border border-amber-500/20 py-3 text-xs font-bold text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
                      >
                        {resetDeviceMutation.isPending ? "Resetting..." : "Unlock Device Binding"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between h-24">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60">Presence</div>
                      <div className="text-3xl font-black text-foreground">{latestSession.session.studentMarkedCount}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-between h-24">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60">Verified</div>
                      <div className="text-3xl font-black text-primary">{latestSession.session.matchedCount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="dark-card relative overflow-hidden rounded-[2rem] p-6 xl:col-span-4"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">Active Analytics</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Detailed comparison metrics.
                </p>
              </div>
              {currentClass && (
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  {currentClass.code}
                </div>
              )}
            </div>

            <div className="relative z-10">
              {isSessionLoading ? (
                <div className="h-[400px] rounded-[1.5rem] bg-white/[0.02] animate-pulse border border-white/5" />
              ) : latestSession ? (
                <SessionOverview session={latestSession} />
              ) : (
                <div className="rounded-[1.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Awaiting Data</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
                    Complete the punch import to unlock deep analytics for this class.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="dark-card relative overflow-hidden rounded-[2rem] p-6 group"
        >
          {/* Accent Glow */}
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-[1.25rem] bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">Class Security Profile</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Set mandatory network rules for student verification.
                </p>
              </div>
            </div>
            {currentClass && (
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground">
                {currentClass.code} System Configuration
              </span>
            )}
          </div>

          {!currentClass ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-bold text-foreground">Select a class first</p>
              <p className="mt-1 text-xs text-muted-foreground opacity-60">
                Configure your network boundary to prevent remote proxy markers.
              </p>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1 text-primary">
                    Mandatory Wi-Fi Name
                  </span>
                  <input
                    value={allowedWifiName}
                    onChange={(event) => setAllowedWifiName(event.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                    placeholder="e.g. Campus-Secure-5G"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                    Public IP Lock <span className="text-muted-foreground/40 lowercase font-medium ml-1">(Optional)</span>
                  </span>
                  <input
                    value={allowedWifiPublicIp}
                    onChange={(event) => setAllowedWifiPublicIp(event.target.value)}
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                    placeholder="e.g. 103.45.12.1"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => networkMutation.mutate()}
                    disabled={networkMutation.isPending}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {networkMutation.isPending ? "Updating rules..." : "Authorize Boundary Rules"}
                  </button>
                  <button
                    onClick={() => {
                      setAllowedWifiName("");
                      setAllowedWifiPublicIp("");
                    }}
                    type="button"
                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-foreground hover:bg-white/10 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-success/10 text-success">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground tracking-tight">Active Sensor Feedback</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 group/ip-helper">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60 mb-2">My Network IP</div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-mono text-foreground font-bold truncate">
                          {detectedPublicIp || "Detecting..."}
                        </div>
                        <button
                          type="button"
                          onClick={() => detectedPublicIp && setAllowedWifiPublicIp(detectedPublicIp)}
                          disabled={!detectedPublicIp}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-primary uppercase tracking-wider hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Match Logic</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Students must be connected to the specified Wi-Fi. If IP lock is set, their public gateway must also match.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className="dark-card rounded-2xl overflow-hidden"
        >
          <div className="p-5 border-b border-card-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recheck Roster</h3>
              <p className="text-sm text-muted-foreground">
                Compare each punched student with self-marked attendance, then finalize.
              </p>
            </div>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!latestSession || saveMutation.isPending}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending ? "Saving review..." : "Save Recheck"}
            </button>
          </div>

          {!latestSession ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Import a punch file to unlock the review roster.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-card-border">
                    {["Student", "Roll No.", "Punch Time", "Student Mark", "Status", "Note"].map((column) => (
                      <th
                        key={column}
                        className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {latestSession.records.map((record) => (
                    <tr key={record.id} className="border-b border-card-border/60 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-card-border">
                            <img
                              src={`${import.meta.env.BASE_URL}${record.avatarUrl.replace("/images/", "images/")}`}
                              alt={record.studentName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{record.studentName}</div>
                            <div className="text-xs text-muted-foreground">{getStatusLabel(draftStatuses[record.id] ?? record.status)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{record.rollNumber}</td>
                      <td className="px-5 py-3.5 text-sm text-foreground">{record.punchedAt ?? "No punch time"}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              record.studentMarked
                                ? "bg-success/15 text-success"
                                : "bg-warning/15 text-warning",
                            )}
                          >
                            {record.studentMarked ? "Marked in class" : "Not marked"}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {record.markedAt
                              ? `${record.markedName ?? record.studentName} • ${record.markedAt}`
                              : "Waiting for student mark"}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={draftStatuses[record.id] ?? record.status}
                          onChange={(event) =>
                            setDraftStatuses((current) => ({
                              ...current,
                              [record.id]: event.target.value as AttendanceStatus,
                            }))
                          }
                          className="w-full rounded-xl border border-card-border bg-muted/60 px-3 py-2 text-sm text-foreground outline-none"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          value={draftNotes[record.id] ?? ""}
                          onChange={(event) =>
                            setDraftNotes((current) => ({
                              ...current,
                              [record.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-card-border bg-muted/60 px-3 py-2 text-sm text-foreground outline-none"
                          placeholder="Optional note"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {latestSession && unmatchedStudentMarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className="dark-card rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-card-border">
              <h3 className="text-lg font-semibold text-foreground">Marked But Missing From Punch Sheet</h3>
              <p className="text-sm text-muted-foreground">
                These students self-marked attendance but were not found in the uploaded Excel sheet.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-card-border">
                    {["Student", "Roll No.", "Marked At"].map((column) => (
                      <th
                        key={column}
                        className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unmatchedStudentMarks.map((mark) => (
                    <tr key={mark.id} className="border-b border-card-border/60">
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">{mark.studentName}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">{mark.rollNumber}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{mark.markedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <div className="flex items-center dark-card rounded-xl px-3.5 py-2.5 max-w-xs gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(isLoading ? Array.from({ length: 6 }) : filteredClasses).map((classItem, index) =>
            isLoading ? (
              <div key={index} className="dark-card rounded-2xl h-[320px] animate-pulse" />
            ) : (
              <ClassCard
                key={(classItem as ClassSummary).id}
                classItem={classItem as ClassSummary}
                isSelected={(classItem as ClassSummary).id === selectedClassId}
                onSelect={() => setSelectedClassId((classItem as ClassSummary).id)}
              />
            ),
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function SessionOverview({ session }: { session: SessionPayload }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: "Workbench",
            value: session.session.uploadedCount,
            color: "text-primary bg-primary/10 border-primary/20",
            icon: FileSpreadsheet,
            sub: "Rows Loaded"
          },
          {
            label: "Self Mark",
            value: session.session.studentMarkedCount,
            color: "text-success bg-success/10 border-success/20",
            icon: Users,
            sub: "Total Marked"
          },
          {
            label: "Verified",
            value: session.session.matchedCount,
            color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
            icon: CheckCircle2,
            sub: "Matched Both"
          },
          {
            label: "Conflict",
            value: session.session.punchOnlyCount,
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            icon: XCircle,
            sub: "Missing Mark"
          },
        ].map((item) => (
          <div key={item.label} className="group rounded-[1.25rem] bg-white/[0.02] border border-white/5 p-4 hover:bg-white/[0.04] transition-all duration-300">
            <div className={cn("inline-flex rounded-xl p-2.5 mb-3 border", item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-foreground group-hover:scale-110 origin-left transition-transform">{item.value}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-white/[0.02] to-transparent border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              {session.session.classCode} System Log
            </div>
            <div className="text-xs text-muted-foreground">
              Source: {session.session.sourceFileName}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-40 mb-1">Review Status</div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wide">
              {session.session.reviewStatus.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-40 mb-1">Proxy Alerts</div>
            <div className="text-xs font-bold text-amber-500">
              {session.session.markOnlyCount} Orphans
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-40 mb-1">Active Gateway</div>
            <div className="text-xs font-mono text-primary font-bold truncate">
              {session.session.allowedWifiName || "Unlimited Access"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  classItem,
  isSelected,
  onSelect,
}: {
  classItem: ClassSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const status = CLASS_STATUS_CONFIG[classItem.status];

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      onClick={onSelect}
      className={cn(
        "dark-card relative overflow-hidden rounded-[2rem] text-left transition-all duration-300 group",
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10 ring-1 ring-primary/20"
          : "hover:border-white/10 hover:bg-white/[0.02]",
      )}
    >
      <div
        className="h-28 p-6 flex flex-col justify-between relative overflow-hidden"
      >
        {/* Gradient Header Pattern */}
        <div
          className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${classItem.colorStart}, ${classItem.colorEnd})`,
          }}
        />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
              {classItem.code}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
            <Users className="w-3 h-3 text-white/80" />
            <span className="text-[10px] font-bold text-white leading-none">
              {classItem.expectedStudents}
            </span>
          </div>
        </div>

        <h3 className="relative z-10 text-white font-black text-xl tracking-tight leading-tight group-hover:translate-x-1 transition-transform">
          {classItem.name}
        </h3>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm", status.text)}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", status.dot)} />
            <span className="text-[10px] uppercase font-black tracking-widest">{status.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Calendar className="w-3 h-3" />
            {classItem.room}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-3.5 group/net transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-3.5 h-3.5 text-primary opacity-60" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Boundary Rule</div>
            </div>
            <div className="text-xs font-bold text-foreground truncate">
              {classItem.allowedWifiName || "Public Network Access"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Verified", value: classItem.verifiedCount, tone: "text-success", bg: "bg-success/5 border-success/10" },
              { label: "Check", value: classItem.questionableCount, tone: "text-warning", bg: "bg-warning/5 border-warning/10" },
              { label: "Missing", value: classItem.absentCount, tone: "text-destructive", bg: "bg-destructive/5 border-destructive/10" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-2.5 text-center border", item.bg)}>
                <div className={cn("text-sm font-black tracking-tighter", item.tone)}>{item.value}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground opacity-50 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 pt-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Success Rate</span>
            <span className="text-lg font-black text-foreground">{classItem.attendanceRate}<span className="text-xs ml-0.5 opacity-40">%</span></span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${classItem.attendanceRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full relative",
                classItem.attendanceRate >= 90 ? "bg-success" : classItem.attendanceRate >= 75 ? "bg-primary" : "bg-warning"
              )}
            >
              <div className="absolute inset-0 bg-white/20 blur-sm" />
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            {classItem.latestSessionDate || "No data"}
          </div>
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.15em] bg-primary/10 px-2 py-0.5 rounded">
            {classItem.uploadedCount} Syncs
          </div>
        </div>
      </div>
    </motion.button>
  );
}
