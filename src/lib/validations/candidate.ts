import { z } from 'zod';

// Candidate validation schemas
export const candidateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    resumeUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    notes: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
});

export const candidateStatusSchema = z.enum([
    'new',
    'screening',
    'interview',
    'offer',
    'hired',
    'rejected',
]);

export type CandidateFormData = z.infer<typeof candidateSchema>;
export type CandidateStatus = z.infer<typeof candidateStatusSchema>;
