# Dev Tunnels Setup Guide

This guide helps you configure and troubleshoot Dev Tunnels for phone testing.

## Current Configuration

- **Frontend Dev Tunnel**: https://xt7lct5c-8080.uks1.devtunnels.ms/
- **Backend Dev Tunnel**: https://xt7lct5c-8000.uks1.devtunnels.ms/

## Frontend Configuration

The frontend `.env.local` file should contain:
```env
VITE_API_URL=https://xt7lct5c-8000.uks1.devtunnels.ms/api/v1
VITE_WEBSOCKET_URL=wss://xt7lct5c-8000.uks1.devtunnels.ms/ws/
```

## Backend Configuration

The backend `.env` file should contain:
```env
ALLOWED_HOSTS=localhost,127.0.0.1,xt7lct5c-8080.uks1.devtunnels.ms,xt7lct5c-8000.uks1.devtunnels.ms
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://localhost:8080,https://xt7lct5c-8080.uks1.devtunnels.ms,https://xt7lct5c-8000.uks1.devtunnels.ms
DEBUG=True
```

## Troubleshooting Steps

### 1. Restart Frontend Dev Server

**IMPORTANT**: After updating `.env.local`, you MUST restart the frontend dev server for changes to take effect.

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
cd frontend
npm run dev
```

### 2. Verify Environment Variables are Loaded

Open your browser's developer console and check:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

It should show: `https://xt7lct5c-8000.uks1.devtunnels.ms/api/v1`

### 3. Test Backend Connection

Open your browser and navigate to:
```
https://xt7lct5c-8000.uks1.devtunnels.ms/health/
```

You should see a JSON response with status information.

### 4. Test API Endpoint

Test the API directly:
```
https://xt7lct5c-8000.uks1.devtunnels.ms/api/v1/auth/login/
```

### 5. Check CORS in Browser Console

Open browser DevTools → Network tab → Look for failed requests:
- Check if they show CORS errors
- Check the request URL (should use the Dev Tunnel URL)
- Check the response headers for CORS headers

### 6. Verify Backend is Running

Make sure your backend server is running and accessible via the Dev Tunnel:
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

### 7. Check Dev Tunnel Status

Verify both Dev Tunnels are active:
- Frontend: https://xt7lct5c-8080.uks1.devtunnels.ms/
- Backend: https://xt7lct5c-8000.uks1.devtunnels.ms/

## Common Issues

### Issue: Frontend can't access backend API

**Solution:**
1. Restart the frontend dev server after updating `.env.local`
2. Verify `VITE_API_URL` in browser console
3. Check that backend is running and accessible
4. Verify CORS settings in backend (should allow all origins when DEBUG=True)

### Issue: CORS errors in browser console

**Solution:**
- Backend has `CORS_ALLOW_ALL_ORIGINS = DEBUG` which should allow all origins when DEBUG=True
- If still getting CORS errors, check that `DEBUG=True` in backend `.env`
- Verify the frontend origin matches what's in CORS_ALLOWED_ORIGINS

### Issue: 404 errors when accessing API

**Solution:**
- Verify the API path is correct: `/api/v1/...`
- Check that backend URLs are properly configured
- Test the backend health endpoint first

### Issue: WebSocket connection fails

**Solution:**
- Verify `VITE_WEBSOCKET_URL` is set in `.env.local`
- Check that WebSocket URL uses `wss://` (secure WebSocket) for HTTPS Dev Tunnels
- Restart frontend dev server after updating WebSocket URL

## Testing from Phone

1. Open browser on your phone
2. Navigate to: https://xt7lct5c-8080.uks1.devtunnels.ms/
3. Open browser DevTools (if available) or check network requests
4. Verify API calls are going to the backend Dev Tunnel URL

## Quick Verification Script

Run this in your browser console on the frontend page:

```javascript
// Check environment variables
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('WebSocket URL:', import.meta.env.VITE_WEBSOCKET_URL);

// Test API connection
fetch(import.meta.env.VITE_API_URL.replace('/api/v1', '/health/'))
  .then(r => r.json())
  .then(data => console.log('Backend health:', data))
  .catch(err => console.error('Backend connection failed:', err));
```

## Notes

- Dev Tunnels URLs may change if you restart the tunnel
- Always update both frontend `.env.local` and backend `.env` when URLs change
- Remember to restart both servers after configuration changes
- HTTPS Dev Tunnels require `wss://` for WebSocket connections (not `ws://`)

