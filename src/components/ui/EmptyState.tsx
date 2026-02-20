import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500",
            className
        )}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 mb-4 group hover:bg-primary/10 transition-colors">
                <Icon className="h-10 w-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} className="btn-primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
