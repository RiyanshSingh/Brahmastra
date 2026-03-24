import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function HighlightCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20 h-full min-h-[220px] flex flex-col justify-between group"
    >
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-primary to-purple-600 z-0"></div>
      
      {/* Decorative Glows */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-400 opacity-30 rounded-full blur-3xl"></div>

      {/* Content */}
      <div className="relative z-10 flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium tracking-wide">
          System Active
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <h2 className="text-2xl font-bold mb-2 leading-tight">
          Real-time attendance <br/> verification made simple.
        </h2>
        <button className="mt-4 flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all duration-300 opacity-90 hover:opacity-100">
          View Documentation <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
