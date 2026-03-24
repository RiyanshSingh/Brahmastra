import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  loadCurrentStudentState,
  signInStudent,
  signOutStudent,
  signUpStudent,
  type StudentProfile,
} from "@/lib/student-auth";

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

    async function bootstrap() {
      setLoading(true);
      try {
        const state = await loadCurrentStudentState();
        if (cancelled) return;
        setSession(state.session);
        setProfile(state.profile);
        setCurrentIp(state.currentIp);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
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
