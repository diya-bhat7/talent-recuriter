import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface Scorecard {
    id: string;
    candidate_id: string;
    user_id: string;
    user_name: string;
    tech_rating: number | null;
    comm_rating: number | null;
    culture_rating: number | null;
    recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no';
    notes: string | null;
    created_at: string;
}

export type ScorecardInsert = Omit<Scorecard, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
};

class ScorecardService {
    async getScorecards(candidateId: string): Promise<Scorecard[]> {
        const { data, error } = await supabase
            .from('scorecards' as any)
            .select('*')
            .eq('candidate_id', candidateId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as any) || [];
    }

    async submitScorecard(scorecard: ScorecardInsert): Promise<Scorecard> {
        const { data, error } = await supabase
            .from('scorecards' as any)
            .insert(scorecard as any)
            .select()
            .single();

        if (error) throw error;
        return data as any;
    }

    async getAverageRatings(candidateId: string) {
        const { data, error } = await supabase
            .from('scorecards' as any)
            .select('tech_rating, comm_rating, culture_rating')
            .eq('candidate_id', candidateId);

        if (error) throw error;
        if (!data || (data as any[]).length === 0) return null;

        const scoreData = data as any[];
        const count = scoreData.length;
        const avg = scoreData.reduce((acc, curr) => ({
            tech: acc.tech + (curr.tech_rating || 0),
            comm: acc.comm + (curr.comm_rating || 0),
            culture: acc.culture + (curr.culture_rating || 0),
        }), { tech: 0, comm: 0, culture: 0 });

        return {
            tech: avg.tech / count,
            comm: avg.comm / count,
            culture: avg.culture / count,
            count
        };
    }
}

export const scorecardService = new ScorecardService();
