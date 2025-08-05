# 🚀 CMP Deployment Guide

This guide explains how to easily deploy your TCF CMP v2.0 to GitHub Pages for development, testing, and demo purposes.

## 📋 Prerequisites

- Node.js and npm installed
- Git installed
- GitHub account
- GitHub CLI (optional but recommended)

## 🎯 Quick Start

### Option 1: Automatic Setup (Recommended)

1. **Install GitHub CLI** (if not already installed):
   ```bash
   # macOS
   brew install gh
   
   # Windows
   winget install --id GitHub.cli
   
   # Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   ```

2. **Run the setup script**:
   ```bash
   ./setup-github.sh
   ```
   
   This will:
   - Initialize git repository
   - Create GitHub repository
   - Set up GitHub Pages
   - Push your code
   - Enable automatic deployment

3. **That's it!** Your CMP will be available at:
   ```
   https://yourusername.github.io/your-repo-name
   ```

### Option 2: Manual Setup

1. **Create GitHub repository manually**:
   - Go to GitHub.com
   - Click "New repository"
   - Name it (e.g., "tcf-cmp-v2")
   - Make it public
   - Don't initialize with README

2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Set source to "GitHub Actions"

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## 🛠️ Deployment Commands

| Command | Description |
|---------|-------------|
| `npm run deploy` | Manual deployment to GitHub Pages |
| `npm run deploy:manual` | Build and deploy in one command |
| `./deploy.sh` | Run deployment script directly |
| `./setup-github.sh` | Complete GitHub setup (one-time) |

## 🔄 How It Works

### Automatic Deployment (GitHub Actions)

The `.github/workflows/deploy.yml` file automatically:
1. Triggers on every push to `main` branch
2. Installs dependencies
3. Builds the project
4. Creates deployment files
5. Deploys to GitHub Pages

### Manual Deployment

The `deploy.sh` script:
1. Builds the project
2. Creates a `gh-pages` branch
3. Copies built files
4. Creates demo pages
5. Pushes to GitHub Pages

## 📄 Demo Pages

Your deployed CMP includes several demo pages:

| Page | URL | Description |
|------|-----|-------------|
| **Main Demo** | `/` | Landing page with navigation |
| **Full Demo** | `/demo.html` | Complete CMP demonstration |
| **Button Test** | `/button-test.html` | Test Accept/Reject/Customize buttons |
| **GVL Test** | `/gvl-test.html` | Test Global Vendor List loading |
| **Simple Test** | `/test.html` | Basic functionality test |

## ⚙️ Configuration

### Custom Domain

To use a custom domain:

1. **Set environment variable**:
   ```bash
   export GITHUB_PAGES_DOMAIN=your-domain.com
   ./deploy.sh
   ```

2. **Or create CNAME manually**:
   ```bash
   echo "your-domain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

### Build Configuration

The deployment uses your existing Vite configuration from `vite.config.ts`. To customize:

1. **Modify build settings** in `vite.config.ts`
2. **Update deployment script** in `deploy.sh` if needed
3. **Rebuild and deploy**:
   ```bash
   npm run deploy
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   chmod +x deploy.sh setup-github.sh
   ```

2. **GitHub CLI Not Authenticated**:
   ```bash
   gh auth login
   ```

3. **Build Fails**:
   ```bash
   npm run lint
   npm run build
   ```

4. **Pages Not Updating**:
   - Check GitHub Actions tab for build status
   - Verify GitHub Pages source is set to "GitHub Actions"
   - Clear browser cache

### Debug Deployment

1. **Check GitHub Actions logs**:
   - Go to repository > Actions tab
   - Click on latest workflow run
   - Check build and deploy logs

2. **Test locally**:
   ```bash
   npm run build
   npm run preview
   ```

3. **Verify deployment files**:
   ```bash
   git checkout gh-pages
   ls -la  # Check deployed files
   git checkout main
   ```

## 🌐 Live Testing

Once deployed, you can test your CMP:

1. **Open browser console** on your GitHub Pages site
2. **Check for CMP logs**:
   ```javascript
   console.log('CMP loaded:', !!window.tcfCMPInstance);
   console.log('API available:', typeof __tcfapi);
   ```

3. **Test API functions**:
   ```javascript
   __tcfapi('ping', 2, console.log);
   __tcfapi('getTCData', 2, console.log);
   ```

## 🔐 Security Notes

- The deployment is public by default
- Sensitive configuration should use environment variables
- API keys should not be committed to the repository
- Consider using GitHub Secrets for production deployments

## 📚 Next Steps

After deployment:

1. **Test all functionality** using the demo pages
2. **Share the link** with stakeholders for testing
3. **Monitor GitHub Actions** for automatic deployments
4. **Update documentation** as needed
5. **Set up monitoring** for production use

## 🤝 Contributing

To contribute to the deployment setup:

1. Fork the repository
2. Make your changes
3. Test the deployment process
4. Submit a pull request

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review GitHub Actions logs
3. Test locally first
4. Check GitHub Pages settings
5. Verify DNS configuration (for custom domains)

---

**Happy Deploying!** 🎉