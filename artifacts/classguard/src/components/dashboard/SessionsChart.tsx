import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronDown } from "lucide-react";
import { useSessionChartData } from "@/hooks/use-dashboard-data";

export function SessionsChart() {
  const { data, isLoading } = useSessionChartData();
  const [filter, setFilter] = useState("Weekly");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="dark-card rounded-[2rem] p-6 lg:p-8 col-span-2 flex flex-col"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Attendance Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">Verification status over time</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-muted border border-card-border rounded-full text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
          {filter} <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-2 justify-between animate-pulse px-4 pb-8">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-12 h-32 bg-muted rounded-t-lg"></div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              barGap={4}
              barSize={12}
            >
              <defs>
                <linearGradient id="barPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barWarning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="barDestructive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(230,14%,17%)" strokeDasharray="3 3" opacity={0.5} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(215,20%,52%)', fontSize: 12, fontWeight: 500 }}
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(215,20%,45%)', fontSize: 11 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0b0c10]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-2">{label}</p>
                        <div className="space-y-2">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-6">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-white/80 text-xs font-medium">{entry.name}</span>
                              </div>
                              <span className="text-white text-xs font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px', paddingTop: '30px', fontWeight: 500, opacity: 0.8 }} />
              <Bar dataKey="present" name="Verified Present" fill="url(#barPresent)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="questionable" name="Flagged" fill="url(#barWarning)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="url(#barDestructive)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
