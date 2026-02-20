import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CANDIDATE_STATUS_OPTIONS, CandidateStatus } from './CandidateStatusBadge';
import { Candidate } from './CandidateCard';
import { Loader2, Star, AlertTriangle } from 'lucide-react';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { candidateSchema } from '@/lib/validations/candidate';

interface CandidateFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Partial<Candidate>) => Promise<void>;
    candidate?: Candidate | null;
    positionId: string;
}

export function CandidateForm({
    open,
    onOpenChange,
    onSubmit,
    candidate,
    positionId,
}: CandidateFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Candidate>>({
        name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        resume_url: '',
        status: 'new',
        notes: '',
        rating: 0,
    });

    // Duplicate detection
    const { result: duplicateResult, debouncedCheck, clearResult, checking: duplicateChecking } = useDuplicateCheck(positionId);

    // Sync form data when candidate changes (for edit mode)
    useEffect(() => {
        if (open) {
            setFormData({
                name: candidate?.name || '',
                email: candidate?.email || '',
                phone: candidate?.phone || '',
                linkedin_url: candidate?.linkedin_url || '',
                resume_url: candidate?.resume_url || '',
                status: candidate?.status || 'new',
                notes: candidate?.notes || '',
                rating: candidate?.rating || 0,
            });
        }
    }, [open, candidate]);

    // Check for duplicates when email changes (only for new candidates)
    useEffect(() => {
        if (!candidate && formData.email && formData.email.includes('@')) {
            debouncedCheck(formData.email, formData.phone);
        } else {
            clearResult();
        }
    }, [formData.email, formData.phone, candidate, debouncedCheck, clearResult]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare data for validation (handling URL fields that might be empty strings)
        const validationData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            resumeUrl: formData.resume_url,
            linkedinUrl: formData.linkedin_url,
            notes: formData.notes,
            rating: formData.rating,
        };

        const result = candidateSchema.safeParse(validationData);

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
        try {
            await onSubmit({
                ...formData,
                position_id: positionId,
                id: candidate?.id,
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingClick = (rating: number) => {
        setFormData((prev) => ({
            ...prev,
            rating: prev.rating === rating ? 0 : rating,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {candidate ? 'Edit Candidate' : 'Add New Candidate'}
                    </DialogTitle>
                    <DialogDescription>
                        {candidate
                            ? 'Update candidate information'
                            : 'Add a new candidate to this position'}
                    </DialogDescription>
                </DialogHeader>

                {/* Duplicate Warning */}
                {duplicateResult?.isDuplicate && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Possible Duplicate</AlertTitle>
                        <AlertDescription>
                            A candidate with this {duplicateResult.matchedField} already exists:
                            <span className="font-medium"> {duplicateResult.existingCandidate?.name}</span>
                            {duplicateResult.positionName && (
                                <span className="text-muted-foreground"> (in {duplicateResult.positionName})</span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                                }
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        status: value as CandidateStatus,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CANDIDATE_STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                            <Input
                                id="linkedin_url"
                                type="url"
                                value={formData.linkedin_url}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        linkedin_url: e.target.value,
                                    }))
                                }
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resume_url">Resume URL</Label>
                            <Input
                                id="resume_url"
                                type="url"
                                value={formData.resume_url}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        resume_url: e.target.value,
                                    }))
                                }
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingClick(star)}
                                    className="p-1 hover:scale-110 transition-transform"
                                >
                                    <Star
                                        className={`h-6 w-6 ${star <= (formData.rating || 0)
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-gray-300 hover:text-yellow-400'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="Add notes about the candidate..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {candidate ? 'Update' : 'Add'} Candidate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
