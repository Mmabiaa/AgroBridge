# Financial Management Service

The Financial Management Service provides comprehensive financial tracking, budgeting, and reporting capabilities for the AgroBridge platform.

## Features

### 10.1 Financial Record Management ✅
- Track income and expenses with detailed categorization
- Support for multiple payment methods (cash, bank transfer, mobile money, etc.)
- Receipt and invoice management
- Link financial records to farms and marketplace orders
- Comprehensive transaction history

### 10.2 Budget Management ✅
- Create and manage budgets by category
- Support for different budget periods (weekly, monthly, quarterly, yearly)
- Real-time budget tracking and spending analysis
- Automatic alerts when spending reaches thresholds
- Budget status monitoring (active, completed, exceeded)

### 10.3 Financial Reporting ✅
- Profit and loss statements
- Cash flow analysis
- Expense breakdowns by category
- Monthly financial trends
- Export reports in CSV, PDF, and Excel formats

### 10.4 Multi-Currency Support ✅
- Support for multiple currencies
- Exchange rate management
- Currency conversion utilities
- Historical exchange rate tracking

### 10.5 Financial Analytics ✅
- Income vs expense analysis
- Category-wise spending patterns
- Monthly and yearly trends
- Budget performance metrics
- Cash flow projections

## Models

### FinancialRecord
Tracks all income and expense transactions:
- Record type (income/expense)
- Category (crop sales, fertilizer, labor, etc.)
- Amount and currency
- Transaction date and payment method
- Receipt/invoice attachments
- Related farm or order references

### Budget
Manages budget planning and tracking:
- Budget name and category
- Budgeted amount and period
- Start and end dates
- Alert thresholds
- Automatic spending calculation
- Status tracking

### ExchangeRate
Stores currency exchange rates:
- Base and target currencies
- Exchange rate
- Date of rate
- Historical rate tracking

## API Endpoints

### Financial Records
- `GET /api/financial/records/` - List all financial records
- `POST /api/financial/records/` - Create new financial record
- `GET /api/financial/records/{id}/` - Get specific record
- `PUT /api/financial/records/{id}/` - Update record
- `DELETE /api/financial/records/{id}/` - Delete record
- `GET /api/financial/records/summary/` - Get financial summary
- `GET /api/financial/records/cash_flow/` - Get cash flow analysis
- `GET /api/financial/records/by_category/` - Get records grouped by category
- `GET /api/financial/records/export/` - Export records (CSV/PDF/Excel)

### Budgets
- `GET /api/financial/budgets/` - List all budgets
- `POST /api/financial/budgets/` - Create new budget
- `GET /api/financial/budgets/{id}/` - Get specific budget
- `PUT /api/financial/budgets/{id}/` - Update budget
- `DELETE /api/financial/budgets/{id}/` - Delete budget
- `GET /api/financial/budgets/active/` - Get active budgets
- `GET /api/financial/budgets/performance/` - Get budget performance
- `GET /api/financial/budgets/alerts/` - Get budget alerts
- `POST /api/financial/budgets/{id}/check_spending/` - Check current spending

### Exchange Rates
- `GET /api/financial/exchange-rates/` - List exchange rates
- `POST /api/financial/exchange-rates/` - Create exchange rate
- `GET /api/financial/exchange-rates/latest/` - Get latest rates
- `POST /api/financial/exchange-rates/convert/` - Convert between currencies

## Usage Examples

### Create Income Record
```python
POST /api/financial/records/
{
    "record_type": "income",
    "category": "crop_sales",
    "amount": "1500.00",
    "currency": "GHS",
    "description": "Sold tomatoes at market",
    "transaction_date": "2024-12-04",
    "payment_method": "mobile_money",
    "reference_number": "MM123456"
}
```

### Create Budget
```python
POST /api/financial/budgets/
{
    "name": "Monthly Fertilizer Budget",
    "category": "fertilizer",
    "budgeted_amount": "2000.00",
    "currency": "GHS",
    "period": "monthly",
    "start_date": "2024-12-01",
    "end_date": "2024-12-31",
    "alert_threshold": 80
}
```

### Get Financial Summary
```python
GET /api/financial/records/summary/?start_date=2024-12-01&end_date=2024-12-31&currency=GHS
```

### Convert Currency
```python
POST /api/financial/exchange-rates/convert/
{
    "amount": "1000.00",
    "from_currency": "GHS",
    "to_currency": "USD"
}
```

## Filtering and Search

### Filter Financial Records
```
GET /api/financial/records/?record_type=expense&category=fertilizer&start_date=2024-12-01
```

### Filter Budgets
```
GET /api/financial/budgets/?status=active&category=seeds
```

## Budget Alerts

The service automatically monitors budgets and generates alerts when:
- Spending reaches the alert threshold (default 80%)
- Budget is exceeded
- Budget period is ending

Alerts are available via:
```
GET /api/financial/budgets/alerts/
```

## Analytics

### Financial Summary
Provides comprehensive overview including:
- Total income and expenses
- Net profit/loss
- Category-wise breakdown
- Monthly trends

### Cash Flow Analysis
Tracks cash movement including:
- Opening and closing balance
- Total inflow and outflow
- Net cash flow
- Daily/weekly/monthly timeline

### Budget Performance
Monitors budget execution:
- Spent vs budgeted amounts
- Remaining budget
- Spending percentage
- Days remaining

## Testing

Run tests with:
```bash
python manage.py test financial
```

Test coverage includes:
- Model creation and validation
- API endpoint functionality
- Financial calculations
- Budget monitoring
- Analytics accuracy

## Integration

### With Marketplace Service
- Automatically link marketplace orders to financial records
- Track sales revenue from marketplace transactions

### With Farm Service
- Link financial records to specific farms
- Track farm-specific income and expenses
- Generate farm profitability reports

### With Notification Service
- Send budget alerts when thresholds are reached
- Notify on budget exceeded
- Alert on unusual spending patterns

## Future Enhancements

- AI-powered spending predictions
- Automated categorization of transactions
- Integration with accounting software (QuickBooks, Xero)
- Tax calculation and reporting
- Invoice generation
- Expense approval workflows
- Multi-user budget collaboration
- Financial goal setting and tracking
