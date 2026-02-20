/**
 * Candidate Filters Component
 * Reusable filter panel for experience, skills, status, and position
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Filter,
    X,
    Briefcase,
    Tag,
    Building2,
    CheckCircle2,
} from 'lucide-react';
import { CANDIDATE_STATUS_OPTIONS, CandidateStatus } from './CandidateStatusBadge';

export interface CandidateFilters {
    experienceMin: number | null;
    experienceMax: number | null;
    skills: string[];
    status: CandidateStatus | 'all';
    positionId: string | 'all';
}

interface CandidateFiltersProps {
    filters: CandidateFilters;
    onFiltersChange: (filters: CandidateFilters) => void;
    positions?: { id: string; position_name: string }[];
    availableSkills?: string[];
}

const defaultFilters: CandidateFilters = {
    experienceMin: null,
    experienceMax: null,
    skills: [],
    status: 'all',
    positionId: 'all',
};

export function CandidateFiltersPanel({
    filters,
    onFiltersChange,
    positions = [],
    availableSkills = [],
}: CandidateFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [expRange, setExpRange] = useState<[number, number]>([
        filters.experienceMin ?? 0,
        filters.experienceMax ?? 20,
    ]);

    // Count active filters
    const activeFilterCount = [
        filters.experienceMin !== null || filters.experienceMax !== null,
        filters.skills.length > 0,
        filters.status !== 'all',
        filters.positionId !== 'all',
    ].filter(Boolean).length;

    const handleExpRangeChange = (value: number[]) => {
        setExpRange([value[0], value[1]]);
    };

    const applyExpRange = () => {
        onFiltersChange({
            ...filters,
            experienceMin: expRange[0] === 0 ? null : expRange[0],
            experienceMax: expRange[1] === 20 ? null : expRange[1],
        });
    };

    const addSkill = (skill: string) => {
        const normalized = skill.trim().toLowerCase();
        if (normalized && !filters.skills.includes(normalized)) {
            onFiltersChange({
                ...filters,
                skills: [...filters.skills, normalized],
            });
        }
        setSkillInput('');
    };

    const removeSkill = (skill: string) => {
        onFiltersChange({
            ...filters,
            skills: filters.skills.filter((s) => s !== skill),
        });
    };

    const clearFilters = () => {
        onFiltersChange(defaultFilters);
        setExpRange([0, 20]);
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Filter Candidates</h4>
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-destructive h-auto p-1"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>

                        {/* Experience Range */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                Experience (years)
                            </Label>
                            <Slider
                                value={expRange}
                                onValueChange={handleExpRangeChange}
                                onValueCommit={applyExpRange}
                                min={0}
                                max={20}
                                step={1}
                                className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{expRange[0]} years</span>
                                <span>{expRange[1]}+ years</span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Skills
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add skill..."
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill(skillInput);
                                        }
                                    }}
                                    className="h-8"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => addSkill(skillInput)}
                                    disabled={!skillInput.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                            {filters.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {filters.skills.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="gap-1 cursor-pointer hover:bg-destructive/20"
                                            onClick={() => removeSkill(skill)}
                                        >
                                            {skill}
                                            <X className="h-3 w-3" />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Status
                            </Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) =>
                                    onFiltersChange({
                                        ...filters,
                                        status: value as CandidateStatus | 'all',
                                    })
                                }
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {CANDIDATE_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Position */}
                        {positions.length > 0 && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Position
                                </Label>
                                <Select
                                    value={filters.positionId}
                                    onValueChange={(value) =>
                                        onFiltersChange({
                                            ...filters,
                                            positionId: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Positions</SelectItem>
                                        {positions.map((pos) => (
                                            <SelectItem key={pos.id} value={pos.id}>
                                                {pos.position_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Active filter badges */}
            {filters.skills.length > 0 && (
                <div className="flex gap-1">
                    {filters.skills.slice(0, 2).map((skill) => (
                        <Badge key={skill} variant="outline" className="gap-1">
                            {skill}
                            <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeSkill(skill)}
                            />
                        </Badge>
                    ))}
                    {filters.skills.length > 2 && (
                        <Badge variant="outline">+{filters.skills.length - 2}</Badge>
                    )}
                </div>
            )}
        </div>
    );
}

export { defaultFilters };
