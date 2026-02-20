import { z } from 'zod';

// Company validation schemas
export const companySchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    companyWebsite: z.string().url('Invalid URL format').optional().or(z.literal('')),
    companyLinkedin: z.string().url('Invalid URL format').optional().or(z.literal('')),
    logo_url: z.string().optional().nullable(),
    officeLocations: z.array(z.string()).optional(),
});

export const contactSchema = z.object({
    contactName: z.string().min(2, 'Name must be at least 2 characters'),
    contactEmail: z.string().email('Invalid email address'),
    contactTitle: z.string().optional(),
});

export const passwordFieldsSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
});

// Combined registration schema with refine for password matching
export const registrationSchema = companySchema
    .merge(contactSchema)
    .merge(passwordFieldsSchema)
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export type CompanyFormData = z.infer<typeof companySchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type PasswordFormData = z.infer<typeof passwordFieldsSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;

