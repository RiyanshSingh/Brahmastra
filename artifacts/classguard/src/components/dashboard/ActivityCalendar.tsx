import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday
} from "date-fns";
import { cn } from "@/lib/utils";
import { useMonthlyActivity } from "@/hooks/use-dashboard-data";

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function ActivityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: activity = {} } = useMonthlyActivity(currentDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Live activity logic based on database
  const getActivity = (day: Date) => {
    if (!isSameMonth(day, monthStart)) return null;
    const dateStr = format(day, "yyyy-MM-dd");
    return activity[dateStr] || null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="dark-card rounded-[2rem] px-6 py-6 border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="font-bold text-lg text-foreground tracking-tight leading-none">
            {format(currentDate, "MMMM")}
          </h3>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1">
            {format(currentDate, "yyyy")} Operations
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-1 rounded-lg bg-muted/20 border border-border hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1 rounded-lg bg-muted/20 border border-border hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {DAYS.map(d => (
          <div key={ d } className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em] mb-1">
            {d}
          </div>
        ))}
        
        {calendarDays.map((day, i) => {
          const currentMonthDay = isSameMonth(day, monthStart);
          const today = isToday(day);
          const dayActivity = getActivity(day);

          return (
            <div key={i} className="flex flex-col items-center justify-center relative py-1">
              <div 
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 cursor-pointer relative z-10",
                  !currentMonthDay && "text-muted-foreground/10",
                  currentMonthDay && !today && "text-foreground/80 hover:bg-muted/20",
                  today && "bg-primary text-white font-bold shadow-md shadow-primary/30"
                )}
              >
                {format(day, "d")}
                
                {/* Visual activity indicator within/around the date */}
                {dayActivity && !today && (
                  <div className={cn(
                    "absolute -bottom-0.5 w-1 h-1 rounded-full",
                    dayActivity === 'high' ? "bg-primary shadow-[0_0_8px_rgba(124,58,237,0.6)]" : 
                    dayActivity === 'medium' ? "bg-primary/60" : "bg-primary/30"
                  )} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
