import { ReactNode, useState, useEffect, useRef } from "react";
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
  LogIn,
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
import { verifyTeacherLogin, updateTeacherProfile, createTeacherAccount, changeCurrentPassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TEACHER_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Classrooms", href: "/classes", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: FileText },
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
};

export function AppLayout({ children, title, subtitle, action }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const displayTitle = title || TITLE_MAP[location] || "Brahmastra Dashboard";
  const { toast } = useToast();
  
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("brahmastra_admin_session") === "true";
  });
  const [adminName, setAdminName] = useState(() => {
    return localStorage.getItem("brahmastra_admin_name") || "Teacher";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'team' | 'security'>('profile');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // My Profile tab
  const [profileName, setProfileName] = useState(adminName);
  const [profileDesignation, setProfileDesignation] = useState(() => 
    localStorage.getItem("brahmastra_admin_designation") || "Class Teacher"
  );

  // Create Teacher tab
  const [newTeacherUsername, setNewTeacherUsername] = useState("");
  const [newTeacherFullName, setNewTeacherFullName] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [isCreatingTeacher, setIsCreatingTeacher] = useState(false);

  // Security tab
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Navigation Visibility Logic
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const container = mainRef.current;
      if (!container) return;

      const currentScrollY = container.scrollTop;
      const isAtBottom = container.offsetHeight + currentScrollY >= container.scrollHeight - 20;
      
      // If at bottom, always hide
      if (isAtBottom) {
        setIsNavVisible(false);
      } 
      // Scrolling down and not at top
      else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsNavVisible(false);
      } 
      // Scrolling up
      else {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    const container = mainRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [lastScrollY]);

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light-classic");
    else if (theme === "light-classic") setTheme("light-premium");
    else setTheme("dark");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await verifyTeacherLogin(username, password);
      if (result) {
        setIsAdminAuthenticated(true);
        setAdminName(result.fullName);
        localStorage.setItem("brahmastra_admin_session", "true");
        localStorage.setItem("brahmastra_admin_token", result.token);
        localStorage.setItem("brahmastra_admin_name", result.fullName);
        localStorage.setItem("brahmastra_teacher_id", result.id);
        setIsLoginDialogOpen(false);
        toast({ title: "Access Granted", description: "Welcome back, Professor." });
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
    setAdminName("Teacher");
    localStorage.removeItem("brahmastra_admin_session");
    localStorage.removeItem("brahmastra_admin_token");
    localStorage.removeItem("brahmastra_admin_name");
    localStorage.removeItem("brahmastra_teacher_id");
    localStorage.removeItem("brahmastra_admin_designation");
    navigate("/");
    setIsProfileOpen(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateTeacherProfile({ 
        full_name: profileName, 
        designation: profileDesignation 
      });
      setAdminName(profileName);
      localStorage.setItem("brahmastra_admin_name", profileName);
      localStorage.setItem("brahmastra_admin_designation", profileDesignation);
      setIsProfileOpen(false);
      toast({ title: "Profile Updated", description: "Changes saved to your command center." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err?.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTeacher(true);
    try {
      await createTeacherAccount(newTeacherUsername, newTeacherPassword, newTeacherFullName);
      toast({ title: "Teacher Created ✓", description: `Login ID: ${newTeacherUsername}` });
      setNewTeacherUsername(""); setNewTeacherFullName(""); setNewTeacherPassword("");
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err?.message, variant: "destructive" });
    } finally {
      setIsCreatingTeacher(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords don't match.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await changeCurrentPassword(newPassword);
      setNewPassword(""); setConfirmPassword("");
      toast({ title: "Password Changed ✓", description: "Your new password is now active." });
    } catch (err: any) {
      toast({ title: "Change Failed", description: err?.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
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
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile Teacher Login Shortcut */}
                  <button 
                    onClick={() => setIsLoginDialogOpen(true)}
                    className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 group shadow-lg shadow-primary/5"
                  >
                    <LogIn className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </button>

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
                  <div className="hidden lg:flex h-10 items-center gap-3 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05] px-4">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{adminName} Active</span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsProfileOpen(true)}
                    className="rounded-2xl border-foreground/10 hover:bg-foreground/[0.03] hover:border-primary/30 transition-all font-bold group gap-2"
                  >
                    <User className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    Profile
                  </Button>
                </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto relative">
         {/* Subtle background glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-primary/5 blur-[120px] pointer-events-none -z-10" />

         <div className="mx-auto max-w-[1600px] px-2 sm:px-6 lg:px-12 py-6 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header Integration */}
            {(displayTitle || subtitle || action) && (
              <div className="mb-8 px-4 flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tighter uppercase">
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

      {/* Mobile Bottom Navigation Gear */}
      {isAdminAuthenticated && (
        <nav className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-lg z-50 lg:hidden pointer-events-auto transition-all duration-500 ease-in-out",
          isNavVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-24 opacity-0 scale-95"
        )}>
          <div className="flex items-center justify-around p-2 rounded-[28px] bg-white/90 backdrop-blur-2xl border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            {TEACHER_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = location === href;
              return (
                <Link key={label} href={href}>
                  <button className={cn(
                    "flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all active:scale-90",
                    isActive 
                      ? "text-primary bg-primary/5 shadow-inner" 
                      : "text-slate-400 hover:text-slate-600"
                  )}>
                    <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", isActive ? "text-primary" : "text-slate-400")}>
                      {label === "Overview" ? "Home" : label === "Classrooms" ? "Classes" : "Stats"}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Teacher Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="w-[calc(100%-40px)] sm:max-w-[420px] bg-white/95 backdrop-blur-2xl border-white/20 p-0 overflow-hidden rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] [&>button:last-child]:hidden">
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
      {/* Teacher Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={(o) => { setIsProfileOpen(o); if (!o) setProfileTab('profile'); }}>
        <DialogContent className="w-[calc(100%-40px)] sm:max-w-[460px] bg-white/95 backdrop-blur-2xl border-white/20 p-0 overflow-hidden rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] [&>button:last-child]:hidden">
          <DialogClose asChild>
            <button className="absolute right-6 top-6 h-8 w-8 rounded-full bg-foreground/[0.03] flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.08] transition-all z-50">
              <X className="w-4 h-4" />
            </button>
          </DialogClose>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 pointer-events-none" />

          {/* Tabs */}
          <div className="relative z-10 pt-8 px-6 sm:px-8">
            <div className="flex gap-1 p-1 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.06]">
              {(['profile', 'team', 'security'] as const).map((tab) => (
                <button key={tab} onClick={() => setProfileTab(tab)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-widest transition-all",
                    profileTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {tab === 'profile' ? 'Profile' : tab === 'team' ? 'Team' : 'Security'}
                </button>
              ))}
            </div>
          </div>

          {/* MY PROFILE TAB */}
          {profileTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-primary/20 p-0.5 shrink-0">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop" alt="Profile" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-xl font-black tracking-tight text-slate-900">{adminName}</DialogTitle>
                    <DialogDescription className="text-[9px] sm:text-xs text-slate-500 font-medium">{localStorage.getItem("brahmastra_admin_designation") || "Class Teacher"}</DialogDescription>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">Display Name</Label>
                    <Input className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-primary/20 transition-all shadow-sm" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">Designation / Class In-charge (TG)</Label>
                    <Input placeholder="e.g. TG-1 Class Teacher" className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900 focus:ring-primary/20 transition-all shadow-sm" value={profileDesignation} onChange={(e) => setProfileDesignation(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button type="submit" className="w-full h-11 rounded-2xl bg-primary font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? "Saving..." : "Update Profile"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleLogout} className="w-full h-11 rounded-2xl text-destructive hover:bg-destructive/10 font-bold text-sm">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* CREATE TEACHER TAB */}
          {profileTab === 'team' && (
            <form onSubmit={handleCreateTeacher}>
              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 relative z-10">
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-foreground">Create Teacher</DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-xs text-muted-foreground mt-1">New account credentials.</DialogDescription>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">Full Name</Label>
                    <Input placeholder="e.g. Prof. Sharma" className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900" value={newTeacherFullName} onChange={(e) => setNewTeacherFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">Login ID</Label>
                    <Input placeholder="e.g. sharma2024" className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900" value={newTeacherUsername} onChange={(e) => setNewTeacherUsername(e.target.value)} required />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">Password</Label>
                    <Input type="password" placeholder="Min. 6 chars" className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900" value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 rounded-2xl bg-primary font-black text-[11px] uppercase tracking-widest mt-2 shadow-lg shadow-primary/20" disabled={isCreatingTeacher}>
                  {isCreatingTeacher ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}

          {/* SECURITY TAB */}
          {profileTab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6 relative z-10">
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-foreground">Security</DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-xs text-muted-foreground mt-1">Update your access key.</DialogDescription>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">New Password</Label>
                    <Input type="password" placeholder="Min. 6 characters" className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/80">Confirm Password</Label>
                    <Input type="password" placeholder="Repeat password" className="h-10 sm:h-12 text-xs sm:text-sm rounded-2xl bg-white border-slate-200 text-slate-900" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 rounded-2xl bg-primary font-black text-[11px] uppercase tracking-widest mt-2 shadow-lg shadow-primary/20" disabled={isChangingPassword}>
                  {isChangingPassword ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
