import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2 } from 'lucide-react';

const fieldFormSchema = z.object({
  name: z.string().min(3, 'Field name must be at least 3 characters').max(100),
  size_hectares: z.coerce.number().positive('Size must be greater than 0'),
  soil_type: z.string().optional(),
  irrigation_type: z.string().optional(),
});

export type FieldFormValues = z.infer<typeof fieldFormSchema>;

interface FieldFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<FieldFormValues>;
  onSubmit: (values: FieldFormValues) => void;
  isSubmitting?: boolean;
  title?: string;
  description?: string;
}

export function FieldForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  title = 'Add Field',
  description = 'Create a new field for this farm',
}: FieldFormProps) {
  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: defaultValues || {
      name: '',
      size_hectares: 0,
      soil_type: '',
      irrigation_type: '',
    },
  });

  const handleSubmit = (values: FieldFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., North Field" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size_hectares"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size (hectares) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="soil_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soil Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="clay">Clay</SelectItem>
                      <SelectItem value="sandy">Sandy</SelectItem>
                      <SelectItem value="loam">Loam</SelectItem>
                      <SelectItem value="silt">Silt</SelectItem>
                      <SelectItem value="peat">Peat</SelectItem>
                      <SelectItem value="chalk">Chalk</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="irrigation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Irrigation Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select irrigation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="drip">Drip Irrigation</SelectItem>
                      <SelectItem value="sprinkler">Sprinkler</SelectItem>
                      <SelectItem value="surface">Surface Irrigation</SelectItem>
                      <SelectItem value="subsurface">Subsurface Drip</SelectItem>
                      <SelectItem value="manual">Manual Watering</SelectItem>
                      <SelectItem value="rainfed">Rainfed</SelectItem>
                    </SelectContent>
                  </Select>
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
                {defaultValues ? 'Update Field' : 'Create Field'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
