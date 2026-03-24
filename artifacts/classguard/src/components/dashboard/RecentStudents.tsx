import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useRecentStudents } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

export function RecentStudents() {
  const { data, isLoading } = useRecentStudents();

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'verified': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'questionable': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'absent': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="dark-card rounded-[2rem] p-6 flex-1 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg text-foreground">Recent Activity</h3>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 -mx-2">
            {data?.map((student) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-2 rounded-2xl group transition-all duration-200 hover:bg-white/[0.03] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 border-card-border shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <img src={`${import.meta.env.BASE_URL}${student.avatarUrl.replace('/images/', 'images/')}`} alt={student.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-px">
                      {getStatusIcon(student.status)}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{student.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{student.time}</p>
                  </div>
                </div>
                
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                  student.status === 'verified' && "bg-success/10 text-success border border-success/20",
                  student.status === 'questionable' && "bg-warning/10 text-warning border border-warning/20",
                  student.status === 'absent' && "bg-destructive/10 text-destructive border border-destructive/20"
                )}>
                  {student.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button className="mt-6 w-full py-3 rounded-xl border border-card-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
        View All Logs
      </button>
    </motion.div>
  );
}
