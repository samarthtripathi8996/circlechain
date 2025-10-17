#!/bin/bash

# Navigate to backend directory
cd /home/samarth-tripathi/myprojects/circlechain/circlechain.backend

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
echo "Starting CircleChain Backend Server..."
echo "Server will be available at http://localhost:8000"
echo "API docs will be available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py