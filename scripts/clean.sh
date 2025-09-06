#!/bin/bash

echo "🧹 Cleaning Socket Game project..."

# Stop Docker containers
echo "🐳 Stopping Docker containers..."
docker-compose down -v

# Remove node_modules
echo "🗑️  Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Remove dist/build folders
echo "🗑️  Removing build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec rm -rf '{}' +

# Remove coverage reports
echo "🗑️  Removing coverage reports..."
find . -name "coverage" -type d -prune -exec rm -rf '{}' +

# Remove log files
echo "🗑️  Removing log files..."
find . -name "*.log" -type f -delete

echo "✅ Cleanup complete!"