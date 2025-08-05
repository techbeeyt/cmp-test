#!/bin/bash

# GitHub Pages Deployment Script for TCF CMP
# This script builds the project and commits to gh-pages branch

set -e

echo "🚀 Starting GitHub Pages deployment..."

# Check if we're on the gh-pages branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "gh-pages" ]; then
    echo "❌ Error: You must be on the gh-pages branch to deploy"
    echo "   Current branch: $CURRENT_BRANCH"
    echo "   Run: git checkout gh-pages"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Add built files to git
echo "📝 Adding files to git..."
git add dist/
git add index.html
git add example/
git add test.html

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to deploy"
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy: Update CMP bundle and pages $(date '+%Y-%m-%d %H:%M')"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin gh-pages

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://[YOUR-USERNAME].github.io/[YOUR-REPO-NAME]/"
echo "   (Replace [YOUR-USERNAME] and [YOUR-REPO-NAME] with your actual GitHub details)"