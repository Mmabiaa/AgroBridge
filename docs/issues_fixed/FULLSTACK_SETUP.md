# AgroBridge Full-Stack Setup Guide

This guide will help you set up the complete AgroBridge application with frontend-backend integration.

## Prerequisites

- Python 3.11+ (for Django backend)
- Node.js 18+ (for React frontend)
- PostgreSQL (for database)
- Git

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://username:password@localhost:5432/agrobridge
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 5. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 6. Start Backend Server
```bash
python manage.py runserver 127.0.0.1:8000
```

The backend will be available at: `http://127.0.0.1:8000`

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the frontend directory:
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WEATHERBIT_API_KEY=your-weather-api-key
VITE_CHATBASE_API_KEY=your-chatbase-key
VITE_CHATBOT_ID=your-chatbot-id
```

### 4. Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## API Integration Features

### 1. Authentication System
- JWT-based authentication
- Role-based access control (Farmer, Buyer, NGO, Admin)
- Automatic token refresh
- Protected routes

### 2. Real-time Features
- WebSocket connections for live updates
- Real-time notifications
- Live marketplace updates
- Chat system integration

### 3. API Endpoints Integration
- **Authentication**: `/auth/login/`, `/auth/register/`, `/auth/user/`
- **Farms**: `/farms/`, `/farms/{id}/`, `/farms/my-farms/`
- **Marketplace**: `/marketplace/products/`, `/marketplace/orders/`
- **AI Assistant**: `/ai/conversations/`, `/ai/voice/`
- **Crop Detection**: `/crop-detection/diseases/`, `/crop-detection/analysis/`

### 4. Caching & Optimization
- React Query for intelligent caching
- Optimistic updates for better UX
- Background synchronization
- Offline support

## Development Tools

### 1. API Testing Dashboard
Visit `/dev` in development mode to access:
- API connection testing
- Authentication flow testing
- Real-time feature testing
- Database connectivity checks

### 2. React Query Devtools
Available in development mode for:
- Query inspection
- Cache management
- Performance monitoring

## Production Deployment

### Backend (Django)
1. Set `DEBUG=False` in production
2. Configure proper `ALLOWED_HOSTS`
3. Use production database (PostgreSQL)
4. Set up static file serving
5. Configure CORS for production domain

### Frontend (React)
1. Build production bundle: `npm run build`
2. Serve static files with nginx/Apache
3. Configure environment variables for production API
4. Set up SSL certificates

## API Integration Architecture

```
Frontend (React + Vite)
├── API Layer
│   ├── Services (authService, farmsService, etc.)
│   ├── Hooks (useAuth, useFarms, etc.)
│   ├── Query Client (React Query)
│   └── Real-time Sync (WebSocket)
├── Components
│   ├── Dashboard (with API integration)
│   ├── Marketplace (live data)
│   └── Forms (with API calls)
└── Pages
    ├── Login/Register (authentication)
    ├── Dashboard (real-time data)
    └── Marketplace (live products)

Backend (Django REST API)
├── Authentication (JWT + Custom User)
├── Farms Management
├── Marketplace System
├── AI Assistant Integration
├── Crop Detection Service
└── WebSocket Support
```

## Key Integration Points

### 1. Authentication Flow
```typescript
// Frontend login
const { mutate: login } = useLogin();
await login({ email, password });

// Backend handles JWT creation
// Frontend stores tokens automatically
// All subsequent API calls include auth headers
```

### 2. Real-time Updates
```typescript
// Frontend subscribes to WebSocket
const realTimeSync = new RealTimeSync();

// Backend sends updates via WebSocket
// Frontend automatically updates React Query cache
// UI updates reactively
```

### 3. Optimistic Updates
```typescript
// Frontend updates UI immediately
const { mutate: createFarm } = useCreateFarm();
await createFarm(farmData); // UI updates before API response

// If API fails, changes are reverted
// If successful, real data replaces optimistic data
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is in `CORS_ALLOWED_ORIGINS`
   - Check that backend is running on correct port

2. **Authentication Issues**
   - Verify JWT tokens are being sent
   - Check token expiration
   - Ensure user permissions are correct

3. **API Connection Issues**
   - Use the `/dev` dashboard to test connections
   - Check network tab in browser dev tools
   - Verify backend health endpoint: `/health/`

### Development Tips

1. **Use the Development Dashboard** (`/dev`) to test API integration
2. **Monitor React Query Devtools** for cache behavior
3. **Check browser console** for WebSocket connection status
4. **Use Django admin** to verify data persistence

## Next Steps

1. **Add More API Endpoints**: Extend services as needed
2. **Implement File Uploads**: For images and documents
3. **Add Push Notifications**: For mobile integration
4. **Optimize Performance**: Add more caching strategies
5. **Add Testing**: Unit and integration tests

## Support

For issues or questions:
1. Check the development dashboard (`/dev`)
2. Review browser console logs
3. Check Django server logs
4. Verify environment configuration