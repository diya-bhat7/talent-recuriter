import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { positionKeys } from '@/hooks/usePositions';
import { positionDetailsSchema } from '@/lib/validations/position';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Stepper } from '@/components/ui/Stepper';
import { PositionDetailsForm, PositionDetailsData } from '@/components/position/PositionDetailsForm';
import { RequirementsForm, RequirementsData } from '@/components/position/RequirementsForm';
import { InterviewPrepForm, InterviewPrepData } from '@/components/position/InterviewPrepForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const STEPS = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Requirements' },
    { id: 3, name: 'Documents' },
];

export default function PositionCreate() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, company, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [positionId, setPositionId] = useState<string | null>(null);

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

    const handleCancel = () => {
        navigate('/dashboard');
    };

    // Step 1: Create position with basic details
    const handleCreatePosition = async () => {
        if (!company) return;

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

        const { data, error } = await supabase
            .from('positions')
            .insert({
                company_id: company.id,
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
                status: 'draft',
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            toast({
                title: 'Error creating position',
                description: error.message,
                variant: 'destructive',
            });
        } else if (data) {
            setPositionId(data.id);
            // Invalidate cache so Dashboard shows the new position
            queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
            toast({
                title: 'Position created',
                description: 'Your new position has been created successfully.',
            });
            setCurrentStep(2);
        }
    };

    // Step 2: Save requirements and generated JD
    const handleSaveRequirements = async () => {
        if (!positionId) return;

        setLoading(true);

        const { error } = await supabase
            .from('positions')
            .update({
                client_jd_text: requirementsData.clientJdText,
                key_requirements: requirementsData.keyRequirements,
                generated_jd: requirementsData.generatedJd,
            })
            .eq('id', positionId);

        setLoading(false);

        if (error) {
            toast({
                title: 'Error saving requirements',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            // Pass generated JD to interview prep step
            setInterviewPrepData(prev => ({
                ...prev,
                generatedJd: requirementsData.generatedJd,
            }));
            setCurrentStep(3);
        }
    };

    // Step 3: Save interview prep doc and finish
    const handleFinish = async () => {
        if (!positionId) return;

        setLoading(true);

        const { error } = await supabase
            .from('positions')
            .update({
                interview_prep_doc: interviewPrepData.interviewPrepDoc,
                status: 'active',
            })
            .eq('id', positionId);

        setLoading(false);

        if (error) {
            toast({
                title: 'Error saving interview prep',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            // Invalidate cache before navigating to ensure fresh data
            await queryClient.invalidateQueries({ queryKey: positionKeys.lists() });
            toast({
                title: 'Position setup complete!',
                description: 'Your position is now active and ready for hiring.',
            });
            navigate('/dashboard');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                        Create New Position
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Fill in the position details to get started
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
                            {currentStep === 1 && 'Enter the basic information about this position'}
                            {currentStep === 2 && 'Add requirements and generate a job description'}
                            {currentStep === 3 && 'Generate interview preparation documents'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentStep === 1 && (
                            <PositionDetailsForm
                                data={detailsData}
                                onChange={setDetailsData}
                                onSubmit={handleCreatePosition}
                                onCancel={handleCancel}
                                loading={loading}
                            />
                        )}

                        {currentStep === 2 && (
                            <RequirementsForm
                                data={requirementsData}
                                onChange={setRequirementsData}
                                onSubmit={handleSaveRequirements}
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
