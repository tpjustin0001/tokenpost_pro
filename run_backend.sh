#!/bin/bash

# Navigate to backend directory
cd flask-backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the server
echo "Starting Flask Server on port 5001..."
export FLASK_APP=app.py
export FLASK_ENV=development
export PORT=5001
python app.py
