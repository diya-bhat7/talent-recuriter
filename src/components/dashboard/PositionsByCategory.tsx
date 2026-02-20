import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type Position = Tables<'positions'>;

interface PositionsByCategoryProps {
    positions: Position[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function PositionsByCategory({ positions }: PositionsByCategoryProps) {
    const data = useMemo(() => {
        const categoryCount: Record<string, number> = {};
        positions.forEach(p => {
            categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        });

        return Object.entries(categoryCount).map(([name, value]) => ({
            name,
            value
        }));
    }, [positions]);

    if (data.length === 0) return null;

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Positions by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
