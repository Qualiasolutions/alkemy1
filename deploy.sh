#!/bin/bash
echo "================================"
echo "Deploying Alkemy to Vercel Prod"
echo "================================"
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found. Building first..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed!"
        exit 1
    fi
fi

echo "✅ Build directory found"
echo ""

# Deploy
echo "🚀 Deploying to Vercel Production..."
echo ""

vercel deploy --prod --yes

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ Deployment successful!"
    echo "================================"
else
    echo ""
    echo "================================"
    echo "❌ Deployment failed!"
    echo "================================"
    exit 1
fi
