# TCF CMP v2.0

IAB TCF 2.2 Compliant Consent Management Platform

## Development

### Quick Start

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Start development server:**
   ```bash
   yarn dev
   ```

3. **Open in browser:**
   The development server will automatically open at `http://localhost:5173`

### Development Features

- **Hot Module Replacement (HMR):** Changes to source files automatically reload the page
- **Fast Refresh:** TypeScript and CSS changes are reflected immediately
- **Development Indicators:** Visual indicators show when HMR is active (only in development mode)
- **Real-time Updates:** Current time display to confirm the page is live (development mode)
- **Conditional Features:** Development features automatically hide in production

### Development Scripts

- `yarn dev` - Start development server
- `yarn dev:open` - Start dev server and open browser automatically
- `yarn dev:host` - Start dev server accessible from other devices on network
- `yarn build` - Build for production
- `yarn preview` - Preview production build locally

### Development Workflow

1. Make changes to files in the `src/` directory
2. Save the file
3. The browser will automatically reload with your changes
4. Test the CMP functionality using the development interface

### Smart Mode Detection

The interface automatically detects whether it's running in development or production mode:

- **Development Mode** (localhost:5173/5174): Shows HMR indicator, development info, and real-time clock
- **Production Mode** (any other domain): Shows production info and hides development features

### Troubleshooting

If the development server isn't working properly:

1. **Clear cache:**
   ```bash
   rm -rf node_modules/.vite
   ```

2. **Restart the server:**
   ```bash
   yarn dev
   ```

3. **Check for TypeScript errors:**
   ```bash
   yarn lint
   ```

## Production

### Building for Production

```bash
yarn build
```

This creates optimized files in the `dist/` directory.

### CDN Files

For CDN hosting, use these files:
- `tcfapi-stub.min.js` - TCF API stub (load first)
- `dist/cmp.bundle.iife.js` - Main CMP bundle

### Integration Example

```html
<!-- Load the TCF API stub first (required for TCF compliance) -->
<script src="https://your-cdn.com/tcfapi-stub.min.js"></script>

<!-- Load the main CMP bundle -->
<script src="https://your-cdn.com/cmp.bundle.iife.js"></script>

<!-- Optional: Configure the CMP -->
<script>
window.TCF_CMP_CONFIG = {
    cmpId: 333, // Your registered CMP ID
    cmpVersion: 1,
    uiOptions: {
        theme: 'light',
        position: 'bottom',
        primaryColor: '#1f56e3'
    }
};
</script>
```

## Testing

```bash
yarn test
```

## License

MIT
