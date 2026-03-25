import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 gap-6">
      <StatCard 
        title="Verified Present" 
        value={data?.verifiedPresent.toLocaleString()} 
        icon={<CheckCircle2 className={cn("w-5 h-5", isLoading ? "text-[#15803d] dark:text-success" : "text-black")} />}
        trend="+12%"
        isLoading={isLoading}
        delay={0.4}
        color="success"
      />
      <StatCard 
        title="Flagged Today" 
        value={data?.flaggedToday.toString()} 
        icon={<AlertTriangle className={cn("w-5 h-5", isLoading ? "text-[#92400e] dark:text-warning" : "text-black")} />}
        trend="-3%"
        trendDown
        isLoading={isLoading}
        delay={0.5}
        color="warning"
      />
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendDown, isLoading, delay, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "dark-card rounded-[2.5rem] p-6 transition-all duration-300 shadow-sm flex flex-col items-center justify-center text-center relative",
        color === 'warning' ? "border-amber-500/10" : "border-green-500/10"
      )}
      style={{
        backgroundColor: color === 'warning' ? '#E59832' : (color === 'success' ? '#22c55e' : undefined),
      }}
    >
      <div className={cn(
        "flex flex-col items-center gap-3",
        "pt-2"
      )}>
        <div className={cn(
          "p-3.5 rounded-3xl",
          "bg-white/20 shadow-xl"
        )}>
          {icon}
        </div>
        
        <div className="flex flex-col items-center">
          <h4 className={cn(
            "font-black uppercase tracking-[0.25em] mb-1",
            "text-black/50 text-[13px]"
          )}>{title}</h4>
          {isLoading ? (
            <Skeleton className="h-10 w-32 mx-auto rounded-xl bg-black/10" />
          ) : (
            <div className={cn(
              "font-black tracking-[calc(-0.02em)] leading-none",
              "text-black text-[40px]"
            )}>{value}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
