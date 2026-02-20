import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StraatixLogo } from '@/components/ui/StraatixLogo';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    // Check if user has access token from reset link
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (!accessToken || type !== 'recovery') {
            toast({
                title: 'Invalid reset link',
                description: 'Please request a new password reset link.',
                variant: 'destructive',
            });
            navigate('/forgot-password');
        }
    }, [navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please ensure both passwords are the same.',
                variant: 'destructive',
            });
            return;
        }

        if (formData.password.length < 6) {
            toast({
                title: 'Password too short',
                description: 'Password must be at least 6 characters long.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: formData.password,
        });

        setLoading(false);

        if (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setSuccess(true);
            toast({
                title: 'Password updated',
                description: 'Your password has been successfully reset.',
            });
            // Redirect after a short delay
            setTimeout(() => navigate('/login'), 3000);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'var(--gradient-soft)' }}
        >
            {/* Decorative Floating Orbs */}
            <div className="orb orb-1" aria-hidden="true" />
            <div className="orb orb-2" aria-hidden="true" />
            <div className="orb orb-3" aria-hidden="true" />

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-center mb-4">
                        <StraatixLogo size="lg" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                        <span className="text-gradient">New Password</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Create a new password for your account
                    </p>
                </div>

                {/* Form Card */}
                <Card className="form-card animate-fade-up border-0" style={{ animationDelay: '0.2s' }}>
                    {success ? (
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Password Reset Complete</h3>
                                <p className="text-muted-foreground mb-4">
                                    Your password has been successfully updated.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Redirecting to login...
                                </p>
                            </div>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">Set New Password</CardTitle>
                                <CardDescription>
                                    Enter your new password below
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            required
                                            minLength={6}
                                            className="input-elegant pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        required
                                        minLength={6}
                                        className="input-elegant"
                                    />
                                </div>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
