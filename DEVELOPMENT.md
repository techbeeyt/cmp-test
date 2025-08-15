# Development Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Start development server:**
   ```bash
   yarn dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:5173`

## Development Environment Features

### ✅ Hot Module Replacement (HMR)
- Changes to TypeScript files automatically reload the page
- CSS changes are applied instantly without page reload
- Development indicators show when HMR is active

### ✅ Fast Development Workflow
- No need to rebuild after changes
- Instant feedback on code modifications
- Real-time error reporting in browser console

### ✅ Development Indicators
- Visual indicator in top-right corner shows HMR is active
- Console logs show development mode is active
- Current time display confirms page is live

## Development Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server |
| `yarn dev:open` | Start dev server and open browser |
| `yarn dev:host` | Start dev server accessible from network |
| `yarn build` | Build for production |
| `yarn preview` | Preview production build |
| `yarn test` | Run tests |
| `yarn lint` | Run linting |

## File Structure

```
src/
├── core/           # Core CMP logic
│   └── CMPCore.ts  # Main CMP implementation
├── ui/             # User interface
│   └── ConsentUI.ts # Consent banner and modal
├── storage/        # Data persistence
│   └── StorageManager.ts
├── gvl/           # Global Vendor List
│   └── GVLManager.ts
├── types/         # TypeScript definitions
│   └── index.ts
├── config/        # Configuration
│   └── constants.ts
└── main.ts        # Entry point
```

## Making Changes

### 1. Edit Source Files
Make changes to files in the `src/` directory. The browser will automatically reload.

### 2. Test Changes
Use the development interface to test your changes:
- Click "Check Status" to verify CMP initialization
- Click "Show Consent UI" to test the interface
- Use browser console to see development logs

### 3. Debug Issues
- Check browser console for errors
- Use browser dev tools to inspect elements
- Add `console.log()` statements for debugging

## Common Development Tasks

### Adding New Features
1. Create new files in appropriate directories
2. Import and use in main.ts
3. Test immediately with HMR

### Modifying UI
1. Edit `src/ui/ConsentUI.ts`
2. Changes appear instantly in browser
3. Test on different screen sizes

### Updating Configuration
1. Modify `src/config/constants.ts`
2. Or update configuration in `src/main.ts`
3. Changes take effect immediately

### Adding New Types
1. Edit `src/types/index.ts`
2. TypeScript will show errors if types are incorrect
3. Fix any type errors that appear

## Troubleshooting

### Development Server Not Working
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart server
yarn dev
```

### TypeScript Errors
```bash
# Check for type errors
yarn lint

# Fix auto-fixable issues
yarn lint --fix
```

### Browser Not Reloading
1. Check if HMR indicator is visible
2. Ensure you're editing files in `src/` directory
3. Check browser console for errors
4. Try hard refresh (Ctrl+F5 / Cmd+Shift+R)

### CMP Not Initializing
1. Check browser console for errors
2. Verify `tcfapi-stub.min.js` is loading
3. Check if TypeScript compilation is successful
4. Look for development mode logs in console

## Development Best Practices

### 1. Use TypeScript Strictly
- Always define proper types
- Use interfaces for object shapes
- Avoid `any` type when possible

### 2. Test Frequently
- Test changes immediately after making them
- Use the development interface buttons
- Check console for errors

### 3. Keep Console Clean
- Remove debug logs before committing
- Use proper error handling
- Add meaningful console messages

### 4. Follow File Structure
- Put new files in appropriate directories
- Use consistent naming conventions
- Import from correct paths

## Production Build

When ready to deploy:

```bash
# Build for production
yarn build

# Preview production build
yarn preview
```

The built files will be in the `dist/` directory.

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Source Maps | ✅ Full | ✅ Minified |
| Bundle Size | ❌ Large | ✅ Optimized |
| Error Messages | ✅ Detailed | ❌ Minimal |
| Console Logs | ✅ Verbose | ❌ Minimal |

## Next Steps

1. Start the development server: `yarn dev`
2. Make changes to source files
3. See changes instantly in browser
4. Test functionality thoroughly
5. Build for production when ready
