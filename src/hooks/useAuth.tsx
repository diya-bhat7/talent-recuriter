import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useSessionTimeout } from './useSessionTimeout';
import { useQueryClient } from '@tanstack/react-query';
import { companyKeys } from './useCompany';

import { TeamRole, ROLE_PERMISSIONS, CompanyPermissions, PermissionKey } from '@/types/advanced-features';

type Company = Tables<'companies'>;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Tables<'profiles'> | null;
    mention_tag: string | null;
    company: Company | null;
    companyId?: string;
    role: TeamRole | null;
    originalRole: TeamRole | null;
    impersonateRole: (role: TeamRole | null) => void;
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
    const [originalRole, setOriginalRole] = useState<TeamRole | null>(null);
    const [impersonatedRole, setImpersonatedRole] = useState<TeamRole | null>(null);
    const [loading, setLoading] = useState(true);

    const [permissions, setPermissions] = useState<CompanyPermissions | null>(null);

    const fetchRolePermissions = useCallback(async (roleName: string, companyId: string) => {
        try {
            const { data, error } = await (supabase
                .from('company_roles' as any)
                .select('permissions')
                .eq('company_id', companyId)
                .eq('role_name', roleName)
                .maybeSingle() as any);

            if (data?.permissions) {
                setPermissions(data.permissions as unknown as CompanyPermissions);
            } else {
                // Fallback to defaults if no custom role found
                setPermissions(ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS['coordinator']);
            }
        } catch (err) {
            console.error('Error fetching role permissions:', err);
            setPermissions(ROLE_PERMISSIONS['coordinator']);
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

            let resolvedRole: TeamRole = 'coordinator';

            if (profileData?.role) {
                resolvedRole = profileData.role;
            } else {
                // Fallback to legacy team_members check if profile sync isn't ready
                const { data } = await supabase
                    .from('team_members')
                    .select('role')
                    .eq('user_id', userId)
                    .eq('company_id', companyId)
                    .maybeSingle();

                if (data) {
                    resolvedRole = data.role;
                } else {
                    // If user is the company owner but not in team_members, treat as admin
                    const { data: compData } = await supabase
                        .from('companies')
                        .select('user_id')
                        .eq('id', companyId)
                        .maybeSingle();

                    if (compData && compData.user_id === userId) {
                        resolvedRole = 'admin';
                    }
                }
            }

            setOriginalRole(resolvedRole);
            fetchRolePermissions(impersonatedRole || resolvedRole, companyId);
        } catch (err) {
            console.error('Error fetching role:', err);
            setOriginalRole('coordinator');
            fetchRolePermissions('coordinator', companyId);
        }
    }, [impersonatedRole, fetchRolePermissions]);

    const fetchCompany = useCallback(async (userId: string) => {
        try {
            // First check if user is a team member of ANY company
            const { data: teamData } = await supabase
                .from('team_members')
                .select('company_id')
                .eq('user_id', userId)
                .maybeSingle();

            let targetCompanyId: string | null = teamData?.company_id || null;

            // If not a team member, check if they are an owner
            if (!targetCompanyId) {
                const { data: ownerData } = await supabase
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
                // Fetch associated role and then permissions
                await fetchRole(userId, companyRecord.id);
            }
        } catch (err: any) {
            console.error('fetchCompany error:', err.message || err);
        }
    }, [queryClient, fetchRole]);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                setProfile(data as any);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    }, []);

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

            // Explicitly backfill roles for the new company
            // (The trigger handles the owner/team association, but let's ensure roles exist)
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('company_id')
                .eq('user_id', authData.user.id)
                .maybeSingle();

            if (teamMember?.company_id) {
                await (supabase.rpc as any)('backfill_company_roles', { target_company_id: teamMember.company_id });
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
        setOriginalRole(null);
        setImpersonatedRole(null);
    }, []);

    const impersonateRole = useCallback((role: TeamRole | null) => {
        if (originalRole !== 'admin') {
            console.warn('Only admins can impersonate roles');
            return;
        }
        setImpersonatedRole(role);
    }, [originalRole]);

    const activeRole = impersonatedRole || originalRole;

    const isAdmin = activeRole === 'admin';

    const canDo = useCallback((permission: PermissionKey): boolean => {
        if (!activeRole) return false;
        if (activeRole === 'admin') return true; // Hardcoded safety for admin role
        if (!permissions) return false;
        return permissions[permission] || false;
    }, [activeRole, permissions]);

    const value = useMemo(() => ({
        user,
        session,
        profile,
        mention_tag: profile?.mention_tag || null,
        company,
        companyId: company?.id,
        role: activeRole,
        originalRole,
        impersonateRole,
        loading,
        isAdmin,
        canDo,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshCompany,
    }), [user, session, profile, company, activeRole, originalRole, impersonateRole, loading, isAdmin, canDo, signUp, signIn, signInWithGoogle, signOut, refreshCompany]);

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
