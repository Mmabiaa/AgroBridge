import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import financialService, { CreateBudgetRequest, Budget } from '@/api/services/financial.service';
import { toast } from 'sonner';

const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  total_amount: z.number().positive('Total amount must be positive'),
  currency: z.string().default('NGN'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  categories: z.array(
    z.object({
      name: z.string().min(1, 'Category name is required'),
      allocated_amount: z.number().positive('Amount must be positive'),
    })
  ).min(1, 'At least one category is required'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  budget?: Budget;
}

export function BudgetForm({
  open,
  onOpenChange,
  onSuccess,
  budget,
}: BudgetFormProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      total_amount: 0,
      currency: 'NGN',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      categories: [{ name: '', allocated_amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  // Update dates in form when calendar changes
  useEffect(() => {
    setValue('start_date', format(startDate, 'yyyy-MM-dd'));
  }, [startDate, setValue]);

  useEffect(() => {
    setValue('end_date', format(endDate, 'yyyy-MM-dd'));
  }, [endDate, setValue]);

  // Load budget data if editing
  useEffect(() => {
    if (budget && open) {
      reset({
        name: budget.name,
        total_amount: budget.total_amount,
        currency: budget.currency,
        start_date: budget.start_date,
        end_date: budget.end_date,
        categories: budget.categories.map(cat => ({
          name: cat.name,
          allocated_amount: cat.allocated_amount,
        })),
      });
      setStartDate(new Date(budget.start_date));
      setEndDate(new Date(budget.end_date));
    }
  }, [budget, open, reset]);

  const categories = watch('categories');
  const totalAllocated = categories.reduce(
    (sum, cat) => sum + (cat.allocated_amount || 0),
    0
  );
  const totalBudget = watch('total_amount') || 0;
  const remaining = totalBudget - totalAllocated;

  const onSubmit = async (data: BudgetFormData) => {
    // Validate that total allocated doesn't exceed budget
    if (totalAllocated > totalBudget) {
      toast.error('Total allocated amount exceeds budget');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData: CreateBudgetRequest = {
        name: data.name,
        total_amount: data.total_amount,
        currency: data.currency,
        start_date: data.start_date,
        end_date: data.end_date,
        categories: data.categories,
      };

      if (budget) {
        await financialService.updateBudget(budget.id, requestData);
        toast.success('Budget updated successfully');
      } else {
        await financialService.createBudget(requestData);
        toast.success('Budget created successfully');
      }

      reset();
      setStartDate(new Date());
      setEndDate(new Date());
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{budget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
          <DialogDescription>
            Set up a budget to track your spending across different categories
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Budget Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Q1 2024 Farm Operations"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Total Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Budget *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('total_amount', { valueAsNumber: true })}
              />
              {errors.total_amount && (
                <p className="text-sm text-red-600">{errors.total_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
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
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
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
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Budget Categories *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', allocated_amount: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Category name"
                      {...register(`categories.${index}.name`)}
                    />
                    {errors.categories?.[index]?.name && (
                      <p className="text-sm text-red-600">
                        {errors.categories[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-32 space-y-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      {...register(`categories.${index}.allocated_amount`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.categories?.[index]?.allocated_amount && (
                      <p className="text-sm text-red-600">
                        {errors.categories[index]?.allocated_amount?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {errors.categories && (
              <p className="text-sm text-red-600">
                {errors.categories.message || 'Please check category fields'}
              </p>
            )}
          </div>

          {/* Budget Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Budget:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: watch('currency') || 'NGN',
                }).format(totalBudget)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Allocated:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: watch('currency') || 'NGN',
                }).format(totalAllocated)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Remaining:</span>
              <span
                className={cn(
                  'font-semibold',
                  remaining < 0 ? 'text-red-600' : 'text-green-600'
                )}
              >
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: watch('currency') || 'NGN',
                }).format(remaining)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? budget
                  ? 'Updating...'
                  : 'Creating...'
                : budget
                ? 'Update Budget'
                : 'Create Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
