import { TopNav } from "@/components/layout/TopNav";
import { HighlightCard } from "@/components/dashboard/HighlightCard";
import { TotalStudentsCard } from "@/components/dashboard/TotalStudentsCard";
import { LiveSessionCard } from "@/components/dashboard/LiveSessionCard";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { StatCards } from "@/components/dashboard/StatCards";
import { SessionsChart } from "@/components/dashboard/SessionsChart";
import { AttendanceBreakdown } from "@/components/dashboard/AttendanceBreakdown";
import { ActivityCalendar } from "@/components/dashboard/ActivityCalendar";
import { RecentStudents } from "@/components/dashboard/RecentStudents";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 text-lg">Here's what's happening with your classes today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column */}
          <div className="col-span-1 md:col-span-12 lg:col-span-3 flex flex-col gap-6 lg:gap-8">
            <div className="h-[220px]">
              <HighlightCard />
            </div>
            <div className="h-[220px]">
              <TotalStudentsCard />
            </div>
            <div className="flex-1 min-h-[300px]">
              <LiveSessionCard />
            </div>
          </div>

          {/* Middle Column */}
          <div className="col-span-1 md:col-span-12 lg:col-span-6 flex flex-col gap-6 lg:gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
              <ScoreCard />
              <StatCards />
            </div>
            <SessionsChart />
            <AttendanceBreakdown />
          </div>

          {/* Right Column */}
          <div className="col-span-1 md:col-span-12 lg:col-span-3 flex flex-col gap-6 lg:gap-8">
            <ActivityCalendar />
            <RecentStudents />
          </div>

        </div>
      </main>
    </div>
  );
}
