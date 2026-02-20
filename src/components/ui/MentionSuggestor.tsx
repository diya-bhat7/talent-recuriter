import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';

export interface MentionUser {
    id: string;
    name: string;
    email?: string;
}

interface MentionSuggestorProps {
    query: string;
    users: MentionUser[];
    onSelect: (user: MentionUser) => void;
    onClose: () => void;
    position?: 'top' | 'bottom';
}

export function MentionSuggestor({
    query,
    users,
    onSelect,
    onClose,
    position = 'top'
}: MentionSuggestorProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Filter users based on query
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (filteredUsers.length === 0) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200",
                position === 'top' ? "bottom-full mb-2" : "top-full mt-2"
            )}
        >
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Suggested People
                </p>
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1">
                {filteredUsers.map((user, index) => (
                    <button
                        key={user.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                        onClick={() => onSelect(user)}
                    >
                        <Avatar className="h-8 w-8 border-2 border-white shadow-sm duration-200 group-hover:scale-105">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate group-hover:text-primary transition-colors">
                                {user.name}
                            </p>
                            {user.email && (
                                <p className="text-[10px] text-slate-400 truncate">
                                    {user.email}
                                </p>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
