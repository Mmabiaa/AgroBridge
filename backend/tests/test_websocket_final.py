#!/usr/bin/env python3
"""
Final WebSocket test script with better error handling
"""
import asyncio
import websockets
import json
import sys

async def test_websocket_detailed(url, description):
    """Test WebSocket connection with detailed logging"""
    print(f"\n🔍 Testing: {description}")
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
            await websocket.send(json.dumps({'type': 'ping', 'data': 'test'}))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"   📨 Ping response: {response}")
            except asyncio.TimeoutError:
                print("   ⏰ No ping response received (timeout)")
            
            # Test echo
            print("   Sending echo message...")
            await websocket.send(json.dumps({'type': 'echo', 'data': {'message': 'Hello WebSocket!'}}))
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"   📨 Echo response: {response}")
            except asyncio.TimeoutError:
                print("   ⏰ No echo response received (timeout)")
                
            return True
                
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"   ❌ HTTP Error {e.status_code} for {description}")
        print(f"   Headers: {e.headers}")
        return False
    except websockets.exceptions.InvalidHandshake as e:
        print(f"   ❌ Handshake failed: {e}")
        return False
    except ConnectionRefusedError:
        print(f"   ❌ Connection refused - server not running?")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

async def main():
    print("🚀 Starting WebSocket connection tests...")
    
    # Test endpoints
    endpoints = [
        ('ws://localhost:8000/ws/simple/', 'Simple WebSocket (no auth)'),
        ('ws://localhost:8000/ws/test/', 'Test WebSocket (auth required)'),
        ('ws://localhost:8000/ws/', 'Main WebSocket (auth required)'),
    ]
    
    results = []
    for url, description in endpoints:
        success = await test_websocket_detailed(url, description)
        results.append((description, success))
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY:")
    print("="*50)
    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status}: {description}")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    if not any(success for _, success in results):
        print("  • All connections failed - check server is running with Daphne")
        print("  • Verify ASGI configuration")
        print("  • Check CORS and allowed hosts settings")
    elif results[0][1] and not results[1][1]:
        print("  • Simple WebSocket works but authenticated ones fail")
        print("  • Authentication might be the issue")
        print("  • Try with a valid JWT token")

if __name__ == "__main__":
    asyncio.run(main())