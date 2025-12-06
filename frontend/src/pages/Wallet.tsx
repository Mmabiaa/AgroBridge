/**
 * Wallet Page
 * Main page for wallet management
 */
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletBalance } from '@/components/payment/WalletBalance';
import { TransactionsHistory } from '@/components/payment/TransactionsHistory';
import { PaymentMethods } from '@/components/payment/PaymentMethods';

export default function Wallet() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your wallet, payment methods, and transactions
        </p>
      </div>

      <Tabs defaultValue="balance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="space-y-4">
          <WalletBalance />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsHistory />
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <PaymentMethods />
        </TabsContent>
      </Tabs>
    </div>
  );
}
