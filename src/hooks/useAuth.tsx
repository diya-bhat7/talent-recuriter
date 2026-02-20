import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useSessionTimeout } from './useSessionTimeout';
import { useQueryClient } from '@tanstack/react-query';
import { companyKeys } from './useCompany';

import { TeamRole, ROLE_PERMISSIONS } from '@/types/advanced-features';

type Company = Tables<'companies'>;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Tables<'profiles'> | null;
    mention_tag: string | null;
    company: Company | null;
    companyId?: string;
    role: TeamRole | null;
    loading: boolean;
    isAdmin: boolean;
    canDo: (permission: keyof typeof ROLE_PERMISSIONS['admin']) => boolean;
    signUp: (email: string, password: string, companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null; confirmationRequired?: boolean }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [role, setRole] = useState<TeamRole | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                const profileData = data as any;
                setProfile(profileData);
                if (profileData.role) {
                    setRole(profileData.role as TeamRole);
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    }, []);

    const fetchRole = useCallback(async (userId: string, companyId: string) => {
        try {
            // First check the profile for an immediate role
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle() as any;

            if (profileData?.role) {
                setRole(profileData.role as TeamRole);
                return;
            }

            // Fallback to legacy team_members check if profile sync isn't ready
            const { data, error } = await supabase
                .from('team_members')
                .select('role')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .maybeSingle();

            if (data) {
                setRole(data.role as TeamRole);
            } else {
                // If user is the company owner but not in team_members, treat as admin
                const { data: compData } = await supabase
                    .from('companies')
                    .select('user_id')
                    .eq('id', companyId)
                    .maybeSingle();

                if (compData && compData.user_id === userId) {
                    setRole('admin');
                } else {
                    setRole('coordinator');
                }
            }
        } catch (err) {
            console.error('Error fetching role:', err);
            setRole('coordinator');
        }
    }, []);

    const fetchCompany = useCallback(async (userId: string) => {
        try {
            // First check if user is a team member of ANY company
            const { data: teamData, error: teamError } = await supabase
                .from('team_members')
                .select('company_id')
                .eq('user_id', userId)
                .maybeSingle();

            let targetCompanyId: string | null = null;
            if (teamData) {
                targetCompanyId = teamData.company_id;
            }

            // If not a team member, check if they are an owner
            if (!targetCompanyId) {
                const { data: ownerData, error: ownerError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (ownerData) {
                    targetCompanyId = ownerData.id;
                }
            }

            if (!targetCompanyId) {
                setCompany(null);
                queryClient.setQueryData(companyKeys.detail(userId), null);
                return;
            }

            // Fetch the full company record
            const { data: companyData, error: fetchError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', targetCompanyId)
                .single();

            if (fetchError) {
                console.error('fetchCompany error:', fetchError.message);
                return;
            }

            if (companyData) {
                const companyRecord = companyData as Company;
                setCompany(companyRecord);
                // Sync to cache
                queryClient.setQueryData(companyKeys.detail(userId), companyRecord);
                // Fetch associated role
                fetchRole(userId, companyRecord.id);
            }
        } catch (err: any) {
            console.error('fetchCompany error:', err.message || err);
        }
    }, [queryClient, fetchRole]);

    const refreshCompany = useCallback(async () => {
        if (user) {
            await fetchCompany(user.id);
        }
    }, [user, fetchCompany]);

    // useSessionTimeout manages automatic sign out after 30 minutes of inactivity
    useSessionTimeout(user, useCallback(() => {
        setCompany(null);
    }, []));

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                if (!mounted) return;

                if (error) {
                    console.error('Error getting initial session:', error);
                }

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    // Await company & profile fetch to prevent RBAC race conditions
                    await Promise.all([
                        fetchCompany(initialSession.user.id),
                        fetchProfile(initialSession.user.id),
                    ]);
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounted) return;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    fetchCompany(currentSession.user.id);
                    fetchProfile(currentSession.user.id);
                } else {
                    setCompany(null);
                    setProfile(null);
                }

                // Ensure loading is false for key auth events
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchCompany]);

    const signUp = useCallback(async (
        email: string,
        password: string,
        companyData: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>
    ) => {
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: companyData.contact_name,
                        company_name: companyData.company_name,
                        company_website: companyData.company_website,
                        company_linkedin: companyData.company_linkedin,
                        office_locations: companyData.office_locations,
                        contact_email: companyData.contact_email,
                        contact_title: companyData.contact_title,
                        contact_name: companyData.contact_name,
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user returned from sign up');

            // Note: Company profile and team membership are now handled by 
            // the database trigger 'handle_new_user' in real-time.
            // This works even if email confirmation is required.

            if (!authData.session) {
                return { error: null, confirmationRequired: true };
            }

            return { error: null, confirmationRequired: false };
        } catch (error) {
            return { error: error as Error };
        }
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setCompany(null);
        setProfile(null);
        setRole(null);
    }, []);

    const isAdmin = role === 'admin';

    const canDo = useCallback((permission: keyof typeof ROLE_PERMISSIONS['admin']): boolean => {
        if (!role || !ROLE_PERMISSIONS[role]) return false;
        return ROLE_PERMISSIONS[role][permission] || false;
    }, [role]);

    const value = useMemo(() => ({
        user,
        session,
        profile,
        mention_tag: profile?.mention_tag || null,
        company,
        companyId: company?.id,
        role,
        loading,
        isAdmin,
        canDo,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshCompany,
    }), [user, session, profile, company, role, loading, isAdmin, canDo, signUp, signIn, signInWithGoogle, signOut, refreshCompany]);

    return (
        <AuthContext.Provider value={value}>
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
