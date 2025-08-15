#!/bin/bash

# Deploy CMP to GitHub Pages
echo "🚀 Deploying CMP to GitHub Pages..."

# Build the project
echo "📦 Building project..."
yarn build

# Check if build was successful
if [ ! -f "dist/cmp.bundle.iife.js" ]; then
    echo "❌ Build failed! dist/cmp.bundle.iife.js not found."
    exit 1
fi

# Check if required files exist
if [ ! -f "tcfapi-stub.min.js" ]; then
    echo "❌ tcfapi-stub.min.js not found!"
    exit 1
fi

if [ ! -f "index.html" ]; then
    echo "❌ index.html not found!"
    exit 1
fi

echo "✅ Build successful!"

# Add files to git
echo "📝 Adding files to git..."
git add dist/
git add index.html
git add tcfapi-stub.min.js

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy CMP v2.0 to GitHub Pages - $(date)"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Deployment complete!"
echo "🌐 Your CMP will be available at: https://yourusername.github.io/your-repo-name/"
echo "📋 Make sure to configure GitHub Pages in your repository settings:"
echo "   Settings → Pages → Source: Deploy from a branch → Branch: main → Save"