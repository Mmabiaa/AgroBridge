/**
 * DepositForm Component
 * Form for depositing funds to wallet
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePaymentMethods, useDeposit } from '@/api/hooks/usePayment';
import { toast } from 'sonner';

const depositSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method_id: z.string().min(1, 'Please select a payment method'),
  description: z.string().optional(),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface DepositFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DepositForm({ onSuccess, onCancel }: DepositFormProps) {
  const { data: paymentMethods, isLoading: loadingMethods } = usePaymentMethods();
  const deposit = useDeposit();

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = async (values: DepositFormValues) => {
    try {
      await deposit.mutateAsync(values);
      toast.success('Deposit successful');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process deposit');
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000, 50000];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deposit Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter the amount you want to add to your wallet
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quick Amount Buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Amounts</p>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.setValue('amount', amount)}
              >
                {amount / 1000}k
              </Button>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="payment_method_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={loadingMethods}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.provider} •••• {method.last_four}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Funds will be charged from this payment method
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Reason for deposit..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={deposit.isPending} className="flex-1">
            {deposit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Funds
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={deposit.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
