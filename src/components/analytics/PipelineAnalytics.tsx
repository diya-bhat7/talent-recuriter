import { useMemo } from 'react';
import { Candidate } from '@/hooks/useCandidates';
import { CANDIDATE_STATUS_OPTIONS } from '../candidates/CandidateStatusBadge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface PipelineAnalyticsProps {
    candidates: Candidate[];
}

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#ef4444'];

export function PipelineAnalytics({ candidates }: PipelineAnalyticsProps) {
    const stats = useMemo(() => {
        const counts = CANDIDATE_STATUS_OPTIONS.reduce((acc, status) => {
            acc[status.value] = candidates.filter(c => c.status === status.value).length;
            return acc;
        }, {} as Record<string, number>);

        const funnelData = CANDIDATE_STATUS_OPTIONS.map((status, index) => ({
            name: status.label,
            count: counts[status.value],
            color: COLORS[index % COLORS.length]
        }));

        const totalCandidates = candidates.length;
        const hiredCount = counts['hired'] || 0;
        const offerCount = counts['offer'] || 0;
        const hireRate = totalCandidates > 0 ? (hiredCount / totalCandidates) * 100 : 0;
        const offerRate = totalCandidates > 0 ? (offerCount / totalCandidates) * 100 : 0;

        const avgDaysInPipeline = candidates.length > 0
            ? candidates.reduce((acc, c) => acc + differenceInDays(new Date(), new Date(c.created_at)), 0) / candidates.length
            : 0;

        return {
            funnelData,
            totalCandidates,
            hiredCount,
            hireRate,
            offerRate,
            avgDaysInPipeline: Math.round(avgDaysInPipeline)
        };
    }, [candidates]);

    return (
        <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Users className="h-12 w-12 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Pipeline</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">{stats.totalCandidates}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                            Active Candidates
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Clock className="h-12 w-12 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Avg. Time in Pipe</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">{stats.avgDaysInPipeline}d</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                            Days Since Applied
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Target className="h-12 w-12 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Offer Rate</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">{stats.offerRate.toFixed(1)}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">
                            Pipeline Velocity
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <TrendingUp className="h-12 w-12 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Hiring Success</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">{stats.hireRate.toFixed(1)}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                            Global Success Rate
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Hiring Funnel
                        </CardTitle>
                        <CardDescription>Distribution of candidates across pipeline stages</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.funnelData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                                    {stats.funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Stage Distribution
                        </CardTitle>
                        <CardDescription>Relative percentage of candidates in each stage</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.funnelData.filter(d => d.count > 0)}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {stats.funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
