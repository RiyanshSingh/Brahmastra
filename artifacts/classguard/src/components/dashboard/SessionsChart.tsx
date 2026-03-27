import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronDown } from "lucide-react";
import { useSessionChartData } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

export function SessionsChart() {
  const { data, isLoading } = useSessionChartData();
  const [filter, setFilter] = useState("Weekly");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="dark-card rounded-[2.5rem] p-6 pb-4 col-span-2 flex flex-col border-foreground/[0.04]"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-2xl text-foreground tracking-tight">Attendance Activity</h3>
          <p className="text-sm font-medium text-muted-foreground/60 mt-1">Strategic verification logs</p>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-muted/20 border border-border/50 rounded-2xl text-[13px] font-bold text-foreground hover:bg-muted/40 transition-all">
          {filter} <ChevronDown className="w-4 h-4 opacity-50" />
        </button>
      </div>

      <div className="flex-1 min-h-[260px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-6 justify-between animate-pulse px-4 pb-8">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="w-16 h-40 bg-muted/20 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              barGap={8}
            >
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-muted-foreground/10"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700, opacity: 0.8 }}
                dy={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600, opacity: 0.7 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 12 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#1a1c24] border border-white/5 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-3">{label}</p>
                        <div className="space-y-3">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-8">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-md shadow-sm" style={{ backgroundColor: entry.color }} />
                                <span className="text-white/80 text-xs font-bold font-sans line-clamp-1">{entry.name}</span>
                              </div>
                              <span className="text-white text-xs font-black">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  paddingTop: '40px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'hsl(var(--muted-foreground))'
                }}
              />

              <Bar
                dataKey="present"
                name="Verified Present"
                fill="#8D6CE5"
                radius={[8, 8, 8, 8]}
                barSize={20}
              />
              <Bar
                dataKey="questionable"
                name="Flagged"
                fill="#A7C4E5"
                radius={[8, 8, 8, 8]}
                barSize={20}
              />
              <Bar
                dataKey="absent"
                name="Absent"
                fill="#ef4444"
                radius={[8, 8, 8, 8]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
