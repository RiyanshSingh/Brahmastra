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
const Analytics = lazy(() => import("@/pages/Analytics"));
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
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  
  if (!isChrome) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090b10] text-white p-8 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-red-500/5 pointer-events-none" />
        <div className="relative z-10 space-y-8 max-w-md animate-in fade-in zoom-in duration-700">
          <div className="mx-auto w-20 h-20 rounded-[2rem] bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-2xl shadow-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" strokeWidth={2.5} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none text-red-500">
              Access Restricted
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/60 pb-2 border-b border-white/5 mx-auto w-fit">
              V8 Engine Required
            </p>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
              Brahmastra security protocols require hardware-level verification only available on <span className="text-white font-bold underline decoration-indigo-500 decoration-2">Google Chrome</span>.
            </p>
          </div>
          <a href="https://www.google.com/chrome/" target="_blank" rel="noreferrer" className="inline-block px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
            Download Google Chrome
          </a>
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
          <Route path="/analytics" component={Analytics} />
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
