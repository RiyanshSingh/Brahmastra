import { motion } from "framer-motion";
import { Radio, Users, Clock, Play } from "lucide-react";
import { useActiveSession } from "@/hooks/use-dashboard-data";

export function LiveSessionCard() {
  const { data, isLoading } = useActiveSession();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="dark-card rounded-[2rem] p-6 h-full flex flex-col justify-between"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-foreground">Live Status</h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/15 border border-destructive/20">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
          <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      ) : (
        <div className="dark-card-elevated rounded-2xl p-5 mb-6">
          <h4 className="font-bold text-foreground mb-1">{data?.className}</h4>
          <p className="text-sm text-muted-foreground mb-4">{data?.room}</p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{data?.studentsCount} <span className="text-muted-foreground font-normal text-sm">students</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <span className="font-semibold font-mono text-foreground">{data?.timeElapsed}</span>
            </div>
          </div>
        </div>
      )}

      <button className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2">
        <Play className="w-4 h-4 fill-current" />
        Start Verification
      </button>
    </motion.div>
  );
}
