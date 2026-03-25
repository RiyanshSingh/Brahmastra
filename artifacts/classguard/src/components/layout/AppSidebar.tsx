import { useState, useEffect } from "react";
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
  Lock,
  User,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { verifyTeacherLogin } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const TEACHER_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Classrooms", href: "/classes", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

const STUDENT_ITEMS = [
  { label: "Student Panel", href: "/", icon: Smartphone },
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
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("brahmastra_admin_session") === "true";
  });
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isTeacherRoute = ["/dashboard", "/classes", "/reports", "/analytics"].includes(location);
  const [isTeacherPanelOpen, setIsTeacherPanelOpen] = useState(isAdminAuthenticated && isTeacherRoute);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const token = await verifyTeacherLogin(username, password);
      if (token) {
        setIsAdminAuthenticated(true);
        localStorage.setItem("brahmastra_admin_session", "true");
        localStorage.setItem("brahmastra_admin_token", token);
        setIsTeacherPanelOpen(true);
        setIsLoginDialogOpen(false);
        toast({
          title: "Access Granted",
          description: "Welcome back, Professor.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid ID or Password. Access denied.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "System Error",
        description: "Unable to reach auth server.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePanelClick = () => {
    if (!isAdminAuthenticated) {
      setIsLoginDialogOpen(true);
    } else {
      setIsTeacherPanelOpen(!isTeacherPanelOpen);
      if (!isTeacherPanelOpen) navigate("/dashboard");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("brahmastra_admin_session");
    localStorage.removeItem("brahmastra_admin_token");
    setIsTeacherPanelOpen(false);
    navigate("/");
    toast({
      title: "Logged Out",
      description: "Teacher session cleared successfully.",
    });
  };

  // Sync open state when location changes to a teacher route (only if authenticated)
  useEffect(() => {
    if (isTeacherRoute && isAdminAuthenticated) {
      setIsTeacherPanelOpen(true);
    }
  }, [location, isTeacherRoute, isAdminAuthenticated]);

  return (
    <>
      <aside
        className={cn(
          "w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-background/95 backdrop-blur-3xl border-r border-border",
          "shadow-[10px_0_40px_rgba(0,0,0,0.3)] z-50",
          className,
        )}
      >
        {/* Premium Logo Area */}
        <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-white/[0.03] to-transparent border-b border-white/[0.04]">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-foreground/5 border border-white/[0.08] shadow-2xl overflow-hidden ring-1 ring-white/[0.05]">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/5 z-10 pointer-events-none" />
              <video 
                src={`${import.meta.env.BASE_URL}logo-video.mp4`}
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover scale-[1.05] z-0"
                style={{ opacity: 1 }}
              />
              <div className="absolute inset-0 bg-black/5 z-[5] pointer-events-none" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-lg font-black tracking-tighter text-foreground leading-[1.1] group-hover:text-primary transition-colors">
                Brahmastra
              </span>
              <span className="text-[10px] font-bold tracking-[0.25em] text-primary uppercase opacity-70">
                Command Center
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto overflow-x-hidden scrollbar-none">
          {/* Teachers Section */}
          <div>
            <div 
              onClick={handlePanelClick}
              className="flex items-center justify-between px-4 mb-4 cursor-pointer group hover:bg-muted/10 py-2 rounded-xl transition-all"
            >
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 group-hover:text-primary transition-colors">
                  Teachers Panel
                </p>
                {!isAdminAuthenticated && (
                  <Lock className="w-2.5 h-2.5 text-muted-foreground/40" />
                )}
              </div>
              <ChevronRight 
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-all duration-300",
                  isTeacherPanelOpen && "rotate-90 text-primary"
                )} 
              />
            </div>

            <div 
              className={cn(
                "space-y-1 ml-3 border-l border-border pl-2 overflow-hidden transition-all duration-300 ease-in-out",
                isTeacherPanelOpen && isAdminAuthenticated ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
              )}
            >
              {TEACHER_ITEMS.map(({ label, href, icon: Icon }) => {
                const isActive = location === href;
                return (
                  <Link key={label} href={href}>
                    <div
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer overflow-hidden",
                        isActive
                          ? "text-white bg-muted/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.01]",
                      )}
                    >
                      {/* Active State Background & Glow */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        </>
                      )}

                      <div className="relative flex items-center gap-3 z-10">
                        <Icon
                          className={cn(
                            "w-[16px] h-[16px] transition-transform duration-300",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground group-hover:scale-110",
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className={cn(isActive && "font-semibold", "text-[13px]")}>
                          {label}
                        </span>
                      </div>

                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 blur-[1px]" />
                      )}
                    </div>
                  </Link>
                );
              })}
              
              <div 
                onClick={handleLogout}
                className="group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground/50 hover:text-destructive transition-all cursor-pointer mt-4"
              >
                <LogOut className="w-4 h-4" />
                <span>Lock Panel</span>
              </div>
            </div>
            
            {!isAdminAuthenticated && isTeacherPanelOpen && (
               <div className="px-4 py-3 rounded-2xl bg-primary/5 border border-primary/10 text-[11px] text-primary/60 mt-2 mx-2">
                 Session locked. Access restricted to Admin only.
               </div>
            )}
          </div>

        {/* Student Section */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 px-4 mb-4">
            Student Access
          </p>
          <div className="space-y-1.5">
            {STUDENT_ITEMS.map(({ label, href, icon: Icon }) => {
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
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-muted/20 transition-colors rounded-2xl" />
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
            <div className="relative w-10 h-10 rounded-full border border-border p-0.5 shrink-0 bg-gradient-to-br from-primary/40 to-indigo-600/40">
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
            <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-destructive/10 group-hover:text-destructive transition-colors shrink-0">
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
            </div>
          </div>
        </div>
      </div>
    </aside>
      {/* Admin Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card backdrop-blur-2xl border-border p-0 overflow-hidden rounded-[28px] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />
          
          <form onSubmit={handleLogin}>
            <div className="p-8 space-y-6 relative z-10">
              <div className="space-y-2 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" strokeWidth={2.5} />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                  Teachers Armor
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Authentication Required
                </DialogDescription>
              </div>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 ml-1">
                    Administrator ID
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Enter ID"
                      className="pl-12 h-12 rounded-2xl bg-muted/20 border-border focus:ring-1 focus:ring-primary/40 focus:bg-muted/30 transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 ml-1">
                    Access Password
                  </Label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-12 rounded-2xl bg-muted/20 border-border focus:ring-1 focus:ring-primary/40 focus:bg-muted/30 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 font-bold"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Verifying..." : "Unlock Command Center"}
              </Button>
            </div>
          </form>
          
          <div className="bg-muted/10 p-4 text-center border-t border-border">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-tighter">
              Brahmastra Security System • v1.0
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
