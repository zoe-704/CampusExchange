import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

export type { Profile };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  initializing: boolean;
  profileLoading: boolean;
  profileError: string | null;
  unreadMessageCount: number;
  refreshUnreadCount: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const loadProfile = async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) {
      console.error("Failed to load profile", error);
      setProfile(null);
      setProfileError(error.message);
    } else {
      setProfile(data);
      setProfileError(null);
    }
    setProfileLoading(false);
  };

  const loadUnreadCount = async (userId: string) => {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("read", false);
    setUnreadMessageCount(count ?? 0);
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session?.user) {
        Promise.all([loadProfile(data.session.user.id), loadUnreadCount(data.session.user.id)]).finally(
          () => isMounted && setInitializing(false),
        );
      } else {
        setInitializing(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
        loadUnreadCount(newSession.user.id);
      } else {
        setProfile(null);
        setProfileError(null);
        setUnreadMessageCount(0);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      // The domain check normally rejects client-side before this ever fires
      // (see SignupPage). This is the fallback for the DB trigger's reject
      // path, whose exact wording GoTrue surfaces isn't guaranteed.
      const message = /database error/i.test(error.message)
        ? "Signups are restricted to @menloschool.org email addresses."
        : error.message;
      return { error: message, needsEmailConfirmation: false };
    }
    return { error: null, needsEmailConfirmation: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const refreshUnreadCount = async () => {
    if (session?.user) await loadUnreadCount(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        initializing,
        profileLoading,
        profileError,
        unreadMessageCount,
        refreshUnreadCount,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
