#!/bin/bash

# CMP GitHub Pages Deployment Script
# This script builds and deploys the CMP to GitHub Pages for easy dev/demo access

set -e  # Exit on any error

echo "🚀 Starting CMP GitHub Pages Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "This directory is not a git repository. Please initialize git first:"
    echo "  git init"
    echo "  git remote add origin <your-repo-url>"
    exit 1
fi

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
    print_status "gh-pages branch already exists"
else
    print_status "Creating gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf .
    git commit --allow-empty -m "Initial gh-pages commit"
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || {
        print_error "Could not switch back to main/master branch"
        exit 1
    }
fi

# Build the project
print_status "Building the project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Please fix build errors first."
    exit 1
fi

print_success "Build completed successfully!"

# Create deployment directory
DEPLOY_DIR="deploy-temp"
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

print_status "Preparing deployment files..."

# Copy built files
cp -r dist/* $DEPLOY_DIR/

# Copy demo/test files for GitHub Pages
cp index.html $DEPLOY_DIR/
cp example/index.html $DEPLOY_DIR/demo.html
cp button-test.html $DEPLOY_DIR/
cp gvl-test.html $DEPLOY_DIR/
cp test.html $DEPLOY_DIR/

# Create a main index.html for GitHub Pages
cat > $DEPLOY_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TCF CMP v2.0 - Live Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f8f9fa;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #1f56e3;
            margin-bottom: 10px;
        }
        
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .card:hover {
            transform: translateY(-2px);
        }
        
        .card h3 {
            color: #333;
            margin-top: 0;
            margin-bottom: 15px;
        }
        
        .card p {
            color: #666;
            margin-bottom: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #1f56e3;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.2s;
        }
        
        .btn:hover {
            background: #1a4bc7;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .features {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .features ul {
            list-style: none;
            padding: 0;
        }
        
        .features li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .features li:before {
            content: "✅";
            margin-right: 10px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ TCF CMP v2.0</h1>
        <p>IAB TCF 2.2 Compliant Consent Management Platform</p>
        <p><strong>Live Demo & Testing Environment</strong></p>
    </div>

    <div class="cards">
        <div class="card">
            <h3>🎭 Full Demo</h3>
            <p>Complete demonstration of the consent management platform with all features enabled.</p>
            <a href="demo.html" class="btn">Open Full Demo</a>
        </div>

        <div class="card">
            <h3>🔘 Button Testing</h3>
            <p>Test the Accept All, Reject All, and Customize button functionality with detailed logging.</p>
            <a href="button-test.html" class="btn">Test Buttons</a>
        </div>

        <div class="card">
            <h3>🔧 GVL Fix Test</h3>
            <p>Verify that the Global Vendor List loading error has been resolved.</p>
            <a href="gvl-test.html" class="btn">Test GVL Fix</a>
        </div>

        <div class="card">
            <h3>🧪 Simple Test</h3>
            <p>Basic CMP functionality test page for quick verification.</p>
            <a href="test.html" class="btn btn-secondary">Simple Test</a>
        </div>
    </div>

    <div class="features">
        <h3>✨ Features</h3>
        <ul>
            <li>IAB TCF 2.2 Compliance</li>
            <li>Accept All / Reject All / Customize buttons</li>
            <li>Cookie storage (euconsent-v2)</li>
            <li>__tcfapi function for vendor integration</li>
            <li>Global Vendor List (GVL) support</li>
            <li>Customizable UI themes and positioning</li>
            <li>Real-time consent change events</li>
            <li>Error handling and fallback support</li>
        </ul>
    </div>

    <div class="footer">
        <p>Built with TypeScript, Vite, and IAB TCF Core library</p>
        <p>Deploy script created for easy GitHub Pages deployment</p>
    </div>

    <!-- Load the CMP for live testing -->
    <script src="cmp.bundle.iife.js"></script>
    <script>
        // Show a small notification that CMP is loaded
        window.addEventListener('tcfapi:ready', () => {
            console.log('🎉 CMP is ready! Try the demo pages above.');
        });

        // Auto-show consent banner after 2 seconds for demo
        setTimeout(() => {
            if (window.tcfCMPInstance) {
                window.tcfCMPInstance.showUI();
            }
        }, 2000);
    </script>
</body>
</html>
EOF

# Create .nojekyll file to prevent Jekyll processing
touch $DEPLOY_DIR/.nojekyll

# Create CNAME file if domain is specified
if [ ! -z "$GITHUB_PAGES_DOMAIN" ]; then
    echo "$GITHUB_PAGES_DOMAIN" > $DEPLOY_DIR/CNAME
    print_status "Added CNAME for custom domain: $GITHUB_PAGES_DOMAIN"
fi

# Switch to gh-pages branch and deploy
print_status "Deploying to gh-pages branch..."

# Stash any changes
git stash push -m "Stashing before deployment" 2>/dev/null || true

# Switch to gh-pages branch
git checkout gh-pages

# Clear existing files (except .git)
find . -maxdepth 1 -not -name '.git' -not -name '.' -not -name '..' -exec rm -rf {} +

# Copy new files
cp -r $DEPLOY_DIR/* .

# Add all files
git add .

# Commit changes
if git diff --cached --quiet; then
    print_warning "No changes to deploy"
else
    git commit -m "Deploy CMP v2.0 - $(date '+%Y-%m-%d %H:%M:%S')"
    
    print_status "Pushing to GitHub..."
    git push origin gh-pages
    
    print_success "Deployment completed!"
fi

# Switch back to main branch
git checkout main 2>/dev/null || git checkout master 2>/dev/null

# Restore stashed changes if any
git stash pop 2>/dev/null || true

# Clean up
rm -rf $DEPLOY_DIR

print_success "🎉 Deployment finished!"
echo ""
echo "Your CMP is now deployed to GitHub Pages!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Go to Settings > Pages"
echo "3. Select 'Deploy from a branch' and choose 'gh-pages'"
echo "4. Your site will be available at: https://yourusername.github.io/your-repo-name"
echo ""
echo "🔗 Available pages:"
echo "   • Main demo: /demo.html"
echo "   • Button test: /button-test.html"
echo "   • GVL test: /gvl-test.html"
echo "   • Simple test: /test.html"
echo ""
echo "💡 Tip: Set GITHUB_PAGES_DOMAIN environment variable for custom domains"
echo "   export GITHUB_PAGES_DOMAIN=your-domain.com"