import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { positionDetailsSchema } from '@/lib/validations/position';
import { Tables } from '@/integrations/supabase/types';
import { Header } from '@/components/layout/Header';
import { Stepper } from '@/components/ui/Stepper';
import { PositionDetailsForm, PositionDetailsData } from '@/components/position/PositionDetailsForm';
import { RequirementsForm, RequirementsData } from '@/components/position/RequirementsForm';
import { InterviewPrepForm, InterviewPrepData } from '@/components/position/InterviewPrepForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

type Position = Tables<'positions'>;

const STEPS = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Requirements' },
    { id: 3, name: 'Documents' },
];

export default function PositionEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user, company, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [position, setPosition] = useState<Position | null>(null);

    // Form data for each step
    const [detailsData, setDetailsData] = useState<PositionDetailsData>({
        positionName: '',
        category: '',
        minExperience: 0,
        maxExperience: 5,
        workType: 'Hybrid',
        preferredLocations: [],
        inOfficeDays: 3,
        numRoles: 1,
        priority: 'Medium',
        hiringStartDate: null,
    });

    const [requirementsData, setRequirementsData] = useState<RequirementsData>({
        clientJdFile: null,
        clientJdText: '',
        keyRequirements: '',
        generatedJd: '',
    });

    const [interviewPrepData, setInterviewPrepData] = useState<InterviewPrepData>({
        generatedJd: '',
        interviewPrepDoc: '',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (id && company) {
            fetchPosition();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, company]);

    const fetchPosition = async () => {
        if (!id) return;

        setFetching(true);
        const { data, error } = await supabase
            .from('positions')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            toast({
                title: 'Position not found',
                description: 'The position you are looking for does not exist.',
                variant: 'destructive',
            });
            navigate('/dashboard');
            return;
        }

        setPosition(data);

        // Populate form data
        setDetailsData({
            positionName: data.position_name,
            category: data.category,
            minExperience: data.min_experience,
            maxExperience: data.max_experience,
            workType: data.work_type,
            preferredLocations: data.preferred_locations || [],
            inOfficeDays: data.in_office_days || 3,
            numRoles: data.num_roles,
            priority: data.priority,
            hiringStartDate: data.hiring_start_date ? new Date(data.hiring_start_date) : null,
        });

        setRequirementsData({
            clientJdFile: null,
            clientJdText: data.client_jd_text || '',
            keyRequirements: data.key_requirements || '',
            generatedJd: data.generated_jd || '',
        });

        setInterviewPrepData({
            generatedJd: data.generated_jd || '',
            interviewPrepDoc: data.interview_prep_doc || '',
        });

        setFetching(false);
    };

    const handleCancel = () => {
        navigate('/dashboard');
    };

    // Step 1: Update position details
    const handleUpdateDetails = async () => {
        if (!id) return;

        // Validate with Zod
        const result = positionDetailsSchema.safeParse(detailsData);
        if (!result.success) {
            const firstError = result.error.errors[0];
            toast({
                title: 'Validation Error',
                description: firstError.message,
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from('positions')
            .update({
                position_name: detailsData.positionName,
                category: detailsData.category,
                min_experience: detailsData.minExperience,
                max_experience: detailsData.maxExperience,
                work_type: detailsData.workType,
                preferred_locations: detailsData.preferredLocations,
                in_office_days: detailsData.workType !== 'Remote' ? detailsData.inOfficeDays : null,
                num_roles: detailsData.numRoles,
                priority: detailsData.priority,
                hiring_start_date: detailsData.hiringStartDate?.toISOString().split('T')[0] || null,
            })
            .eq('id', id);

        setLoading(false);

        if (error) {
            toast({
                title: 'Error updating position',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Position updated',
                description: 'Position details have been saved.',
            });
            setCurrentStep(2);
        }
    };

    // Step 2: Update requirements
    const handleUpdateRequirements = async () => {
        if (!id) return;

        setLoading(true);

        const { error } = await supabase
            .from('positions')
            .update({
                client_jd_text: requirementsData.clientJdText,
                key_requirements: requirementsData.keyRequirements,
                generated_jd: requirementsData.generatedJd,
            })
            .eq('id', id);

        setLoading(false);

        if (error) {
            toast({
                title: 'Error saving requirements',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setInterviewPrepData(prev => ({
                ...prev,
                generatedJd: requirementsData.generatedJd,
            }));
            setCurrentStep(3);
        }
    };

    // Step 3: Update interview prep and finish
    const handleFinish = async () => {
        if (!id) return;

        setLoading(true);

        const { error } = await supabase
            .from('positions')
            .update({
                interview_prep_doc: interviewPrepData.interviewPrepDoc,
            })
            .eq('id', id);

        setLoading(false);

        if (error) {
            toast({
                title: 'Error saving interview prep',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Position updated!',
                description: 'All changes have been saved successfully.',
            });
            navigate('/dashboard');
        }
    };

    if (authLoading || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading position...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Back Link */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">
                        Edit Position
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Update the position details and documents
                    </p>
                </div>

                {/* Stepper */}
                <div className="mb-8">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                </div>

                {/* Form Card */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>
                            {currentStep === 1 && 'Position Details'}
                            {currentStep === 2 && 'Requirements & Job Description'}
                            {currentStep === 3 && 'Interview Preparation'}
                        </CardTitle>
                        <CardDescription>
                            {currentStep === 1 && 'Update the basic information about this position'}
                            {currentStep === 2 && 'Update requirements and regenerate job description'}
                            {currentStep === 3 && 'Update interview preparation documents'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentStep === 1 && (
                            <PositionDetailsForm
                                data={detailsData}
                                onChange={setDetailsData}
                                onSubmit={handleUpdateDetails}
                                onCancel={handleCancel}
                                loading={loading}
                            />
                        )}

                        {currentStep === 2 && (
                            <RequirementsForm
                                data={requirementsData}
                                onChange={setRequirementsData}
                                onSubmit={handleUpdateRequirements}
                                onBack={() => setCurrentStep(1)}
                                onCancel={handleCancel}
                                loading={loading}
                                positionName={detailsData.positionName}
                                category={detailsData.category}
                                workType={detailsData.workType}
                            />
                        )}

                        {currentStep === 3 && (
                            <InterviewPrepForm
                                data={interviewPrepData}
                                onChange={setInterviewPrepData}
                                onFinish={handleFinish}
                                onBack={() => setCurrentStep(2)}
                                loading={loading}
                                positionName={detailsData.positionName}
                                category={detailsData.category}
                                workType={detailsData.workType}
                            />
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
