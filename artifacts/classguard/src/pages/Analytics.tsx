import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
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
  { time: "8:00", count: 12 }, { time: "8:30", count: 38 }, { time: "9:00", count: 145 },
  { time: "9:15", count: 52 }, { time: "9:30", count: 18 }, { time: "10:00", count: 89 },
  { time: "10:30", count: 34 }, { time: "11:00", count: 112 }, { time: "11:30", count: 28 }, { time: "12:00", count: 9 },
];

const CLASS_COMPARISON = [
  { name: "CS 301", rate: 91 }, { name: "MATH 210", rate: 87 }, { name: "PHY 305", rate: 95 },
  { name: "ENG 101", rate: 78 }, { name: "CS 450", rate: 83 }, { name: "DATA 201", rate: 89 },
];

const PIE_DATA = [
  { name: "Verified Present", value: 82, color: "hsl(240,73%,62%)" },
  { name: "Questionable", value: 12, color: "hsl(38,94%,55%)" },
  { name: "Absent", value: 6, color: "hsl(4,80%,58%)" },
];

const AT_RISK = [
  { name: "Marcus Johnson", rollNo: "CS2021033", cls: "CS 301", absences: 7, rate: 62, trend: "down" },
  { name: "Liam Thompson", rollNo: "ENG2022019", cls: "ENG 101", absences: 5, rate: 71, trend: "down" },
  { name: "Mia Rodriguez", rollNo: "MATH2021044", cls: "MATH 210", absences: 4, rate: 75, trend: "up" },
  { name: "Ethan Brown", rollNo: "CS2022007", cls: "CS 450", absences: 4, rate: 73, trend: "up" },
  { name: "Olivia Davis", rollNo: "PHY2021056", cls: "PHY 305", absences: 3, rate: 80, trend: "up" },
];

const TOOLTIP_STYLE = {
  contentStyle: { background: "hsl(230,16%,11%)", border: "1px solid hsl(230,14%,17%)", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" },
  labelStyle: { color: "hsl(210,30%,95%)", fontSize: "12px", fontWeight: 600 },
  itemStyle: { color: "hsl(215,20%,65%)", fontSize: "11px" },
};

const KPI_CARDS = [
  { label: "Avg Attendance Rate", value: "87.2%", change: "+2.1%", up: true, icon: Target, color: "text-primary bg-primary/15" },
  { label: "Proxy Attempts Blocked", value: "234", change: "-18 this week", up: true, icon: AlertTriangle, color: "text-destructive bg-destructive/15" },
  { label: "At-Risk Students", value: "5", change: "-2 from last month", up: true, icon: Users, color: "text-warning bg-warning/15" },
  { label: "Verification Accuracy", value: "96.4%", change: "+0.8%", up: true, icon: Activity, color: "text-success bg-success/15" },
];

export default function Analytics() {
  return (
    <AppLayout title="Analytics" subtitle="Attendance trends, patterns, and at-risk student identification.">
      <div className="p-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {KPI_CARDS.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }}
              className="dark-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2.5 rounded-xl", kpi.color)}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <span className={cn("text-xs font-semibold flex items-center gap-1", kpi.up ? "text-success" : "text-destructive")}>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* 8-Week Trend */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="dark-card rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-base text-foreground">8-Week Attendance Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Verified present vs flagged vs absent (%)</p>
              </div>
              <span className="text-xs font-semibold text-success bg-success/15 px-3 py-1.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2.1% overall
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={TREND_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(240,73%,62%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(240,73%,62%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38,94%,55%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(38,94%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(230,14%,17%)" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 11 }} unit="%" />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", paddingTop: "14px", color: "hsl(215,20%,65%)" }} />
                <Area type="monotone" dataKey="present" name="Present" stroke="hsl(240,73%,62%)" strokeWidth={2.5} fill="url(#gPresent)" dot={{ fill: "hsl(240,73%,62%)", r: 3 }} />
                <Area type="monotone" dataKey="questionable" name="Questionable" stroke="hsl(38,94%,55%)" strokeWidth={2} fill="url(#gQ)" dot={{ fill: "hsl(38,94%,55%)", r: 3 }} />
                <Line type="monotone" dataKey="absent" name="Absent" stroke="hsl(4,80%,58%)" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "hsl(4,80%,58%)", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
            className="dark-card rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-base text-foreground">Overall Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Semester to date</p>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={3} dataKey="value">
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 mt-1">
              {PIE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Check-in Distribution */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="dark-card rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="font-semibold text-base text-foreground">Check-in Time Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">When students are marking attendance today</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DAILY_CHECKIN} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(230,14%,17%)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" name="Check-ins" fill="hsl(240,73%,62%)" radius={[5, 5, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Class Comparison */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
            className="dark-card rounded-2xl p-6">
            <div className="mb-5">
              <h3 className="font-semibold text-base text-foreground">Class Attendance Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Semester average by course</p>
            </div>
            <div className="space-y-4">
              {CLASS_COMPARISON.sort((a, b) => b.rate - a.rate).map((cls, i) => (
                <div key={cls.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{cls.name}</span>
                    <span className={cn("font-bold", cls.rate >= 90 ? "text-success" : cls.rate >= 80 ? "text-primary" : "text-warning")}>{cls.rate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${cls.rate}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.07, ease: "easeOut" }}
                      className={cn("h-full rounded-full", cls.rate >= 90 ? "bg-success" : cls.rate >= 80 ? "bg-primary" : "bg-warning")} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* At-Risk Students */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="dark-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base text-foreground">At-Risk Students</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Attendance below 80% — early intervention recommended</p>
            </div>
            <span className="text-xs font-bold text-destructive bg-destructive/15 px-3 py-1.5 rounded-full">{AT_RISK.length} flagged</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  {["Student", "Roll No.", "Class", "Absences", "Attendance Rate", "Trend", "Action"].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AT_RISK.map((s, i) => (
                  <motion.tr key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}
                    className="border-b border-card-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center text-[10px] font-bold text-warning shrink-0">
                          {s.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{s.rollNo}</td>
                    <td className="px-4 py-3.5"><span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-lg">{s.cls}</span></td>
                    <td className="px-4 py-3.5"><span className="text-sm font-bold text-destructive">{s.absences}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-warning rounded-full" style={{ width: `${s.rate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-warning">{s.rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", s.trend === "up" ? "text-success" : "text-destructive")}>
                        {s.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {s.trend === "up" ? "Improving" : "Declining"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Send Alert</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
