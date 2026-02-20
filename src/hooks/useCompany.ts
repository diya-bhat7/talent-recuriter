import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type Company = Tables<'companies'>;
type CompanyUpdate = Partial<Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Query keys for cache management
export const companyKeys = {
    all: ['companies'] as const,
    detail: (userId: string) => [...companyKeys.all, 'detail', userId] as const,
};

/**
 * Hook to fetch the current user's company
 * Note: This supplements useAuth's company - use for fresh data or mutations
 */
export function useCompany() {
    const { user } = useAuth();

    return useQuery({
        queryKey: companyKeys.detail(user?.id ?? ''),
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data as Company;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to update company profile with optimistic updates
 */
export function useUpdateCompany() {
    const queryClient = useQueryClient();
    const { user, refreshCompany } = useAuth();

    return useMutation({
        mutationFn: async (updates: CompanyUpdate) => {
            if (!user) throw new Error('User must be logged in');

            const upsertData: Database['public']['Tables']['companies']['Insert'] = {
                id: (updates as any).id || undefined, // Keep existing ID if updates has it
                company_name: updates.company_name || 'My Company',
                contact_email: updates.contact_email || user.email || '',
                contact_name: updates.contact_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
                company_website: updates.company_website || null,
                company_linkedin: updates.company_linkedin || null,
                office_locations: updates.office_locations || [],
                contact_title: updates.contact_title || null,
                ...updates,
                user_id: user.id,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('companies')
                .upsert(upsertData, { onConflict: 'user_id' })
                .select()
                .maybeSingle();

            if (error) {
                console.error('Company upsert error:', error);
                throw error;
            }

            return data as Company;
        },
        onMutate: async (updates) => {
            const id = (updates as any).id;
            await queryClient.cancelQueries({ queryKey: companyKeys.detail(user?.id ?? '') });

            const previousCompany = queryClient.getQueryData<Company>(
                companyKeys.detail(user?.id ?? '')
            );

            queryClient.setQueryData<Company>(
                companyKeys.detail(user?.id ?? ''),
                (old) => {
                    if (old) return { ...old, ...updates };
                    // If no old data, don't set a partial optimistic record as it poisons useAuth's fetchCompany
                    return old;
                }
            );

            return { previousCompany };
        },
        onError: (err, variables, context) => {
            if (context?.previousCompany) {
                queryClient.setQueryData(
                    companyKeys.detail(user?.id ?? ''),
                    context.previousCompany
                );
            }
        },
        onSuccess: async (data) => {
            if (data) {
                // Immediately sync the full record (with ID) to the cache
                queryClient.setQueryData(companyKeys.detail(user?.id ?? ''), data);
            }
            // Also trigger the auth context refresh
            refreshCompany().catch(err => console.error('Refresh company failed:', err));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: companyKeys.detail(user?.id ?? '') });
        },
    });
}
