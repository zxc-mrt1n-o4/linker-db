#!/bin/bash

echo "🚀 Starting Linker Database API Server..."

# Wait a moment for the database to be ready
echo "⏳ Waiting for database connection..."
sleep 5

# Push database schema
echo "📊 Creating database tables..."
npm run db:push

# Seed initial data
echo "🌱 Seeding database with initial data..."
npm run db:seed

# Start the server
echo "🎯 Starting server..."
npm start
