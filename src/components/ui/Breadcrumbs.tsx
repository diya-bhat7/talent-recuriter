import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

/**
 * Breadcrumb navigation for deep routes.
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Software Engineer' },
 *   ]} />
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-muted-foreground ${className}`}>
            <Link
                to="/dashboard"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-3.5 w-3.5" />
            </Link>
            {items.map((item, idx) => (
                <span key={idx} className="flex items-center">
                    <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-muted-foreground/40" />
                    {item.href && idx < items.length - 1 ? (
                        <Link
                            to={item.href}
                            className="hover:text-foreground transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-medium truncate max-w-[200px]">
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
