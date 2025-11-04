import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber: string, referralCode?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id).catch(err => console.error('Profile fetch error:', err));
        }
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
        if (mounted) {
          setTimeout(() => setLoading(false), 100);
        }
      }
    };

    const setupListener = () => {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return;

          setUser(session?.user ?? null);

          if (session?.user) {
            fetchProfile(session.user.id).catch(err => console.error('Profile fetch error:', err));
          } else {
            setProfile(null);
          }
        });

        authSubscription = data.subscription;
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    };

    initAuth();
    setupListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (err) {
          console.error('Unsubscribe error:', err);
        }
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phoneNumber: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      let referrerId = null;

      if (referralCode) {
        const { data: referrerData } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .maybeSingle();

        if (referrerData) {
          referrerId = referrerData.id;
        }
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone: phoneNumber,
        referred_by: referrerId,
        balance: 0,
        total_invested: 0,
        total_earnings: 0,
      });

      if (profileError) {
        return { error: profileError };
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
