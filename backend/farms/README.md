# Farm Management Service

The Farm Management Service provides comprehensive farm, field, and crop management capabilities with satellite imagery integration and advanced analytics for the AgroBridge platform.

## Features

### 1. Farm Management
- **Multi-Farm Support**: Users can manage multiple farms
- **Farm Types**: Crop, livestock, poultry, mixed, organic, greenhouse, aquaculture
- **Certification Tracking**: Organic, GAP, Fair Trade, Rainforest Alliance
- **Location Management**: GPS coordinates and address information
- **Privacy Controls**: Public/private farm visibility settings

### 2. Field Management with GeoJSON
- **GeoJSON Boundaries**: Precise field boundaries using polygon coordinates
- **Field Characteristics**: Soil type, pH, elevation, slope tracking
- **Infrastructure**: Irrigation systems, drainage, fencing status
- **Area Calculation**: Automatic area calculation from boundaries
- **Center Coordinates**: Field center point calculation
- **Validation**: Robust GeoJSON polygon validation

### 3. Crop Management
- **Lifecycle Tracking**: Complete crop lifecycle from planting to harvest
- **Field Association**: Crops linked to specific fields
- **Growth Monitoring**: Automatic growth stage percentage calculation
- **Yield Management**: Expected vs actual yield tracking and efficiency
- **Status Updates**: Real-time crop status management
- **Seasonal Planning**: Crop rotation and seasonal tracking

### 4. Satellite Imagery Integration
- **Multi-Satellite Support**: Sentinel-2, Landsat, MODIS, Planet, WorldView
- **Vegetation Indices**: NDVI and EVI calculation from satellite data
- **Crop Health Analysis**: Automated health scoring (0-100 scale)
- **Stress Detection**: Identification of crop stress indicators
- **Quality Assessment**: Cloud coverage and resolution tracking
- **Processing Pipeline**: Automated imagery analysis workflow

### 5. Livestock Management
- **Animal Tracking**: Cattle, goats, sheep, pigs, poultry, fish, rabbits
- **Health Monitoring**: Health status tracking and alerts
- **Production Tracking**: Milk, eggs, meat production monitoring
- **Breeding Management**: Breeding records and genealogy
- **Financial Tracking**: Acquisition costs and value estimation

### 6. Equipment Management
- **Asset Tracking**: Tractors, tools, machinery, vehicles
- **Maintenance Scheduling**: Preventive maintenance planning
- **Condition Monitoring**: Equipment condition and operational status
- **Depreciation Tracking**: Asset value and depreciation calculation
- **Usage Monitoring**: Hours used and utilization metrics

### 7. Activity Management
- **Task Scheduling**: Farm activity planning and scheduling
- **Progress Tracking**: Activity completion and progress monitoring
- **Resource Management**: Materials, labor, and cost tracking
- **Alert System**: Overdue task notifications and reminders
- **Assignment**: Task assignment to farm workers

### 8. Analytics & Monitoring
- **Farm Overview**: Total area, crop count, livestock summary
- **Performance Metrics**: Yield efficiency, completion rates, utilization
- **Trend Analysis**: Historical data and seasonal patterns
- **Alert System**: Automated notifications for critical events
- **Dashboard**: Centralized farm management dashboard

## API Endpoints

### Farm Management
- `GET /api/farms/farms/` - List user's farms
- `POST /api/farms/farms/` - Create new farm
- `GET /api/farms/farms/{id}/` - Get farm details
- `PUT /api/farms/farms/{id}/` - Update farm
- `DELETE /api/farms/farms/{id}/` - Delete farm
- `GET /api/farms/farms/{id}/analytics/` - Farm analytics
- `GET /api/farms/farms/{id}/performance/` - Performance metrics
- `GET /api/farms/farms/dashboard/` - Dashboard data

### Field Management
- `GET /api/farms/fields/` - List fields
- `POST /api/farms/fields/` - Create field with GeoJSON boundary
- `GET /api/farms/fields/{id}/` - Get field details
- `PUT /api/farms/fields/{id}/` - Update field
- `DELETE /api/farms/fields/{id}/` - Delete field
- `POST /api/farms/fields/{id}/validate_boundary/` - Validate GeoJSON
- `GET /api/farms/fields/{id}/crops/` - Get field crops
- `GET /api/farms/fields/{id}/satellite_images/` - Get satellite imagery

### Crop Management
- `GET /api/farms/crops/` - List crops
- `POST /api/farms/crops/` - Create crop
- `GET /api/farms/crops/{id}/` - Get crop details
- `PUT /api/farms/crops/{id}/` - Update crop
- `DELETE /api/farms/crops/{id}/` - Delete crop
- `POST /api/farms/crops/{id}/update_status/` - Update crop status
- `POST /api/farms/crops/{id}/record_harvest/` - Record harvest data

### Livestock Management
- `GET /api/farms/livestock/` - List livestock
- `POST /api/farms/livestock/` - Add livestock
- `GET /api/farms/livestock/{id}/` - Get livestock details
- `PUT /api/farms/livestock/{id}/` - Update livestock
- `DELETE /api/farms/livestock/{id}/` - Remove livestock
- `POST /api/farms/livestock/{id}/update_health_status/` - Update health
- `POST /api/farms/livestock/{id}/record_production/` - Record production

### Equipment Management
- `GET /api/farms/equipment/` - List equipment
- `POST /api/farms/equipment/` - Add equipment
- `GET /api/farms/equipment/{id}/` - Get equipment details
- `PUT /api/farms/equipment/{id}/` - Update equipment
- `DELETE /api/farms/equipment/{id}/` - Remove equipment
- `POST /api/farms/equipment/{id}/record_maintenance/` - Record maintenance
- `GET /api/farms/equipment/needs_maintenance/` - Equipment needing maintenance

### Activity Management
- `GET /api/farms/activities/` - List activities
- `POST /api/farms/activities/` - Create activity
- `GET /api/farms/activities/{id}/` - Get activity details
- `PUT /api/farms/activities/{id}/` - Update activity
- `DELETE /api/farms/activities/{id}/` - Delete activity
- `POST /api/farms/activities/{id}/mark_completed/` - Mark completed
- `GET /api/farms/activities/upcoming/` - Upcoming activities
- `GET /api/farms/activities/overdue/` - Overdue activities

### Satellite Imagery
- `GET /api/farms/satellite-imagery/` - List satellite images
- `POST /api/farms/satellite-imagery/` - Add satellite image
- `GET /api/farms/satellite-imagery/{id}/` - Get image details
- `PUT /api/farms/satellite-imagery/{id}/` - Update image
- `DELETE /api/farms/satellite-imagery/{id}/` - Delete image
- `POST /api/farms/satellite-imagery/{id}/process_imagery/` - Process image
- `POST /api/farms/satellite-imagery/{id}/analyze_crop_health/` - Analyze health
- `GET /api/farms/satellite-imagery/latest_by_field/` - Latest images per field

### Health Check
- `GET /api/farms/health/` - Service health check

## Models

### Farm
Core farm entity with location, certification, and operational data:
- Basic information (name, description, type, size)
- Location data (coordinates, address)
- Certification and compliance tracking
- Contact information and settings
- Privacy and visibility controls

### Field
GeoJSON-based field management:
- Polygon boundary definition
- Soil characteristics (type, pH, elevation, slope)
- Infrastructure (irrigation, drainage, fencing)
- Area calculation and center coordinates
- Cultivation history and status

### Crop
Comprehensive crop lifecycle management:
- Planting and harvest date tracking
- Growth stage monitoring
- Yield planning and actual results
- Status progression (planted → growing → harvested)
- Field association and area allocation

### Livestock
Animal management and tracking:
- Animal type, breed, and count
- Health status monitoring
- Production tracking (milk, eggs, meat)
- Acquisition and financial data
- Age and weight management

### Equipment
Farm asset and machinery management:
- Equipment type and specifications
- Condition and operational status
- Maintenance scheduling and history
- Purchase and depreciation tracking
- Usage monitoring

### FarmActivity
Task and operation management:
- Activity scheduling and assignment
- Progress tracking and completion
- Resource and cost management
- Priority and status management
- Results and notes recording

### SatelliteImagery
Satellite data processing and analysis:
- Multi-satellite source support
- Image metadata and quality metrics
- Vegetation indices calculation (NDVI, EVI)
- Crop health scoring and stress detection
- Processing status and results

## Filtering & Search

### Advanced Filtering
- **Farms**: Type, certification, size, location, establishment date
- **Fields**: Soil type, irrigation, area, infrastructure
- **Crops**: Status, season, planting/harvest dates, yield
- **Livestock**: Type, health status, age, production purpose
- **Activities**: Type, status, priority, assignment, dates
- **Equipment**: Type, condition, maintenance needs
- **Satellite**: Satellite source, date range, cloud coverage, processing status

### Search Capabilities
- **Text Search**: Name, description, variety, breed
- **Date Ranges**: Flexible date filtering for all time-based data
- **Numeric Ranges**: Area, yield, count, cost filtering
- **Status Filtering**: Active/inactive, operational status
- **Geographic**: Location-based filtering (future enhancement)

## Analytics & Intelligence

### Farm Analytics
- **Overview Metrics**: Total area, crop count, livestock summary
- **Performance Indicators**: Yield efficiency, completion rates
- **Financial Metrics**: Asset values, cost tracking, ROI
- **Trend Analysis**: Historical performance and seasonal patterns
- **Comparative Analysis**: Farm-to-farm performance comparison

### Crop Analytics
- **Status Distribution**: Crop lifecycle stage breakdown
- **Yield Analysis**: Expected vs actual yield comparison
- **Seasonal Trends**: Planting and harvest patterns
- **Efficiency Metrics**: Yield per hectare, growth rates
- **Health Monitoring**: Satellite-based health assessment

### Livestock Analytics
- **Population Metrics**: Animal counts by type and purpose
- **Health Statistics**: Health status distribution and trends
- **Production Analysis**: Milk, egg, meat production tracking
- **Financial Analysis**: Asset values and production ROI
- **Breeding Analytics**: Reproduction rates and genealogy

### Performance Monitoring
- **Automated Alerts**: Overdue tasks, maintenance needs, health issues
- **Threshold Monitoring**: Yield targets, health scores, equipment status
- **Trend Detection**: Performance degradation, seasonal patterns
- **Recommendation Engine**: Optimization suggestions and best practices

## Satellite Imagery Features

### Supported Satellites
- **Sentinel-2**: 10m resolution, 5-day revisit
- **Landsat 8/9**: 30m resolution, 16-day revisit
- **MODIS**: 250m resolution, daily revisit
- **Planet**: 3m resolution, daily revisit
- **WorldView**: Sub-meter resolution, on-demand

### Vegetation Indices
- **NDVI**: Normalized Difference Vegetation Index
- **EVI**: Enhanced Vegetation Index
- **Custom Indices**: Extensible for additional calculations

### Crop Health Analysis
- **Health Scoring**: 0-100 scale based on vegetation vigor
- **Stress Detection**: Water stress, nutrient deficiency, disease
- **Temporal Analysis**: Health trends over time
- **Comparative Analysis**: Field-to-field health comparison

### Quality Assessment
- **Cloud Coverage**: Automatic cloud percentage calculation
- **Resolution Tracking**: Spatial resolution metadata
- **Acquisition Timing**: Optimal imaging conditions
- **Processing Status**: Automated processing pipeline

## Security & Permissions

### Access Control
- **Farm Ownership**: Users can only access their own farms
- **Public Visibility**: Optional public farm sharing
- **Field-Level Security**: Granular access to field data
- **Role-Based Access**: Different permissions for different roles

### Data Protection
- **Input Validation**: Comprehensive data validation
- **GeoJSON Security**: Boundary data validation and sanitization
- **File Upload Security**: Satellite imagery URL validation
- **API Security**: Rate limiting and authentication

## Performance & Scalability

### Database Optimization
- **Indexing**: Optimized indexes for all search fields
- **Query Optimization**: Efficient database queries
- **Pagination**: Large dataset handling
- **Caching**: Strategic caching for analytics

### API Performance
- **Response Times**: < 200ms for most operations
- **Bulk Operations**: Efficient batch processing
- **Satellite Processing**: Optimized vegetation index calculation
- **Analytics**: Fast dashboard and reporting

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Load Balancing**: Service discovery integration
- **Caching Strategy**: Redis integration ready
- **Database Scaling**: Read replicas and sharding ready

## Integration Points

### Current Integrations
- **User Service**: Farm ownership and user management
- **Authentication Service**: Secure API access
- **Consul**: Service discovery and health monitoring

### Future Integration Ready
- **IoT Service**: Field sensor data integration
- **Weather Service**: Weather data for crop management
- **Notification Service**: Farm alerts and reminders
- **Analytics Service**: Advanced data processing
- **Marketplace Service**: Crop sales and inventory management

## Development

### Local Development
1. Ensure Django is configured with farms app
2. Run migrations: `python manage.py migrate farms`
3. Create test data using Django admin or API
4. Access API at `/api/farms/`

### Testing
```bash
# Run all farm service tests
python manage.py test farms

# Run specific test classes
python manage.py test farms.tests.FarmModelTest
python manage.py test farms.tests.FieldAPITest
python manage.py test farms.tests.SatelliteImageryTest

# Run with coverage
coverage run --source='.' manage.py test farms
coverage report -m
```

### Service Registration
```bash
# Manual service registration
cd backend/farms
python service_registration.py register
python service_registration.py health
python service_registration.py deregister
```

## Deployment

### Docker Support
The service includes Docker configuration for containerized deployment with proper health checks and service discovery integration.

### Environment Variables
- `FARM_SERVICE_HOST` - Service host (default: localhost)
- `FARM_SERVICE_PORT` - Service port (default: 8002)
- `CONSUL_URL` - Consul server URL (default: http://localhost:8500)
- `REGISTER_SERVICES` - Auto-register with Consul (default: false)

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Service registration enabled
- [ ] Health checks configured
- [ ] Monitoring setup
- [ ] Satellite imagery integration configured
- [ ] Analytics caching enabled
- [ ] Security settings verified

The Farm Management Service provides a comprehensive foundation for agricultural operations management with advanced satellite imagery integration and analytics capabilities.