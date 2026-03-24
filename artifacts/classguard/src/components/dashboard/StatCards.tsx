import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

export function StatCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 gap-6">
      <StatCard 
        title="Verified Present" 
        value={data?.verifiedPresent.toLocaleString()} 
        icon={<CheckCircle2 className="w-5 h-5 text-success" />}
        trend="+12%"
        isLoading={isLoading}
        delay={0.4}
        color="success"
      />
      <StatCard 
        title="Flagged Today" 
        value={data?.flaggedToday.toString()} 
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
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
      className="dark-card rounded-[2rem] p-6 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-2xl",
          color === 'success' ? "bg-success/10" : "bg-warning/10"
        )}>
          {icon}
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full text-xs font-bold",
          trendDown ? "bg-success/10 text-success" : "bg-success/10 text-success" 
          // Note: Assuming both examples are good trends, adjust logic as needed
        )}>
          {trend}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-1">{title}</h4>
        {isLoading ? (
          <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
        ) : (
          <div className="text-3xl font-bold text-foreground">{value}</div>
        )}
      </div>
    </motion.div>
  );
}
