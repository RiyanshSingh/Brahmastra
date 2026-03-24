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
      className="glass-card rounded-[2rem] p-6 lg:p-8 shadow-sm col-span-2 flex flex-col"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Attendance Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">Verification status over time</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-100 transition-colors">
          {filter} <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-2 justify-between animate-pulse px-4 pb-8">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="w-12 h-32 bg-slate-100 rounded-t-lg"></div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              barGap={2}
              barSize={8}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Bar dataKey="present" name="Verified Present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="questionable" name="Flagged" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
