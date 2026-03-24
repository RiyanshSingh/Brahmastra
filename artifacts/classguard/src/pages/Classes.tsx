import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  BookOpen, Users, Clock, MapPin, Play, CheckCircle2,
  AlertTriangle, XCircle, Search, MoreHorizontal, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLASSES = [
  {
    id: "1", code: "CS 301", name: "Advanced Algorithms", room: "Hall 4B",
    schedule: "Mon / Wed / Fri  •  09:00 – 10:30 AM", students: 142,
    attendanceRate: 91, status: "active", color: "from-indigo-500 to-violet-600",
    verified: 129, questionable: 8, absent: 5,
  },
  {
    id: "2", code: "MATH 210", name: "Linear Algebra", room: "Rm 202",
    schedule: "Tue / Thu  •  11:00 AM – 12:30 PM", students: 98,
    attendanceRate: 87, status: "active", color: "from-blue-500 to-cyan-500",
    verified: 85, questionable: 10, absent: 3,
  },
  {
    id: "3", code: "ENG 101", name: "Engineering Fundamentals", room: "Lecture Hall A",
    schedule: "Mon / Wed  •  02:00 – 03:30 PM", students: 180,
    attendanceRate: 78, status: "scheduled", color: "from-orange-400 to-rose-500",
    verified: 140, questionable: 22, absent: 18,
  },
  {
    id: "4", code: "PHY 305", name: "Quantum Mechanics", room: "Lab 3",
    schedule: "Tue / Thu  •  09:00 – 10:30 AM", students: 54,
    attendanceRate: 95, status: "active", color: "from-emerald-500 to-teal-500",
    verified: 51, questionable: 2, absent: 1,
  },
  {
    id: "5", code: "CS 450", name: "Machine Learning", room: "Rm 310",
    schedule: "Fri  •  01:00 – 04:00 PM", students: 76,
    attendanceRate: 83, status: "scheduled", color: "from-violet-500 to-indigo-600",
    verified: 63, questionable: 9, absent: 4,
  },
  {
    id: "6", code: "DATA 201", name: "Database Systems", room: "Rm 115",
    schedule: "Mon / Wed / Fri  •  10:45 – 11:45 AM", students: 110,
    attendanceRate: 89, status: "ended", color: "from-slate-500 to-slate-700",
    verified: 98, questionable: 8, absent: 4,
  },
];

const STATUS_CONFIG = {
  active:    { label: "Active",    dot: "bg-success",           text: "text-success bg-success/15" },
  scheduled: { label: "Scheduled", dot: "bg-warning",           text: "text-warning bg-warning/15" },
  ended:     { label: "Ended",     dot: "bg-muted-foreground",  text: "text-muted-foreground bg-muted" },
};

export default function Classes() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "ended">("all");

  const filtered = CLASSES.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AppLayout title="Classes" subtitle="Manage and monitor all your class sessions.">
      <div className="p-6">
        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Classes", value: CLASSES.length, icon: BookOpen, color: "text-primary bg-primary/15" },
            { label: "Active Now", value: CLASSES.filter(c => c.status === "active").length, icon: Play, color: "text-success bg-success/15" },
            { label: "Total Students", value: CLASSES.reduce((a, c) => a + c.students, 0).toLocaleString(), icon: Users, color: "text-blue-400 bg-blue-400/15" },
            { label: "Avg Attendance", value: Math.round(CLASSES.reduce((a, c) => a + c.attendanceRate, 0) / CLASSES.length) + "%", icon: CheckCircle2, color: "text-warning bg-warning/15" },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.06 }}
              className="dark-card rounded-2xl p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl", item.color)}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center dark-card rounded-xl px-3.5 py-2.5 flex-1 max-w-xs gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input type="text" placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground" />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "scheduled", "ended"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === f ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" : "dark-card text-muted-foreground hover:text-foreground")}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cls, i) => {
            const status = STATUS_CONFIG[cls.status as keyof typeof STATUS_CONFIG];
            return (
              <motion.div key={cls.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
                className="dark-card rounded-2xl overflow-hidden hover:border-[hsl(var(--card-border))]/80 transition-all duration-300 group cursor-pointer">
                {/* Gradient Header */}
                <div className={cn("bg-gradient-to-br h-20 p-5 flex items-start justify-between", cls.color)}>
                  <div>
                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{cls.code}</span>
                    <h3 className="text-white font-bold text-lg leading-tight mt-0.5">{cls.name}</h3>
                  </div>
                  <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full", status.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)}></span>
                      {status.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium text-foreground">{cls.students}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" /> {cls.room}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 shrink-0" /> {cls.schedule}
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Attendance Rate</span>
                      <span className="font-bold text-foreground">{cls.attendanceRate}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${cls.attendanceRate}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                        className={cn("h-full rounded-full",
                          cls.attendanceRate >= 90 ? "bg-success" : cls.attendanceRate >= 80 ? "bg-primary" : "bg-warning")} />
                    </div>
                  </div>

                  {/* Mini Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Present", value: cls.verified, icon: CheckCircle2, color: "text-success" },
                      { label: "Flagged", value: cls.questionable, icon: AlertTriangle, color: "text-warning" },
                      { label: "Absent", value: cls.absent, icon: XCircle, color: "text-destructive" },
                    ].map((s) => (
                      <div key={s.label} className="bg-muted/60 rounded-xl p-2.5 text-center">
                        <s.icon className={cn("w-3 h-3 mx-auto mb-1", s.color)} />
                        <div className="text-sm font-bold text-foreground">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <button className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    cls.status === "active" ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                    : cls.status === "scheduled" ? "bg-muted text-foreground hover:bg-muted/80"
                    : "bg-muted/50 text-muted-foreground cursor-default")}>
                    {cls.status === "active" && <><Play className="w-3.5 h-3.5" /> Take Attendance</>}
                    {cls.status === "scheduled" && <><Clock className="w-3.5 h-3.5" /> View Schedule</>}
                    {cls.status === "ended" && <><ChevronRight className="w-3.5 h-3.5" /> View History</>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
