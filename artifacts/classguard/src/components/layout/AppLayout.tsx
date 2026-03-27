import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Bell, 
  Menu, 
  Plus, 
  Search, 
  Shield, 
  User, 
  Lock,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart2,
  KeyRound,
  Smartphone,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { verifyTeacherLogin } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TEACHER_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Classrooms", href: "/classes", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

const TITLE_MAP: Record<string, string> = {
  "/": "Student Attendance",
  "/dashboard": "Teacher Dashboard",
  "/classes": "Classroom Management",
  "/reports": "Attendance Reports",
  "/analytics": "Strategic Analytics",
};

export function AppLayout({ children, title, subtitle, action }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const displayTitle = title || TITLE_MAP[location] || "Brahmastra Dashboard";
  const { toast } = useToast();
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("brahmastra_admin_session") === "true";
  });
  
  const [theme, setTheme] = useState<"dark" | "light-classic" | "light-premium">(() => {
    const saved = localStorage.getItem("brahmastra_theme");
    return (saved as any) || "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light-classic", "light-premium");
    root.classList.add(theme);
    localStorage.setItem("brahmastra_theme", theme);
  }, [theme]);

  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light-classic");
    else if (theme === "light-classic") setTheme("light-premium");
    else setTheme("dark");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const token = await verifyTeacherLogin(username, password);
      if (token) {
        setIsAdminAuthenticated(true);
        localStorage.setItem("brahmastra_admin_session", "true");
        localStorage.setItem("brahmastra_admin_token", token);
        setIsLoginDialogOpen(false);
        toast({ title: "Access Granted", description: "Welcome, Professor." });
        navigate("/dashboard");
      } else {
        toast({ title: "Error", description: "Invalid credentials.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "System Error", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("brahmastra_admin_session");
    localStorage.removeItem("brahmastra_admin_token");
    navigate("/");
  };

  return (
    <div className="flex h-screen flex-col bg-background selection:bg-primary/20 transition-colors duration-500">
      {/* Top Professional Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-foreground/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 lg:px-12">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3.5 group transition-transform active:scale-95">
            <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-foreground/5 border border-foreground/10 shadow-xl overflow-hidden ring-1 ring-foreground/5">
               <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
               <video 
                src={`${import.meta.env.BASE_URL}logo-video.mp4`}
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg lg:text-xl font-black tracking-tighter text-foreground uppercase">Brahmastra</span>
            </div>
          </Link>

          {/* Navigation Links (Conditional) */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl">
            {isAdminAuthenticated && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.04]">
                {TEACHER_ITEMS.map(({ label, href, icon: Icon }) => {
                  const isActive = location === href;
                  return (
                    <Link key={label} href={href}>
                      <button className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transition-all duration-300",
                        isActive 
                          ? "bg-foreground/[0.05] text-foreground shadow-inner" 
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
                      )}>
                        <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                        {label}
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-foreground/[0.03] border border-foreground/[0.05] hover:bg-foreground/[0.08] transition-all group"
              >
                {theme === "dark" && <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />}
                {theme === "light-classic" && <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#92400e] dark:text-amber-500 group-hover:rotate-12 transition-transform" />}
                {theme === "light-premium" && <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:rotate-12 transition-transform" />}
              </button>

             {!isAdminAuthenticated ? (
               <div className="flex items-center gap-3">
                 <Link href="/">
                    <Button variant="ghost" className="hidden sm:flex rounded-2xl font-bold text-sm gap-2">
                      <Smartphone className="w-4 h-4" />
                      Student Panel
                    </Button>
                 </Link>
                 <Button 
                   onClick={() => setIsLoginDialogOpen(true)}
                   className="hidden sm:inline-flex rounded-2xl bg-gradient-to-r from-indigo-500 to-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all px-6"
                 >
                   Teacher Login
                 </Button>
               </div>
             ) : (
               <div className="flex items-center gap-4">
                  <div className="flex h-10 items-center gap-3 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05] px-4">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Admin Active</span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="rounded-2xl border-foreground/10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-bold group"
                  >
                    <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Logout
                  </Button>
               </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
         {/* Subtle background glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-primary/5 blur-[120px] pointer-events-none -z-10" />

         <div className="mx-auto max-w-[1600px] px-2 sm:px-6 lg:px-12 py-6 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header Integration */}
            {(displayTitle || subtitle || action) && (
              <div className="mb-8 px-4 flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase whitespace-nowrap">
                    {displayTitle}
                  </h1>
                  {subtitle && (
                    <p className="text-sm font-medium text-muted-foreground/60 tracking-wide uppercase">
                      {subtitle}
                    </p>
                  )}
                </div>
                {action && <div className="flex items-center gap-3">{action}</div>}
              </div>
            )}
            {children}
         </div>
      </main>

      {/* Teacher Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card backdrop-blur-2xl border-border p-0 overflow-hidden rounded-[32px] shadow-2xl [&>button:last-child]:hidden">
          <DialogClose asChild>
            <button className="absolute right-6 top-6 h-8 w-8 rounded-full bg-foreground/[0.03] flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.08] transition-all z-50">
              <X className="w-4 h-4" />
            </button>
          </DialogClose>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />
          
          <form onSubmit={handleLogin}>
            <div className="p-10 space-y-8 relative z-10">
              <div className="space-y-3 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 shadow-2xl shadow-primary/10">
                  <Shield className="w-7 h-7 text-primary" strokeWidth={2.5} />
                </div>
                <DialogTitle className="text-3xl font-black tracking-tight text-foreground dark:text-white leading-none">
                  Teachers Armor
                </DialogTitle>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] pt-2">
                  SECURE ACCESS • V1.2
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">
                    Administrator ID
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Enter ID"
                      className="pl-13 h-14 rounded-2xl bg-muted/20 border-border focus:ring-1 focus:ring-primary/40 focus:bg-muted/30 transition-all text-sm font-medium"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 ml-1">
                    Access Password
                  </Label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-13 h-14 rounded-2xl bg-muted/20 border-border focus:ring-1 focus:ring-primary/40 focus:bg-muted/30 transition-all text-sm font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 font-black text-xs uppercase tracking-widest"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Verifying Access..." : "Unlock Command Center"}
              </Button>
            </div>
          </form>
          
          <div className="bg-muted/30 p-5 text-center border-t border-border">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Brahmastra Strategic Security Framework
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
