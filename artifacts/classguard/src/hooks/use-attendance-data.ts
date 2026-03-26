import { useQuery } from "@tanstack/react-query";
import {
  getAnalytics,
  getClasses,
  getClassUploadHistory,
  getLatestSession,
  getReports,
} from "@/lib/api";

export function useClassesData() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });
}

export function useLatestSessionData(classId: string | null) {
  return useQuery({
    queryKey: ["classes", "latest-session", classId],
    queryFn: () => getLatestSession(classId as string),
    enabled: Boolean(classId),
    refetchInterval: 5000,
  });
}

export function useClassUploadHistoryData(classId: string | null) {
  return useQuery({
    queryKey: ["classes", "upload-history", classId],
    queryFn: () => getClassUploadHistory(classId as string),
    enabled: Boolean(classId),
  });
}

export function useReportsData(filters: {
  search: string;
  status: string;
  classId: string;
  range: string;
}) {
  return useQuery({
    queryKey: ["reports", filters],
    queryFn: () =>
      getReports({
        search: filters.search || undefined,
        status: filters.status || undefined,
        classId: filters.classId || undefined,
        range: filters.range || undefined,
      }),
  });
}

export function useAnalyticsData() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
  });
}
