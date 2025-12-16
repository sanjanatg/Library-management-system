import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { normalizeStudentId } from '@/utils/studentId';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'student' | 'librarian' | null;
  userId: string | number | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    roleHint?: 'student' | 'librarian',
    options?: { name?: string; year?: number; deptId?: string; studentId?: string }
  ) => Promise<{ error: any }>; 
  signUp: (
    email: string,
    password: string,
    role: 'student' | 'librarian',
    options?: { name?: string; year?: number; deptId?: string; studentId?: string }
  ) => Promise<{ error: any; insertError?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'librarian' | null>(null);
  const [userId, setUserId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only fetch user role on initial auth state change, not on every tab switch
        if (session?.user && !hasInitializedRef.current) {
          setTimeout(() => {
            fetchUserRole(session.user!.email!);
          }, 0);
        } else if (!session?.user) {
          setUserRole(null);
          setUserId(null);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        hasInitializedRef.current = true;
        fetchUserRole(session.user.email!);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (email: string, showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const normalized = email.trim().toLowerCase();

      // Check if user is a librarian (case-insensitive)
      const { data: librarian, error: libError } = await supabase
        .from('LIBRARIAN')
        .select('Librarian_ID')
        .ilike('Email', normalized)
        .maybeSingle();

      if (libError) {
        console.error('LIBRARIAN lookup error:', libError);
      }

      if (librarian) {
        console.log('✅ User is librarian:', librarian);
        setUserRole('librarian');
        setUserId(librarian.Librarian_ID);
        setLoading(false);
        return;
      }

      // Check if user is a student (by email column, case-insensitive)
      const { data: student, error: stuError } = await supabase
        .from('STUDENT')
        .select('student_id')
        .ilike('email', normalized)
        .maybeSingle();

      if (stuError) {
        console.error('STUDENT lookup error:', stuError);
      }

      if (student) {
        console.log('✅ User is student:', student);
        setUserRole('student');
        setUserId(student.student_id);
        setLoading(false);
        return;
      }

      // No role found
      console.warn('❌ No role found for:', normalized);
      setUserRole(null);
      setUserId(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setLoading(false);
    }
  };

  const signIn = async (
    email: string,
    password: string,
    roleHint?: 'student' | 'librarian',
    options?: { name?: string; year?: number; deptId?: string; studentId?: string }
  ) => {
    try {
      setLoading(true);
      const normalized = email.trim().toLowerCase();
      console.log('🔐 Attempting login:', normalized, 'Role:', roleHint);

      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password
      });

      if (authError) throw authError;
      if (!authData.user || !authData.session) {
        throw new Error('No session established');
      }

      console.log('✅ Auth successful');

      // Step 2: Load role-specific data
      if (roleHint === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('STUDENT')
          .select('*')
          .eq('email', normalized)
          .maybeSingle();

        console.log('Student lookup:', { found: !!studentData, error: studentError?.message });

        if (studentData) {
          setUser({ ...studentData, role: 'student' } as any);
          navigate('/student-dashboard');
        } else {
          throw new Error('Student record not found. Please contact your librarian.');
        }
      }

      if (roleHint === 'librarian') {
        const { data: librarianData, error: librarianError } = await supabase
          .from('LIBRARIAN')
          .select('*')
          .eq('Email', normalized)
          .maybeSingle();

        console.log('Librarian lookup:', { found: !!librarianData, error: librarianError?.message });

        if (librarianData) {
          setUser({ ...librarianData, role: 'librarian' } as any);
          navigate('/librarian-dashboard');
        } else {
          throw new Error('Librarian record not found. Please contact administrator.');
        }
      }

      console.log('✅ Login successful!');
      return { error: null };

    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: 'student' | 'librarian',
    options?: { name?: string; year?: number; deptId?: string; studentId?: string }
  ) => {
    // After a user confirms their email, Supabase will redirect them to this URL.
    // Prefer an explicit environment override if provided, otherwise default to current origin + /dashboard
    const redirectUrl = (import.meta.env.VITE_EMAIL_REDIRECT_URL as string) || `${window.location.origin}/dashboard`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // Insert into role table immediately (even if email confirmation is pending). RLS must allow this.
    let insertError: any = null;
    try {
      if (!error) {
        const normalized = email.trim().toLowerCase();
        const authUserId = data.user?.id;
        
        // Sign in the user immediately to establish authenticated session for RLS
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        
        if (signInError) {
          console.warn('⚠️ Auto sign-in after signup failed:', signInError);
          // Continue anyway - RLS policy might allow unauthenticated inserts
        } else {
          console.log('✅ User auto-signed in after signup');
        }
        
        if (role === 'student') {
          if (!authUserId) {
            insertError = new Error('Could not determine your new account id. Please verify your email and sign in.');
          } else if (typeof options?.year !== 'number' || !options?.deptId) {
            insertError = new Error('Year and department are required to create your student profile.');
          } else if (!options?.studentId) {
            insertError = new Error('Student ID (USN) is required to create your student profile.');
          } else {
            const payload: any = {
              student_id: options.studentId,
              name: (options?.name ?? normalized.split('@')[0]).trim(),
              email: normalized,
              year: Number(options.year),
              dept_id: options.deptId,
            };
            console.log('Inserting student record:', payload);
            const { error: insErr } = await supabase.from('STUDENT').insert([payload] as any);
            if (insErr) {
              console.error('Student insert error details:', insErr);
              insertError = insErr;
            } else {
              console.log('✅ Student record created successfully');
            }
          }
        } else if (role === 'librarian') {
          const payload: any = {
            Email: normalized,
            Name: options?.name ?? normalized.split('@')[0],
            Role: 'librarian',
          };
          console.log('Inserting librarian record:', payload);
          const { error: insErr } = await supabase.from('LIBRARIAN').insert([payload]);
          if (insErr) {
            console.error('Librarian insert error details:', insErr);
            insertError = insErr;
          } else {
            console.log('✅ Librarian record created successfully');
          }
        }
        // refresh role after insertion
        if (!insertError) await fetchUserRole(normalized);
      }
    } catch (e) {
      insertError = e;
      console.error('Post-signup role insert error:', e);
    }

    return { error, insertError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserId(null);
    navigate('/auth');
  };

  const value = {
    user,
    session,
    userRole,
    userId,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
