import { useRef, useCallback } from 'react';
import { useMutation, type UseMutationOptions, type DefaultError } from '@tanstack/react-query';

/**
 * useDebouncedMutation — wraps React Query's `useMutation` with:
 * 1. In-flight guard: ignores calls while a mutation is pending
 * 2. Debounce: ignores rapid sequential calls within `debounceMs`
 *
 * Usage is identical to `useMutation`, just add `debounceMs` option.
 */
export function useDebouncedMutation<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
>(
    options: UseMutationOptions<TData, TError, TVariables, TContext>,
    debounceMs = 300,
) {
    const lastCallRef = useRef(0);
    const mutation = useMutation(options);

    const debouncedMutate = useCallback(
        (variables: TVariables) => {
            // Guard: skip if already in flight
            if (mutation.isPending) return;

            // Guard: skip if called too recently
            const now = Date.now();
            if (now - lastCallRef.current < debounceMs) return;
            lastCallRef.current = now;

            mutation.mutate(variables);
        },
        [mutation, debounceMs],
    );

    return {
        ...mutation,
        mutate: debouncedMutate,
    };
}
