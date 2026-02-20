
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Candidate {
    id: string;
    name: string;
    position: { position_name: string };
    status: string;
    created_at: string;
}

interface ReviewCandidateCardProps {
    candidate: Candidate;
    onReview: (id: string) => void;
    onPass: (id: string) => void;
    onReject: (id: string) => void;
}

export function ReviewCandidateCard({ candidate, onReview, onPass, onReject }: ReviewCandidateCardProps) {
    const initials = candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">
                        {candidate.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                        {candidate.position.position_name} • Applied {format(new Date(candidate.created_at), 'MMM d')}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onReject(candidate.id)} className="text-muted-foreground hover:text-red-500 hover:bg-red-50">
                        <XCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onPass(candidate.id)} className="text-muted-foreground hover:text-green-500 hover:bg-green-50">
                        <CheckCircle2 className="h-5 w-5" />
                    </Button>
                    <Button size="sm" onClick={() => onReview(candidate.id)}>
                        Review
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
