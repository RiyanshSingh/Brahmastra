import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalyticsData } from "@/hooks/use-attendance-data";

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(230,16%,11%)",
    border: "1px solid hsl(230,14%,17%)",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "hsl(210,30%,95%)", fontSize: "12px", fontWeight: 600 },
  itemStyle: { color: "hsl(215,20%,65%)", fontSize: "11px" },
};

const KPI_ICONS = [Target, AlertTriangle, Users, Activity];

export default function Analytics() {
  const { data, isLoading } = useAnalyticsData();

  return (
    <AppLayout title="Analytics">
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(data?.kpis ?? Array.from({ length: 4 }, () => null)).map((kpi, index) => {
            const Icon = KPI_ICONS[index] ?? Target;

            return (
              <motion.div
                key={kpi?.label ?? index}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.07 }}
                className="dark-card rounded-2xl p-5"
              >
                {isLoading || !kpi ? (
                  <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl",
                          kpi.tone === "primary" && "text-primary bg-primary/15",
                          kpi.tone === "warning" && "text-warning bg-warning/15",
                          kpi.tone === "destructive" && "text-destructive bg-destructive/15",
                          kpi.tone === "success" && "text-success bg-success/15",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold flex items-center gap-1",
                          kpi.up ? "text-success" : "text-destructive",
                        )}
                      >
                        {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {kpi.change}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="dark-card rounded-2xl p-6 lg:col-span-2"
          >
            <div className="mb-5">
              <h3 className="font-semibold text-base text-foreground">8-Week Verification Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Verified present vs needs review vs absent (%)</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.weeklyTrend ?? []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(240,73%,62%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(240,73%,62%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gQuestionable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38,94%,55%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(38,94%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(230,14%,17%)" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="present" stroke="hsl(240,73%,62%)" fill="url(#gPresent)" strokeWidth={2} />
                <Area type="monotone" dataKey="questionable" stroke="hsl(38,94%,55%)" fill="url(#gQuestionable)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent" stroke="hsl(4,80%,58%)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="dark-card rounded-2xl p-6"
          >
            <div className="mb-5">
              <h3 className="font-semibold text-base text-foreground">Current Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Across all tracked sessions</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data?.pieData ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {(data?.pieData ?? []).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="dark-card rounded-2xl p-6 lg:col-span-2"
          >
            <div className="mb-5">
              <h3 className="font-semibold text-base text-foreground">Session Upload Volume</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How many rows were imported in recent sessions</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.dailyCheckins ?? []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(230,14%,17%)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215,20%,52%)", fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="hsl(240,73%,62%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="dark-card rounded-2xl p-6"
          >
            <div className="mb-5">
              <h3 className="font-semibold text-base text-foreground">Class Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Verified rate by class</p>
            </div>
            <div className="space-y-4">
              {(data?.classComparison ?? []).map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className={cn("font-bold", item.rate >= 90 ? "text-success" : item.rate >= 75 ? "text-primary" : "text-warning")}>
                      {item.rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.rate >= 90 ? "bg-success" : item.rate >= 75 ? "bg-primary" : "bg-warning",
                      )}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="dark-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-base text-foreground">At-Risk Students</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Students trending below 80% verified attendance</p>
            </div>
            <span className="text-xs font-bold text-destructive bg-destructive/15 px-3 py-1.5 rounded-full">
              {data?.atRiskStudents.length ?? 0} flagged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-card-border">
                  {["Student", "Roll No.", "Class", "Absences", "Attendance Rate", "Trend"].map((column) => (
                    <th key={column} className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.atRiskStudents ?? []).map((student) => (
                  <tr key={`${student.rollNo}-${student.cls}`} className="border-b border-card-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-medium text-foreground">{student.name}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{student.rollNo}</td>
                    <td className="px-4 py-3.5 text-sm text-foreground">{student.cls}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-destructive">{student.absences}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-warning rounded-full" style={{ width: `${student.rate}%` }} />
                        </div>
                        <span className="text-xs font-bold text-warning">{student.rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", student.trend === "up" ? "text-success" : "text-destructive")}>
                        {student.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {student.trend === "up" ? "Improving" : "Declining"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
