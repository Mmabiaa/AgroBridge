#!/usr/bin/env python3
"""
Simple WebSocket client test for AgroBridge backend
"""
import asyncio
import websockets
import json

async def test_websocket():
    # Use the token from get_test_token.py
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxMjU0ODcxLCJpYXQiOjE3NjEyNTM5NzEsImp0aSI6ImEwYzIzOTVkNjU3MTQ2OTk4YTllYWQ1OGI3Y2M3YTkwIiwidXNlcl9pZCI6IjUiLCJhdWQiOiJhZ3JvYnJpZGdlLWFwaSIsImlzcyI6ImFncm9icmlkZ2UifQ.MywtI5Mh4w2-BgKkNBhwCBpVBBvIArbYZuYJ5eb_nk0"
    # Test both endpoints
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxMjU0ODcxLCJpYXQiOjE3NjEyNTM5NzEsImp0aSI6ImEwYzIzOTVkNjU3MTQ2OTk4YTllYWQ1OGI3Y2M3YTkwIiwidXNlcl9pZCI6IjUiLCJhdWQiOiJhZ3JvYnJpZGdlLWFwaSIsImlzcyI6ImFncm9icmlkZ2UifQ.MywtI5Mh4w2-BgKkNBhwCBpVBBvIArbYZuYJ5eb_nk0"
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