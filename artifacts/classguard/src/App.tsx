import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StudentAuthProvider } from "@/providers/student-auth-provider";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Reports from "@/pages/Reports";
import Analytics from "@/pages/Analytics";
import MarkAttendance from "@/pages/MarkAttendance";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";

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
      <Switch>
        <Route path="/" component={MarkAttendance} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/classes" component={Classes} />
        <Route path="/reports" component={Reports} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
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
