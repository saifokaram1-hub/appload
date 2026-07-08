import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Role = 'admin' | 'support' | 'user';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function loadProfileAndRole(userId: string) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ]);

  // Höchste Rolle gewinnt: admin > support > user
  const roleSet = new Set((roles ?? []).map((r) => r.role as Role));
  const role: Role | null = roleSet.has('admin')
    ? 'admin'
    : roleSet.has('support')
      ? 'support'
      : roleSet.has('user')
        ? 'user'
        : null;

  return { profile: (profile as Profile) ?? null, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrate(nextSession: Session | null) {
    setSession(nextSession);
    if (nextSession?.user) {
      const { profile, role } = await loadProfileAndRole(nextSession.user.id);
      setProfile(profile);
      setRole(role);
    } else {
      setProfile(null);
      setRole(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      hydrate(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, role, loading, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider stehen');
  return ctx;
}
