#!/usr/bin/env python3
"""
Quick server status check
"""
import requests
import websockets
import asyncio
import sys

def check_http_server():
    """Check if HTTP server is running"""
    try:
        response = requests.get('http://localhost:8000/api/v1/marketplace/products/', timeout=5)
        print(f"✅ HTTP Server is running (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ HTTP Server is NOT running - Connection refused")
        return False
    except requests.exceptions.Timeout:
        print("❌ HTTP Server timeout - might be starting up")
        return False
    except Exception as e:
        print(f"❌ HTTP Server check failed: {e}")
        return False

async def check_websocket_server():
    """Check if WebSocket server is running"""
    try:
        async with websockets.connect('ws://localhost:8000/ws/simple/', timeout=5) as websocket:
            print("✅ WebSocket server is running and accepting connections")
            return True
    except websockets.exceptions.InvalidURI:
        print("❌ Invalid WebSocket URI")
        return False
    except websockets.exceptions.InvalidHandshake:
        print("❌ WebSocket handshake failed - server might not support WebSockets")
        return False
    except ConnectionRefusedError:
        print("❌ WebSocket connection refused - server not running")
        return False
    except asyncio.TimeoutError:
        print("❌ WebSocket connection timeout")
        return False
    except Exception as e:
        print(f"❌ WebSocket check failed: {e}")
        return False

if __name__ == "__main__":
    print("Checking server status...")
    
    # Check HTTP server first
    http_ok = check_http_server()
    
    # Check WebSocket server
    websocket_ok = asyncio.run(check_websocket_server())
    
    if not http_ok and not websocket_ok:
        print("\n🚨 SERVER IS NOT RUNNING!")
        print("Please start the server with:")
        print("  python manage.py runserver")
        print("  OR")
        print("  daphne agrobridge_backend.asgi:application --port 8000")