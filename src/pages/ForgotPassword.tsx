import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StraatixLogo } from '@/components/ui/StraatixLogo';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);

        if (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setEmailSent(true);
            toast({
                title: 'Email sent',
                description: 'Check your inbox for the password reset link.',
            });
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
                        <span className="text-gradient">Reset Password</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Enter your email to receive a password reset link
                    </p>
                </div>

                {/* Form Card */}
                <Card className="form-card animate-fade-up border-0" style={{ animationDelay: '0.2s' }}>
                    {emailSent ? (
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Check your email</h3>
                                <p className="text-muted-foreground mb-6">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setEmailSent(false)}
                                    className="mr-2"
                                >
                                    Try again
                                </Button>
                                <Link to="/login">
                                    <Button variant="ghost">Back to login</Button>
                                </Link>
                            </div>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">Forgot Password</CardTitle>
                                <CardDescription>
                                    We'll send you a link to reset your password
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="input-elegant"
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    type="submit"
                                    className="w-full btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>

                                <Link
                                    to="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to login
                                </Link>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
