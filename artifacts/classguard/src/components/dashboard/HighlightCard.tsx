import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function HighlightCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[2.5rem] h-full group bg-black"
    >
      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2000ms] ease-out opacity-100"
        >
          <source src="/dashboard-preview.mp4" type="video/mp4" />
        </video>
      </div>
    </motion.div>
  );
}
