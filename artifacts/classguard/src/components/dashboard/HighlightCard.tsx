import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function HighlightCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 h-full flex flex-col justify-between group"
    >
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary to-purple-700 z-0"></div>
      
      {/* Decorative Glows & Mesh-like effects */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-25 transition-opacity duration-700 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-400 opacity-30 rounded-full blur-3xl"></div>

      {/* Content */}
      <div className="relative z-10 flex justify-between items-start">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium tracking-wide">
          System Active
        </div>
      </div>

      <div className="relative z-10">
        <h2 className="text-xl md:text-2xl font-bold mb-2 leading-tight text-balance">
          Real-time attendance verification made simple.
        </h2>
        <button className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-white/5 group/btn">
          View Documentation 
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
