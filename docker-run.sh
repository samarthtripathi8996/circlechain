#!/bin/bash

echo "🐳 Starting Marketplace API with Docker..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start services
echo "📦 Building and starting services..."
docker-compose up --build

echo "✅ Services started!"
echo ""
echo "🌐 API available at: http://localhost:8000"
echo "📚 Interactive docs at: http://localhost:8000/docs"
echo "🗄️ Database available at: localhost:5432"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
