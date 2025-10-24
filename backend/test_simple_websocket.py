#!/usr/bin/env python3
"""
Simple WebSocket client test for AgroBridge backend (no auth)
"""
import asyncio
import websockets
import json

async def test_simple_websocket():
    uri = "ws://localhost:8000/ws/simple/"
    
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "ping",
                "data": {"message": "Hello from simple test client"}
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"Sent: {test_message}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send another message
            echo_message = {
                "type": "echo",
                "data": {"message": "This is an echo test"}
            }
            
            await websocket.send(json.dumps(echo_message))
            print(f"Sent: {echo_message}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_simple_websocket())