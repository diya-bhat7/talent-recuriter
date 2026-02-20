import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * RouteErrorBoundary — wraps a single route's element.
 * Uses the current pathname as a React key so the error state
 * resets automatically when the user navigates away and back.
 */
export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
    const { pathname } = useLocation();
    return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}
