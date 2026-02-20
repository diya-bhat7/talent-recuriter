/**
 * Activity Feed Component
 * Shows recent activity with real-time updates
 */

import { formatDistanceToNow } from 'date-fns';
import { useCompanyActivity, useActivityRealtime } from '@/hooks/useActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    UserPlus,
    Edit,
    Trash2,
    ArrowRight,
    MessageSquare,
    Star,
    Activity,
} from 'lucide-react';
import type { ActivityAction, EntityType } from '@/types/advanced-features';
import { MentionText } from '../comments/MentionText';

interface ActivityFeedProps {
    companyId: string | undefined;
    maxHeight?: string;
    showHeader?: boolean;
}

const actionIcons: Record<ActivityAction, typeof UserPlus> = {
    created: UserPlus,
    updated: Edit,
    deleted: Trash2,
    status_changed: ArrowRight,
    commented: MessageSquare,
    scored: Star,
    assigned: UserPlus,
    mentioned: MessageSquare,
};

const actionColors: Record<ActivityAction, string> = {
    created: 'text-emerald-600 bg-emerald-100',
    updated: 'text-blue-600 bg-blue-100',
    deleted: 'text-red-600 bg-red-100',
    status_changed: 'text-purple-600 bg-purple-100',
    commented: 'text-amber-600 bg-amber-100',
    scored: 'text-yellow-600 bg-yellow-100',
    assigned: 'text-indigo-600 bg-indigo-100',
    mentioned: 'text-pink-600 bg-pink-100',
};

const actionLabels: Record<ActivityAction, string> = {
    created: 'added',
    updated: 'updated',
    deleted: 'removed',
    status_changed: 'moved',
    commented: 'commented on',
    scored: 'scored',
    assigned: 'assigned',
    mentioned: 'mentioned in',
};

function getInitials(name: string | null): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatActivityMessage(
    action: ActivityAction,
    entityType: EntityType,
    entityName: string | null,
    metadata: Record<string, unknown>
): string {
    const name = entityName || 'Unknown';

    if (action === 'status_changed' && metadata.old_status && metadata.new_status) {
        return `${name} from ${metadata.old_status} to ${metadata.new_status}`;
    }

    if (action === 'scored' && metadata.recommendation) {
        return `${name} (${metadata.recommendation})`;
    }

    if (action === 'commented' && metadata.content) {
        return metadata.content as string;
    }

    return name;
}

export function ActivityFeed({
    companyId,
    maxHeight = '400px',
    showHeader = true
}: ActivityFeedProps) {
    const { data: activities, isLoading } = useCompanyActivity(companyId);
    useActivityRealtime(companyId);

    if (!companyId) return null;

    return (
        <Card>
            {showHeader && (
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <ScrollArea style={{ maxHeight }} className="pr-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !activities?.length ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No activity yet
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity) => {
                                const Icon = actionIcons[activity.action];
                                const colorClass = actionColors[activity.action];

                                return (
                                    <div key={activity.id} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {getInitials(activity.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                <span className="font-medium">
                                                    {activity.user_name || 'Someone'}
                                                </span>
                                                {' '}
                                                <span className="text-muted-foreground">
                                                    {actionLabels[activity.action]}
                                                </span>
                                                {' '}
                                                <span className="font-medium italic">
                                                    <MentionText
                                                        content={formatActivityMessage(
                                                            activity.action,
                                                            activity.entity_type,
                                                            activity.entity_name,
                                                            activity.metadata
                                                        )}
                                                    />
                                                </span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs px-1.5 py-0 ${colorClass}`}
                                                >
                                                    <Icon className="h-3 w-3 mr-1" />
                                                    {activity.entity_type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(activity.created_at), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

// Compact version for sidebar or small spaces
export function ActivityFeedCompact({ companyId }: { companyId: string | undefined }) {
    const { data: activities } = useCompanyActivity(companyId, 5);
    useActivityRealtime(companyId);

    if (!companyId || !activities?.length) return null;

    return (
        <div className="space-y-2">
            {activities.slice(0, 5).map((activity) => (
                <div
                    key={activity.id}
                    className="text-xs text-muted-foreground flex items-center gap-2"
                >
                    <span className="font-medium text-foreground">
                        <MentionText content={activity.user_name?.split(' ')[0] || 'Someone'} />
                    </span>
                    <span>{actionLabels[activity.action]}</span>
                    <span className="text-foreground truncate max-w-[100px]">
                        <MentionText content={activity.entity_name || ''} />
                    </span>
                </div>
            ))}
        </div>
    );
}
