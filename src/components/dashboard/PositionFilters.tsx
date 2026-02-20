/* eslint-disable react-refresh/only-export-components */
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const CATEGORIES = [
    'Engineering',
    'Product Management',
    'UX Design',
    'QA',
    'SRE',
    'DevOps',
];

const WORK_TYPES = ['In-Office', 'Remote', 'Hybrid'];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const STATUSES = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'filled', label: 'Filled' },
    { value: 'closed', label: 'Closed' },
];

const LOCATIONS = [
    'Hyderabad',
    'NCR',
    'Mumbai',
    'Chennai',
    'Pune',
    'Bangalore',
    'Other Cities',
];

export interface PositionFiltersState {
    category: string;
    workType: string;
    priority: string;
    location: string;
    status: string;
}

interface PositionFiltersProps {
    filters: PositionFiltersState;
    onFiltersChange: (filters: PositionFiltersState) => void;
}

export function PositionFilters({ filters, onFiltersChange }: PositionFiltersProps) {
    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    const handleFilterChange = (key: keyof PositionFiltersState, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value === 'all' ? '' : value,
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            category: '',
            workType: '',
            priority: '',
            location: '',
            status: '',
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Select
                value={filters.category || 'all'}
                onValueChange={(value) => handleFilterChange('category', value)}
            >
                <SelectTrigger className="w-[160px] bg-background">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                            {category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
            >
                <SelectTrigger className="w-[130px] bg-background">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                            {status.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.workType || 'all'}
                onValueChange={(value) => handleFilterChange('workType', value)}
            >
                <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue placeholder="Work Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {WORK_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                            {type}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => handleFilterChange('priority', value)}
            >
                <SelectTrigger className="w-[130px] bg-background">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                            {priority}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={filters.location || 'all'}
                onValueChange={(value) => handleFilterChange('location', value)}
            >
                <SelectTrigger className="w-[150px] bg-background">
                    <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                            {location}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                </Button>
            )}
        </div>
    );
}

