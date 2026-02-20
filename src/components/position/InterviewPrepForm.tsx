/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, FileText, CheckCircle2, PartyPopper } from 'lucide-react';
import { DocumentPreview } from '@/components/ui/DocumentPreview';

export interface InterviewPrepData {
    generatedJd: string;
    interviewPrepDoc: string;
}

interface InterviewPrepFormProps {
    data: InterviewPrepData;
    onChange: (data: InterviewPrepData) => void;
    onFinish: () => void;
    onBack: () => void;
    loading?: boolean;
    positionName?: string;
    category?: string;
    workType?: string;
}

export function InterviewPrepForm({
    data,
    onChange,
    onFinish,
    onBack,
    loading = false,
    positionName = '{{Job Title}}',
    category = '{{Department}}',
    workType = '{{Employment Type}}',
}: InterviewPrepFormProps) {
    const [generating, setGenerating] = useState(false);

    const handleGenerateInterviewPrep = async () => {
        setGenerating(true);

        // Simulate AI generation - in production, this would call an actual API
        await new Promise((resolve) => setTimeout(resolve, 2500));

        const mockInterviewPrep = `{{Document Type}} : Interview Preparation Guide
{{Job Title}} : ${positionName}
{{Department}} : ${category}
{{Employment Type}} : ${workType}
{{Hiring Manager}} : {{Hiring Manager}}
{{Interview Date}} : {{Date}}

---

{{Interview Plan}} :
## Interview Structure

### Round 1: Technical Screening (45 minutes)
- Technical fundamentals assessment
- Problem-solving exercise
- Basic coding challenge

### Round 2: Technical Deep Dive (60 minutes)
- System design discussion
- Architecture review
- Code review exercise

### Round 3: Cultural Fit (45 minutes)
- Behavioral questions
- Team dynamics assessment
- Career goals discussion

---

{{Suggested Questions}} :
## Technical Questions
1. Describe a complex technical problem you solved recently.
2. How do you approach debugging production issues?
3. Explain your experience with relevant technologies.
4. Walk us through your approach to system design.

## Behavioral Questions
1. Tell me about a time you had to meet a tight deadline.
2. How do you handle disagreements with team members?
3. Describe a situation where you had to learn a new technology quickly.
4. How do you prioritize tasks when everything seems urgent?

---

{{Evaluation Framework}} :
## Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Technical Skills | 35% | Depth of technical knowledge and coding ability |
| Problem Solving | 25% | Approach to complex problems and debugging |
| Communication | 20% | Clarity in explaining technical concepts |
| Cultural Fit | 20% | Alignment with team values and work style |

---

## Red Flags to Watch For
- Unable to explain past work clearly
- Dismissive of feedback or alternative approaches
- Lack of curiosity about the role or company

## Green Flags
- Asks thoughtful questions about the team and role
- Shows enthusiasm for learning
- Takes ownership of past mistakes
`;

        onChange({ ...data, interviewPrepDoc: mockInterviewPrep });
        setGenerating(false);
    };

    const canFinish = data.interviewPrepDoc.trim() !== '';

    return (
        <div className="space-y-6">
            {/* Generated JD Display */}
            <DocumentPreview
                title="Job Description"
                description="Reference job description for this position"
                content={data.generatedJd}
                type="job-description"
                className="bg-muted/30"
            />

            {/* Generate Interview Prep Button */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Interview Preparation</h4>
                                <p className="text-sm text-muted-foreground">
                                    Generate interview questions and evaluation criteria
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleGenerateInterviewPrep}
                            disabled={generating || data.interviewPrepDoc !== ''}
                            variant={data.interviewPrepDoc ? 'outline' : 'default'}
                            className={data.interviewPrepDoc ? '' : 'btn-primary'}
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : data.interviewPrepDoc ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                    Generated
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Interview Prep
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Generated Interview Prep Display */}
            {data.interviewPrepDoc && (
                <DocumentPreview
                    title="Interview Preparation"
                    description="AI-generated interview questions and evaluation criteria"
                    content={data.interviewPrepDoc}
                    type="interview-prep"
                />
            )}

            {/* Success Message */}
            {canFinish && (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <PartyPopper className="h-6 w-6 text-green-600" />
                    <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                            Position setup complete!
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                            Click "Finish" to save and return to the dashboard.
                        </p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onBack} disabled={loading || generating}>
                    Back
                </Button>
                <Button
                    onClick={onFinish}
                    disabled={!canFinish || loading || generating}
                    className="btn-primary"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finishing...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Finish
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
