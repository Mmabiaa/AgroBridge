import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const harvestFormSchema = z.object({
  actual_harvest_date: z.string().min(1, 'Harvest date is required'),
  quantity_harvested: z.coerce.number().positive('Quantity must be greater than 0'),
  notes: z.string().max(500).optional(),
});

export type HarvestFormValues = z.infer<typeof harvestFormSchema>;

interface HarvestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: HarvestFormValues) => void;
  isSubmitting?: boolean;
  cropType: string;
  unit?: string;
}

export function HarvestForm({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  cropType,
  unit = 'kg',
}: HarvestFormProps) {
  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestFormSchema),
    defaultValues: {
      actual_harvest_date: new Date().toISOString().split('T')[0],
      quantity_harvested: 0,
      notes: '',
    },
  });

  const handleSubmit = (values: HarvestFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Harvest</DialogTitle>
          <DialogDescription>
            Record the harvest details for {cropType}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actual_harvest_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harvest Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity_harvested"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Harvested *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Amount in {unit}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Quality, conditions, or other observations..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Harvest
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
