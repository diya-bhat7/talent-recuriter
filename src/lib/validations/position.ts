import { z } from 'zod';

// Base position details schema (without refine)
export const positionDetailsBaseSchema = z.object({
    positionName: z.string().min(2, 'Position name must be at least 2 characters'),
    category: z.string().min(1, 'Please select a category'),
    minExperience: z.number().min(0, 'Minimum experience cannot be negative'),
    maxExperience: z.number().min(0, 'Maximum experience cannot be negative'),
    workType: z.enum(['In-Office', 'Remote', 'Hybrid']),
    preferredLocations: z.array(z.string()).optional(),
    inOfficeDays: z.number().min(1).max(5).optional(),
    numRoles: z.number().min(1, 'At least 1 role is required'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
    hiringStartDate: z.date().nullable().optional(),
});

// Position details with validation
export const positionDetailsSchema = positionDetailsBaseSchema.refine(
    (data) => data.maxExperience >= data.minExperience,
    {
        message: 'Maximum experience must be greater than or equal to minimum experience',
        path: ['maxExperience'],
    }
);

export const requirementsSchema = z.object({
    clientJdText: z.string().optional(),
    clientJdFileUrl: z.string().optional(),
    keyRequirements: z.string().optional(),
});

export const documentsSchema = z.object({
    generatedJd: z.string().optional(),
    interviewPrepDoc: z.string().optional(),
});

// Full position schema (base merged, then refined)
export const positionSchema = positionDetailsBaseSchema
    .merge(requirementsSchema)
    .merge(documentsSchema)
    .refine(
        (data) => data.maxExperience >= data.minExperience,
        {
            message: 'Maximum experience must be greater than or equal to minimum experience',
            path: ['maxExperience'],
        }
    );

// Position status
export const positionStatusSchema = z.enum([
    'draft',
    'active',
    'interviewing',
    'filled',
    'closed',
]);

export type PositionDetailsFormData = z.infer<typeof positionDetailsSchema>;
export type RequirementsFormData = z.infer<typeof requirementsSchema>;
export type DocumentsFormData = z.infer<typeof documentsSchema>;
export type PositionFormData = z.infer<typeof positionSchema>;
export type PositionStatus = z.infer<typeof positionStatusSchema>;

