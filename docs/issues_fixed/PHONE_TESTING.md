# Phone Testing Setup Guide

This guide will help you run both the backend and frontend servers so you can test the application on your phone.

## Quick Start

### Windows (PowerShell)
```powershell
.\start-dev-servers.ps1
```

### Linux/macOS (Bash)
```bash
chmod +x start-dev-servers.sh
./start-dev-servers.sh
```

## Manual Setup

If you prefer to run the servers manually:

### 1. Find Your Local IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Linux/macOS:**
```bash
# Linux
ip addr show | grep "inet "

# macOS
ifconfig | grep "inet "
```

### 2. Update Frontend Configuration

Create or update `frontend/.env.local` (Vite prioritizes `.env.local` over `.env`):
```env
VITE_API_URL=http://YOUR_LOCAL_IP:8000/api/v1
VITE_WEBSOCKET_URL=ws://YOUR_LOCAL_IP:8000/ws/
```

Replace `YOUR_LOCAL_IP` with your actual local IP address (e.g., `192.168.1.100`)

**Note:** If you already have a `frontend/.env.local` file, the scripts will automatically update it. Otherwise, you can manually edit it.

### 3. Start Backend Server

```bash
cd backend

# Activate virtual environment (if using one)
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Start server on all network interfaces
python manage.py runserver 0.0.0.0:8000
```

The backend will be available at: `http://YOUR_LOCAL_IP:8000`

### 4. Start Frontend Server

In a new terminal:
```bash
cd frontend
npm run dev
```

The frontend is already configured to bind to all interfaces (host: "::" in vite.config.ts), so it will be available at: `http://YOUR_LOCAL_IP:8080`

## Accessing from Your Phone

1. **Make sure your phone is on the same Wi-Fi network** as your computer
2. Open a web browser on your phone
3. Navigate to: `http://YOUR_LOCAL_IP:8080`

Example: If your local IP is `192.168.1.100`, visit `http://192.168.1.100:8080`

## Troubleshooting

### Can't Access from Phone

1. **Check Firewall**: Make sure Windows Firewall (or your firewall) allows connections on ports 8000 and 8080
   - Windows: Go to Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule
   - Allow ports 8000 (TCP) and 8080 (TCP)

2. **Check Network**: Ensure both devices are on the same Wi-Fi network

3. **Check IP Address**: Verify your local IP hasn't changed (it can change when reconnecting to Wi-Fi)

4. **Check Server Status**: Make sure both servers are running and showing no errors

### CORS Errors

If you see CORS errors, the backend should already be configured to allow requests from your local IP. If not, you may need to add your IP to `CORS_ALLOWED_ORIGINS` in `backend/agrobridge_backend/settings.py`.

### API Connection Issues

1. Verify the `VITE_API_URL` in `frontend/.env` matches your local IP
2. Check that the backend is running on `0.0.0.0:8000` (not just `127.0.0.1:8000`)
3. Test the backend directly from your phone's browser: `http://YOUR_LOCAL_IP:8000/health/`

## Using Port Forwarding (Alternative)

If you prefer to use port forwarding tools instead:

### VS Code Port Forwarding
1. Open VS Code
2. Go to Ports tab
3. Forward ports 8000 and 8080
4. Use the forwarded URLs on your phone

### ngrok (for external access)
```bash
# Terminal 1 - Backend
ngrok http 8000

# Terminal 2 - Frontend  
ngrok http 8080
```

Then update `VITE_API_URL` in `frontend/.env` to use the ngrok backend URL.

## Security Note

⚠️ **Important**: Running servers on `0.0.0.0` makes them accessible to anyone on your local network. Only do this for development/testing purposes. Never use this configuration in production!

