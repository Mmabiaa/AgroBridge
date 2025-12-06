import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useProfitLossReport,
  useCashFlowReport,
  useExpenseBreakdown,
} from '@/api/hooks/useFinancial';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReportsSection() {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const reportParams = {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  };

  const { data: profitLossData, isLoading: profitLossLoading } =
    useProfitLossReport(reportParams);
  const { data: cashFlowData, isLoading: cashFlowLoading } =
    useCashFlowReport(reportParams);
  const { data: expenseData, isLoading: expenseLoading } =
    useExpenseBreakdown(reportParams);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for charts
  const profitLossTrendData = profitLossData?.trends || [];
  const cashFlowMonthlyData = cashFlowData?.cash_flow_by_month || [];
  
  const expenseBreakdownData = expenseData?.by_category
    ? Object.entries(expenseData.by_category).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  const incomeBreakdownData = profitLossData?.income_by_category
    ? Object.entries(profitLossData.income_by_category).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            Analyze your financial performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit & Loss Summary */}
      {profitLossLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : profitLossData ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>
              {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Income</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(profitLossData.total_income)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <TrendingDown className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Expenses</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(profitLossData.total_expenses)}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm font-medium">Net Profit</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(profitLossData.net_profit)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {profitLossData.profit_margin.toFixed(1)}% margin
                </p>
              </div>
            </div>

            {/* Trend Chart */}
            {profitLossTrendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-4">Income vs Expenses Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profitLossTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis tickFormatter={(value) => `₦${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      name="Income"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      name="Expenses"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#3b82f6"
                      name="Profit"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Cash Flow Report */}
      {cashFlowLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : cashFlowData ? (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Cash Flow Report</CardTitle>
            <CardDescription>Monthly cash inflows and outflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Opening Balance</p>
                <p className="text-lg font-bold">
                  {formatCurrency(cashFlowData.opening_balance)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Total Inflow</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(cashFlowData.total_inflow)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Total Outflow</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(cashFlowData.total_outflow)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Closing Balance</p>
                <p className="text-lg font-bold">
                  {formatCurrency(cashFlowData.closing_balance)}
                </p>
              </div>
            </div>

            {/* Monthly Chart */}
            {cashFlowMonthlyData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-4">Monthly Cash Flow</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashFlowMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₦${value / 1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="inflow" fill="#10b981" name="Inflow" />
                    <Bar dataKey="outflow" fill="#ef4444" name="Outflow" />
                    <Bar dataKey="net" fill="#3b82f6" name="Net" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Expense Breakdown */}
      {expenseLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : expenseData && expenseBreakdownData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expenseBreakdownData.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {incomeBreakdownData.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
                <CardDescription>Income by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {incomeBreakdownData.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
