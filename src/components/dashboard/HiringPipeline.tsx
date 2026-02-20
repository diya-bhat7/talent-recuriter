import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Position = Tables<'positions'>;

interface HiringPipelineProps {
    positions: Position[];
}

const STATUS_COLORS: Record<string, string> = {
    draft: '#9ca3af', // gray-400
    active: '#34d399', // emerald-400
    interviewing: '#60a5fa', // blue-400
    filled: '#a78bfa', // violet-400
    closed: '#475569', // slate-600
};

export function HiringPipeline({ positions }: HiringPipelineProps) {
    const data = useMemo(() => {
        const statusCount: Record<string, number> = {
            draft: 0,
            active: 0,
            interviewing: 0,
            filled: 0,
            closed: 0
        };

        positions.forEach(p => {
            const status = p.status || 'draft';
            if (statusCount[status] !== undefined) {
                statusCount[status]++;
            } else {
                // Handle unexpected statuses if any
                statusCount[status] = 1;
            }
        });

        // Order matters for pipeline visual
        return [
            { name: 'Draft', value: statusCount.draft, key: 'draft' },
            { name: 'Active', value: statusCount.active, key: 'active' },
            { name: 'Interviewing', value: statusCount.interviewing, key: 'interviewing' },
            { name: 'Filled', value: statusCount.filled, key: 'filled' },
            { name: 'Closed', value: statusCount.closed, key: 'closed' },
        ];
    }, [positions]);

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle>Hiring Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" width={80} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.key] || '#8884d8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
