import { useQuery } from "@tanstack/react-query";

// Mock Data Types
export type AttendanceStats = {
  score: number;
  activeClasses: number;
  verifiedPresent: number;
  flaggedToday: number;
  totalStudents: number;
  enrollmentTrend: number;
};

export type SessionData = {
  day: string;
  present: number;
  questionable: number;
  absent: number;
};

export type StudentCheckIn = {
  id: string;
  name: string;
  avatarUrl: string;
  time: string;
  status: 'verified' | 'questionable' | 'absent';
};

export type ActiveSession = {
  className: string;
  room: string;
  studentsCount: number;
  timeElapsed: string;
  isActive: boolean;
};

// Mock Data Source
const MOCK_STATS: AttendanceStats = {
  score: 89,
  activeClasses: 12,
  verifiedPresent: 2845,
  flaggedToday: 34,
  totalStudents: 3120,
  enrollmentTrend: 4.2,
};

const MOCK_SESSION_DATA: SessionData[] = [
  { day: 'Mon', present: 280, questionable: 20, absent: 12 },
  { day: 'Tue', present: 300, questionable: 15, absent: 8 },
  { day: 'Wed', present: 290, questionable: 25, absent: 15 },
  { day: 'Thu', present: 275, questionable: 30, absent: 10 },
  { day: 'Fri', present: 250, questionable: 45, absent: 25 },
  { day: 'Sat', present: 120, questionable: 10, absent: 5 },
  { day: 'Sun', present: 90, questionable: 5, absent: 2 },
];

const MOCK_STUDENTS: StudentCheckIn[] = [
  { id: '1', name: 'Eleanor Pena', avatarUrl: '/images/avatar-1.png', time: '09:42 AM', status: 'verified' },
  { id: '2', name: 'Cody Fisher', avatarUrl: '/images/avatar-2.png', time: '09:41 AM', status: 'questionable' },
  { id: '3', name: 'Esther Howard', avatarUrl: '/images/avatar-3.png', time: '09:38 AM', status: 'verified' },
  { id: '4', name: 'Wade Warren', avatarUrl: '/images/avatar-4.png', time: '09:35 AM', status: 'absent' },
];

const MOCK_ACTIVE_SESSION: ActiveSession = {
  className: 'CS 301 - Advanced Algorithms',
  room: 'Hall 4B',
  studentsCount: 142,
  timeElapsed: '00:45:12',
  isActive: true,
};

// Hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Simulate network delay for realistic loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_STATS;
    },
  });
}

export function useSessionChartData() {
  return useQuery({
    queryKey: ['dashboard', 'chart'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return MOCK_SESSION_DATA;
    },
  });
}

export function useRecentStudents() {
  return useQuery({
    queryKey: ['dashboard', 'students'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_STUDENTS;
    },
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: ['dashboard', 'session'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return MOCK_ACTIVE_SESSION;
    },
  });
}
