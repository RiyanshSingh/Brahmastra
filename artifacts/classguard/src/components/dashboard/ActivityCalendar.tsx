import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DATES = Array.from({ length: 35 }, (_, i) => {
  const day = i - 2;
  if (day <= 0) return { date: 30 + day, current: false };
  if (day > 31) return { date: day - 31, current: false };
  let activity = null;
  if ([4, 12, 18, 25].includes(day)) activity = 'high';
  else if ([7, 14, 21, 28].includes(day)) activity = 'medium';
  else if ([2, 9, 16, 23].includes(day)) activity = 'low';
  return { date: day, current: true, activity, isToday: day === 18 };
});

export function ActivityCalendar() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="dark-card rounded-[2rem] p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-foreground">October 2024</h3>
        <div className="flex gap-2">
          <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-3 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
        
        {DATES.map((d, i) => (
          <div key={i} className="flex justify-center relative">
            <div className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors cursor-pointer",
              !d.current && "text-muted-foreground/30",
              d.current && !d.isToday && "text-foreground hover:bg-muted",
              d.isToday && "bg-primary text-white font-bold shadow-md shadow-primary/30"
            )}>
              {d.date}
            </div>
            {d.activity && (
              <div className="absolute -bottom-1 flex justify-center w-full">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  d.activity === 'high' ? "bg-primary" :
                  d.activity === 'medium' ? "bg-warning" : "bg-success"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
