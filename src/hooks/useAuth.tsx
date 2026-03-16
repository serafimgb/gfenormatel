import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'manager' | 'user' | 'viewer';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
  canCreate: boolean;
  canCancelAll: boolean;
  isApproved: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: 'user',
  isAdmin: false,
  isManager: false,
  isViewer: false,
  canCreate: true,
  canCancelAll: false,
  isApproved: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      const roleList = rolesRes.data?.map(r => r.role) ?? [];
      if (roleList.includes('admin')) setRole('admin');
      else if (roleList.includes('manager')) setRole('manager');
      else if (roleList.includes('viewer')) setRole('viewer');
      else setRole('user');
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fire and forget — don't await inside callback
          fetchProfile(session.user.id).then(() => {
            if (isMounted) setLoading(false);
          });
        } else {
          setProfile(null);
          setRole('user');
          setLoading(false);
        }
      }
    );

    // Then restore session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('user');
  };

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isViewer = role === 'viewer';
  const canCreate = role !== 'viewer';
  const canCancelAll = role === 'admin' || role === 'manager';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      isAdmin,
      isManager,
      isViewer,
      canCreate,
      canCancelAll,
      isApproved: profile?.is_approved ?? false,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
