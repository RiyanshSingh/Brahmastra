import { lazy, Suspense } from "react";
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

// Loading placeholder for smoother route transitions
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Brahmastra...</p>
    </div>
  </div>
);

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
  );
}

export default App;
