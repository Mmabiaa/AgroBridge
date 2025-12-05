#!/usr/bin/env python3
"""
Test WebSocket with authentication
"""
import asyncio
import websockets
import json
import sys

async def test_authenticated_websocket(token, endpoint, description):
    """Test authenticated WebSocket connection"""
    print(f"\n🔐 Testing: {description}")
    url = f"ws://localhost:8000{endpoint}?token={token}"
    print(f"   URL: {url}")
    
    try:
        async with websockets.connect(
            url,
            ping_interval=20,
            ping_timeout=20,
            close_timeout=10
        ) as websocket:
            print(f"   ✅ SUCCESS: Connected to {description}")
            
            # Wait for connection message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"   📨 Connection message: {message}")
            except asyncio.TimeoutError:
                print("   ⏰ No connection message received (timeout)")
            
            # Send ping
            print("   Sending ping message...")
            await websocket.send(json.dumps({'type': 'ping'}))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"   📨 Ping response: {response}")
            except asyncio.TimeoutError:
                print("   ⏰ No ping response received (timeout)")
            
            # Get user info
            print("   Requesting user info...")
            await websocket.send(json.dumps({'type': 'user_info'}))
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"   📨 User info: {response}")
            except asyncio.TimeoutError:
                print("   ⏰ No user info received (timeout)")
                
            return True
                
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"   ❌ HTTP Error {e.status_code} for {description}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

async def main():
    if len(sys.argv) < 2:
        print("❌ Please provide a JWT token")
        print("Usage: python test_websocket_with_auth.py <JWT_TOKEN>")
        print("\nGet a token by running: python get_jwt_token.py")
        return
    
    token = sys.argv[1]
    print(f"🔑 Using token: {token[:50]}...")
    
    # Test authenticated endpoints
    endpoints = [
        ('/ws/', 'Main WebSocket'),
        ('/ws/test/', 'Test WebSocket'),
    ]
    
    results = []
    for endpoint, description in endpoints:
        success = await test_authenticated_websocket(token, endpoint, description)
        results.append((description, success))
    
    # Summary
    print("\n" + "="*50)
    print("📊 AUTHENTICATED WEBSOCKET TEST SUMMARY:")
    print("="*50)
    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status}: {description}")

if __name__ == "__main__":
    asyncio.run(main())