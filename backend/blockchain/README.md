# Blockchain Service

The Blockchain Service provides blockchain-based certificate generation, verification, and supply chain tracking functionality for the AgroBridge platform.

## Features

### Certificate Management
- **Certificate Generation**: Create blockchain-backed certificates for organic, quality, fair trade, and other certifications
- **QR Code Generation**: Automatic QR code generation for easy verification
- **Certificate Verification**: Verify certificate authenticity via blockchain
- **Certificate Revocation**: Revoke certificates when needed
- **Expiry Management**: Automatic tracking and updating of expired certificates

### Supply Chain Tracking
- **Event Recording**: Record supply chain events (harvest, processing, packaging, transport, etc.)
- **Blockchain Chaining**: Events are cryptographically linked for tamper-proof tracking
- **Product Journey**: Track complete journey of products from farm to consumer
- **Verification**: Verify integrity of supply chain data

### Certification Bodies
- **Body Management**: Manage external certification bodies
- **API Integration**: Support for external certification body APIs
- **Accreditation Tracking**: Track accreditation status and expiry

## Models

### Certificate
Stores blockchain-backed certificates with the following key fields:
- `certificate_number`: Unique certificate identifier
- `certificate_type`: Type of certification (organic, quality, etc.)
- `blockchain_hash`: Unique hash stored on blockchain
- `transaction_hash`: Blockchain transaction hash
- `qr_code`: QR code for verification
- `status`: Certificate status (pending, issued, verified, revoked, expired)

### SupplyChainEvent
Records supply chain events with blockchain verification:
- `product_id`: Product identifier
- `batch_number`: Batch number for tracking
- `event_type`: Type of event (harvest, processing, etc.)
- `blockchain_hash`: Event hash on blockchain
- `previous_event_hash`: Links to previous event for chain integrity
- `location`: Geographic location of event

### CertificationBody
Manages external certification bodies:
- `name`: Certification body name
- `code`: Unique code
- `accreditation_number`: Accreditation details
- `api_endpoint`: API integration endpoint

## API Endpoints

### Certificates

#### List Certificates
```http
GET /api/blockchain/certificates/
```

#### Create Certificate
```http
POST /api/blockchain/certificates/
Content-Type: application/json

{
  "certificate_type": "organic",
  "issuer": "Ghana Organic Agriculture Network",
  "title": "Organic Certification",
  "description": "Certified organic farm",
  "product_name": "Cocoa",
  "product_category": "Agricultural Product",
  "issue_date": "2025-01-01T00:00:00Z",
  "expiry_date": "2026-01-01T00:00:00Z"
}
```

#### Verify Certificate
```http
POST /api/blockchain/certificates/verify/
Content-Type: application/json

{
  "certificate_number": "ORG-20250101120000-ABC12345"
}
```

Response:
```json
{
  "is_valid": true,
  "message": "Certificate is valid and verified on blockchain",
  "certificate": { ... }
}
```

#### Revoke Certificate
```http
POST /api/blockchain/certificates/{id}/revoke/
```

#### Get My Certificates
```http
GET /api/blockchain/certificates/my_certificates/
```

#### Get Statistics
```http
GET /api/blockchain/certificates/statistics/
```

### Supply Chain Events

#### List Events
```http
GET /api/blockchain/supply-chain/
```

#### Create Event
```http
POST /api/blockchain/supply-chain/
Content-Type: application/json

{
  "product_id": "PROD-001",
  "product_name": "Organic Cocoa",
  "batch_number": "BATCH-001",
  "event_type": "harvest",
  "event_description": "Harvested 500kg of cocoa beans",
  "event_timestamp": "2025-01-01T08:00:00Z",
  "location_name": "Farm A, Ashanti Region",
  "latitude": 6.6885,
  "longitude": -1.6244,
  "actor_name": "John Farmer",
  "actor_role": "Farmer"
}
```

#### Track Product/Batch
```http
POST /api/blockchain/supply-chain/track/
Content-Type: application/json

{
  "batch_number": "BATCH-001"
}
```

Response:
```json
{
  "product_id": "PROD-001",
  "product_name": "Organic Cocoa",
  "batch_number": "BATCH-001",
  "event_count": 5,
  "integrity_verified": true,
  "events": [ ... ]
}
```

#### Verify Event
```http
POST /api/blockchain/supply-chain/{id}/verify_event/
```

### Certification Bodies

#### List Bodies
```http
GET /api/blockchain/certification-bodies/
```

#### Get Active Bodies
```http
GET /api/blockchain/certification-bodies/active/
```

## Management Commands

### Populate Sample Data
```bash
python manage.py populate_blockchain_data
```

Options:
- `--clear`: Clear existing data before populating

### Check Expired Certificates
```bash
python manage.py check_expired_certificates
```

This command should be run periodically (e.g., daily via cron) to update expired certificates.

## Blockchain Integration

The service includes a `BlockchainService` class that provides blockchain operations:

```python
from blockchain.blockchain_service import BlockchainService

service = BlockchainService()

# Store certificate on blockchain
tx_hash, block_number = service.store_certificate(certificate)

# Verify certificate
is_valid = service.verify_certificate(certificate)

# Verify supply chain integrity
result = service.verify_supply_chain_integrity(events)
```

### Current Implementation

The current implementation simulates blockchain operations. In production, this should be replaced with actual blockchain integration using:

- **Ethereum/Polygon**: For public blockchain with smart contracts
- **Hyperledger Fabric**: For private/permissioned blockchain
- **Web3.py**: For Ethereum integration
- **Smart Contracts**: Solidity contracts for certificate and supply chain management

## Configuration

Add to Django settings:

```python
# Blockchain settings
BLOCKCHAIN_NETWORK = 'ethereum'  # or 'polygon', 'hyperledger', etc.
BLOCKCHAIN_CONTRACT_ADDRESS = '0x...'  # Smart contract address
BLOCKCHAIN_RPC_URL = 'https://...'  # Blockchain RPC endpoint
BLOCKCHAIN_PRIVATE_KEY = env('BLOCKCHAIN_PRIVATE_KEY')  # For signing transactions
```

## Security Considerations

1. **Private Keys**: Store blockchain private keys securely in Vault
2. **API Authentication**: All endpoints require authentication except verification
3. **Permission Checks**: Users can only manage their own certificates
4. **Blockchain Verification**: All certificates and events are verified on blockchain
5. **Audit Trail**: All verification attempts are logged

## Testing

Run tests:
```bash
python manage.py test blockchain
```

Test coverage includes:
- Certificate creation and validation
- Supply chain event chaining
- Blockchain service operations
- API endpoints
- Permission checks

## Service Registration

The service automatically registers with Consul on startup:

```python
from blockchain.service_registration import register_service

register_service()
```

Service metadata:
- Name: `blockchain-service`
- Tags: `blockchain`, `certificates`, `supply-chain`, `verification`
- Health check: `/health`

## Integration with Other Services

### Marketplace Service
- Verify seller certifications
- Display certificate badges on products
- Track product supply chain

### Farm Service
- Link certificates to farms
- Display farm certifications
- Track farm produce journey

### Notification Service
- Send alerts for expiring certificates
- Notify on certificate verification
- Alert on supply chain events

## Future Enhancements

1. **Smart Contract Integration**: Deploy and integrate with actual smart contracts
2. **Multi-chain Support**: Support multiple blockchain networks
3. **NFT Certificates**: Issue certificates as NFTs
4. **IPFS Integration**: Store certificate documents on IPFS
5. **Mobile Verification**: Mobile app for QR code scanning
6. **Batch Operations**: Bulk certificate issuance
7. **Analytics Dashboard**: Certificate and supply chain analytics
8. **External API**: Public API for third-party verification

## Dependencies

- Django REST Framework
- qrcode: QR code generation
- Pillow: Image processing
- Web3.py (for production blockchain integration)

## License

Part of the AgroBridge platform.
