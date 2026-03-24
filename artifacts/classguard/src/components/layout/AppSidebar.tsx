import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, FileText, BarChart2,
  Shield, Settings, HelpCircle, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Classes", href: "/classes", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

const SECONDARY_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-md shadow-primary/25">
            <Shield className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-base text-[hsl(var(--sidebar-foreground))] leading-none block">ClassGuard</span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium tracking-wide">Attendance System</span>
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-3 mb-3">Main</p>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link key={label} href={href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none",
                isActive
                  ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] font-semibold"
                  : "text-[hsl(215,16%,47%)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
              )}>
                <Icon className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-[hsl(var(--sidebar-primary))]" : "text-[hsl(215,16%,55%)]"
                )} />
                {label}
              </div>
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-3 mb-3">System</p>
          {SECONDARY_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[hsl(215,16%,47%)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))] transition-all duration-150 cursor-pointer select-none">
                <Icon className="w-4 h-4 shrink-0 text-[hsl(215,16%,55%)]" />
                {label}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-3 pb-4 border-t border-[hsl(var(--sidebar-border))] pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--sidebar-accent))] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[hsl(var(--sidebar-border))] shrink-0">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))] leading-none truncate">Prof. Davis</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Admin</p>
          </div>
          <LogOut className="w-3.5 h-3.5 text-[hsl(215,16%,55%)] shrink-0" />
        </div>
      </div>
    </aside>
  );
}
