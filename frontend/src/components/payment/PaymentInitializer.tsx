/**
 * PaymentInitializer Component
 * Wrapper component that handles payment initialization with API integration
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentForm } from './PaymentForm';
import { useInitializePayment } from '@/api/hooks/usePayment';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PaymentInitializerProps {
  amount?: number;
  orderId?: string;
  onSuccess?: (paymentData: any) => void;
  onCancel?: () => void;
  redirectOnSuccess?: boolean;
}

export function PaymentInitializer({
  amount,
  orderId,
  onSuccess,
  onCancel,
  redirectOnSuccess = true,
}: PaymentInitializerProps) {
  const navigate = useNavigate();
  const initializePayment = useInitializePayment();

  const handlePaymentSubmit = async (formData: any) => {
    try {
      const paymentData = {
        amount: formData.amount,
        currency: formData.currency || 'NGN',
        payment_method_id: formData.payment_method_id,
        description: formData.description,
        metadata: {
          order_id: orderId,
        },
      };

      const response = await initializePayment.mutateAsync(paymentData);

      // If there's an authorization URL (for external payment gateways)
      if (response.authorization_url) {
        // Redirect to payment gateway
        window.location.href = response.authorization_url;
        return;
      }

      // Otherwise, redirect to verification page
      if (redirectOnSuccess) {
        navigate(`/payment/verify?reference=${response.reference}`);
      }

      // Call success callback
      onSuccess?.(response);
      
      toast.success('Payment initialized successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
      throw error;
    }
  };

  if (initializePayment.isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    );
  }

  return (
    <PaymentForm
      defaultAmount={amount}
      orderId={orderId}
      onSuccess={handlePaymentSubmit}
      onCancel={onCancel}
    />
  );
}
