import { motion } from "framer-motion";
import { useDashboardStats } from "@/hooks/use-dashboard-data";

export function AttendanceBreakdown() {
  const { data, isLoading } = useDashboardStats();

  // Mock percentages since our API hook doesn't return exactly these
  const stats = [
    { label: "Verified Present", value: 82, color: "bg-primary" },
    { label: "Questionable Match", value: 12, color: "bg-warning" },
    { label: "Absent", value: 6, color: "bg-destructive" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card rounded-[2rem] p-6 shadow-sm col-span-2"
    >
      <h3 className="font-semibold text-lg text-foreground mb-6">Verification Breakdown</h3>
      
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-foreground">{stat.label}</span>
                <span className="text-muted-foreground">{stat.value}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.value}%` }}
                  transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "easeOut" }}
                  className={`h-full ${stat.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
