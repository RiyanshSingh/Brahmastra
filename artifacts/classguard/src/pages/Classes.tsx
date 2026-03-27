import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  HelpCircle,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { MapPicker } from "@/components/dashboard/MapPicker";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import {
  clearClassUploadHistory,
  deleteUploadedWorkbook,
  importPunches,
  initializeLiveSession,
  resetStudentDeviceBinding,
  saveSessionRecheck,
  updateClassGateways,
  updateClassQuizEnabled,
  upsertQuiz,
  fetchQuiz,
  createClass,
  deleteClass,
  type AttendanceStatus,
  type ClassSummary,
  type SessionPayload,
  type UploadedWorkbookHistoryItem,
  type QuizQuestion,
} from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getStatusLabel, parsePunchWorkbook } from "@/lib/attendance";
import { fetchPublicIp } from "@/lib/student-auth";
import {
  useClassUploadHistoryData,
  useClassesData,
  useLatestSessionData,
} from "@/hooks/use-attendance-data";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS: AttendanceStatus[] = [
  "pending",
  "present",
  "late_present",
  "left_after_punch",
  "absent",
];

const CLASS_STATUS_CONFIG = {
  active: { label: "Recheck active", dot: "bg-success", text: "text-[#15803d] dark:text-success bg-success/15" },
  scheduled: { label: "Waiting for upload", dot: "bg-warning", text: "text-[#92400e] dark:text-warning bg-warning/15" },
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
  const [reviewerName, setReviewerName] = useState(() => 
    localStorage.getItem("brahmastra_admin_name") || "Teacher"
  );
  const [allowedWifiPublicIp, setAllowedWifiPublicIp] = useState("");
  const [allowedLatitude, setAllowedLatitude] = useState("");
  const [allowedLongitude, setAllowedLongitude] = useState("");
  const [allowedRadius, setAllowedRadius] = useState("");
  const [detectedPublicIp, setDetectedPublicIp] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isDeviceBound, setIsDeviceBound] = useState(false);
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [resetEnrollmentNo, setResetEnrollmentNo] = useState("");
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const { data: latestSession, isLoading: isSessionLoading } = useLatestSessionData(
    selectedClassId || null,
  );
  const {
    data: uploadHistory = [],
    isLoading: isUploadHistoryLoading,
  } = useClassUploadHistoryData(selectedClassId || null);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmDetails, setDeleteConfirmDetails] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassRoom, setNewClassRoom] = useState("");
  const [newClassSchedule, setNewClassSchedule] = useState("");
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
    if (currentClass) {
      setAllowedWifiPublicIp(currentClass.allowedWifiPublicIp ?? "");
      setAllowedLatitude(currentClass.allowedLatitude?.toString() ?? "");
      setAllowedLongitude(currentClass.allowedLongitude?.toString() ?? "");
      setAllowedRadius(currentClass.allowedRadius?.toString() ?? "");
      setQuizEnabled(currentClass.quizEnabled ?? false);

      fetchQuiz(currentClass.id)
        .then((q) => {
          if (q) setQuizQuestions(q.questions);
          else setQuizQuestions([]);
        })
        .catch(console.error);
    }
  }, [selectedClassId]);

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

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!cancelled) {
            setDetectedLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          }
        },
        null,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
      );
      return () => {
        cancelled = true;
        navigator.geolocation.clearWatch(watchId);
      };
    }

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
    const uploadedRowsCount =
      latestSession?.session.uploadedCount ??
      (currentClass && currentClass.uploadedCount > 0 ? currentClass.uploadedCount : null) ??
      (uploadHistory[0]?.uploadCount ?? null);

    const uploadedCountValue = (uploadedRowsCount ?? 0).toLocaleString();
    const uploadedCountLabel = "Excel Rows Uploaded";

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
        color: "text-[#15803d] dark:text-success bg-success/15",
      },
      {
        label: uploadedCountLabel,
        value: uploadedCountValue,
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
        color: "text-[#92400e] dark:text-warning bg-warning/15",
      },
    ];
  }, [classes, currentClass, latestSession, uploadHistory]);

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

  const liveSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) {
        throw new Error("Choose a class before starting a session.");
      }
      return initializeLiveSession(selectedClassId, sessionDate);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.setQueryData(["classes", "latest-session", selectedClassId], data);
      toast({
        title: "Live session initialized",
        description: `Students can now mark attendance for ${data.session.sessionDate}. You can upload the Excel sheet later to match records.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start session",
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
        throw new Error("Choose a class before saving network rules.");
      }

      await updateClassGateways(selectedClassId, {
        allowedWifiName: null,
        allowedWifiPublicIp,
        allowedLatitude: allowedLatitude ? parseFloat(allowedLatitude) : null,
        allowedLongitude: allowedLongitude ? parseFloat(allowedLongitude) : null,
        allowedRadius: allowedRadius ? parseInt(allowedRadius) : null,
      });

      await updateClassQuizEnabled(selectedClassId, quizEnabled);
      if (quizQuestions.length > 0) {
        await upsertQuiz(selectedClassId, `${currentClass?.name || 'Class'} Quiz`, quizQuestions);
      }
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["classes", "latest-session", selectedClassId] });
      toast({
        title: "Gateways updated",
        description: "Class boundary rules (IP/GPS) have been successfully authorized.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to save boundary rules",
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

  const deleteHistoryItemMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      setDeletingHistoryId(sessionId);
      await deleteUploadedWorkbook(sessionId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["classes", "latest-session", selectedClassId] });
      await queryClient.invalidateQueries({ queryKey: ["classes", "upload-history", selectedClassId] });
      toast({
        title: "Upload removed",
        description: "The selected Excel upload has been cleared from this class.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to remove upload",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingHistoryId(null);
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) {
        throw new Error("Choose a class before clearing upload history.");
      }

      await clearClassUploadHistory(selectedClassId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["classes", "latest-session", selectedClassId] });
      await queryClient.invalidateQueries({ queryKey: ["classes", "upload-history", selectedClassId] });
      toast({
        title: "Upload history cleared",
        description: "All previously uploaded Excel files for this class have been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to clear history",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async () => {
      if (!newClassCode.trim() || !newClassName.trim()) {
        throw new Error("Both Class Code and Name are required.");
      }
      return createClass({
        code: newClassCode,
        name: newClassName,
        room: newClassRoom,
        scheduleText: newClassSchedule
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsCreateClassOpen(false);
      setNewClassCode("");
      setNewClassName("");
      setNewClassRoom("");
      setNewClassSchedule("");
      toast({
        title: "Class Created",
        description: "Your new classroom has been successfully initialized in the system.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => deleteClass(classId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setSelectedClassId("");
      toast({
        title: "Class Deleted",
        description: "The course and its associated records have been wiped.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summaryStrip.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="dark-card backdrop-blur-xl border border-border rounded-[1.5rem] p-5 flex items-center gap-4 group transition-all duration-300 hover:shadow-2xl hover:shadow-black/20"
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
            className="dark-card relative overflow-hidden rounded-[1.75rem] p-5 xl:col-span-4 group"
          >
            {/* Mesh Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight leading-tight">Morning Punch Import</h3>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Load the teacher’s Excel sheet to begin.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Target Class
                </span>
                <div className="flex items-center gap-2">
                  {currentClass && (
                    <button
                      onClick={() => {
                        setDeleteConfirmDetails({
                          title: `Permanently delete ${currentClass.code}?`,
                          description: "All class history, student records, and attendance data will be permanently wiped from the database. This action cannot be undone.",
                          onConfirm: () => deleteClassMutation.mutate(currentClass.id)
                        });
                        setDeleteConfirmOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-[11px] font-bold text-destructive flex items-center gap-1.5 transition-all active:scale-[0.95] shadow-sm shadow-destructive/5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setIsCreateClassOpen(true)}
                    className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-[11px] font-bold text-primary flex items-center gap-1.5 transition-all active:scale-[0.95] shadow-sm shadow-primary/5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>
              </div>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger className="w-full h-12 rounded-xl border border-border bg-muted/20 backdrop-blur-md px-4 text-sm text-foreground focus:ring-primary/40 focus:bg-muted/30 transition-all">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-card">
                  {classes.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="rounded-xl focus:bg-primary">
                      {item.code} • {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Session Date
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 backdrop-blur-md px-4 py-2.5 focus-within:border-primary/40 focus-within:bg-muted/30 transition-all">
                  <Calendar className="w-4 h-4 text-primary/60" />
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(event) => setSessionDate(event.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Record Reviewer
                </span>
                <input
                  value={reviewerName}
                  onChange={(event) => setReviewerName(event.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/20 backdrop-blur-md px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-muted/30 transition-all"
                  placeholder="Enter name"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                  Excel Workbook
                </span>
                <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/10 p-4 hover:bg-muted/20 hover:border-primary/30 transition-all group/upload">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover/upload:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
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
                disabled={importMutation.isPending || liveSessionMutation.isPending}
                className="w-full rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] hover:bg-right px-4 py-3.5 text-xs font-bold text-white shadow-xl shadow-primary/20 transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {importMutation.isPending ? "Processing..." : "Import & Initialize Recheck"}
              </button>
              <div className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-border/20" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/30 whitespace-nowrap px-1">OR</span>
                <div className="h-px flex-1 bg-border/20" />
              </div>

              <button
                onClick={() => liveSessionMutation.mutate()}
                disabled={importMutation.isPending || liveSessionMutation.isPending}
                className="w-full rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 text-xs font-bold text-primary transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {liveSessionMutation.isPending ? "Starting..." : "Start Live Session (No File)"}
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
                <div className="rounded-[1.5rem] border-2 border-dashed border-border bg-muted/10 px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-foreground font-bold">Session required</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                    Upload a punch sheet to activate live student marking.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 flex items-center justify-between">
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
                      <span className="text-[10px] font-bold text-[#15803d] dark:text-success uppercase tracking-wider">Active</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 group/ip">
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

                  <div className="rounded-[1.5rem] border border-border bg-gradient-to-br from-white/[0.05] to-transparent p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#92400e] dark:text-amber-500">
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
                          className="w-full rounded-xl border border-border bg-muted/20 pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-amber-500/30 transition-all"
                          placeholder="Enrollment"
                        />
                      </div>
                      <button
                        onClick={() => resetDeviceMutation.mutate()}
                        disabled={resetDeviceMutation.isPending || !resetEnrollmentNo.trim()}
                        className="w-full rounded-xl bg-amber-600 dark:bg-amber-500/10 border border-amber-600/20 py-3 text-xs font-bold text-white dark:text-amber-500 hover:bg-amber-700 dark:hover:bg-amber-500 dark:hover:text-white transition-all duration-300 shadow-lg shadow-amber-600/10 dark:shadow-none disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest"
                      >
                        {resetDeviceMutation.isPending ? "Resetting..." : "Unlock Device Binding"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-muted/10 border border-border p-4 flex flex-col justify-between h-24">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60">Presence</div>
                      <div className="text-3xl font-black text-foreground">{latestSession.session.studentMarkedCount}</div>
                    </div>
                    <div className="rounded-2xl bg-muted/10 border border-border p-4 flex flex-col justify-between h-24">
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
            className="dark-card relative overflow-hidden rounded-[2rem] flex flex-col xl:col-span-4"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="p-6 border-b border-card-border overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-foreground tracking-tight">Excel History</h3>
                {currentClass && (
                  <div className="px-2 py-0.5 rounded-full bg-muted/20 border border-border text-[9px] uppercase font-bold tracking-widest text-muted-foreground scale-95 origin-right">
                    {uploadHistory.length} uploads
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-60">
                {currentClass ? `History for ${currentClass.code}` : "Previously uploaded sheets"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[520px] scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
              {!currentClass ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs font-bold text-foreground opacity-60">Select a class first</p>
                </div>
              ) : isUploadHistoryLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-20 rounded-2xl bg-muted/10 border border-border animate-pulse" />
                  ))}
                </div>
              ) : uploadHistory.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-6 h-6 text-muted-foreground/20" />
                  </div>
                  <p className="text-xs font-bold text-foreground opacity-40">No history found</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {uploadHistory.map((item) => (
                    <UploadHistoryCard
                      key={item.id}
                      item={item}
                      compact
                      isDeleting={deleteHistoryItemMutation.isPending && deletingHistoryId === item.id}
                      onDelete={() => {
                        setDeleteConfirmDetails({
                          title: `Delete ${item.sourceFileName}?`,
                          description: "This specific Excel upload and its associated attendance recheck records will be permanently removed. This action cannot be reversed.",
                          onConfirm: () => deleteHistoryItemMutation.mutate(item.id)
                        });
                        setDeleteConfirmOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {currentClass && uploadHistory.length > 0 && (
              <div className="p-4 bg-muted/5 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Clear all?`)) {
                      clearHistoryMutation.mutate();
                    }
                  }}
                  disabled={clearHistoryMutation.isPending}
                  className="w-full rounded-xl border border-destructive/20 bg-destructive/10 py-2.5 text-[10px] font-black uppercase tracking-widest text-destructive transition-all hover:bg-destructive hover:text-white disabled:opacity-40"
                >
                  {clearHistoryMutation.isPending ? "Clearing..." : "Clear Upload History"}
                </button>
              </div>
            )}
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
              <span className="px-4 py-1.5 rounded-full bg-muted/20 border border-border text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground">
                {currentClass.code} System Configuration
              </span>
            )}
          </div>

          {!currentClass ? (
            <div className="rounded-[1.5rem] border-2 border-dashed border-border bg-muted/10 px-6 py-12 text-center">
              <p className="text-sm font-bold text-foreground">Select a class first</p>
              <p className="mt-1 text-xs text-muted-foreground opacity-60">
                Configure your network boundary to prevent remote proxy markers.
              </p>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                      Visual Coordinates Pick
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase">
                      <MapIcon className="w-2.5 h-2.5" /> Interactive Map
                    </div>
                  </div>
                  <MapPicker
                    lat={allowedLatitude ? parseFloat(allowedLatitude) : null}
                    lng={allowedLongitude ? parseFloat(allowedLongitude) : null}
                    radius={parseInt(allowedRadius) || 100}
                    onChange={(lat, lng) => {
                      setAllowedLatitude(lat.toString());
                      setAllowedLongitude(lng.toString());
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                    Public IP Lock <span className="text-muted-foreground/40 lowercase font-medium ml-1">(Optional)</span>
                  </span>
                  <input
                    value={allowedWifiPublicIp}
                    onChange={(event) => setAllowedWifiPublicIp(event.target.value)}
                    className="w-full rounded-2xl border border-border bg-muted/20 backdrop-blur-md px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-muted/30 transition-all"
                    placeholder="e.g. 103.45.12.1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                      Latitude
                    </span>
                    <div className="relative">
                      <input
                        value={allowedLatitude}
                        onChange={(event) => setAllowedLatitude(event.target.value)}
                        className="w-full rounded-2xl border border-border bg-muted/20 backdrop-blur-md pl-4 pr-10 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-muted/30 transition-all"
                        placeholder="e.g. 19.076"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            setLocationLoading(true);
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setAllowedLatitude(pos.coords.latitude.toString());
                              setAllowedLongitude(pos.coords.longitude.toString());
                              setLocationLoading(false);
                            }, () => setLocationLoading(false));
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-foreground"
                      >
                        <MapPin className={cn("w-4 h-4", locationLoading && "animate-ping")} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">
                      Longitude
                    </span>
                    <input
                      value={allowedLongitude}
                      onChange={(event) => setAllowedLongitude(event.target.value)}
                      className="w-full rounded-2xl border border-border bg-muted/20 backdrop-blur-md px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary/40 focus:bg-muted/30 transition-all"
                      placeholder="e.g. 72.877"
                    />
                  </div>
                  <div className="space-y-2 text-primary">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold ml-1">
                      Radius (meters)
                    </span>
                    <input
                      value={allowedRadius}
                      onChange={(event) => setAllowedRadius(event.target.value)}
                      className="w-full rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md px-4 py-3.5 text-sm font-bold text-primary outline-none focus:border-primary/40 focus:bg-primary/10 transition-all"
                      placeholder="e.g. 100"
                    />
                  </div>
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
                      setAllowedWifiPublicIp("");
                      setAllowedLatitude("");
                      setAllowedLongitude("");
                      setAllowedRadius("");
                    }}
                    type="button"
                    className="px-6 py-4 rounded-2xl bg-muted/20 border border-border text-sm font-bold text-foreground hover:bg-muted/30 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-border p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-success/10 text-[#15803d] dark:text-success">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground tracking-tight">Active Sensor Feedback</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 group/ip-helper transition-colors hover:bg-muted/60">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 mb-2">My Network IP</div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-mono text-foreground font-bold truncate">
                          {detectedPublicIp || "Detecting..."}
                        </div>
                        <button
                          type="button"
                          onClick={() => detectedPublicIp && setAllowedWifiPublicIp(detectedPublicIp)}
                          disabled={!detectedPublicIp}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-wider hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 group/loc-helper transition-colors hover:bg-muted/60">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">My Current Location</div>
                        {detectedLocation?.accuracy && (
                          <div className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                            detectedLocation.accuracy < 20 ? "bg-success/20 text-[#15803d] dark:text-success" : "bg-warning/20 text-[#92400e] dark:text-warning"
                          )}>
                            Accurate to {detectedLocation.accuracy.toFixed(0)}m
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-mono text-foreground font-bold truncate">
                          {detectedLocation ? `${detectedLocation.lat.toFixed(6)}, ${detectedLocation.lng.toFixed(6)}` : "Fetching GPS..."}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (detectedLocation) {
                              setAllowedLatitude(detectedLocation.lat.toString());
                              setAllowedLongitude(detectedLocation.lng.toString());
                              if (!allowedRadius) setAllowedRadius("100");
                            }
                          }}
                          disabled={!detectedLocation}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-wider hover:bg-primary hover:text-white transition-all disabled:opacity-30"
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
                        If boundary rules are set, students can mark attendance only when their Public IP matches and they are within the GPS Radius of the classroom.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-gradient-to-br from-primary/5 to-transparent border border-border p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-foreground block">Quiz-Gated Attendance</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Extra Verification</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuizEnabled(!quizEnabled)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-300 outline-none p-1 shadow-inner",
                        quizEnabled ? "bg-primary" : "bg-slate-200 dark:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full bg-white transition-all duration-300 transform shadow-md shadow-black/10",
                        quizEnabled ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  {quizEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold ml-1">Quiz Questions ({quizQuestions.length})</span>
                        <button
                          type="button"
                          onClick={() => setQuizQuestions([...quizQuestions, { question_text: "", options: ["", ""], correct_option_index: 0 }])}
                          className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Add Question
                        </button>
                      </div>

                      <div className="space-y-4">
                        {quizQuestions.map((q, qIdx) => (
                          <div key={qIdx} className="p-5 rounded-2xl bg-muted/20 border border-border space-y-4 relative group/q animate-in zoom-in-95 duration-300">
                            <button
                              type="button"
                              onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                              className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive opacity-100 lg:opacity-0 lg:group-hover/q:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex gap-4">
                              <span className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">{qIdx + 1}</span>
                              <input
                                value={q.question_text}
                                onChange={(e) => {
                                  const newQs = [...quizQuestions];
                                  newQs[qIdx] = { ...newQs[qIdx], question_text: e.target.value };
                                  setQuizQuestions(newQs);
                                }}
                                className="flex-1 bg-transparent border-none text-base font-bold text-foreground placeholder:text-muted-foreground/30 outline-none h-8"
                                placeholder="Enter Question"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                              {Array.from({ length: 4 }).map((_, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                    q.correct_option_index === oIdx ? "bg-primary/10 border-primary/30" : "bg-muted/40 border-border"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newQs = [...quizQuestions];
                                      newQs[qIdx] = { ...newQs[qIdx], correct_option_index: oIdx };
                                      setQuizQuestions(newQs);
                                    }}
                                    className={cn(
                                      "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                      q.correct_option_index === oIdx ? "bg-primary border-primary" : "bg-transparent border-border/40"
                                    )}
                                  >
                                    {q.correct_option_index === oIdx && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </button>
                                  <input
                                    value={q.options[oIdx] || ""}
                                    onChange={(e) => {
                                      const newQs = [...quizQuestions];
                                      const newOpts = [...newQs[qIdx].options];
                                      newOpts[oIdx] = e.target.value;
                                      newQs[qIdx] = { ...newQs[qIdx], options: newOpts };
                                      setQuizQuestions(newQs);
                                    }}
                                    className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground/30 outline-none"
                                    placeholder={`Option ${oIdx + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
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
            <div className="overflow-x-auto relative max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-md shadow-sm">
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
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-card-border shadow-sm group-hover:scale-105 transition-all duration-300">
                            <img
                              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${record.studentName}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
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
                                ? "bg-success/15 text-[#15803d] dark:text-success"
                                : "bg-warning/15 text-[#92400e] dark:text-warning",
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
                        <Select
                          value={draftStatuses[record.id] ?? record.status}
                          onValueChange={(val) =>
                            setDraftStatuses((current) => ({
                              ...current,
                              [record.id]: val as AttendanceStatus,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-muted/20 px-3 text-xs font-semibold text-foreground focus:ring-primary/40 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border border-border bg-card backdrop-blur-2xl">
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status} className="rounded-xl focus:bg-primary">
                                {getStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

      <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card backdrop-blur-2xl border-border p-0 overflow-hidden rounded-[32px] shadow-2xl">
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white">Create New Class</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Initialize a new strategic classroom.</DialogDescription>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Class Code</Label>
                <Input
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                  className="h-12 rounded-2xl bg-muted/20 border-border"
                  placeholder="CS101"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Room No.</Label>
                <Input
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  className="h-12 rounded-2xl bg-muted/20 border-border"
                  placeholder="B-204"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Full Class Name</Label>
              <Input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="h-12 rounded-2xl bg-muted/20 border-border"
                placeholder="Software Engineering"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Timing / Schedule</Label>
              <Input
                value={newClassSchedule}
                onChange={(e) => setNewClassSchedule(e.target.value)}
                className="h-12 rounded-2xl bg-muted/20 border-border"
                placeholder="Mon / Wed / Fri • 09:00 AM"
              />
            </div>

            <Button
              onClick={() => createClassMutation.mutate()}
              disabled={createClassMutation.isPending}
              className="w-full h-12 rounded-2xl bg-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {createClassMutation.isPending ? "Creating..." : "Initialize Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Deletion Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-40px)] sm:max-w-[400px] rounded-[1.8rem] sm:rounded-[2rem] bg-card border-border backdrop-blur-3xl p-6 sm:p-10 shadow-2xl outline-none">
          <AlertDialogHeader className="space-y-4 text-center">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] bg-destructive/10 flex items-center justify-center mb-1 sm:mb-2 shadow-2xl shadow-destructive/10 border border-destructive/20">
              <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" strokeWidth={2} stroke="currentColor" />
            </div>
            <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-foreground tracking-tight text-center w-full">
              Delete Live Entry?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-[15px] font-medium text-muted-foreground/80 leading-relaxed px-2 sm:px-4 text-center w-full">
              All associated attendance records will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 sm:mt-10 flex flex-row items-center justify-center gap-3 sm:gap-4">
            <AlertDialogCancel
              className="mt-0 h-11 sm:h-12 flex-1 rounded-2xl border-border bg-muted/20 hover:bg-muted/30 text-xs sm:text-sm font-semibold transition-all"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 sm:h-12 flex-1 rounded-2xl bg-destructive hover:bg-destructive/90 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-destructive/20 transition-all active:scale-[0.98]"
              onClick={() => {
                deleteConfirmDetails?.onConfirm();
                setDeleteConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
            color: "text-[#15803d] dark:text-success bg-success/10 border-success/20",
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
            color: "text-[#92400e] dark:text-amber-500 bg-amber-500/10 border-amber-500/20",
            icon: XCircle,
            sub: "Missing Mark"
          },
        ].map((item) => (
          <div key={item.label} className="group rounded-[1.25rem] bg-muted/10 border border-border p-4 hover:bg-white/[0.04] transition-all duration-300">
            <div className={cn("inline-flex rounded-xl p-2.5 mb-3 border", item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-foreground group-hover:scale-110 origin-left transition-transform">{item.value}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-white/[0.02] to-transparent border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center border border-border">
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
            <div className="text-xs font-bold text-[#92400e] dark:text-amber-500">
              {session.session.markOnlyCount} Orphans
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-40 mb-1">Active Gateway</div>
            <div className="text-xs font-mono text-primary font-bold truncate">
              {session.session.allowedWifiPublicIp || "Open access"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadHistoryCard({
  item,
  isDeleting,
  onDelete,
  compact = false,
}: {
  item: UploadedWorkbookHistoryItem;
  isDeleting: boolean;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-muted/20 p-4 sm:p-5 hover:bg-white/[0.045] transition-colors group/card">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-foreground leading-tight break-all transition-colors line-clamp-2">
                {item.sourceFileName}
              </div>
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mt-1.5 opacity-60">
                Uploaded {new Date(item.importedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
              item.reviewStatus === "finalized"
                ? "bg-success/15 text-[#15803d] dark:text-success"
                : item.reviewStatus === "recheck_pending"
                  ? "bg-warning/15 text-[#92400e] dark:text-warning"
                  : "bg-muted/30 text-muted-foreground",
            )}
          >
            {item.reviewStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        <HistoryMetric label="Session Date" value={item.sessionDate} />
        <HistoryMetric label="Rows Count" value={item.uploadCount} />
        <HistoryMetric
          label="Last Update"
          value={new Date(item.updatedAt).toLocaleDateString()}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isDeleting ? "Removing..." : "Remove Upload"}
        </button>
      </div>
    </div>
  );
}

function HistoryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-2.5 sm:p-3 transition-colors hover:bg-muted/60">
      <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">
        {label}
      </div>
      <div className="mt-1 text-[11px] sm:text-xs font-black text-foreground leading-tight">{value}</div>
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
          : "hover:border-border hover:bg-muted/10",
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
          <div className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-border/40">
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
              {classItem.code}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md border border-border">
            <Users className="w-3 h-3 text-foreground/80" />
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
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-muted/20 px-2.5 py-1 rounded-lg border border-border">
            <Calendar className="w-3 h-3" />
            {classItem.room}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="rounded-2xl bg-muted/10 border border-border p-3.5 group/net transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-3.5 h-3.5 text-primary opacity-60" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Boundary Rule</div>
            </div>
            <div className="text-xs font-bold text-foreground truncate">
              {classItem.allowedWifiPublicIp || "Open Network Access"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Verified", value: classItem.verifiedCount, tone: "text-[#15803d] dark:text-success", bg: "bg-success/5 border-success/10" },
              { label: "Check", value: classItem.questionableCount, tone: "text-[#92400e] dark:text-warning", bg: "bg-warning/5 border-warning/10" },
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
          <div className="h-2 bg-muted/20 rounded-full overflow-hidden border border-border relative">
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

        <div className="flex items-center justify-between pt-4 border-t border-border">
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
