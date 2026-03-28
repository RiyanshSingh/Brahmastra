import { motion } from "framer-motion";
import { useDashboardStats } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceBreakdown() {
  const { data, isLoading } = useDashboardStats();
  const stats = [
    { label: "Verified Present", value: data?.breakdown.verified ?? 0, color: "#22c55e" }, 
    { label: "Absent today", value: data?.breakdown.absent ?? 0, color: "#ef4444" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="dark-card rounded-[2rem] p-5 col-span-2 flex flex-col"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground tracking-tight">Verification Analytics</h3>
          <p className="text-xs text-muted-foreground mt-1">Cross-check efficiency distribution</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 flex-1 items-center">
          {[1, 2].map(i => (
            <div key={i} className="flex flex-col items-center gap-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 flex-1 items-center">
          {stats.map((stat, idx) => (
            <CircularStat 
              key={idx} 
              label={stat.label} 
              value={stat.value} 
              color={stat.color} 
              delay={0.6 + (idx * 0.1)} 
              idx={idx}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CircularStat({ label, value, color, delay, idx }: any) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const gradientId = `grad-${idx}`;

  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Glow backdrop refined */}
        <div 
          className="absolute inset-4 rounded-full blur-[24px] opacity-10 transition-all duration-500 group-hover:opacity-30 group-hover:scale-110" 
          style={{ backgroundColor: color }}
        />
        
        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 112 112">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-foreground/[0.04]"
          />
          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.8, delay, ease: "circOut" }}
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="text-lg font-black text-foreground tracking-tighter tabular-nums drop-shadow-sm">{value}%</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-foreground/70 text-center leading-tight">
          {label.split(' ')[0]}
        </span>
        <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/40 text-center">
          {label.split(' ').slice(1).join(' ')}
        </span>
      </div>
    </div>
  );
}
