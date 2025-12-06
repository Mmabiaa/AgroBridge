import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FinancialFiltersProps {
    onFilterChange: (filters: FilterValues) => void;
    categories?: string[];
}

export interface FilterValues {
    type?: 'income' | 'expense' | '';
    category?: string;
    startDate?: string;
    endDate?: string;
}

export function FinancialFilters({
    onFilterChange,
    categories = [],
}: FinancialFiltersProps) {
    const [filters, setFilters] = useState<FilterValues>({
        type: 'all' as any,
        category: 'all',
        startDate: '',
        endDate: '',
    });
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    useEffect(() => {
        const updatedFilters = {
            ...filters,
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        };
        setFilters(updatedFilters);
    }, [startDate, endDate]);

    const handleApplyFilters = () => {
        // Convert 'all' to empty string for API
        const apiFilters = {
            ...filters,
            type: filters.type === 'all' ? '' : filters.type,
            category: filters.category === 'all' ? '' : filters.category,
        };
        onFilterChange(apiFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters: FilterValues = {
            type: 'all' as any,
            category: 'all',
            startDate: '',
            endDate: '',
        };
        setFilters(clearedFilters);
        setStartDate(undefined);
        setEndDate(undefined);
        onFilterChange(clearedFilters);
    };

    const hasActiveFilters = filters.type !== 'all' || filters.category !== 'all' || filters.startDate !== '' || filters.endDate !== '';

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <h3 className="font-semibold">Filters</h3>
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-8"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={filters.type}
                        onValueChange={(value) =>
                            setFilters({ ...filters, type: value as 'income' | 'expense' | '' })
                        }
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        value={filters.category}
                        onValueChange={(value) =>
                            setFilters({ ...filters, category: value })
                        }
                    >
                        <SelectTrigger id="category">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Start Date Filter */}
                <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !startDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* End Date Filter */}
                <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !endDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                                disabled={(date) =>
                                    startDate ? date < startDate : false
                                }
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleApplyFilters}>
                    Apply Filters
                </Button>
            </div>
        </div>
    );
}
