/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/MultiSelect';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { DocumentPreview } from '@/components/ui/DocumentPreview';

export interface RequirementsData {
    clientJdFile: File | null;
    clientJdText: string;
    keyRequirements: string;
    generatedJd: string;
}

interface RequirementsFormProps {
    data: RequirementsData;
    onChange: (data: RequirementsData) => void;
    onSubmit: () => void;
    onBack: () => void;
    onCancel: () => void;
    loading?: boolean;
    positionName?: string;
    category?: string;
    workType?: string;
}

export function RequirementsForm({
    data,
    onChange,
    onSubmit,
    onBack,
    onCancel,
    loading = false,
    positionName = '{{Job Title}}',
    category = '{{Department}}',
    workType = '{{Employment Type}}',
}: RequirementsFormProps) {
    const [generating, setGenerating] = useState(false);

    const handleChange = <K extends keyof RequirementsData>(
        key: K,
        value: RequirementsData[K]
    ) => {
        onChange({ ...data, [key]: value });
    };

    const handleGenerateJD = async () => {
        setGenerating(true);

        // Simulate AI generation - in production, this would call an actual API
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const mockJD = `{{Job Code}} : JD-${Math.floor(Math.random() * 10000)}
{{Job Title}} : ${positionName}
{{Department}} : ${category}
{{Location}} : {{Location}}
{{Hiring Manager}} : {{Hiring Manager}}
{{Recruiter Name}} : {{Recruiter Name}}
{{About The company}} : We are a fast-growing startup dedicated to delivering premium hiring solutions. Use modern technology to bridge the gap between talent and opportunity.

{{Employment Type}} : ${workType}

{{Job Description}} :
## Position Overview
This role is an excellent opportunity for a skilled professional to join our team. We are looking for someone with strong technical abilities and excellent communication skills.

## Key Responsibilities
- Lead and participate in the design, development, and deployment of scalable solutions
- Collaborate with cross-functional teams to define and implement innovative solutions
- Mentor junior team members and contribute to team growth
- Participate in code reviews and ensure code quality standards are met

## Required Qualifications
${data.keyRequirements || '- Relevant experience in the field\n- Strong problem-solving skills\n- Excellent communication abilities'}

## What We Offer
- Competitive compensation package
- Flexible work arrangements
- Professional development opportunities

${data.clientJdText ? '\n## Additional Notes\n' + data.clientJdText.slice(0, 200) + '...' : ''}
`;

        handleChange('generatedJd', mockJD);
        setGenerating(false);
    };

    const hasContent = data.clientJdText.trim() !== '' || data.keyRequirements.trim() !== '';
    const canSubmit = data.generatedJd.trim() !== '';

    return (
        <div className="space-y-6">
            {/* Upload JD Document */}
            <div className="space-y-2">
                <Label>Upload JD Document (Optional)</Label>
                <FileUpload
                    onFileSelect={(file) => handleChange('clientJdFile', file)}
                    selectedFile={data.clientJdFile}
                />
            </div>

            {/* Job Description Text */}
            <div className="space-y-2">
                <Label htmlFor="jdText">Job Description Text</Label>
                <Textarea
                    id="jdText"
                    placeholder="Paste or type the job description here..."
                    value={data.clientJdText}
                    onChange={(e) => handleChange('clientJdText', e.target.value)}
                    className="min-h-[120px] bg-background resize-y"
                />
            </div>

            {/* Key Requirements */}
            <div className="space-y-2">
                <Label htmlFor="requirements">Key Requirements</Label>
                <Textarea
                    id="requirements"
                    placeholder="List the key requirements for this position..."
                    value={data.keyRequirements}
                    onChange={(e) => handleChange('keyRequirements', e.target.value)}
                    className="min-h-[100px] bg-background resize-y"
                />
            </div>

            {/* Generate JD Button */}
            <div className="flex items-center justify-center py-4">
                <Button
                    onClick={handleGenerateJD}
                    disabled={!hasContent || generating}
                    className="btn-primary gap-2"
                    size="lg"
                >
                    {generating ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating JD...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5" />
                            Generate JD
                        </>
                    )}
                </Button>
            </div>


            {/* Generated JD Display */}
            {data.generatedJd && (
                <DocumentPreview
                    title="Job Description"
                    description="AI-powered job description for your position"
                    content={data.generatedJd}
                    type="job-description"
                />
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onBack} disabled={loading || generating}>
                    Back
                </Button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={loading || generating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!canSubmit || loading || generating}
                        className="btn-primary"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Next'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
