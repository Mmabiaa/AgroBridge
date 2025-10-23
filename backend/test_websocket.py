#!/usr/bin/env python3
"""
Simple WebSocket client test for AgroBridge backend
"""
import asyncio
import websockets
import json

async def test_websocket():
    # Use the token from get_test_token.py
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxMjU2NTkwLCJpYXQiOjE3NjEyNTU2OTAsImp0aSI6ImYxOTNjNWE2Y2JjZjQzNTI5ZTM4OTg1ZTdkN2Q2YWJmIiwidXNlcl9pZCI6IjUiLCJhdWQiOiJhZ3JvYnJpZGdlLWFwaSIsImlzcyI6ImFncm9icmlkZ2UifQ.RR2jds7sqA7SYm1Cn458XxJ6lbvulEmZecCk4u_sS88"
    uri = f"ws://localhost:8000/ws/?token={token}"
    
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "ping",
                "data": {"message": "Hello from test client"}
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"Sent: {test_message}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())