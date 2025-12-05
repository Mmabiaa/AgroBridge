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

const cropFormSchema = z.object({
  crop_type: z.string().min(2, 'Crop type is required'),
  variety: z.string().optional(),
  planting_date: z.string().min(1, 'Planting date is required'),
  expected_harvest_date: z.string().optional(),
  quantity_planted: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CropFormValues = z.infer<typeof cropFormSchema>;

interface CropFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CropFormValues>;
  onSubmit: (values: CropFormValues) => void;
  isSubmitting?: boolean;
  title?: string;
  description?: string;
}

export function CropForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  title = 'Plant Crop',
  description = 'Add a new crop to this field',
}: CropFormProps) {
  const form = useForm<CropFormValues>({
    resolver: zodResolver(cropFormSchema),
    defaultValues: defaultValues || {
      crop_type: '',
      variety: '',
      planting_date: new Date().toISOString().split('T')[0],
      expected_harvest_date: '',
      quantity_planted: undefined,
      unit: 'kg',
      notes: '',
    },
  });

  const handleSubmit = (values: CropFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="crop_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crop Type *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Maize, Tomatoes, Wheat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="variety"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variety</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hybrid 614" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="planting_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planting Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_harvest_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Harvest</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity_planted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Planted</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., kg, bags, seeds" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about this crop..."
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
                {defaultValues ? 'Update Crop' : 'Plant Crop'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
