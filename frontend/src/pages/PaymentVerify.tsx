/**
 * PaymentVerify Page
 * Page for verifying payment after redirect from payment gateway
 */
import React from 'react';
import { PaymentVerification } from '@/components/payment/PaymentVerification';

export default function PaymentVerify() {
  return (
    <div className="container mx-auto py-8 px-4">
      <PaymentVerification />
    </div>
  );
}
