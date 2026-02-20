/**
 * Duplicate Detection Hook
 * Checks if a candidate with the same email/phone already exists
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/hooks/useCandidates';
import { CandidateStatus } from '@/components/candidates/CandidateStatusBadge';

interface DuplicateResult {
    isDuplicate: boolean;
    existingCandidate: Partial<Candidate> | null;
    matchedField: 'email' | 'phone' | null;
    positionName?: string;
}

export function useDuplicateCheck(currentPositionId?: string) {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<DuplicateResult | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const checkDuplicate = useCallback(
        async (email: string, phone?: string): Promise<DuplicateResult> => {
            if (!email || email.length < 5) {
                return { isDuplicate: false, existingCandidate: null, matchedField: null };
            }

            setChecking(true);
            try {
                // Check by email (case-insensitive)
                const { data: emailMatch } = await supabase
                    .from('candidates')
                    .select(`
                        id,
                        name,
                        email,
                        status,
                        position_id,
                        positions!inner(position_name)
                    `)
                    .ilike('email', email.toLowerCase())
                    .limit(1)
                    .single();

                if (emailMatch) {
                    const matchResult: DuplicateResult = {
                        isDuplicate: true,
                        existingCandidate: {
                            id: emailMatch.id,
                            name: emailMatch.name,
                            email: emailMatch.email,
                            status: emailMatch.status as CandidateStatus,
                            position_id: emailMatch.position_id,
                        },
                        matchedField: 'email',
                        positionName: (emailMatch as any).positions?.position_name,
                    };
                    setResult(matchResult);
                    return matchResult;
                }

                // Check by phone if provided (normalize phone by removing non-digits)
                if (phone && phone.length >= 10) {
                    const normalizedPhone = phone.replace(/\D/g, '');
                    const { data: phoneMatch } = await supabase
                        .from('candidates')
                        .select(`
                            id,
                            name,
                            email,
                            phone,
                            status,
                            position_id,
                            positions!inner(position_name)
                        `)
                        .not('phone', 'is', null)
                        .limit(100); // Get all to filter

                    // Filter by normalized phone
                    const match = phoneMatch?.find(
                        (c) => c.phone?.replace(/\D/g, '') === normalizedPhone
                    );

                    if (match) {
                        const matchResult: DuplicateResult = {
                            isDuplicate: true,
                            existingCandidate: {
                                id: match.id,
                                name: match.name,
                                email: match.email,
                                status: match.status as CandidateStatus,
                                position_id: match.position_id,
                            },
                            matchedField: 'phone',
                            positionName: (match as any).positions?.position_name,
                        };
                        setResult(matchResult);
                        return matchResult;
                    }
                }

                const noMatch: DuplicateResult = {
                    isDuplicate: false,
                    existingCandidate: null,
                    matchedField: null,
                };
                setResult(noMatch);
                return noMatch;
            } catch (error) {
                console.error('Duplicate check error:', error);
                return { isDuplicate: false, existingCandidate: null, matchedField: null };
            } finally {
                setChecking(false);
            }
        },
        []
    );

    // Debounced check for use in forms
    const debouncedCheck = useCallback(
        (email: string, phone?: string) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                checkDuplicate(email, phone);
            }, 500);
        },
        [checkDuplicate]
    );

    const clearResult = useCallback(() => {
        setResult(null);
    }, []);

    return {
        checking,
        result,
        checkDuplicate,
        debouncedCheck,
        clearResult,
    };
}
