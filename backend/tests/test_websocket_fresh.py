#!/usr/bin/env python3
"""
WebSocket test with fresh token generation
"""
import asyncio
import websockets
import json
import subprocess
import sys

async def test_websocket_with_fresh_token():
    try:
        # Generate fresh token
        print("Generating fresh token...")
        result = subprocess.run([sys.executable, 'get_test_token.py'], 
                              capture_output=True, text=True, cwd='.')
        
        if result.returncode != 0:
            print(f"Failed to generate token: {result.stderr}")
            return
        
        # Extract token from output
        lines = result.stdout.strip().split('\n')
        token_line = [line for line in lines if line.startswith('Access Token:')]
        
        if not token_line:
            print("Could not find token in output")
            return
        
        token = token_line[0].replace('Access Token: ', '').strip()
        print(f"Using token: {token[:50]}...")
        
        # Test WebSocket connection
        uri = f"ws://localhost:8000/ws/?token={token}"
        
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "ping",
                "data": {"message": "Hello from fresh token test"}
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"📤 Sent: {test_message}")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Received: {response}")
            
            # Send user info request
            user_info_message = {
                "type": "user_info",
                "data": {}
            }
            
            await websocket.send(json.dumps(user_info_message))
            print(f"📤 Sent: {user_info_message}")
            
            # Wait for user info response
            user_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Received: {user_response}")
            
    except asyncio.TimeoutError:
        print("❌ Timeout waiting for WebSocket response")
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_with_fresh_token())