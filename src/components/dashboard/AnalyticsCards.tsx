import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { Briefcase, Users, Layout, Clock } from 'lucide-react';
import { useMemo } from 'react';

type Position = Tables<'positions'>;

interface AnalyticsCardsProps {
    positions: Position[];
}

export function AnalyticsCards({ positions }: AnalyticsCardsProps) {
    const stats = useMemo(() => {
        const totalPositions = positions.length;
        const activePositions = positions.filter(p => p.status === 'active' || p.status === 'interviewing').length;
        const totalRoles = positions.reduce((acc, p) => acc + p.num_roles, 0);

        // Calculate average distinct categories
        const categories = new Set(positions.map(p => p.category)).size;

        return {
            totalPositions,
            activePositions,
            totalRoles,
            categories
        };
    }, [positions]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPositions}</div>
                    <p className="text-xs text-muted-foreground">
                        All time positions created
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Hiring</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activePositions}</div>
                    <p className="text-xs text-muted-foreground">
                        Positions currently active
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRoles}</div>
                    <p className="text-xs text-muted-foreground">
                        Openings across all positions
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Departments</CardTitle>
                    <Layout className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.categories}</div>
                    <p className="text-xs text-muted-foreground">
                        Active departments hiring
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
