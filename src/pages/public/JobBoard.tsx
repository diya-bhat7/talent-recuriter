import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Position = Tables<'positions'>;

export default function PublicJobBoard() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data: positions, isLoading } = useQuery({
        queryKey: ['public-positions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('positions')
                .select('*')
                .eq('status', 'active')
                .gt('closing_date', new Date().toISOString()) // Only show open positions
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Position[];
        }
    });

    const filteredPositions = positions?.filter(p =>
        p.position_name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-12">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                    Join Our Mission
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    We're looking for passionate people to help us build the future.
                    Explore our open roles and find your next challenge.
                </p>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    placeholder="Search by role or category..."
                    className="pl-10 h-12 text-lg rounded-full shadow-sm border-slate-200 focus:ring-2 focus:ring-slate-900"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Jobs Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading open positions...</div>
            ) : filteredPositions?.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    No open positions found matching your search.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {filteredPositions?.map((position) => (
                        <Card key={position.id} className="flex flex-col hover:shadow-lg transition-shadow border-slate-200">
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <Badge variant="secondary" className="mb-2">
                                            {position.category}
                                        </Badge>
                                        <CardTitle className="text-xl font-bold text-slate-900">
                                            {position.position_name}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        {position.work_type}
                                    </div>
                                    {position.preferred_locations && position.preferred_locations.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {position.preferred_locations[0]}
                                        </div>
                                    )}
                                </div>
                                <p className="text-slate-600 line-clamp-3 text-sm">
                                    {position.generated_jd || position.client_jd_text || 'Join our team and make an impact.'}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-4 border-t bg-slate-50/50">
                                <Button className="w-full group" onClick={() => navigate(`/jobs/${position.id}/apply`)}>
                                    Apply Now
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
