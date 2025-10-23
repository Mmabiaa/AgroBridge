#!/bin/bash

# AgroBridge Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting AgroBridge deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    if ! command -v pip &> /dev/null; then
        print_error "pip is not installed"
        exit 1
    fi
    
    print_status "All requirements satisfied ✓"
}

# Deploy Backend
deploy_backend() {
    print_status "Deploying backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run migrations
    print_status "Running database migrations..."
    python manage.py makemigrations
    python manage.py migrate
    
    # Collect static files
    print_status "Collecting static files..."
    python manage.py collectstatic --noinput
    
    # Create superuser if it doesn't exist
    print_status "Creating superuser (if needed)..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@agrobridge.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
"
    
    cd ..
    print_status "Backend deployment completed ✓"
}

# Deploy Frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build
    
    cd ..
    print_status "Frontend deployment completed ✓"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start backend
    print_status "Starting Django backend..."
    cd backend
    source venv/bin/activate
    nohup python manage.py runserver 0.0.0.0:8000 > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..
    
    # Start frontend (for development - in production, use nginx)
    print_status "Frontend built and ready for serving"
    print_warning "In production, serve frontend/dist with nginx or similar web server"
    
    print_status "Services started ✓"
    print_status "Backend PID: $BACKEND_PID"
    print_status "Backend logs: logs/backend.log"
}

# Create logs directory
mkdir -p logs

# Main deployment flow
main() {
    print_status "AgroBridge Production Deployment"
    print_status "================================"
    
    check_requirements
    deploy_backend
    deploy_frontend
    start_services
    
    print_status ""
    print_status "🎉 Deployment completed successfully!"
    print_status ""
    print_status "Backend: http://localhost:8000"
    print_status "Frontend: Serve frontend/dist directory"
    print_status "Admin: http://localhost:8000/admin (admin/admin123)"
    print_status ""
    print_status "Next steps:"
    print_status "1. Configure your web server (nginx) to serve the frontend"
    print_status "2. Set up SSL certificates"
    print_status "3. Configure domain names"
    print_status "4. Set up monitoring and logging"
    print_status ""
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Run main function
main