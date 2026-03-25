import { motion } from "framer-motion";
import { Users, Clock, Play } from "lucide-react";
import { useLocation } from "wouter";
import { useActiveSession } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
      className="dark-card rounded-[2rem] p-6 h-full flex flex-col justify-start"
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-lg text-foreground tracking-tight">Live Status</h3>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full border",
          isActive
            ? "bg-destructive/15 border-destructive/20"
            : "bg-muted border-card-border"
        )}>
          <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-destructive animate-pulse" : "bg-muted-foreground")}></div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            isActive ? "text-destructive" : "text-muted-foreground"
          )}>
            {isActive ? "Active" : "Waiting"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <div className="dark-card-elevated rounded-2xl px-4 py-3.5 border-primary/5">
          <h4 className="font-extrabold text-foreground mb-0.5 tracking-tight line-clamp-1">{data?.className}</h4>
          <p className="text-xs font-medium text-muted-foreground mb-4">{data?.room}</p>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground text-xs">{data?.studentsCount} <span className="text-muted-foreground font-normal">students</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#92400e] dark:text-warning" />
              <span className="font-bold font-mono text-foreground text-xs">{data?.timeElapsed}</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mt-3 opacity-60 uppercase tracking-tighter">
            {data?.markedCount ?? 0} Students Self-Marked
          </p>
        </div>
      )}

      <button
        onClick={handleContinue}
        className={cn(
          "w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-auto",
          isActive
            ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Play className="w-4 h-4 fill-current" />
        {isActive ? "Continue Recheck" : "Upload Morning Punches"}
      </button>
    </motion.div>
  );
}
