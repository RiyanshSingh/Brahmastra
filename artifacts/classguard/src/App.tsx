import React, { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StudentAuthProvider } from "@/providers/student-auth-provider";
import { AppLayout } from "@/components/layout/AppLayout";

// Lazy load pages to split code into smaller chunks
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Classes = lazy(() => import("@/pages/Classes"));
const Reports = lazy(() => import("@/pages/Reports"));
const MarkAttendance = lazy(() => import("@/pages/MarkAttendance"));
const NotFound = lazy(() => import("@/pages/not-found"));

import { ShieldAlert } from "lucide-react";

// Loading placeholder for smoother route transitions
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Brahmastra...</p>
    </div>
  </div>
);

// Strategic Gate: Restrict access to Chrome/Chromium only for hardware fingerprint stability
const BrowserGuard = ({ children }: { children: React.ReactNode }) => {
  // Strict "Chrome-Only" detection to block all spoofing/Chromium-based browsers
  const isBrave = typeof (navigator as any).brave !== "undefined";
  const isEdge = /Edg\//.test(navigator.userAgent);
  const isOpera = /OPR\/|Opera\//.test(navigator.userAgent);
  const isVivaldi = /Vivaldi/.test(navigator.userAgent);
  const isSamsung = /SamsungBrowser/.test(navigator.userAgent);
  
  const isChrome = 
    /Chrome/.test(navigator.userAgent) && 
    /Google Inc/.test(navigator.vendor) && 
    !isBrave && !isEdge && !isOpera && !isVivaldi && !isSamsung;
  
  if (!isChrome) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#020617] text-slate-200 p-6 selection:bg-indigo-500/30">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-radial-gradient from-indigo-500/5 via-transparent to-transparent" />
        
        <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-10">
          {/* Minimalist Icon */}
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-indigo-500/20" />
            <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
              <ShieldAlert className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />
            </div>
          </div>

          {/* Clean Content */}
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Browser Not Supported
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              To ensure the integrity of attendance data and hardware-level security, Brahmastra is optimized exclusively for <span className="text-indigo-400 font-bold">Google Chrome</span>.
            </p>
          </div>

          {/* Action Area */}
          <div className="w-full flex flex-col items-center gap-6">
            <a 
              href="https://www.google.com/chrome/" 
              target="_blank" 
              rel="noreferrer"
              className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-bold text-black transition-all hover:bg-slate-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              Get Google Chrome
            </a>
            
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              V8 Engine Security Protocol 
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={MarkAttendance} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/classes" component={Classes} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserGuard>
      <QueryClientProvider client={queryClient}>
        <StudentAuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </StudentAuthProvider>
      </QueryClientProvider>
    </BrowserGuard>
  );
}

export default App;
