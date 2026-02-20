import { Bell, Info, MessageSquare, Star } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { MentionText } from '../comments/MentionText';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case 'mention': return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'scorecard': return <Star className="h-4 w-4 text-amber-500" />;
            default: return <Info className="h-4 w-4 text-slate-500" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold border-2 border-background animate-in zoom-in"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Notifications</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-blue-50 text-blue-600 border-blue-100">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-[10px] font-bold uppercase text-primary hover:bg-transparent"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications && notifications.length > 0 ? (
                        <div className="grid divide-y">
                            {notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    to={n.link || '#'}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors hover:bg-slate-50",
                                        !n.is_read && "bg-blue-50/50"
                                    )}
                                    onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                                >
                                    <div className="mt-1 shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            {getIcon(n.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold leading-none">{n.title}</p>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            <MentionText content={n.message} />
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-40">
                            <Bell className="h-8 w-8" />
                            <p className="text-xs font-medium">All caught up!</p>
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Link to="/activity">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-slate-600">
                            View All Activity
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
