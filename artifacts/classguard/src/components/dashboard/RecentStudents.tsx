import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useRecentStudents } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentStudents() {
  const { data, isLoading } = useRecentStudents();

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'verified': return <CheckCircle2 className="w-4 h-4 text-[#15803d] dark:text-success" />;
      case 'questionable': return <AlertCircle className="w-4 h-4 text-[#92400e] dark:text-warning" />;
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
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 -mx-2">
            {data?.map((student) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-2 rounded-2xl group transition-all duration-200 hover:bg-muted/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-foreground/[0.08] shadow-sm transform group-hover:scale-105 transition-all duration-300">
                      <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${student.name}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                        alt={student.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm ring-1 ring-border/50">
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
                  student.status === 'verified' && "bg-success/10 text-[#15803d] dark:text-success border border-success/20",
                  student.status === 'questionable' && "bg-warning/10 text-[#92400e] dark:text-warning border border-warning/20",
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
