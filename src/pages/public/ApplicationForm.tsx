import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';

type Position = Tables<'positions'>;

export default function PublicApplicationForm() {
    const { positionId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        linkedin: '',
        coverLetter: '',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    // Fetch Position Details
    const { data: position, isLoading: positionLoading } = useQuery({
        queryKey: ['public-position', positionId],
        queryFn: async () => {
            if (!positionId) return null;
            const { data, error } = await supabase
                .from('positions')
                .select('*')
                .eq('id', positionId)
                .single();
            if (error) throw error;
            return data as Position;
        },
        enabled: !!positionId
    });

    // Submit Application Mutation
    const { mutate: submitApplication, isPending } = useMutation({
        mutationFn: async () => {
            if (!position) throw new Error("Position not found");

            // 1. Upload Resume (if present)
            let resumeUrl = null;
            if (resumeFile) {
                const fileExt = resumeFile.name.split('.').pop();
                const fileName = `${positionId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('resumes')
                    .upload(fileName, resumeFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('resumes')
                    .getPublicUrl(fileName);

                resumeUrl = publicUrl;
            }

            // 2. Insert Candidate
            const { error: insertError } = await supabase
                .from('candidates')
                .insert({
                    position_id: position.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    linkedin_url: formData.linkedin,
                    notes: formData.coverLetter, // Assuming 'notes' can store cover letter for now or add column
                    resume_url: resumeUrl,
                    status: 'new',
                    company_id: position.company_id // Important: Link to company
                });

            if (insertError) throw insertError;
        },
        onSuccess: () => {
            setIsSubmitted(true);
            toast({
                title: "Application Submitted!",
                description: "We've received your application. Good luck!",
            });
        },
        onError: (error) => {
            console.error(error);
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your application. Please try again.",
                variant: "destructive"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitApplication();
    };

    if (positionLoading) {
        return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (!position) {
        return <div className="text-center py-12">Position not found or closed.</div>;
    }

    if (isSubmitted) {
        return (
            <div className="max-w-md mx-auto py-12 animate-in zoom-in-95 duration-500">
                <Card className="text-center border-emerald-100 bg-emerald-50/50">
                    <CardContent className="pt-12 pb-12 space-y-6">
                        <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Application Received!</h2>
                        <p className="text-slate-600">
                            Thanks for applying to <strong>{position.position_name}</strong>.
                            We've sent a confirmation email to {formData.email}.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/jobs')}>
                            Back to Job Board
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => navigate('/jobs')} className="-ml-4 text-slate-500 hover:text-slate-900">
                    ← Back to all jobs
                </Button>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">{position.position_name}</h1>
                    <div className="flex items-center gap-4 text-slate-500">
                        <span>{position.category}</span>
                        <span>•</span>
                        <span>{position.work_type}</span>
                        {position.preferred_locations?.[0] && (
                            <>
                                <span>•</span>
                                <span>{position.preferred_locations[0]}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Apply for this role</CardTitle>
                    <CardDescription>Please fill out the form below to submit your application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                                <Input
                                    id="linkedin"
                                    type="url"
                                    placeholder="https://linkedin.com/in/..."
                                    value={formData.linkedin}
                                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume/CV *</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer relative">
                                <Input
                                    id="resume"
                                    type="file"
                                    required
                                    accept=".pdf,.doc,.docx"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={e => setResumeFile(e.target.files?.[0] || null)}
                                />
                                <div className="flex flex-col items-center gap-2 text-slate-500">
                                    <Upload className="h-8 w-8 text-slate-300" />
                                    {resumeFile ? (
                                        <span className="text-emerald-600 font-medium">{resumeFile.name}</span>
                                    ) : (
                                        <span>Click to upload or drag and drop</span>
                                    )}
                                    <span className="text-xs text-slate-400">PDF, DOC, DOCX up to 5MB</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverLetter">Cover Letter / Notes</Label>
                            <Textarea
                                id="coverLetter"
                                placeholder="Tell us why you're a great fit..."
                                className="min-h-[120px]"
                                value={formData.coverLetter}
                                onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Request...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
