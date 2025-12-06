/**
 * PaymentMethods Component
 * Manages user's payment methods
 */
import { useState } from 'react';
import {
    CreditCard,
    Smartphone,
    Building2,
    Plus,
    MoreVertical,
    Trash2,
    Star,
    CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    usePaymentMethods,
    useDeletePaymentMethod,
    useSetDefaultPaymentMethod,
} from '@/api/hooks/usePayment';
import { AddPaymentMethodForm } from './AddPaymentMethodForm';
import { toast } from 'sonner';
import { PaymentMethod } from '@/api/services/payment.service';

const getPaymentIcon = (type: string) => {
    switch (type) {
        case 'card':
            return <CreditCard className="h-5 w-5" />;
        case 'mobile_money':
            return <Smartphone className="h-5 w-5" />;
        case 'bank_account':
            return <Building2 className="h-5 w-5" />;
        default:
            return <CreditCard className="h-5 w-5" />;
    }
};

const getCardBrand = (provider: string) => {
    const brands: Record<string, string> = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        verve: 'Verve',
        amex: 'American Express',
    };
    return brands[provider.toLowerCase()] || provider;
};

export function PaymentMethods() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);

    const { data: paymentMethods, isLoading } = usePaymentMethods();
    const deleteMethod = useDeletePaymentMethod();
    const setDefaultMethod = useSetDefaultPaymentMethod();

    const handleSetDefault = async (methodId: string) => {
        try {
            await setDefaultMethod.mutateAsync(methodId);
            toast.success('Default payment method updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to set default payment method');
        }
    };

    const handleDelete = async () => {
        if (!deleteMethodId) return;

        try {
            await deleteMethod.mutateAsync(deleteMethodId);
            toast.success('Payment method deleted');
            setDeleteMethodId(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete payment method');
        }
    };

    const renderPaymentMethodCard = (method: PaymentMethod) => (
        <Card key={method.id} className="relative">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                            {getPaymentIcon(method.type)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                    {method.type === 'card'
                                        ? getCardBrand(method.provider)
                                        : method.provider}
                                </h3>
                                {method.is_default && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        <Star className="mr-1 h-3 w-3 fill-current" />
                                        Default
                                    </Badge>
                                )}
                                {method.is_verified && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {method.type === 'card' && `•••• •••• •••• ${method.last_four}`}
                                {method.type === 'mobile_money' && `•••• ${method.last_four}`}
                                {method.type === 'bank_account' && `Account •••• ${method.last_four}`}
                            </p>
                            {method.expiry_month && method.expiry_year && (
                                <p className="text-xs text-muted-foreground">
                                    Expires {String(method.expiry_month).padStart(2, '0')}/{method.expiry_year}
                                </p>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {!method.is_default && (
                                <DropdownMenuItem onClick={() => handleSetDefault(method.id)}>
                                    <Star className="mr-2 h-4 w-4" />
                                    Set as Default
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => setDeleteMethodId(method.id)}
                                className="text-red-600"
                                disabled={method.is_default}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
                    <p className="text-muted-foreground">
                        Manage your saved payment methods
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Payment Method
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Payment Method</DialogTitle>
                            <DialogDescription>
                                Add a new payment method to your account
                            </DialogDescription>
                        </DialogHeader>
                        <AddPaymentMethodForm
                            onSuccess={() => {
                                setIsAddDialogOpen(false);
                                toast.success('Payment method added successfully');
                            }}
                            onCancel={() => setIsAddDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Payment Methods List */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-muted rounded" />
                                        <div className="h-3 w-24 bg-muted rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : paymentMethods && paymentMethods.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {paymentMethods.map(renderPaymentMethodCard)}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No payment methods</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Add a payment method to make transactions easier
                        </p>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Payment Method
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteMethodId} onOpenChange={() => setDeleteMethodId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this payment method? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
