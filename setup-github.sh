#!/bin/bash

# GitHub Repository Setup Script for CMP Deployment
# This script helps set up your repository for GitHub Pages deployment

set -e

echo "🚀 Setting up GitHub repository for CMP deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    print_success "Git repository initialized"
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    echo "Or run: brew install gh"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    print_status "You need to login to GitHub CLI first..."
    gh auth login
fi

# Get repository name
echo ""
read -p "Enter repository name (or press Enter for 'tcf-cmp-v2'): " REPO_NAME
REPO_NAME=${REPO_NAME:-tcf-cmp-v2}

print_status "Repository name: $REPO_NAME"

# Add all files to git
print_status "Adding files to git..."
git add .

# Commit if there are changes
if ! git diff --cached --quiet; then
    git commit -m "Initial commit: TCF CMP v2.0 with deployment setup"
    print_success "Initial commit created"
else
    print_status "No changes to commit"
fi

# Create GitHub repository
print_status "Creating GitHub repository: $REPO_NAME"
if gh repo create "$REPO_NAME" --public --description "IAB TCF 2.2 Compliant Consent Management Platform" --confirm; then
    print_success "GitHub repository created successfully"
else
    print_warning "Repository might already exist, continuing..."
fi

# Set remote origin if not set
if ! git remote get-url origin &> /dev/null; then
    print_status "Setting remote origin..."
    gh repo set-default
    print_success "Remote origin set"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
git branch -M main
git push -u origin main

print_success "Code pushed to GitHub!"

# Enable GitHub Pages
print_status "Setting up GitHub Pages..."
gh api repos/:owner/:repo --method PATCH --field has_pages=true

echo ""
print_success "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your repository: $(gh repo view --web --json url -q .url)"
echo "2. Go to Settings > Pages"
echo "3. Set source to 'GitHub Actions'"
echo "4. Your CMP will auto-deploy on every push to main branch"
echo ""
echo "🚀 Deployment options:"
echo "• Manual deployment: npm run deploy"
echo "• Auto deployment: Just push to main branch"
echo ""
echo "🔗 Your site will be available at:"
echo "   https://$(gh api user -q .login).github.io/$REPO_NAME"
echo ""
echo "💡 Available demo pages:"
echo "   • Full demo: /demo.html"
echo "   • Button test: /button-test.html"
echo "   • GVL test: /gvl-test.html"
echo "   • Simple test: /test.html"