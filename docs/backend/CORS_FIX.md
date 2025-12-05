# CORS Fix for Dev Tunnels

## Problem
The frontend at `https://xt7lct5c-8080.uks1.devtunnels.ms` cannot access the backend at `https://xt7lct5c-8000.uks1.devtunnels.ms` due to CORS errors.

## Solution Applied

1. **Updated CORS settings** in `backend/agrobridge_backend/settings.py`:
   - Added explicit Dev Tunnel origin checking
   - Added CORS_EXPOSE_HEADERS
   - Added CORS_PREFLIGHT_MAX_AGE

2. **Fixed WebSocket URL** in `frontend/src/api/realTimeSync.ts` to use environment variable

## Critical Steps to Fix

### 1. RESTART THE BACKEND SERVER

**This is the most important step!** The backend server MUST be restarted for CORS changes to take effect.

```bash
# Stop the current backend server (Ctrl+C)
# Then restart it
cd backend

# Activate virtual environment if needed
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Start the server
python manage.py runserver 0.0.0.0:8000
```

### 2. Verify Backend is Running

Test the backend health endpoint:
```
https://xt7lct5c-8000.uks1.devtunnels.ms/health/
```

You should see a JSON response.

### 3. Test CORS Configuration

Run the test script:
```bash
cd backend
python test_cors.py
```

This will verify that CORS is configured correctly.

### 4. Check Browser Console

After restarting the backend, try the login again and check:
- Network tab: Look for the OPTIONS preflight request
- Check if it returns 200 OK with CORS headers
- Check if the actual POST request succeeds

## Expected CORS Headers

When the backend responds correctly, you should see these headers in the response:
```
Access-Control-Allow-Origin: https://xt7lct5c-8080.uks1.devtunnels.ms
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: DELETE, GET, OPTIONS, PATCH, POST, PUT
Access-Control-Allow-Headers: accept, accept-encoding, authorization, content-type, ...
```

## If It Still Doesn't Work

### Check 1: Verify DEBUG is True
```bash
cd backend
python manage.py shell
>>> from django.conf import settings
>>> print(settings.DEBUG)
>>> print(settings.CORS_ALLOW_ALL_ORIGINS)
```

Both should be `True`.

### Check 2: Verify Backend .env
Make sure `backend/.env` has:
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,xt7lct5c-8080.uks1.devtunnels.ms,xt7lct5c-8000.uks1.devtunnels.ms
```

### Check 3: Test Direct API Call
Open browser console on the frontend page and run:
```javascript
fetch('https://xt7lct5c-8000.uks1.devtunnels.ms/health/', {
  method: 'GET',
  headers: {
    'Origin': 'https://xt7lct5c-8080.uks1.devtunnels.ms'
  }
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', [...r.headers.entries()]);
  return r.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));
```

### Check 4: Verify Dev Tunnel is Active
- Make sure the backend Dev Tunnel is still active
- The URL might have changed if the tunnel was restarted
- Update `frontend/.env.local` if the URL changed

## Common Issues

### Issue: "No 'Access-Control-Allow-Origin' header"
**Solution**: Backend server needs to be restarted

### Issue: "Preflight request failed"
**Solution**: Check that OPTIONS method is in CORS_ALLOW_METHODS (it is)

### Issue: "CORS policy blocked"
**Solution**: 
1. Restart backend server
2. Verify DEBUG=True
3. Check that frontend origin matches what's in CORS settings

## Quick Verification

After restarting the backend, open browser DevTools → Network tab → Try login → Check the OPTIONS request:
- Should return 200 OK
- Should have `Access-Control-Allow-Origin` header
- Should have `Access-Control-Allow-Methods` header

If you see these headers, CORS is working!

