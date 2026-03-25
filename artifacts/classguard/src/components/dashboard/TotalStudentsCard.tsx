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
        {/* More Options */}
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
          </div>
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
            <div className="flex items-center gap-1.5 text-success mb-2 bg-success/15 px-3 py-1 rounded-full border border-success/20 shadow-sm shadow-success/10">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-tight">+{data?.enrollmentTrend}%</span>
            </div>
          </div>
        )}
        <p className="text-slate-400 text-sm mt-2">Rows across all uploaded Excel sheets</p>
      </div>
    </motion.div>
  );
}
