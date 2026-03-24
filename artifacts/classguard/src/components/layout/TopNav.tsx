import { Link, useLocation } from "wouter";
import { Shield, Bell, Search, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Dashboard", href: "/" },
  { name: "Classes", href: "/classes" },
  { name: "Reports", href: "/reports" },
  { name: "Analytics", href: "/analytics" },
];

export function TopNav() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/40">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            ClassGuard
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/40 rounded-full px-2 py-1.5 border border-white/60">
          {NAV_LINKS.map((link) => {
            const isActive = location === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  isActive 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-white/60 rounded-full px-4 py-2 border border-white/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="bg-transparent border-none outline-none text-sm ml-2 w-48 placeholder:text-muted-foreground text-foreground"
            />
          </div>
          
          <button className="relative p-2.5 rounded-full hover:bg-white/60 transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-border mx-1"></div>
          
          <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/60 transition-colors border border-transparent hover:border-white/60">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-foreground leading-none">Prof. Davis</span>
              <span className="text-xs text-muted-foreground mt-0.5">Admin</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
