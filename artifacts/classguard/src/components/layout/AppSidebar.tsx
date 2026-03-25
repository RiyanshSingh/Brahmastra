import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart2,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Classrooms", href: "/classes", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Student Panel", href: "/mark-attendance", icon: Smartphone },
];

const SECONDARY_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help & Support", href: "/help", icon: HelpCircle },
];

export function AppSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-background/95 backdrop-blur-3xl border-r border-white/5",
        "shadow-[10px_0_40px_rgba(0,0,0,0.3)] z-50",
        className,
      )}
    >
      {/* Premium Logo Area */}
      <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/[0.04]">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-500 via-primary to-purple-600 shadow-lg shadow-primary/30">
            <div className="absolute inset-0 rounded-[14px] bg-gradient-to-t from-black/20 to-transparent" />
            <Shield className="relative h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-foreground leading-none">
              ClassGuard
            </span>
            <span className="text-[11px] font-semibold tracking-widest text-primary/80 uppercase mt-1">
              Command Center
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-none">
        {/* Main Section */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 px-4 mb-4">
            Main Menu
          </p>
          <div className="space-y-1.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link key={label} href={href}>
                  <div
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 cursor-pointer overflow-hidden",
                      isActive
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {/* Active State Background & Glow */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-indigo-500/10" />
                        <div className="absolute inset-0 border border-primary/20 rounded-2xl" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                      </>
                    )}

                    {/* Hover State Background for Inactive */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white-[0.03] transition-colors rounded-2xl" />
                    )}

                    <div className="relative flex items-center gap-3.5 z-10">
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] transition-transform duration-300",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground group-hover:scale-110",
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className={cn(isActive && "font-semibold")}>
                        {label}
                      </span>
                    </div>

                    {isActive && (
                      <ChevronRight className="relative z-10 w-4 h-4 text-primary/70" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Section */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 px-4 mb-4">
            Preferences
          </p>
          <div className="space-y-1.5">
            {SECONDARY_ITEMS.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href}>
                <div
                  onClick={onNavigate}
                  className="group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors rounded-2xl" />
                  <Icon className="relative z-10 w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative z-10">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Premium User Profile Widget */}
      <div className="p-4 mt-auto">
        <div className="relative p-3 rounded-[20px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.05] hover:border-white/[0.1] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full border border-white/10 p-0.5 shrink-0 bg-gradient-to-br from-primary/40 to-indigo-600/40">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#09090b]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                Prof. Davis
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
                System Admin
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-destructive/10 group-hover:text-destructive transition-colors shrink-0">
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
