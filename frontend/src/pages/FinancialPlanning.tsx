import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Calendar,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';
import { useRecords, useBudgets } from '@/api/hooks/useFinancial';
import financialService from '@/api/services/financial.service';
import { FinancialRecordsTable } from '@/components/financial/FinancialRecordsTable';
import { FinancialSummary } from '@/components/financial/FinancialSummary';
import { FinancialFilters, FilterValues } from '@/components/financial/FinancialFilters';
import { FinancialRecordForm } from '@/components/financial/FinancialRecordForm';
import { BudgetManager } from '@/components/financial/BudgetManager';
import { BudgetForm } from '@/components/financial/BudgetForm';
import { ReportsSection } from '@/components/financial/ReportsSection';
import { ExportDataDialog } from '@/components/financial/ExportDataDialog';
import { Budget } from '@/api/services/financial.service';
import { toast } from 'sonner';

const investments = [
  {
    title: 'New Irrigation System',
    cost: 15000,
    saved: 8500,
    targetDate: '2024-12-31',
    roi: 'High',
    payback: '2.5 years'
  },
  {
    title: 'Solar Panel Installation',
    cost: 25000,
    saved: 12000,
    targetDate: '2025-06-30',
    roi: 'Medium',
    payback: '4 years'
  },
  {
    title: 'Greenhouse Expansion',
    cost: 35000,
    saved: 5000,
    targetDate: '2025-12-31',
    roi: 'High',
    payback: '3 years'
  }
];

const loanOptions = [
  {
    type: 'Agricultural Development Loan',
    amount: 50000,
    rate: 4.5,
    term: 60,
    monthlyPayment: 931,
    purpose: 'Equipment & Infrastructure'
  },
  {
    type: 'Crop Production Loan',
    amount: 20000,
    rate: 6.2,
    term: 24,
    monthlyPayment: 883,
    purpose: 'Seasonal Operations'
  },
  {
    type: 'Livestock Expansion Loan',
    amount: 75000,
    rate: 5.8,
    term: 84,
    monthlyPayment: 1124,
    purpose: 'Livestock & Feed'
  }
];

const revenueProjections = [
  { crop: 'Tomatoes', area: '5 ha', expectedYield: '40 tons', pricePerUnit: 450, revenue: 18000 },
  { crop: 'Maize', area: '8 ha', expectedYield: '32 tons', pricePerUnit: 280, revenue: 8960 },
  { crop: 'Beans', area: '3 ha', expectedYield: '6 tons', pricePerUnit: 680, revenue: 4080 },
  { crop: 'Onions', area: '2 ha', expectedYield: '20 tons', pricePerUnit: 320, revenue: 6400 }
];

export default function FinancialPlanning() {
  const [activeTab, setActiveTab] = useState('records');
  const [filters, setFilters] = useState<FilterValues>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    profit_margin: 0,
  });

  // Fetch records with filters
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useRecords(filters);
  const { data: budgetsData, isLoading: budgetsLoading, refetch: refetchBudgets } = useBudgets();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await financialService.getCategories();
        setCategories([...data.income_categories, ...data.expense_categories]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch summary when filters change
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await financialService.getSummary({
          start_date: filters.startDate,
          end_date: filters.endDate,
        });
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      }
    };
    fetchSummary();
  }, [filters.startDate, filters.endDate]);

  const records = recordsData?.results || [];
  const budgets = budgetsData || [];

  const getROIColor = (roi: string) => {
    switch (roi) {
      case 'High': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-0 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-full space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 md:gap-3">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Agricultural Financial Planning
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Comprehensive financial management tools for sustainable farm operations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="hidden md:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>



        {/* Financial Summary */}
        <FinancialSummary
          totalIncome={summary.total_income}
          totalExpenses={summary.total_expenses}
          netProfit={summary.net_profit}
          profitMargin={summary.profit_margin}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          {['records', 'budget', 'reports', 'investments', 'loans', 'projections'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Financial Records */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Financial Records</CardTitle>
                    <CardDescription>Track all income and expense transactions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchRecords()}
                      disabled={recordsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${recordsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowRecordForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <FinancialFilters
                  onFilterChange={setFilters}
                  categories={categories}
                />

                {/* Records Table */}
                {recordsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <FinancialRecordsTable
                    records={records}
                    onEdit={() => {
                      toast.info('Edit functionality coming soon');
                    }}
                    onDelete={async (recordId) => {
                      try {
                        await financialService.deleteRecord(recordId);
                        toast.success('Record deleted successfully');
                        refetchRecords();
                      } catch (error) {
                        toast.error('Failed to delete record');
                      }
                    }}
                    onView={() => {
                      toast.info('View details functionality coming soon');
                    }}
                  />
                )}

                {/* Pagination */}
                {recordsData && recordsData.count > 10 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {records.length} of {recordsData.count} records
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!recordsData.previous}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!recordsData.next}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Tracking */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {budgetsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : (
              <BudgetManager
                budgets={budgets}
                onCreateBudget={() => {
                  setEditingBudget(undefined);
                  setShowBudgetForm(true);
                }}
                onEditBudget={(budget) => {
                  setEditingBudget(budget);
                  setShowBudgetForm(true);
                }}
                onDeleteBudget={async (budgetId) => {
                  try {
                    await financialService.deleteBudget(budgetId);
                    toast.success('Budget deleted successfully');
                    refetchBudgets();
                  } catch (error) {
                    toast.error('Failed to delete budget');
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Financial Reports */}
        {activeTab === 'reports' && <ReportsSection />}

        {/* Investment Planning */}
        {activeTab === 'investments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {investments.map((investment, idx) => (
              <Card key={idx} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{investment.title}</CardTitle>
                      <CardDescription>Target: {investment.targetDate}</CardDescription>
                    </div>
                    <Badge className={getROIColor(investment.roi)}>{investment.roi} ROI</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Cost</p>
                      <p className="font-bold text-lg">₦{investment.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saved So Far</p>
                      <p className="font-bold text-lg text-green-600">₦{investment.saved.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Savings Progress</span>
                      <span>{Math.round((investment.saved / investment.cost) * 100)}%</span>
                    </div>
                    <Progress value={(investment.saved / investment.cost) * 100} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs bg-muted/50 p-3 rounded">
                    <div>
                      <p className="text-muted-foreground">Expected Payback</p>
                      <p className="font-medium">{investment.payback}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Savings Needed</p>
                      <p className="font-medium">₦{Math.round((investment.cost - investment.saved) / 12).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <Button className="w-full">Update Savings</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loan Calculator */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Agricultural Loan Options
                </CardTitle>
                <CardDescription>Compare loan products tailored for farming operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loanOptions.map((loan, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{loan.type}</h3>
                      <Badge variant="outline">{loan.purpose}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Loan Amount</p>
                        <p className="font-bold">₦{loan.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Rate</p>
                        <p className="font-bold">{loan.rate}% APR</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Term</p>
                        <p className="font-bold">{loan.term} months</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p className="font-bold text-primary">₦{loan.monthlyPayment.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1">Apply Now</Button>
                      <Button variant="outline">Calculate</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Projections */}
        {activeTab === 'projections' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Projections
                </CardTitle>
                <CardDescription>Expected income from current growing season</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueProjections.map((projection, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{projection.crop}</h4>
                        <p className="text-sm text-muted-foreground">
                          {projection.area} • {projection.expectedYield} expected
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₦{projection.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">@₦{projection.pricePerUnit}/kg</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Projected Revenue</span>
                      <span className="text-2xl font-bold text-primary">
                        ₦{revenueProjections.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Projected Revenue</span>
                    <span className="font-bold">₦37,440</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Expenses</span>
                    <span className="font-bold">₦21,350</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Net Profit</span>
                    <span className="font-bold text-green-600">₦16,090</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin</span>
                    <span className="font-bold text-primary">43%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Financial Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calculator className="h-4 w-4 mr-2" />
                    Loan Calculator
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Review
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Financial Record Form Dialog */}
      <FinancialRecordForm
        open={showRecordForm}
        onOpenChange={setShowRecordForm}
        onSuccess={() => {
          refetchRecords();
          // Refetch summary
          const fetchSummary = async () => {
            try {
              const data = await financialService.getSummary({
                start_date: filters.startDate,
                end_date: filters.endDate,
              });
              setSummary(data);
            } catch (error) {
              console.error('Failed to fetch summary:', error);
            }
          };
          fetchSummary();
        }}
      />

      {/* Budget Form Dialog */}
      <BudgetForm
        open={showBudgetForm}
        onOpenChange={(open) => {
          setShowBudgetForm(open);
          if (!open) setEditingBudget(undefined);
        }}
        budget={editingBudget}
        onSuccess={() => {
          refetchBudgets();
        }}
      />

      {/* Export Data Dialog */}
      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        categories={categories}
      />
    </div>
  );
}
