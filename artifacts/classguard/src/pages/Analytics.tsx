import { motion } from "framer-motion";
import { TopNav } from "@/components/layout/TopNav";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { TrendingUp, TrendingDown, Users, AlertTriangle, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const TREND_DATA = [
  { week: "W1", present: 88, questionable: 8, absent: 4 },
  { week: "W2", present: 84, questionable: 10, absent: 6 },
  { week: "W3", present: 91, questionable: 6, absent: 3 },
  { week: "W4", present: 87, questionable: 9, absent: 4 },
  { week: "W5", present: 79, questionable: 14, absent: 7 },
  { week: "W6", present: 85, questionable: 9, absent: 6 },
  { week: "W7", present: 90, questionable: 7, absent: 3 },
  { week: "W8", present: 89, questionable: 8, absent: 3 },
];

const DAILY_CHECKIN = [
  { time: "8:00", count: 12 },
  { time: "8:30", count: 38 },
  { time: "9:00", count: 145 },
  { time: "9:15", count: 52 },
  { time: "9:30", count: 18 },
  { time: "10:00", count: 89 },
  { time: "10:30", count: 34 },
  { time: "11:00", count: 112 },
  { time: "11:30", count: 28 },
  { time: "12:00", count: 9 },
];

const CLASS_COMPARISON = [
  { name: "CS 301", rate: 91 },
  { name: "MATH 210", rate: 87 },
  { name: "PHY 305", rate: 95 },
  { name: "ENG 101", rate: 78 },
  { name: "CS 450", rate: 83 },
  { name: "DATA 201", rate: 89 },
];

const PIE_DATA = [
  { name: "Verified Present", value: 82, color: "hsl(243 75% 59%)" },
  { name: "Questionable", value: 12, color: "hsl(25 95% 53%)" },
  { name: "Absent", value: 6, color: "hsl(348 83% 47%)" },
];

const AT_RISK = [
  { name: "Marcus Johnson", rollNo: "CS2021033", class: "CS 301", absences: 7, rate: 62, trend: "down" },
  { name: "Liam Thompson", rollNo: "ENG2022019", class: "ENG 101", absences: 5, rate: 71, trend: "down" },
  { name: "Mia Rodriguez", rollNo: "MATH2021044", class: "MATH 210", absences: 4, rate: 75, trend: "up" },
  { name: "Ethan Brown", rollNo: "CS2022007", class: "CS 450", absences: 4, rate: 73, trend: "up" },
  { name: "Olivia Davis", rollNo: "PHY2021056", class: "PHY 305", absences: 3, rate: 80, trend: "up" },
];

const KPI_CARDS = [
  { label: "Avg Attendance Rate", value: "87.2%", change: "+2.1%", up: true, icon: Target, color: "text-primary bg-primary/10" },
  { label: "Proxy Attempts Blocked", value: "234", change: "-18 this week", up: true, icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
  { label: "At-Risk Students", value: "5", change: "-2 from last month", up: true, icon: Users, color: "text-warning bg-warning/10" },
  { label: "Verification Accuracy", value: "96.4%", change: "+0.8%", up: true, icon: Activity, color: "text-success bg-success/10" },
];

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Attendance trends, patterns, and at-risk student identification.
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {KPI_CARDS.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2.5 rounded-xl", kpi.color)}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-xs font-semibold flex items-center gap-1",
                  kpi.up ? "text-success" : "text-destructive"
                )}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Attendance Trend — Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card rounded-3xl p-6 lg:col-span-2 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg text-foreground">8-Week Attendance Trend</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Verified present vs flagged vs absent (%)</p>
              </div>
              <span className="text-xs font-semibold text-success bg-success/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2.1% overall
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={TREND_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(25 95% 53%)" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="hsl(25 95% 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  formatter={(v: number) => [`${v}%`]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                <Area type="monotone" dataKey="present" name="Present" stroke="hsl(243 75% 59%)" strokeWidth={2.5} fill="url(#colorPresent)" dot={{ fill: "hsl(243 75% 59%)", r: 3 }} />
                <Area type="monotone" dataKey="questionable" name="Questionable" stroke="hsl(25 95% 53%)" strokeWidth={2} fill="url(#colorQ)" dot={{ fill: "hsl(25 95% 53%)", r: 3 }} />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="hsl(348 83% 47%)" strokeWidth={2} fill="none" dot={{ fill: "hsl(348 83% 47%)", r: 3 }} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="glass-card rounded-3xl p-6 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-lg text-foreground">Overall Breakdown</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Semester to date</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 mt-2">
              {PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in Time Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-3xl p-6 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="font-semibold text-lg text-foreground">Check-in Time Distribution</h3>
              <p className="text-sm text-muted-foreground mt-0.5">When students are marking attendance today</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={DAILY_CHECKIN} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="count" name="Check-ins" fill="hsl(243 75% 59%)" radius={[6, 6, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Class Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="glass-card rounded-3xl p-6 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="font-semibold text-lg text-foreground">Class Attendance Comparison</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Semester average by course</p>
            </div>
            <div className="space-y-4">
              {CLASS_COMPARISON.sort((a, b) => b.rate - a.rate).map((cls, i) => (
                <div key={cls.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{cls.name}</span>
                    <span className={cn(
                      "font-bold",
                      cls.rate >= 90 ? "text-success" : cls.rate >= 80 ? "text-primary" : "text-warning"
                    )}>{cls.rate}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cls.rate}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        cls.rate >= 90 ? "bg-success" : cls.rate >= 80 ? "bg-primary" : "bg-warning"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* At-Risk Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card rounded-3xl p-6 shadow-sm lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg text-foreground">At-Risk Students</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Students with attendance below 80% — early intervention recommended</p>
              </div>
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
                {AT_RISK.length} flagged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Student", "Roll No.", "Class", "Absences", "Attendance Rate", "Trend", "Action"].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AT_RISK.map((s, i) => (
                    <motion.tr
                      key={s.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warning/30 to-warning/10 flex items-center justify-center text-xs font-bold text-warning">
                            {s.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-medium text-foreground text-sm">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground font-mono">{s.rollNo}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-foreground bg-slate-100 px-2.5 py-1 rounded-lg">{s.class}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-destructive">{s.absences}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-warning rounded-full"
                              style={{ width: `${s.rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-warning">{s.rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "flex items-center gap-1 text-xs font-semibold w-fit",
                          s.trend === "up" ? "text-success" : "text-destructive"
                        )}>
                          {s.trend === "up"
                            ? <TrendingUp className="w-3.5 h-3.5" />
                            : <TrendingDown className="w-3.5 h-3.5" />}
                          {s.trend === "up" ? "Improving" : "Declining"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="text-xs font-semibold text-primary hover:underline">
                          Send Alert
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
