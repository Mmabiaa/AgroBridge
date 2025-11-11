# Backend Not Responding - Troubleshooting Guide

## Problem
The backend at `https://xt7lct5c-8000.uks1.devtunnels.ms` is not responding to requests, causing CORS errors because the preflight OPTIONS request fails.

## Critical Steps

### 1. Verify Backend Server is Running

**Check if the backend process is running:**
```bash
# Windows PowerShell
Get-Process python | Where-Object {$_.Path -like "*backend*"}

# Or check if port 8000 is in use
netstat -ano | findstr :8000
```

**If not running, start it:**
```bash
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
# OR
source venv/bin/activate  # Linux/macOS

# Start the server on all interfaces (CRITICAL for Dev Tunnels)
python manage.py runserver 0.0.0.0:8000
```

**IMPORTANT**: You MUST use `0.0.0.0:8000` (not `127.0.0.1:8000` or `localhost:8000`) so the Dev Tunnel can forward requests to it.

### 2. Verify Dev Tunnel is Active

**Check VS Code Ports tab:**
- Open VS Code
- Go to "Ports" tab (usually at the bottom)
- Verify port 8000 is forwarded and shows "Forwarded" status
- The URL should be `https://xt7lct5c-8000.uks1.devtunnels.ms`

**If the tunnel is not active:**
- Right-click on port 8000 in the Ports tab
- Select "Port Visibility" → "Public" or "Private"
- Make sure it's set to forward

### 3. Test Backend Directly

**Test the health endpoint:**
```bash
# Using curl (if available)
curl https://xt7lct5c-8000.uks1.devtunnels.ms/health/

# Or open in browser
# https://xt7lct5c-8000.uks1.devtunnels.ms/health/
```

**You should see a JSON response like:**
```json
{"status": "healthy", ...}
```

**If you get an error or timeout:**
- The backend is not running, OR
- The Dev Tunnel is not forwarding correctly

### 4. Run Diagnostic Script

```bash
cd backend
python check_backend.py
```

This will test:
- Health endpoint accessibility
- CORS preflight (OPTIONS) request
- CORS headers in responses

### 5. Check Backend Logs

**Look at the terminal where the backend is running:**
- You should see request logs when you try to access the API
- If you see NO logs when making requests, the requests aren't reaching the backend

**Common log messages to look for:**
```
Request <id>: OPTIONS /api/v1/auth/login/
Response <id>: 200
```

### 6. Verify Configuration

**Check `backend/.env`:**
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,xt7lct5c-8080.uks1.devtunnels.ms,xt7lct5c-8000.uks1.devtunnels.ms
```

**Verify settings are loaded:**
```bash
cd backend
python manage.py shell
>>> from django.conf import settings
>>> print(settings.DEBUG)
>>> print(settings.CORS_ALLOW_ALL_ORIGINS)
>>> print(settings.ALLOWED_HOSTS)
```

All should show the correct values.

## Common Issues and Solutions

### Issue: "Connection refused" or timeout

**Solution:**
1. Backend is not running → Start it with `python manage.py runserver 0.0.0.0:8000`
2. Wrong bind address → Must use `0.0.0.0:8000`, not `127.0.0.1:8000`
3. Port 8000 is blocked → Check firewall settings
4. Dev Tunnel not active → Check VS Code Ports tab

### Issue: Backend running but Dev Tunnel not forwarding

**Solution:**
1. Restart the Dev Tunnel:
   - In VS Code Ports tab, right-click port 8000
   - Select "Stop Forwarding"
   - Then right-click again and select "Forward Port" or set visibility to "Public"
2. Verify the tunnel URL hasn't changed
3. Check that the backend is bound to `0.0.0.0:8000`

### Issue: CORS headers missing even after restart

**Solution:**
1. Make sure you restarted the backend server (not just the frontend)
2. Verify `DEBUG=True` in `backend/.env`
3. Check that `CORS_ALLOW_ALL_ORIGINS = True` in settings (it should be when DEBUG=True)
4. Clear browser cache and try again

### Issue: "No 'Access-Control-Allow-Origin' header"

**This means the preflight OPTIONS request is failing. Check:**
1. Is the backend running? (See step 1)
2. Is the Dev Tunnel forwarding? (See step 2)
3. Can you access the health endpoint? (See step 3)

## Quick Verification Checklist

- [ ] Backend server is running (`python manage.py runserver 0.0.0.0:8000`)
- [ ] Backend is bound to `0.0.0.0:8000` (not localhost)
- [ ] Dev Tunnel for port 8000 is active in VS Code
- [ ] Health endpoint is accessible: `https://xt7lct5c-8000.uks1.devtunnels.ms/health/`
- [ ] `DEBUG=True` in `backend/.env`
- [ ] Backend has been restarted after configuration changes
- [ ] `check_backend.py` script passes all tests

## Next Steps

Once the backend is responding:
1. The CORS errors should stop
2. Login requests should work
3. You should see request logs in the backend terminal

If the backend is still not responding after following these steps, the issue is likely with the Dev Tunnel configuration in VS Code, not the Django backend code.

