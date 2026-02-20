import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Interview = Database['public']['Tables']['interviews']['Row'];
export type InterviewInsert = Database['public']['Tables']['interviews']['Insert'];

export type InterviewCandidate = {
    candidate_id: string;
    candidates: {
        name: string;
        email: string;
    };
};

export type InterviewPanelMember = {
    user_id: string;
    profiles?: {
        name: string;
        avatar_url?: string;
    };
};

export type InterviewWithDetails = Interview & {
    interview_candidates: InterviewCandidate[];
    interview_panel: InterviewPanelMember[];
    positions: {
        position_name: string;
    };
};

class InterviewService {
    async getInterviews(candidateId: string): Promise<Interview[]> {
        const { data, error } = await (supabase
            .from('interview_candidates' as any)
            .select('interviews(*)') as any)
            .eq('candidate_id', candidateId);

        if (error) throw error;
        return (data || []).map((d: any) => d.interviews) as any as Interview[];
    }

    async getAllInterviews(companyId: string): Promise<InterviewWithDetails[]> {
        const { data, error } = await supabase
            .from('interviews')
            .select(`
                *,
                interview_candidates(
                    candidate_id,
                    candidates(name, email)
                ),
                interview_panel(
                    user_id,
                    profiles(name, avatar_url)
                ),
                positions:positions!inner(position_name, company_id)
            `)
            .eq('positions.company_id', companyId)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error fetching interviews:', error);
            throw error;
        }
        return data as any as InterviewWithDetails[];
    }

    async scheduleInterview(
        interview: InterviewInsert,
        candidateIds: string[],
        interviewerIds: string[]
    ): Promise<Interview> {
        // 1. Insert the interview record
        const { data: newInterview, error: interviewError } = await supabase
            .from('interviews')
            .insert({
                ...interview,
                is_collaborative: candidateIds.length > 1 || interviewerIds.length > 1
            })
            .select()
            .single();

        if (interviewError) throw interviewError;

        // 2. Insert candidates
        if (candidateIds.length > 0) {
            const { error: candidatesError } = await (supabase
                .from('interview_candidates' as any)
                .insert(candidateIds.map(cid => ({
                    interview_id: (newInterview as any).id,
                    candidate_id: cid
                }))) as any);
            if (candidatesError) throw candidatesError;
        }

        // 3. Insert panel
        if (interviewerIds.length > 0) {
            const { error: panelError } = await (supabase
                .from('interview_panel' as any)
                .insert(interviewerIds.map(uid => ({
                    interview_id: (newInterview as any).id,
                    user_id: uid
                }))) as any);
            if (panelError) throw panelError;
        }

        return newInterview as Interview;
    }

    async updateInterviewStatus(id: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('interviews')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }

    async updateInterviewNotes(id: string, notes: string): Promise<void> {
        const { error } = await supabase
            .from('interviews')
            .update({ notes })
            .eq('id', id);

        if (error) throw error;
    }
}

export const interviewService = new InterviewService();

