import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Edit, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Budget } from '@/api/services/financial.service';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface BudgetManagerProps {
  budgets: Budget[];
  onCreateBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export function BudgetManager({
  budgets,
  onCreateBudget,
  onEditBudget,
  onDeleteBudget,
}: BudgetManagerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent_amount / budget.total_amount) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      onDeleteBudget(budgetToDelete);
      setBudgetToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  if (budgets.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Budgets Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first budget to start tracking your spending
          </p>
          <Button onClick={onCreateBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Budget Management</h2>
            <p className="text-muted-foreground">
              Track and manage your financial budgets
            </p>
          </div>
          <Button onClick={onCreateBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const percentage = (budget.spent_amount / budget.total_amount) * 100;
            const remaining = budget.total_amount - budget.spent_amount;

            return (
              <Card key={budget.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <CardDescription>
                        {format(new Date(budget.start_date), 'MMM dd, yyyy')} -{' '}
                        {format(new Date(budget.end_date), 'MMM dd, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge className={cn('capitalize', getStatusColor(status))}>
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(budget.total_amount, budget.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(budget.spent_amount, budget.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget Utilization</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={cn(
                        'h-2',
                        percentage >= 100 && '[&>div]:bg-red-500',
                        percentage >= 90 && percentage < 100 && '[&>div]:bg-yellow-500'
                      )}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {remaining >= 0 ? 'Remaining' : 'Over budget'}:{' '}
                        {formatCurrency(Math.abs(remaining), budget.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Budget Alerts */}
                  {percentage >= 90 && (
                    <div
                      className={cn(
                        'flex items-start gap-2 p-3 rounded-lg text-sm',
                        percentage >= 100
                          ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                          : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                      )}
                    >
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        {percentage >= 100
                          ? 'Budget exceeded! Consider reviewing your expenses.'
                          : 'Warning: You have used 90% or more of your budget.'}
                      </p>
                    </div>
                  )}

                  {/* Category Breakdown */}
                  {budget.categories && budget.categories.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Category Breakdown</p>
                      <div className="space-y-2">
                        {budget.categories.map((category, idx) => {
                          const catPercentage =
                            (category.spent_amount / category.allocated_amount) * 100;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{category.name}</span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(category.spent_amount, budget.currency)} /{' '}
                                  {formatCurrency(category.allocated_amount, budget.currency)}
                                </span>
                              </div>
                              <Progress
                                value={Math.min(catPercentage, 100)}
                                className="h-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEditBudget(budget)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteClick(budget.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
