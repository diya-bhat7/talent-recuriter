import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateCompany } from '@/hooks/useCompany';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Building2, Globe, Linkedin, MapPin, Mail, User, Briefcase,
    Loader2, ArrowLeft, Save, Edit, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { companySchema, contactSchema } from '@/lib/validations/company';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/images';

const LOCATIONS = [
    'Hyderabad',
    'NCR',
    'Mumbai',
    'Chennai',
    'Pune',
    'Bangalore',
    'Other Cities',
];

// Combine schemas for the full profile
const profileSchema = companySchema.extend({
    contactName: contactSchema.shape.contactName,
    contactTitle: contactSchema.shape.contactTitle,
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
    const navigate = useNavigate();
    const { user, company, loading: authLoading } = useAuth();
    const { toast } = useToast();

    // View/Edit mode toggle
    const [isEditing, setIsEditing] = useState(!company);

    // React Query mutation for updating company
    const updateCompany = useUpdateCompany();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            companyName: '',
            companyWebsite: '',
            companyLinkedin: '',
            officeLocations: [],
            contactName: '',
            contactTitle: '',
        }
    });

    // Logo Upload State
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const officeLocations = watch('officeLocations') || [];

    // Populate form when company data is available
    useEffect(() => {
        if (company) {
            setLogoUrl(company.logo_url || null);
            reset({
                companyName: company.company_name || '',
                companyWebsite: company.company_website || '',
                companyLinkedin: company.company_linkedin || '',
                officeLocations: company.office_locations || [],
                contactName: company.contact_name || '',
                contactTitle: company.contact_title || '',
            });
        }
    }, [company, reset]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSelectedFile(reader.result as string);
                setIsCropperOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!company) return;

        setIsUploading(true);
        try {
            const timestamp = new Date().getTime();
            const fileName = `logos/${company.id}/${timestamp}.png`;
            const file = new File([croppedBlob], 'logo.png', { type: 'image/png' });

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(fileName, file, {
                    upsert: true,
                    cacheControl: '3600',
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(fileName);

            // Update Company Record
            await updateCompany.mutateAsync({
                logo_url: publicUrl,
            });

            setLogoUrl(publicUrl);
            toast({
                title: 'Logo updated',
                description: 'Your company logo has been updated successfully.',
            });

        } catch (error: any) {
            console.error('Error uploading logo:', error);
            toast({
                title: 'Upload failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            setIsCropperOpen(false);
        }
    };

    // Redirect to login if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/login" replace />;
    }

    const handleLocationToggle = (location: string) => {
        const currentLocations = officeLocations;
        const newLocations = currentLocations.includes(location)
            ? currentLocations.filter(l => l !== location)
            : [...currentLocations, location];

        setValue('officeLocations', newLocations, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data: ProfileFormData) => {
        try {
            await updateCompany.mutateAsync({
                company_name: data.companyName,
                company_website: data.companyWebsite || null,
                company_linkedin: data.companyLinkedin || null,
                office_locations: data.officeLocations || [],
                contact_email: user?.email || '',
                contact_title: data.contactTitle || null,
                contact_name: data.contactName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
            });

            toast({
                title: company ? 'Profile updated' : 'Profile created',
                description: 'Your company profile has been saved successfully.',
            });

            // Switch back to view mode after saving
            setIsEditing(false);
        } catch (error: any) {
            console.error('Profile submission caught error:', error);
            toast({
                title: 'Operation failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleCancelEdit = () => {
        // Reset form data to original company data
        if (company) {
            reset({
                companyName: company.company_name || '',
                companyWebsite: company.company_website || '',
                companyLinkedin: company.company_linkedin || '',
                officeLocations: company.office_locations || [],
                contactName: company.contact_name || '',
                contactTitle: company.contact_title || '',
            });
            setLogoUrl(company.logo_url || null);
        }
        setIsEditing(false);
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

            <main className="container mx-auto px-4 py-8 max-w-2xl pb-20 md:pb-8">
                {/* Back Link */}
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Company Profile
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isEditing ? 'Edit your company information' : 'View your company information'}
                        </p>
                    </div>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                {isEditing ? (
                    /* Edit Mode - Show Form */
                    <Card className="border-border/50">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <CardHeader>
                                <CardTitle>Edit Company Information</CardTitle>
                                <CardDescription>
                                    Update your company details visible to our team
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Logo Upload Section */}
                                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 border-border">
                                            <AvatarImage src={getOptimizedImageUrl(logoUrl, { width: 200, height: 200 })} className="object-cover" />
                                            <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                                                {company?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Label htmlFor="logo-upload" className="cursor-pointer text-white flex flex-col items-center gap-1 text-xs">
                                                <Camera className="h-5 w-5" />
                                                <span>Change</span>
                                            </Label>
                                        </div>
                                        <Input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h3 className="font-medium">Company Logo</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Upload your company logo. This will be displayed on the sidebar and header.
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Recommended size: 400x400px.
                                        </p>
                                    </div>
                                </div>

                                {/* Company Information Section */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName" className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Company Name *
                                            </Label>
                                            <Input
                                                id="companyName"
                                                placeholder="Acme Corporation"
                                                {...register('companyName')}
                                                required
                                                className={`bg-background ${errors.companyName ? 'border-destructive' : ''}`}
                                            />
                                            {errors.companyName && (
                                                <p className="text-xs text-destructive">{errors.companyName.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyWebsite" className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Company Website
                                            </Label>
                                            <Input
                                                id="companyWebsite"
                                                type="url"
                                                placeholder="https://example.com"
                                                {...register('companyWebsite')}
                                                className={`bg-background ${errors.companyWebsite ? 'border-destructive' : ''}`}
                                            />
                                            {errors.companyWebsite && (
                                                <p className="text-xs text-destructive">{errors.companyWebsite.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="companyLinkedin" className="flex items-center gap-2">
                                            <Linkedin className="h-4 w-4" />
                                            Company LinkedIn
                                        </Label>
                                        <Input
                                            id="companyLinkedin"
                                            type="url"
                                            placeholder="https://linkedin.com/company/..."
                                            {...register('companyLinkedin')}
                                            className={`bg-background ${errors.companyLinkedin ? 'border-destructive' : ''}`}
                                        />
                                        {errors.companyLinkedin && (
                                            <p className="text-xs text-destructive">{errors.companyLinkedin.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Office Locations
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {LOCATIONS.map(location => (
                                                <button
                                                    key={location}
                                                    type="button"
                                                    onClick={() => handleLocationToggle(location)}
                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${officeLocations.includes(location)
                                                        ? 'bg-primary text-primary-foreground shadow-md'
                                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                        }`}
                                                >
                                                    {location}
                                                    {officeLocations.includes(location) && (
                                                        <span className="ml-1">×</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information Section */}
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Contact Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="contactName" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Your Name *
                                            </Label>
                                            <Input
                                                id="contactName"
                                                placeholder="John Doe"
                                                {...register('contactName')}
                                                required
                                                className={`bg-background ${errors.contactName ? 'border-destructive' : ''}`}
                                            />
                                            {errors.contactName && (
                                                <p className="text-xs text-destructive">{errors.contactName.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="contactTitle" className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" />
                                                Your Title
                                            </Label>
                                            <Input
                                                id="contactTitle"
                                                placeholder="Head of Talent Acquisition"
                                                {...register('contactTitle')}
                                                className={`bg-background ${errors.contactTitle ? 'border-destructive' : ''}`}
                                            />
                                            {errors.contactTitle && (
                                                <p className="text-xs text-destructive">{errors.contactTitle.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail" className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email Address
                                        </Label>
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Email cannot be changed. Contact support if you need to update it.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    disabled={updateCompany.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={updateCompany.isPending || isSubmitting}
                                >
                                    {updateCompany.isPending || isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                ) : (
                    /* View Mode - Show Profile Info */
                    <div className="space-y-6">
                        {/* Company Information Card */}
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    Company Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 pb-4 mb-4 border-b">
                                    <Avatar className="h-16 w-16 border border-border">
                                        <AvatarImage src={getOptimizedImageUrl(logoUrl, { width: 128, height: 128 })} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                                            {company?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-lg">{company?.company_name || '—'}</p>
                                        <p className="text-sm text-muted-foreground">Company Profile</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                                        <p className="font-medium">{company?.company_name || '—'}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Website</p>
                                        {company?.company_website ? (
                                            <a
                                                href={company.company_website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                                            >
                                                {company.company_website}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <p className="font-medium text-muted-foreground">—</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">LinkedIn</p>
                                    {company?.company_linkedin ? (
                                        <a
                                            href={company.company_linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            {company.company_linkedin}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : (
                                        <p className="font-medium text-muted-foreground">—</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Office Locations</p>
                                    {company?.office_locations && company.office_locations.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {company.office_locations.map(location => (
                                                <Badge key={location} variant="secondary">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {location}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="font-medium text-muted-foreground">—</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information Card */}
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                                        <p className="font-medium">{company?.contact_name || '—'}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Title</p>
                                        <p className="font-medium">{company?.contact_title || '—'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                                    <p className="font-medium">{company?.contact_email || '—'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>

            <ImageCropper
                open={isCropperOpen}
                imageSrc={selectedFile}
                onClose={() => setIsCropperOpen(false)}
                onCropComplete={handleCropComplete}
                aspectRatio={1}
            />
        </div>
    );
}
