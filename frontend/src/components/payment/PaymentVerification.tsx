/**
 * PaymentVerification Component
 * Handles payment verification and displays success/failure messages
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useVerifyPayment } from '@/api/hooks/usePayment';
import { toast } from 'sonner';

interface PaymentVerificationProps {
  reference?: string;
  onSuccess?: (transaction: any) => void;
  onFailure?: (error: any) => void;
  redirectPath?: string;
}

export function PaymentVerification({
  reference: propReference,
  onSuccess,
  onFailure,
  redirectPath = '/dashboard',
}: PaymentVerificationProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyPayment = useVerifyPayment();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [transactionData, setTransactionData] = useState<any>(null);

  const reference = propReference || searchParams.get('reference');

  useEffect(() => {
    if (!reference) {
      toast.error('No payment reference provided');
      setVerificationStatus('failed');
      return;
    }

    // Verify payment
    const verify = async () => {
      try {
        const response = await verifyPayment.mutateAsync({ reference });
        
        if (response.status === 'success') {
          setVerificationStatus('success');
          setTransactionData(response.transaction);
          toast.success('Payment verified successfully');
          onSuccess?.(response.transaction);
        } else {
          setVerificationStatus('failed');
          toast.error(response.message || 'Payment verification failed');
          onFailure?.(response);
        }
      } catch (error: any) {
        setVerificationStatus('failed');
        toast.error(error.message || 'Failed to verify payment');
        onFailure?.(error);
      }
    };

    verify();
  }, [reference]);

  const handleContinue = () => {
    if (verificationStatus === 'success' && transactionData) {
      // Redirect based on transaction metadata or default path
      const orderPath = transactionData.metadata?.order_id 
        ? `/orders/${transactionData.metadata.order_id}`
        : redirectPath;
      navigate(orderPath);
    } else {
      navigate(redirectPath);
    }
  };

  const handleRetry = () => {
    navigate(-1); // Go back to payment page
  };

  if (verificationStatus === 'verifying') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verifying Payment</CardTitle>
          <CardDescription>Please wait while we verify your payment...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center">Payment Successful!</CardTitle>
          <CardDescription className="text-center">
            Your payment has been processed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactionData && (
            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono font-medium">{transactionData.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono font-medium">{transactionData.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {transactionData.currency} {transactionData.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {transactionData.status}
                </span>
              </div>
              {transactionData.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="text-right">{transactionData.description}</span>
                </div>
              )}
            </div>
          )}
          
          <Alert>
            <AlertTitle>What's Next?</AlertTitle>
            <AlertDescription>
              A confirmation email has been sent to your registered email address.
              You can view your transaction history in your account.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleContinue} className="flex-1">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/payment/transactions')}
          >
            View Transactions
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Failed state
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-red-100 p-3">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <CardTitle className="text-center">Payment Failed</CardTitle>
        <CardDescription className="text-center">
          We couldn't verify your payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Payment Verification Failed</AlertTitle>
          <AlertDescription>
            {verifyPayment.error?.message || 
              'There was an issue verifying your payment. Please contact support if the amount was deducted from your account.'}
          </AlertDescription>
        </Alert>

        {reference && (
          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-mono font-medium">{reference}</span>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">If you believe this is an error:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your email for payment confirmation</li>
            <li>Contact our support team with the reference number</li>
            <li>Try making the payment again</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleRetry} variant="outline" className="flex-1">
          Try Again
        </Button>
        <Button onClick={() => navigate('/support')} variant="outline">
          Contact Support
        </Button>
      </CardFooter>
    </Card>
  );
}
