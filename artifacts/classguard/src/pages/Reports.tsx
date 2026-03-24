import { useState } from "react";
import { motion } from "framer-motion";
import { TopNav } from "@/components/layout/TopNav";
import {
  Download, Filter, Search, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, Calendar, FileText, ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_DATA = [
  { id: 1, student: "Eleanor Pena", rollNo: "CS2021047", class: "CS 301", date: "Mar 24, 2026", checkIn: "09:02 AM", distance: "8m", wifi: "Connected", status: "present" },
  { id: 2, student: "Cody Fisher", rollNo: "CS2021019", class: "CS 301", date: "Mar 24, 2026", checkIn: "09:11 AM", distance: "2.3 km", wifi: "Off-campus", status: "absent" },
  { id: 3, student: "Esther Howard", rollNo: "MATH2022011", class: "MATH 210", date: "Mar 24, 2026", checkIn: "11:07 AM", distance: "12m", wifi: "Connected", status: "present" },
  { id: 4, student: "Wade Warren", rollNo: "ENG2021088", class: "ENG 101", date: "Mar 24, 2026", checkIn: "02:22 PM", distance: "46m", wifi: "Connected", status: "questionable" },
  { id: 5, student: "Savannah Nguyen", rollNo: "CS2020031", class: "CS 301", date: "Mar 24, 2026", checkIn: "09:19 AM", distance: "5m", wifi: "Connected", status: "present" },
  { id: 6, student: "Brooklyn Simmons", rollNo: "PHY2022003", class: "PHY 305", date: "Mar 24, 2026", checkIn: "09:05 AM", distance: "3m", wifi: "Connected", status: "present" },
  { id: 7, student: "Robert Fox", rollNo: "CS2021062", class: "CS 450", date: "Mar 23, 2026", checkIn: "01:32 PM", distance: "890m", wifi: "Connected", status: "questionable" },
  { id: 8, student: "Jenny Wilson", rollNo: "MATH2021009", class: "MATH 210", date: "Mar 23, 2026", checkIn: "—", distance: "—", wifi: "—", status: "absent" },
  { id: 9, student: "Dianne Russell", rollNo: "ENG2022041", class: "ENG 101", date: "Mar 23, 2026", checkIn: "02:04 PM", distance: "21m", wifi: "Connected", status: "present" },
  { id: 10, student: "Cameron Williamson", rollNo: "CS2020078", class: "CS 301", date: "Mar 23, 2026", checkIn: "09:00 AM", distance: "9m", wifi: "Connected", status: "present" },
  { id: 11, student: "Kristin Watson", rollNo: "DATA2022015", class: "DATA 201", date: "Mar 23, 2026", checkIn: "10:48 AM", distance: "7m", wifi: "Connected", status: "present" },
  { id: 12, student: "Guy Hawkins", rollNo: "PHY2021027", class: "PHY 305", date: "Mar 22, 2026", checkIn: "—", distance: "—", wifi: "—", status: "absent" },
];

const STATUS_CONFIG = {
  present: { label: "Present", icon: CheckCircle2, color: "text-success bg-success/10" },
  questionable: { label: "Questionable", icon: AlertTriangle, color: "text-warning bg-warning/10" },
  absent: { label: "Absent", icon: XCircle, color: "text-destructive bg-destructive/10" },
};

const CLASSES_LIST = ["All Classes", "CS 301", "MATH 210", "ENG 101", "PHY 305", "CS 450", "DATA 201"];
const DATE_OPTIONS = ["All Dates", "Today", "Yesterday", "Last 7 Days", "Last 30 Days"];

export default function Reports() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [sortField, setSortField] = useState<string | null>(null);

  const filtered = REPORT_DATA.filter((r) => {
    const matchSearch =
      r.student.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchClass = classFilter === "All Classes" || r.class === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  const summary = {
    total: REPORT_DATA.length,
    present: REPORT_DATA.filter(r => r.status === "present").length,
    questionable: REPORT_DATA.filter(r => r.status === "questionable").length,
    absent: REPORT_DATA.filter(r => r.status === "absent").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Detailed attendance records and verification logs.
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/70 border border-white/80 rounded-full text-sm font-semibold text-foreground hover:bg-white transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Records", value: summary.total, icon: FileText, color: "text-primary bg-primary/10" },
            { label: "Present", value: summary.present, icon: CheckCircle2, color: "text-success bg-success/10" },
            { label: "Questionable", value: summary.questionable, icon: AlertTriangle, color: "text-warning bg-warning/10" },
            { label: "Absent", value: summary.absent, icon: XCircle, color: "text-destructive bg-destructive/10" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4"
            >
              <div className={cn("p-2.5 rounded-xl", item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
        >
          <div className="flex items-center bg-white/60 rounded-xl px-3 py-2 border border-white/80 flex-1 min-w-[180px] max-w-xs gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
            />
          </div>

          <SelectPill
            icon={<Filter className="w-3.5 h-3.5" />}
            label="Status"
            value={statusFilter === "all" ? "All Status" : STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG].label}
            options={["all", "present", "questionable", "absent"]}
            display={(v) => v === "all" ? "All Status" : STATUS_CONFIG[v as keyof typeof STATUS_CONFIG].label}
            onChange={setStatusFilter}
          />

          <SelectPill
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Class"
            value={classFilter}
            options={CLASSES_LIST}
            display={(v) => v}
            onChange={setClassFilter}
          />

          <SelectPill
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Date"
            value={dateFilter}
            options={DATE_OPTIONS}
            display={(v) => v}
            onChange={setDateFilter}
          />

          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-3xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Student", "Roll No.", "Class", "Date", "Check-in", "Distance", "WiFi", "Status"].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      <button
                        onClick={() => setSortField(col)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {col}
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const st = STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG];
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {row.student.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-medium text-foreground text-sm">{row.student}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{row.rollNo}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-foreground px-2.5 py-1 bg-slate-100 rounded-lg">{row.class}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.date}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">{row.checkIn}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.distance}</td>
                      <td className="px-6 py-4">
                        {row.wifi === "Connected" ? (
                          <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">{row.wifi}</span>
                        ) : row.wifi === "Off-campus" ? (
                          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2.5 py-1 rounded-full">{row.wifi}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("flex items-center gap-1.5 w-fit text-xs font-semibold px-3 py-1.5 rounded-full", st.color)}>
                          <st.icon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No records found matching your filters.</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function SelectPill({ icon, label, value, options, display, onChange }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  display: (v: string) => string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none flex items-center gap-2 px-4 py-2 bg-white/60 border border-white/80 rounded-xl text-sm font-medium text-foreground hover:bg-white/80 transition-colors cursor-pointer pr-8 outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{display(opt)}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
