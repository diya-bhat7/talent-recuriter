/* eslint-disable react-refresh/only-export-components */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

const LOCATIONS = [
    'Hyderabad',
    'NCR',
    'Mumbai',
    'Chennai',
    'Pune',
    'Bangalore',
    'Other Cities',
];

export interface PositionDetailsData {
    positionName: string;
    category: string;
    minExperience: number;
    maxExperience: number;
    workType: string;
    preferredLocations: string[];
    inOfficeDays: number;
    numRoles: number;
    priority: string;
    hiringStartDate: Date | null;
}

interface PositionDetailsFormProps {
    data: PositionDetailsData;
    onChange: (data: PositionDetailsData) => void;
    onSubmit: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function PositionDetailsForm({
    data,
    onChange,
    onSubmit,
    onCancel,
    loading = false,
}: PositionDetailsFormProps) {
    const handleChange = <K extends keyof PositionDetailsData>(
        key: K,
        value: PositionDetailsData[K]
    ) => {
        onChange({ ...data, [key]: value });
    };

    const isValid =
        data.positionName.trim() !== '' &&
        data.category !== '' &&
        data.priority !== '' &&
        data.workType !== '' &&
        data.minExperience <= data.maxExperience;

    const showInOfficeDays = data.workType === 'Hybrid' || data.workType === 'In-Office';

    return (
        <div className="space-y-6">
            {/* Position Name */}
            <div className="space-y-2">
                <Label htmlFor="positionName">Position Name *</Label>
                <Input
                    id="positionName"
                    placeholder="e.g., Senior Backend Engineer"
                    value={data.positionName}
                    onChange={(e) => handleChange('positionName', e.target.value)}
                    className="bg-background"
                />
            </div>

            {/* Category and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                        value={data.category}
                        onValueChange={(value) => handleChange('category', value)}
                    >
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select
                        value={data.priority}
                        onValueChange={(value) => handleChange('priority', value)}
                    >
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIORITIES.map((priority) => (
                                <SelectItem key={priority} value={priority}>
                                    {priority}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Experience Range and Number of Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Experience Range (Years) *</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={30}
                            value={data.minExperience}
                            onChange={(e) => handleChange('minExperience', parseInt(e.target.value) || 0)}
                            className="w-20 bg-background"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                            type="number"
                            min={0}
                            max={30}
                            value={data.maxExperience}
                            onChange={(e) => handleChange('maxExperience', parseInt(e.target.value) || 0)}
                            className="w-20 bg-background"
                        />
                        <span className="text-muted-foreground">years</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="numRoles">Number of Roles *</Label>
                    <Input
                        id="numRoles"
                        type="number"
                        min={1}
                        max={100}
                        value={data.numRoles}
                        onChange={(e) => handleChange('numRoles', parseInt(e.target.value) || 1)}
                        className="bg-background"
                    />
                </div>
            </div>

            {/* Work Type and In-Office Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Work Type *</Label>
                    <Select
                        value={data.workType}
                        onValueChange={(value) => handleChange('workType', value)}
                    >
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                            {WORK_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {showInOfficeDays && (
                    <div className="space-y-2">
                        <Label>In-Office Days per Week</Label>
                        <Select
                            value={data.inOfficeDays.toString()}
                            onValueChange={(value) => handleChange('inOfficeDays', parseInt(value))}
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select days" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                        {day} day{day > 1 ? 's' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Preferred Locations */}
            <div className="space-y-2">
                <Label>Preferred Locations *</Label>
                <MultiSelect
                    options={LOCATIONS}
                    selected={data.preferredLocations}
                    onChange={(selected) => handleChange('preferredLocations', selected)}
                    placeholder="Select cities..."
                />
            </div>

            {/* Hiring Start Date */}
            <div className="space-y-2">
                <Label>Hiring Start Date *</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'w-full md:w-[280px] justify-start text-left font-normal bg-background',
                                !data.hiringStartDate && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data.hiringStartDate ? (
                                format(data.hiringStartDate, 'PPP')
                            ) : (
                                <span>dd-mm-yyyy</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={data.hiringStartDate || undefined}
                            onSelect={(date) => handleChange('hiringStartDate', date || null)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={onSubmit}
                    disabled={!isValid || loading}
                    className="btn-primary"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Next'
                    )}
                </Button>
            </div>
        </div>
    );
}
