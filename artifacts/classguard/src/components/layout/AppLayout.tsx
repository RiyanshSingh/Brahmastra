import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, Plus } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppLayout({ children, title, subtitle, action }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-background">
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center bg-card border border-card-border rounded-xl px-3 py-2 gap-2 w-48">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
              />
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl bg-card border border-card-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full"></span>
            </button>

            {/* Add button */}
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25">
              <Plus className="w-3.5 h-3.5" />
              New
            </button>

            {/* Action slot */}
            {action}
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
