
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  PieChart, 
  CreditCard,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download
} from 'lucide-react';

const budgetCategories = [
  { name: 'Seeds & Planting', budgeted: 5000, spent: 4200, percentage: 84 },
  { name: 'Fertilizers', budgeted: 3000, spent: 2800, percentage: 93 },
  { name: 'Equipment Maintenance', budgeted: 2500, spent: 1950, percentage: 78 },
  { name: 'Labor Costs', budgeted: 8000, spent: 7500, percentage: 94 },
  { name: 'Irrigation & Utilities', budgeted: 1800, spent: 1650, percentage: 92 },
  { name: 'Insurance', budgeted: 1200, spent: 1200, percentage: 100 }
];

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
  const [activeTab, setActiveTab] = useState('budget');

  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const budgetUtilization = (totalSpent / totalBudget) * 100;

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
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center gap-2 md:gap-3">
            <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Agricultural Financial Planning
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Comprehensive financial management tools for sustainable farm operations
          </p>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">₦{totalBudget.toLocaleString()}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Annual Budget</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">₦{totalSpent.toLocaleString()}</div>
              <p className="text-xs md:text-sm text-muted-foreground">Spent to Date</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <Target className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">{budgetUtilization.toFixed(1)}%</div>
              <p className="text-xs md:text-sm text-muted-foreground">Budget Utilized</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4 md:p-6 text-center">
              <PieChart className="h-6 w-6 md:h-8 md:w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold">₦37,440</div>
              <p className="text-xs md:text-sm text-muted-foreground">Projected Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          {['budget', 'investments', 'loans', 'projections'].map((tab) => (
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

        {/* Budget Tracking */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Budget Categories</CardTitle>
                    <CardDescription>Track spending across different farm operations</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetCategories.map((category, idx) => (
                  <div key={idx} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{category.name}</h3>
                      <div className={`px-2 py-1 rounded text-xs ${
                        category.percentage > 95 ? 'bg-red-100 text-red-800' :
                        category.percentage > 85 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {category.percentage}% Used
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>₦{category.spent.toLocaleString()} / ₦{category.budgeted.toLocaleString()}</span>
                        <span>₦{(category.budgeted - category.spent).toLocaleString()} remaining</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

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
    </div>
  );
}
