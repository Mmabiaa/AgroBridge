/**
 * WithdrawForm Component
 * Form for withdrawing funds from wallet
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
import { usePaymentMethods, useWithdraw } from '@/api/hooks/usePayment';
import { toast } from 'sonner';

const withdrawSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method_id: z.string().min(1, 'Please select a payment method'),
  description: z.string().optional(),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

interface WithdrawFormProps {
  availableBalance: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WithdrawForm({ availableBalance, onSuccess, onCancel }: WithdrawFormProps) {
  const { data: paymentMethods, isLoading: loadingMethods } = usePaymentMethods();
  const withdraw = useWithdraw();

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = async (values: WithdrawFormValues) => {
    if (values.amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      await withdraw.mutateAsync(values);
      toast.success('Withdrawal request submitted successfully');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process withdrawal');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold">NGN {availableBalance.toLocaleString()}</p>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Amount</FormLabel>
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
                Maximum: NGN {availableBalance.toLocaleString()}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_method_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Method</FormLabel>
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
                Funds will be sent to this payment method
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
                  placeholder="Reason for withdrawal..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={withdraw.isPending} className="flex-1">
            {withdraw.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Withdraw Funds
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={withdraw.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
