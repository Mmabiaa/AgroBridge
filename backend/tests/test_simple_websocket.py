#!/usr/bin/env python3
"""
Simple WebSocket test that shows exactly what's happening
"""
import asyncio
import websockets
import json

async def test_websocket_detailed():
    print("Testing WebSocket connection...")
    
    # Test multiple endpoints
    endpoints = [
        '/ws/',
        '/ws/simple/',
        '/ws/test/',
    ]
    
    for endpoint in endpoints:
        url = f'wss://xt7lct5c-8000.uks1.devtunnels.ms/ws/{endpoint}'
        print(f"\nTesting: {url}")
        
        try:
            async with websockets.connect(url) as websocket:
                print(f"✅ SUCCESS: Connected to {endpoint}")
                
                # Try to receive initial message
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    print(f"📨 Received: {message}")
                except asyncio.TimeoutError:
                    print("⏰ No initial message received (timeout)")
                
                # Send a test message
                test_msg = {'type': 'ping'}
                await websocket.send(json.dumps(test_msg))
                print(f"📤 Sent: {test_msg}")
                
                # Try to receive response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    print(f"📨 Response: {response}")
                except asyncio.TimeoutError:
                    print("⏰ No response received (timeout)")
                    
        except websockets.exceptions.InvalidStatusCode as e:
            print(f"❌ HTTP Error {e.status_code} for {endpoint}")
        except ConnectionRefusedError:
            print(f"❌ Connection refused for {endpoint}")
        except Exception as e:
            print(f"❌ Error for {endpoint}: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_detailed())