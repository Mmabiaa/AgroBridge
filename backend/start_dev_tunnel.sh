#!/bin/bash

# Stop any running Django server
pkill -f "python manage.py runserver"
pkill -f "daphne"

# Set environment variables
export DJANGO_SETTINGS_MODULE=agrobridge_backend.settings
export PYTHONPATH=/path/to/your/backend

# Start Daphne on all interfaces
echo "Starting Daphne on 0.0.0.0:8000..."
daphne agrobridge_backend.asgi:application --port 8000 --bind 0.0.0.0 &

echo "Backend is now accessible via dev tunnel!"
echo "API URL: https://xt7lct5c-8000.uks1.devtunnels.ms/api/v1"
echo "WebSocket URL: wss://xt7lct5c-8000.uks1.devtunnels.ms/ws/"