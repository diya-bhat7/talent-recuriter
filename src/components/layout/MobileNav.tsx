import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, PlusCircle, Briefcase, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function MobileNav() {
    const { pathname } = useLocation();
    const { user } = useAuth();

    if (!user) return null;

    const links = [
        {
            href: '/dashboard',
            label: 'Home',
            icon: LayoutDashboard,
            active: pathname === '/dashboard' || pathname === '/',
        },
        {
            href: '/hiring',
            label: 'Hiring',
            icon: Briefcase,
            active: pathname === '/hiring',
        },
        {
            href: '/candidates',
            label: 'Candidates',
            icon: Users,
            active: pathname === '/candidates',
        },
        {
            href: '/interviews',
            label: 'Interviews',
            icon: Calendar,
            active: pathname === '/interviews',
        },
        {
            href: '/positions/new',
            label: 'Create',
            icon: PlusCircle,
            active: pathname === '/positions/new',
        },
        {
            href: '/profile',
            label: 'Profile',
            icon: User,
            active: pathname === '/profile',
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <nav className="flex items-center justify-around h-16">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 text-xs transition-colors hover:bg-accent/50",
                            link.active ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                    >
                        <link.icon className={cn("h-5 w-5", link.active && "fill-current")} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
