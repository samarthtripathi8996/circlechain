#!/bin/bash

# Circular Economy Marketplace Setup Script
echo "Setting up Circular Economy Marketplace..."

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set up environment variables
echo "Setting up environment variables..."
cat > .env << EOL
# Database
DATABASE_URL=postgresql://user:password@localhost/marketplace

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Development
DEBUG=True
EOL

echo "Please update the .env file with your actual database credentials and secret key!"

# Initialize Alembic
echo "Initializing database migrations..."
alembic init alembic

# Replace alembic env.py with our custom one
cp alembic_env.py alembic/env.py

echo "Setup complete! Don't forget to:"
echo "1. Update .env with your database credentials"
echo "2. Run 'alembic revision --autogenerate -m \"Initial migration\"'"
echo "3. Run 'alembic upgrade head'"
echo "4. Start the server with 'python main.py'"