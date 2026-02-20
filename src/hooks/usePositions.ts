import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type Position = Tables<'positions'>;
type PositionInsert = Omit<Position, 'id' | 'created_at' | 'updated_at'>;
type PositionUpdate = Partial<PositionInsert> & { id: string };

// Query keys for cache management
export const positionKeys = {
    all: ['positions'] as const,
    lists: () => [...positionKeys.all, 'list'] as const,
    list: (companyId: string) => [...positionKeys.lists(), companyId] as const,
    details: () => [...positionKeys.all, 'detail'] as const,
    detail: (id: string) => [...positionKeys.details(), id] as const,
};

/**
 * Hook to fetch all positions for the current company
 */
export function usePositions() {
    const { company } = useAuth();

    return useQuery({
        queryKey: positionKeys.list(company?.id ?? ''),
        queryFn: async () => {
            if (!company) return [];

            const { data, error } = await supabase
                .from('positions')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Position[];
        },
        enabled: !!company,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch a single position by ID
 */
export function usePosition(id: string | undefined) {
    return useQuery({
        queryKey: positionKeys.detail(id ?? ''),
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('positions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Position;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to create a new position with optimistic updates
 */
export function useCreatePosition() {
    const queryClient = useQueryClient();
    const { company } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (newPosition: Omit<PositionInsert, 'company_id'>) => {
            if (!company) throw new Error('No company found');

            const { data, error } = await supabase
                .from('positions')
                .insert({ ...newPosition, company_id: company.id })
                .select()
                .single();

            if (error) throw error;
            return data as Position;
        },
        onSuccess: (newPosition) => {
            // Add to cache
            queryClient.setQueryData<Position[]>(
                positionKeys.list(company?.id ?? ''),
                (old) => old ? [newPosition, ...old] : [newPosition]
            );
            toast({
                title: 'Position created',
                description: `${newPosition.position_name} has been successfully created.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to create position',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Hook to update a position with optimistic updates
 */
export function useUpdatePosition() {
    const queryClient = useQueryClient();
    const { company } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: PositionUpdate) => {
            const { data, error } = await supabase
                .from('positions')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Position;
        },
        onMutate: async ({ id, ...updates }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: positionKeys.list(company?.id ?? '') });

            // Snapshot previous value
            const previousPositions = queryClient.getQueryData<Position[]>(
                positionKeys.list(company?.id ?? '')
            );

            // Optimistically update cache
            queryClient.setQueryData<Position[]>(
                positionKeys.list(company?.id ?? ''),
                (old) => old?.map(p => p.id === id ? { ...p, ...updates } : p)
            );

            return { previousPositions };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousPositions) {
                queryClient.setQueryData(
                    positionKeys.list(company?.id ?? ''),
                    context.previousPositions
                );
            }
            toast({
                title: 'Failed to update position',
                description: err.message,
                variant: 'destructive',
            });
        },
        onSuccess: (updated) => {
            toast({
                title: 'Position updated',
                description: `${updated.position_name} has been updated successfully.`,
            });
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
        },
    });
}

/**
 * Hook to delete a position with optimistic updates
 */
export function useDeletePosition() {
    const queryClient = useQueryClient();
    const { company } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('positions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: positionKeys.list(company?.id ?? '') });

            const previousPositions = queryClient.getQueryData<Position[]>(
                positionKeys.list(company?.id ?? '')
            );

            queryClient.setQueryData<Position[]>(
                positionKeys.list(company?.id ?? ''),
                (old) => old?.filter(p => p.id !== id)
            );

            return { previousPositions };
        },
        onError: (err, id, context) => {
            if (context?.previousPositions) {
                queryClient.setQueryData(
                    positionKeys.list(company?.id ?? ''),
                    context.previousPositions
                );
            }
            toast({
                title: 'Failed to delete position',
                description: err.message,
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            toast({
                title: 'Position deleted',
                description: 'The position has been removed successfully.',
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
        },
    });
}
