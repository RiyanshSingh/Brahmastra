import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { studentSupabase } from "@/lib/supabase";
import {
  signInStudent,
  signOutStudent,
  signUpStudent,
  getProfileByUserIdPublic,
  type StudentProfile,
} from "@/lib/student-auth";
import { fetchPublicIpSafe } from "@/lib/student-auth";

type StudentAuthContextValue = {
  session: Session | null;
  profile: StudentProfile | null;
  currentIp: string | null;
  loading: boolean;
  signIn: (input: { enrollmentNo: string; password: string }) => Promise<void>;
  signUp: (input: {
    enrollmentNo: string;
    fullName: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const StudentAuthContext = createContext<StudentAuthContextValue | null>(null);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Step 1: Load the persisted session from localStorage immediately.
    studentSupabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      if (cancelled) return;
      const existingSession = data.session;
      setSession(existingSession);

      if (existingSession?.user) {
        try {
          const [prof, ip] = await Promise.all([
            getProfileByUserIdPublic(existingSession.user.id),
            fetchPublicIpSafe(),
          ]);
          if (!cancelled) {
            setProfile(prof);
            setCurrentIp(ip);
          }
        } catch (err) {
          console.error("Profile load error:", err);
        }
      }

      if (!cancelled) setLoading(false);
    });

    // Step 2: Listen for real auth changes (login, logout, token refresh).
    const {
      data: { subscription },
    } = studentSupabase.auth.onAuthStateChange(async (event: string, nextSession: Session | null) => {
      if (cancelled) return;

      // Ignore the INITIAL_SESSION event — we already handled it above.
      if (event === "INITIAL_SESSION") return;

      setSession(nextSession);

      if (nextSession?.user) {
        try {
          const [prof, ip] = await Promise.all([
            getProfileByUserIdPublic(nextSession.user.id),
            fetchPublicIpSafe(),
          ]);
          if (!cancelled) {
            setProfile(prof);
            setCurrentIp(ip);
          }
        } catch (err) {
          console.error("Profile sync error:", err);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value: StudentAuthContextValue = {
    session,
    profile,
    currentIp,
    loading,
    signIn: async (input) => {
      setLoading(true);
      try {
        const result = await signInStudent(input);
        setSession(result.session);
        setProfile(result.profile);
        setCurrentIp(result.currentIp);
      } finally {
        setLoading(false);
      }
    },
    signUp: async (input) => {
      setLoading(true);
      try {
        const result = await signUpStudent(input);
        setSession(result.session);
        setProfile(result.profile);
        setCurrentIp(result.currentIp);
      } finally {
        setLoading(false);
      }
    },
    signOut: async () => {
      setLoading(true);
      try {
        await signOutStudent();
        setSession(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);

  if (!context) {
    throw new Error("useStudentAuth must be used inside StudentAuthProvider.");
  }

  return context;
}
