import { useAuth } from '@/hooks/useAuth';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Shield, UserCog, Users } from 'lucide-react';
import { TeamRole } from '@/types/advanced-features';

export function RoleSwitcher() {
    const { role, originalRole, impersonateRole } = useAuth();

    // Only allow admins to see and use the switcher
    if (originalRole !== 'admin') return null;

    return (
        <div className="flex items-center gap-2 px-2 py-1">
            <Select
                value={role || 'admin'}
                onValueChange={(value) => impersonateRole(value as TeamRole)}
            >
                <SelectTrigger className="h-8 w-full border border-primary/10 bg-muted/20 hover:bg-muted/40 px-3 focus:ring-0 rounded-md transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <UserCog className="h-3.5 w-3.5 text-primary shrink-0" />
                        <SelectValue placeholder="Select Role" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm">Admin</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="recruiter">
                        <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-sm">Recruiter</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="coordinator">
                        <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-sm">Coordinator</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
