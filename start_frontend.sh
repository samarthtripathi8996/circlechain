#!/bin/bash

# Navigate to frontend directory
cd /home/samarth-tripathi/myprojects/circlechain/circlechain.frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Set environment variable for backend API
export REACT_APP_API_URL=http://localhost:8000

# Start the React development server
echo "Starting CircleChain Frontend..."
echo "Frontend will be available at http://localhost:3000"
echo ""
echo "Make sure the backend is running at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

npm start