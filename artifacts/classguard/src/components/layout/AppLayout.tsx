import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppLayout({ children, title, subtitle, action }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] max-w-[88vw] p-0 sm:w-[300px]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar
            className="h-full w-full border-r-0"
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 border-b border-border/70 bg-background/88 backdrop-blur-xl">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3 md:gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-card-border bg-card/90 text-muted-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground"
                  aria-label="Open navigation menu"
                >
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/16 via-transparent to-transparent opacity-80" />
                  <Menu className="relative h-4.5 w-4.5" />
                </button>

                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold leading-none text-foreground md:text-[1.75rem]">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1 max-w-3xl truncate text-xs text-muted-foreground md:text-sm">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <div className="hidden min-w-[260px] items-center gap-3 rounded-2xl border border-card-border bg-card/40 backdrop-blur-sm px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:flex lg:min-w-[320px] focus-within:border-primary/40 focus-within:bg-card/60 transition-all duration-300">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search classes, reports, students..."
                    className="w-full border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-card-border bg-card/40 backdrop-blur-sm p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                  <button
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-white/5 hover:text-foreground active:scale-95"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4.25 w-4.25" />
                    <span className="absolute right-3 top-3 h-2 w-2 rounded-full border-2 border-background bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  </button>

                  <button className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 sm:flex">
                    <Plus className="h-4 w-4" />
                    New
                  </button>

                  {action && (
                    <div className={cn("flex items-center", "max-sm:hidden")}>{action}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
