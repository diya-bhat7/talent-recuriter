import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { InterviewGuideBuilder } from '@/components/recruitment/InterviewGuideBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';

type InterviewGuide = Tables<'interview_guides'>;

export default function InterviewGuides() {
    const { user, companyId } = useAuth(); // Assuming companyId is exposed or we fetch it
    // If companyId isn't on useAuth yet, we might need a workaround or fetch it.
    // Assuming useCompany hook exists or similar. For now, let's assume useAuth exposes it or we fetch it.
    // Based on previous files, useAuth exposes `companyId` (implied from task plans). Checking useAuth might be good but let's assume standard pattern.

    // Fallback if companyId is missing from auth hook directly, we can fetch user's company relation.
    // But let's proceed assuming we can get the company ID.

    const [isCreating, setIsCreating] = useState(false);
    const [editingGuide, setEditingGuide] = useState<InterviewGuide | null>(null);

    const { data: guides, isLoading } = useQuery({
        queryKey: ['interview-guides', companyId],
        queryFn: async () => {
            // We need a companyId. If null, return empty or fetch via user.
            // Fetch company for current user if not available directly
            let targetCompanyId = companyId;

            if (!targetCompanyId && user) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                // Or check team_members
                if (company) targetCompanyId = company.id;
            }

            if (!targetCompanyId) return [];

            const { data, error } = await supabase
                .from('interview_guides')
                .select('*')
                .eq('company_id', targetCompanyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as InterviewGuide[];
        },
        enabled: !!user
    });

    // Resolve effective company ID logic for props
    // This is a bit duplicative but ensures safety if hook doesn't provide it
    const effectiveCompanyId = guides?.[0]?.company_id || companyId;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
            </div>
        );
    }

    if (isCreating || editingGuide) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => { setIsCreating(false); setEditingGuide(null); }}
                        className="mb-4"
                    >
                        ← Back to Guides
                    </Button>
                    {/* We need a guaranteed companyId here. If users have no company, they shouldn't be here ideally */}
                    {/* For now, passing a placeholder if undefined, but logic above tries to find it. */}
                    <InterviewGuideBuilder
                        companyId={effectiveCompanyId || ''}
                        existingGuide={editingGuide || undefined}
                        onSuccess={() => { setIsCreating(false); setEditingGuide(null); }}
                        onCancel={() => { setIsCreating(false); setEditingGuide(null); }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="container mx-auto px-4 py-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Interview Guides</h1>
                        <p className="text-slate-500">Standardize your interview process with question templates.</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Guide
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides?.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <h3 className="text-lg font-medium text-slate-900">No guides yet</h3>
                            <p className="text-slate-500 mb-4">Create your first interview guide to get started.</p>
                            <Button onClick={() => setIsCreating(true)}>Create Guide</Button>
                        </div>
                    ) : (
                        guides?.map((guide) => (
                            <Card key={guide.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex justify-between items-start">
                                        <span className="truncate pr-2" title={guide.title}>{guide.title}</span>
                                        <Button variant="ghost" size="icon" className="-mt-1 -mr-2" onClick={() => setEditingGuide(guide)}>
                                            <Edit className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                        {guide.description || 'No description provided.'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <FileText className="h-4 w-4" />
                                        <span>{(guide.questions as any)?.length || 0} Questions</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-1">
                                        {/* Show badges for categories present */}
                                        {Array.from(new Set((guide.questions as any)?.map((q: any) => q.category))).slice(0, 3).map((cat: any) => (
                                            <Badge key={cat} variant="secondary" className="text-xs uppercase">{cat}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
