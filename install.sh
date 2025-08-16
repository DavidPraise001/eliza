#!/bin/bash

echo "🚀 Setting up SEI Swap Plugin..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your PRIVATE_KEY"
else
    echo "✅ .env file already exists"
fi

# Create types directory if it doesn't exist
if [ ! -d types ]; then
    echo "📁 Creating types directory..."
    mkdir -p types
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your PRIVATE_KEY"
echo "2. Run 'npm run build' to compile TypeScript"
echo "3. Run 'npm run dev' for development mode"
echo ""
echo "For more information, see README.md"