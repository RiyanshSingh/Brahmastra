import { motion } from "framer-motion";
import { Users, Clock, Play } from "lucide-react";
import { useLocation } from "wouter";
import { useActiveSession } from "@/hooks/use-dashboard-data";

export function LiveSessionCard() {
  const { data, isLoading } = useActiveSession();
  const isActive = data?.isActive ?? false;
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    if (data?.classId) {
      setLocation(`/classes?classId=${encodeURIComponent(data.classId)}`);
      return;
    }

    setLocation("/classes");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="dark-card rounded-[2rem] p-6 h-full flex flex-col justify-between"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-foreground">Live Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
          isActive
            ? "bg-destructive/15 border-destructive/20"
            : "bg-muted border-card-border"
        }`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? "bg-destructive animate-pulse" : "bg-muted-foreground"}`}></div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${
            isActive ? "text-destructive" : "text-muted-foreground"
          }`}>
            {isActive ? "Active" : "Waiting"}
          </span>
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
          <p className="text-xs text-muted-foreground mt-3">
            {data?.markedCount ?? 0} students have self-marked attendance so far
          </p>
        </div>
      )}

      <button
        onClick={handleContinue}
        className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
        isActive
          ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
          : "bg-muted text-muted-foreground"
      }`}
      >
        <Play className="w-4 h-4 fill-current" />
        {isActive ? "Continue Recheck" : "Upload Morning Punches"}
      </button>
    </motion.div>
  );
}
