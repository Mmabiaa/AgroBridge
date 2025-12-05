# Payment Service

The Payment Service handles all payment processing, escrow management, and financial transactions for the AgroBridge platform.

## Features

### 15.1 Payment Processing ✅
- Initialize payment transactions
- Support multiple payment gateways (Paystack, Stripe, PayPal, Flutterwave)
- Handle payment callbacks and webhooks
- Validate payment status
- Store transaction records with full audit trail

### 15.2 Payment Gateway Integration ✅
- **Paystack**: Primary gateway for African payments
- **Mobile Money**: Support for MTN, Vodafone, AirtelTigo
- **Bank Transfer**: Direct bank account transfers
- **USSD**: USSD-based payments
- **QR Code**: QR code payment support

### 15.3 Transaction Management ✅
- Create and track payment transactions
- Support multiple transaction types (payment, refund, payout, escrow)
- Real-time transaction status updates
- Transaction history and filtering
- Automatic fee calculation

### 15.4 Escrow Management ✅
- Hold funds securely in escrow
- Release funds on buyer confirmation
- Automatic release after configurable period
- Refund to buyer if needed
- Escrow status tracking

### 15.5 Multi-Currency Support ✅
- Support multiple currencies (GHS, USD, EUR, etc.)
- Real-time exchange rate integration
- Automatic currency conversion
- Exchange rate history tracking

### 15.6 Payment Receipts ✅
- Automatic receipt generation
- PDF receipt downloads
- Invoice creation
- Tax calculation support
- Receipt numbering system

### 15.7 Dispute Resolution ✅
- Submit payment disputes
- Upload evidence
- Track dispute status
- Admin resolution workflow
- Automatic refund processing

### 15.8 Security Features ✅
- PCI DSS compliance ready
- Encrypted payment data
- Secure webhook validation
- Transaction audit logging
- Fraud detection hooks

## Models

### Transaction
Stores all payment transactions with complete details:
- Reference number (unique)
- User and recipient
- Transaction type (payment, refund, payout, escrow)
- Amount, currency, fees
- Payment method and gateway
- Status tracking
- Gateway response data
- Related order/escrow IDs

### Escrow
Manages escrow transactions:
- Buyer and seller
- Amount and currency
- Hold and release transactions
- Auto-release configuration
- Status tracking (pending, held, released, refunded)

### PaymentReceipt
Generates and stores payment receipts:
- Receipt number
- Transaction details
- Line items
- Tax calculations
- PDF file path

### Dispute
Handles payment disputes:
- Transaction reference
- Parties involved
- Reason and description
- Evidence files
- Resolution status
- Refund details

### ExchangeRate
Stores currency exchange rates:
- Currency pairs
- Exchange rate
- Effective date
- Source (API/manual)

## API Endpoints

### Transactions
```
POST   /api/payment/transactions/          - Initialize payment
GET    /api/payment/transactions/          - List transactions
GET    /api/payment/transactions/{id}/     - Get transaction details
POST   /api/payment/transactions/{id}/verify/  - Verify transaction
POST   /api/payment/transactions/{id}/refund/  - Refund transaction
POST   /api/payment/transactions/webhook/      - Payment webhook
```

### Escrow
```
POST   /api/payment/escrow/                - Create escrow
GET    /api/payment/escrow/                - List escrow transactions
GET    /api/payment/escrow/{id}/           - Get escrow details
POST   /api/payment/escrow/{id}/release/   - Release escrow
POST   /api/payment/escrow/{id}/refund/    - Refund escrow
```

### Receipts
```
GET    /api/payment/receipts/              - List receipts
GET    /api/payment/receipts/{id}/         - Get receipt details
GET    /api/payment/receipts/{id}/download/ - Download PDF
```

### Disputes
```
POST   /api/payment/disputes/              - Create dispute
GET    /api/payment/disputes/              - List disputes
GET    /api/payment/disputes/{id}/         - Get dispute details
POST   /api/payment/disputes/{id}/resolve/ - Resolve dispute (admin)
```

### Exchange Rates
```
GET    /api/payment/exchange-rates/        - List exchange rates
POST   /api/payment/exchange-rates/        - Create exchange rate
POST   /api/payment/exchange-rates/convert/ - Convert currency
GET    /api/payment/exchange-rates/latest/  - Get latest rates
```

## Usage Examples

### Initialize Payment
```python
from payment.services import PaymentService

service = PaymentService()

transaction = service.initialize_payment(
    user=request.user,
    amount=Decimal('100.00'),
    currency='GHS',
    order_id='ORD-123',
    description='Product purchase',
    callback_url='https://example.com/callback'
)

# Get payment URL
payment_url = transaction.gateway_response['data']['authorization_url']
```

### Create Escrow
```python
escrow = service.create_escrow(
    buyer=buyer_user,
    seller_id=seller_user.id,
    amount=Decimal('500.00'),
    order_id='ORD-456',
    auto_release_days=7
)
```

### Release Escrow
```python
released_escrow = service.release_escrow(escrow)
```

### Create Dispute
```python
dispute = service.create_dispute(
    user=request.user,
    transaction_id=transaction.id,
    reason='Product not received',
    description='Order was not delivered after 2 weeks',
    evidence=['https://example.com/evidence1.jpg']
)
```

### Convert Currency
```python
converted_amount = service.convert_currency(
    amount=Decimal('100.00'),
    from_currency='USD',
    to_currency='GHS'
)
```

## Configuration

### Environment Variables
```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx

# Payment Settings
USE_MOCK_PAYMENT=True  # Use mock gateway for testing
PAYMENT_SERVICE_PORT=8015

# Currency Settings
DEFAULT_CURRENCY=GHS
SUPPORTED_CURRENCIES=GHS,USD,EUR,NGN

# Escrow Settings
DEFAULT_ESCROW_DAYS=7
MAX_ESCROW_DAYS=30
```

### Django Settings
```python
INSTALLED_APPS = [
    ...
    'payment',
]

# Payment configuration
PAYMENT_GATEWAYS = {
    'paystack': {
        'enabled': True,
        'secret_key': os.getenv('PAYSTACK_SECRET_KEY'),
        'public_key': os.getenv('PAYSTACK_PUBLIC_KEY'),
    }
}
```

## Testing

Run tests:
```bash
python manage.py test payment
```

Run specific test:
```bash
python manage.py test payment.tests.TransactionAPITest
```

## Payment Gateway Integration

### Paystack Setup
1. Sign up at https://paystack.com
2. Get API keys from dashboard
3. Configure webhook URL: `https://your-domain.com/api/payment/transactions/webhook/`
4. Set environment variables

### Webhook Events
The service handles these webhook events:
- `charge.success` - Payment successful
- `charge.failed` - Payment failed
- `transfer.success` - Transfer successful
- `transfer.failed` - Transfer failed

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Webhook Validation**: Verify webhook signatures
3. **PCI Compliance**: Never store card details
4. **Encryption**: Encrypt sensitive data at rest
5. **Audit Logging**: Log all payment operations
6. **Rate Limiting**: Implement rate limits on payment endpoints

## Monitoring

Key metrics to monitor:
- Transaction success rate
- Average transaction time
- Failed payment reasons
- Escrow release time
- Dispute resolution time
- Gateway response times

## Troubleshooting

### Payment Initialization Fails
- Check API keys are correct
- Verify network connectivity
- Check gateway status page
- Review error logs

### Webhook Not Received
- Verify webhook URL is accessible
- Check firewall settings
- Review webhook logs in gateway dashboard
- Test webhook manually

### Currency Conversion Fails
- Ensure exchange rates are up to date
- Check currency pair exists
- Verify external API connectivity

## Future Enhancements

- [ ] Support for more payment gateways (Stripe, PayPal)
- [ ] Recurring payments/subscriptions
- [ ] Payment plans and installments
- [ ] Cryptocurrency support
- [ ] Advanced fraud detection
- [ ] Payment analytics dashboard
- [ ] Automated reconciliation
- [ ] Multi-merchant support

## Support

For issues or questions:
- Check logs: `backend/logs/payment.log`
- Review documentation
- Contact development team

## License

Copyright © 2025 AgroBridge. All rights reserved.
