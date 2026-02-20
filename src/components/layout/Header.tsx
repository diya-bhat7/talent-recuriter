import { memo, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StraatixLogo } from '@/components/ui/StraatixLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, LogOut, User, RefreshCw } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getOptimizedImageUrl } from '@/lib/images';

export const Header = memo(function Header() {
    const { user, company, role, signOut } = useAuth();
    const { isAdmin, canPostJobs, viewFullDashboard, canManageTeam } = usePermissions();
    const navigate = useNavigate();

    const handleSignOut = useCallback(async () => {
        await signOut();
        navigate('/login');
    }, [signOut, navigate]);

    const handleNavigateProfile = useCallback(() => {
        navigate('/profile');
    }, [navigate]);

    const handleNavigateSync = useCallback(() => {
        navigate('/sync');
    }, [navigate]);

    const initials = useMemo(() => {
        if (!company?.contact_name) return '';
        return company.contact_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, [company?.contact_name]);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link to="/dashboard">
                    <StraatixLogo className="h-8 w-auto text-foreground" />
                </Link>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
                    {viewFullDashboard && (
                        <Link to="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Dashboard
                        </Link>
                    )}
                    <Link to="/candidates" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Candidates
                    </Link>
                    <Link to="/interviews" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Interviews
                    </Link>
                    {canPostJobs && (
                        <Link to="/hiring" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Hiring
                        </Link>
                    )}
                    {canManageTeam && (
                        <Link to="/team" className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Team
                        </Link>
                    )}
                </nav>

                {/* Right side: Notifications + Theme toggle + User Menu */}
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <ThemeToggle />

                    {user && company && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 h-auto">
                                    <div className="flex items-center gap-2">
                                        {company.logo_url ? (
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={getOptimizedImageUrl(company.logo_url, { width: 48, height: 48 })} className="object-cover" />
                                                <AvatarFallback className="bg-transparent">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm font-medium hidden sm:inline-block">
                                            {company.company_name}
                                        </span>
                                    </div>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="flex items-center gap-2 p-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{company.contact_name}</span>
                                            {role && (
                                                <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-primary/30 text-primary">
                                                    {role}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{company.contact_email}</span>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleNavigateProfile} className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleNavigateSync} className="cursor-pointer">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Sync Status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
});
