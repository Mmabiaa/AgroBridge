/**
 * PaymentTransactions Page
 * Page for viewing transaction history
 */
import React from 'react';
import { TransactionsHistory } from '@/components/payment/TransactionsHistory';

export default function PaymentTransactions() {
  return (
    <div className="container mx-auto py-8 px-4">
      <TransactionsHistory />
    </div>
  );
}
