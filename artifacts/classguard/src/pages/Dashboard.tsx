import { AppLayout } from "@/components/layout/AppLayout";
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
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="col-span-1 md:col-span-12 lg:col-span-3 flex flex-col gap-5">
          <div className="h-[210px]">
            <HighlightCard />
          </div>
          <div className="h-[210px]">
            <TotalStudentsCard />
          </div>
          <div className="flex-1 min-h-[260px]">
            <LiveSessionCard />
          </div>
        </div>

        {/* Middle Column */}
        <div className="col-span-1 md:col-span-12 lg:col-span-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ScoreCard />
            <StatCards />
          </div>
          <SessionsChart />
          <AttendanceBreakdown />
        </div>

        {/* Right Column */}
        <div className="col-span-1 md:col-span-12 lg:col-span-3 flex flex-col gap-5">
          <ActivityCalendar />
          <RecentStudents />
        </div>
      </div>
    </div>
  );
}
