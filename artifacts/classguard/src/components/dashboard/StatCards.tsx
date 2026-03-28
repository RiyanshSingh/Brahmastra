import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-6 h-full">
      <StatCard 
        title="Verified" 
        value={data?.verifiedPresent.toLocaleString()} 
        icon={<CheckCircle2 className={cn("w-4 h-4 sm:w-5 sm:h-5", isLoading ? "opacity-50 text-white" : "text-white")} />}
        isLoading={isLoading}
        delay={0.4}
        color="success"
      />
      <StatCard 
        title="Absent" 
        value={data?.absentToday?.toLocaleString() || "0"} 
        icon={<XCircle className={cn("w-4 h-4 sm:w-5 sm:h-5", isLoading ? "opacity-50 text-white" : "text-white")} />}
        isLoading={isLoading}
        delay={0.5}
        color="destructive"
      />
    </div>
  );
}

function StatCard({ title, value, icon, isLoading, delay, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "dark-card rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 transition-all duration-300 shadow-sm flex flex-col items-center justify-center text-center relative",
        color === 'destructive' ? "border-red-500/10 text-white" : color === 'warning' ? "border-amber-500/10" : "border-green-500/10 text-white"
      )}
      style={{
        backgroundColor: color === 'destructive' ? '#ef4444' : color === 'warning' ? '#E59832' : (color === 'success' ? '#22c55e' : undefined),
      }}
    >
      <div className={cn(
        "flex flex-col items-center gap-2 sm:gap-3",
        "pt-1 sm:pt-2"
      )}>
        <div className={cn(
          "p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl",
          "bg-white/20 shadow-xl"
        )}>
          {icon}
        </div>
        
        <div className="flex flex-col items-center">
          <h4 className={cn(
            "font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] mb-0.5 sm:mb-1",
            "text-white/70 text-[9px] sm:text-[13px]"
          )}>{title}</h4>
          {isLoading ? (
            <Skeleton className="h-7 w-20 sm:h-10 sm:w-32 mx-auto rounded-xl bg-black/10" />
          ) : (
            <div className={cn(
              "font-black tracking-[calc(-0.02em)] leading-none",
              "text-white text-2xl sm:text-[40px]"
            )}>{value}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
