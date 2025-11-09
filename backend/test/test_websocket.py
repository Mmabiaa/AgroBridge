#!/usr/bin/env python3
"""
Test script for WebSocket connections
"""
import asyncio
import websockets
import json
import sys

async def test_simple_websocket():
    """Test simple WebSocket without authentication"""
    try:
        async with websockets.connect('ws://localhost:8000/ws/simple/') as websocket:
            print("✅ Connected to simple WebSocket")
            
            # Send ping
            await websocket.send(json.dumps({'type': 'ping', 'data': 'test'}))
            response = await websocket.recv()
            print(f"✅ Ping response: {response}")
            
            # Send echo
            await websocket.send(json.dumps({'type': 'echo', 'data': {'message': 'Hello'}}))
            response = await websocket.recv()
            print(f"✅ Echo response: {response}")
            
    except Exception as e:
        print(f"❌ Simple WebSocket test failed: {e}")

async def test_authenticated_websocket(token):
    """Test authenticated WebSocket with JWT token"""
    try:
        async with websockets.connect(f'ws://localhost:8000/ws/?token={token}') as websocket:
            print("✅ Connected to authenticated WebSocket")
            
            # Wait for connection message
            response = await websocket.recv()
            print(f"✅ Connection message: {response}")
            
            # Send ping
            await websocket.send(json.dumps({'type': 'ping'}))
            response = await websocket.recv()
            print(f"✅ Ping response: {response}")
            
            # Get user info
            await websocket.send(json.dumps({'type': 'user_info'}))
            response = await websocket.recv()
            print(f"✅ User info: {response}")
            
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
        print("ℹ️  No token provided, skipping authenticated WebSocket test")
        print("ℹ️  Usage: python test_websocket.py <JWT_TOKEN>")