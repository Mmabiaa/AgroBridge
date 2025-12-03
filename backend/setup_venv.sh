#!/bin/bash
# Setup script for Python virtual environments

echo "Setting up Python virtual environments for AgroBridge microservices..."

# Create main virtual environment
if [ ! -d "venv" ]; then
    echo "Creating main virtual environment..."
    python -m venv venv
    echo "✓ Main virtual environment created"
else
    echo "✓ Main virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install shared dependencies
echo "Installing shared dependencies..."
pip install -r shared/requirements.txt

# Install main requirements
echo "Installing main requirements..."
pip install -r requirements.txt

echo ""
echo "✓ Virtual environment setup complete!"
echo ""
echo "To activate the virtual environment, run:"
echo "  source venv/bin/activate  (Linux/Mac)"
echo "  venv\\Scripts\\activate     (Windows)"
