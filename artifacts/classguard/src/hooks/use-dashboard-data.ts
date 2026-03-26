import { useQuery } from "@tanstack/react-query";
import {
  getDashboard,
  getMonthlyActivity,
  type ActiveSession,
  type DashboardStats,
  type SessionChartData,
  type StudentCheckIn,
} from "@/lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    select: (data): DashboardStats => data.stats,
  });
}

export function useSessionChartData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    select: (data): SessionChartData[] => data.chart,
  });
}

export function useRecentStudents() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    select: (data): StudentCheckIn[] => data.recentStudents,
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    select: (data): ActiveSession => data.activeSession,
  });
}

export function useMonthlyActivity(date: Date) {
  return useQuery({
    queryKey: ["dashboard", "activity", date.getFullYear(), date.getMonth()],
    queryFn: () => getMonthlyActivity(date),
  });
}
