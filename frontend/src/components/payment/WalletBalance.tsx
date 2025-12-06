/**
 * WalletBalance Component
 * Displays wallet balance and transaction management
 */
import { useState } from 'react';
import { format } from 'date-fns';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    Minus,
    RefreshCw,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useWalletBalance, useTransactions } from '@/api/hooks/usePayment';
import { WithdrawForm } from './WithdrawForm';
import { DepositForm } from './DepositForm';

export function WalletBalance() {
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const { data: balance, isLoading: loadingBalance, refetch: refetchBalance } = useWalletBalance();
    const { data: transactionsData, isLoading: loadingTransactions } = useTransactions({
        type: 'withdrawal,deposit',
        page_size: 10,
    });

    const walletTransactions = transactionsData?.results || [];

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            <CardTitle className="text-white">Wallet Balance</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refetchBalance()}
                            className="text-white hover:bg-white/20"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingBalance ? (
                        <div className="animate-pulse">
                            <div className="h-12 w-48 bg-white/20 rounded mb-4" />
                            <div className="h-4 w-32 bg-white/20 rounded" />
                        </div>
                    ) : balance ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-white/80 mb-1">Available Balance</p>
                                <p className="text-4xl font-bold text-white">
                                    {balance.currency} {balance.available_balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-white/70">Total Balance</p>
                                    <p className="text-lg font-semibold text-white">
                                        {balance.currency} {balance.balance.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">Pending</p>
                                    <p className="text-lg font-semibold text-white">
                                        {balance.currency} {balance.pending_balance.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="flex-1">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Top Up
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Top Up Wallet</DialogTitle>
                                            <DialogDescription>
                                                Add funds to your wallet
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DepositForm
                                            onSuccess={() => {
                                                setIsDepositOpen(false);
                                                refetchBalance();
                                            }}
                                            onCancel={() => setIsDepositOpen(false)}
                                        />
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="flex-1">
                                            <Minus className="mr-2 h-4 w-4" />
                                            Withdraw
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Withdraw Funds</DialogTitle>
                                            <DialogDescription>
                                                Withdraw funds from your wallet
                                            </DialogDescription>
                                        </DialogHeader>
                                        <WithdrawForm
                                            availableBalance={balance.available_balance}
                                            onSuccess={() => {
                                                setIsWithdrawOpen(false);
                                                refetchBalance();
                                            }}
                                            onCancel={() => setIsWithdrawOpen(false)}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-white/80">Unable to load balance</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Wallet Activity</CardTitle>
                    <CardDescription>Your latest deposits and withdrawals</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingTransactions ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 animate-pulse">
                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-muted rounded" />
                                        <div className="h-3 w-24 bg-muted rounded" />
                                    </div>
                                    <div className="h-4 w-20 bg-muted rounded" />
                                </div>
                            ))}
                        </div>
                    ) : walletTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {walletTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div
                                        className={`rounded-full p-2 ${transaction.type === 'deposit'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-orange-100 text-orange-600'
                                            }`}
                                    >
                                        {transaction.type === 'deposit' ? (
                                            <ArrowDownLeft className="h-5 w-5" />
                                        ) : (
                                            <ArrowUpRight className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium capitalize">{transaction.type}</p>
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    transaction.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : transaction.status === 'failed'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                }
                                            >
                                                {transaction.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`font-semibold ${transaction.type === 'deposit'
                                                ? 'text-green-600'
                                                : 'text-orange-600'
                                                }`}
                                        >
                                            {transaction.type === 'deposit' ? '+' : '-'}
                                            {transaction.currency} {transaction.amount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">No wallet transactions yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balance?.currency}{' '}
                            {walletTransactions
                                .filter((t) => t.type === 'deposit' && t.status === 'completed')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {walletTransactions.filter((t) => t.type === 'deposit').length} transactions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balance?.currency}{' '}
                            {walletTransactions
                                .filter((t) => t.type === 'withdrawal' && t.status === 'completed')
                                .reduce((sum, t) => sum + t.amount, 0)
                                .toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {walletTransactions.filter((t) => t.type === 'withdrawal').length} transactions
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
