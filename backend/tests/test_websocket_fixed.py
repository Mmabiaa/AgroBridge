#!/usr/bin/env python3
"""
Fixed WebSocket test script
"""
import asyncio
import websockets
import json
import sys

async def test_simple_websocket():
    """Test simple WebSocket without authentication"""
    print("Testing simple WebSocket (no auth)...")
    try:
        async with websockets.connect('ws://localhost:8000/ws/simple/') as websocket:
            print("✅ SUCCESS: Connected to simple WebSocket")
            
            # Wait for connection message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Connection message: {message}")
            except asyncio.TimeoutError:
                print("⏰ No connection message received")
            
            # Send ping
            print("Sending ping...")
            await websocket.send(json.dumps({'type': 'ping', 'data': 'test'}))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Ping response: {response}")
            except asyncio.TimeoutError:
                print("⏰ No ping response received")
                
    except Exception as e:
        print(f"❌ Simple WebSocket test failed: {e}")

async def test_authenticated_websocket(token):
    """Test authenticated WebSocket with JWT token"""
    print(f"Testing authenticated WebSocket with token...")
    try:
        async with websockets.connect(f'ws://localhost:8000/ws/?token={token}') as websocket:
            print("✅ SUCCESS: Connected to authenticated WebSocket")
            
            # Wait for connection message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Connection message: {message}")
            except asyncio.TimeoutError:
                print("⏰ No connection message received")
            
            # Send ping
            print("Sending ping...")
            await websocket.send(json.dumps({'type': 'ping'}))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 Ping response: {response}")
            except asyncio.TimeoutError:
                print("⏰ No ping response received")
                
    except Exception as e:
        print(f"❌ Authenticated WebSocket test failed: {e}")

if __name__ == "__main__":
    print("Testing WebSocket connections...")
    
    # Test simple WebSocket first
    asyncio.run(test_simple_websocket())
    
    # Test authenticated if token provided
    if len(sys.argv) > 1:
        token = sys.argv[1]
        asyncio.run(test_authenticated_websocket(token))
    else:
        print("\nℹ️  No token provided, skipping authenticated WebSocket test")
        print("ℹ️  Usage: python test_websocket_fixed.py <JWT_TOKEN>")