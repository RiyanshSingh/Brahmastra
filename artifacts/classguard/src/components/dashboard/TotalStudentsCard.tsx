import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-data";

export function TotalStudentsCard() {
  const { data, isLoading } = useDashboardStats();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-[2rem] p-8 shadow-xl bg-slate-900 text-white h-full min-h-[220px] flex flex-col justify-between group"
    >
      {/* Bank Card Aesthetic Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/90 to-slate-800/80"></div>
      
      {/* Content */}
      <div className="relative z-10 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-5 h-5" />
          <span className="font-medium text-sm tracking-wide uppercase">Total Enrolled</span>
        </div>
        {/* Decorative Chip similar to bank card */}
        <div className="w-10 h-8 rounded border border-slate-600/50 bg-slate-800/50 flex flex-col justify-center gap-1 p-1.5 opacity-70">
          <div className="w-full h-[1px] bg-slate-500"></div>
          <div className="w-full h-[1px] bg-slate-500"></div>
          <div className="w-full h-[1px] bg-slate-500"></div>
        </div>
      </div>

      <div className="relative z-10 mt-8">
        {isLoading ? (
          <div className="h-12 w-32 bg-slate-800 rounded animate-pulse"></div>
        ) : (
          <div className="flex items-end gap-4">
            <h3 className="text-5xl font-bold tracking-tight">
              {data?.totalStudents.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 text-success mb-2 bg-success/10 px-2 py-1 rounded-md border border-success/20">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-bold">+{data?.enrollmentTrend}%</span>
            </div>
          </div>
        )}
        <p className="text-slate-400 text-sm mt-2">Across 42 active programs</p>
      </div>
    </motion.div>
  );
}
