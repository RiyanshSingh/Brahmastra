import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";

export function ScoreCard() {
  const { data, isLoading } = useDashboardStats();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="dark-card rounded-[2rem] p-6 border-foreground/[0.08]"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg text-foreground">Attendance Score</h3>
        <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        {isLoading ? (
          <Skeleton className="w-32 h-32 rounded-full border-8 border-muted/20" />
        ) : (
          <div className="relative">
            {/* SVG Circular Progress */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-muted"
              />
              <motion.circle
                cx="72"
                cy="72"
                r="60"
                stroke="#8D6CE5"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * (data?.score || 0)) / 100}
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(141,108,229,0.3)]"
                initial={{ strokeDashoffset: 377 }}
                animate={{ strokeDashoffset: 377 - (377 * (data?.score || 0)) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-tighter text-foreground">
                {data?.score}%
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-foreground">Punch-to-class verification</p>
          <p className="text-xs text-muted-foreground mt-1">Based on morning uploads and teacher rechecks</p>
        </div>
      </div>
    </motion.div>
  );
}
