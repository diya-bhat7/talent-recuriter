import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StraatixLogo } from '@/components/ui/StraatixLogo';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Loader2 } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { user, signIn, signInWithGoogle, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Redirect to dashboard if already authenticated
    if (!authLoading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await signIn(formData.email, formData.password);

        setLoading(false);

        if (error) {
            toast({
                title: 'Login failed',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Welcome back!',
                description: 'You have been successfully logged in.',
            });
            navigate('/dashboard');
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            toast({
                title: 'Google Login failed',
                description: error.message,
                variant: 'destructive',
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
                        <StraatixLogo variant="vertical" className="h-24 w-auto text-foreground" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                        <span className="text-gradient">Welcome Back</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Sign in to access your hiring dashboard
                    </p>
                </div>

                {/* Login Form */}
                <Card className="form-card animate-fade-up border-0" style={{ animationDelay: '0.2s' }}>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Sign In</CardTitle>
                        <CardDescription>Enter your credentials to continue</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                    className="input-elegant"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        required
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

                            <Button
                                type="submit"
                                className="w-full btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 gap-3 hover:bg-slate-50 border-border/50 text-foreground transition-all duration-200"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Forgot your password?
                        </Link>

                        <p className="text-sm text-muted-foreground text-center">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary font-medium hover:underline">
                                Register your company
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <p
                    className="text-center text-sm text-muted-foreground mt-8 animate-fade-up"
                    style={{ animationDelay: '0.3s' }}
                >
                    ✨ Secure & Encrypted Login
                </p>
            </div>
        </div>
    );
}
