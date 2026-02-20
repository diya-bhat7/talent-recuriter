import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component fails
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border-destructive/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-muted-foreground mb-4">
                                An unexpected error occurred. This has been logged for investigation.
                            </p>
                            {this.state.error && (
                                <details className="text-left text-xs bg-muted p-3 rounded-md">
                                    <summary className="cursor-pointer text-muted-foreground mb-2">
                                        Error details
                                    </summary>
                                    <pre className="whitespace-pre-wrap break-words text-destructive">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={this.handleRetry}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={this.handleReload}>
                                Reload Page
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
