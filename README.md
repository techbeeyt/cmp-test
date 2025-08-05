# TCF 2.2 Compliant CMP

A fully IAB TCF 2.2-compliant Consent Management Platform (CMP) built with TypeScript.

## 🚀 Features

- ✅ **Full IAB TCF 2.2 Compliance** - Adheres to all IAB TCF v2.2 specifications
- ✅ **TypeScript Implementation** - Type-safe, modern codebase
- ✅ **Global Vendor List Integration** - Automatic GVL fetching and caching
- ✅ **TC String Generation** - Valid consent string creation using @iabtcf/core
- ✅ **Complete TCF API** - Full __tcfapi implementation with all required methods
- ✅ **Responsive UI** - Mobile-friendly consent interface
- ✅ **Customizable Theming** - Configurable colors, positioning, and styling
- ✅ **Persistent Storage** - Cookie and localStorage-based consent persistence
- ✅ **Event System** - Comprehensive event handling for integration
- ✅ **Accessibility Support** - Keyboard navigation and screen reader friendly
- ✅ **Lightweight Bundle** - Optimized for fast loading

## 🏗️ Architecture

```
src/
├── core/           # Core CMP logic and TCF API implementation
├── storage/        # Consent data persistence
├── gvl/           # Global Vendor List management
├── ui/            # User interface components
├── types/         # TypeScript type definitions
├── config/        # Constants and configuration
└── main.ts        # Entry point and initialization
```

## 📦 Installation

### Option 1: Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd tcf-cmp-v2

# Install dependencies
npm install

# Build the CMP
npm run build

# The built CMP will be available at dist/cmp.bundle.js
```

### Option 2: Direct Integration

Include the built CMP bundle directly in your HTML:

```html
<script src="path/to/cmp.bundle.js"></script>
```

## 🔧 Configuration

### Basic Configuration

The CMP can be configured by setting a global configuration object before the script loads:

```html
<script>
window.TCF_CMP_CONFIG = {
    cmpId: 123,                    // Your registered CMP ID
    cmpVersion: 1,                 // Your CMP version
    cookieMaxAgeSeconds: 33696000, // 13 months
    defaultLang: 'en',
    gvlLocation: 'https://vendor-list.consensu.org/v2/vendor-list.json',
    storeConsentGlobally: false,
    uiOptions: {
        theme: 'light',            // 'light' or 'dark'
        position: 'bottom',        // 'bottom', 'top', or 'center'
        primaryColor: '#1f56e3',
        showVendorCount: true,
        showPurposeDescriptions: true
    }
};
</script>
<script src="path/to/cmp.bundle.js"></script>
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cmpId` | number | 1 | Your IAB-registered CMP ID |
| `cmpVersion` | number | 1 | Version of your CMP implementation |
| `cookieMaxAgeSeconds` | number | 33696000 | Consent cookie expiration (13 months) |
| `defaultLang` | string | 'en' | Default language code |
| `gvlLocation` | string | IAB URL | Custom GVL endpoint URL |
| `storeConsentGlobally` | boolean | false | Whether consent applies globally |
| `uiOptions.theme` | string | 'light' | UI theme ('light' or 'dark') |
| `uiOptions.position` | string | 'bottom' | Banner position |
| `uiOptions.primaryColor` | string | '#1f56e3' | Primary UI color |

## 🛠️ API Usage

### TCF API (__tcfapi)

The CMP exposes the standard `__tcfapi` function for integration:

```javascript
// Check if GDPR applies
__tcfapi('ping', 2, function(pingData) {
    console.log('GDPR applies:', pingData.gdprApplies);
    console.log('CMP loaded:', pingData.cmpLoaded);
});

// Get current consent data
__tcfapi('getTCData', 2, function(tcData, success) {
    if (success) {
        console.log('TC String:', tcData.tcString);
        console.log('Purpose consents:', tcData.purpose.consents);
        console.log('Vendor consents:', tcData.vendor.consents);
    }
});

// Listen for consent changes
__tcfapi('addEventListener', 2, function(tcData, success) {
    if (success) {
        console.log('Consent event:', tcData.eventStatus);
        // Handle consent changes
    }
});

// Remove event listener
__tcfapi('removeEventListener', 2, function(success) {
    console.log('Listener removed:', success);
}, listenerId);
```

### Custom Events

The CMP also emits custom events for easier integration:

```javascript
// CMP ready
window.addEventListener('tcfapi:ready', function() {
    console.log('CMP is initialized and ready');
});

// Consent changes
window.addEventListener('tcfapi:consentchanged', function(event) {
    console.log('New consent data:', event.detail);
});

// UI visibility changes
window.addEventListener('tcfapi:uishown', function() {
    console.log('Consent UI is now visible');
});

window.addEventListener('tcfapi:uihidden', function() {
    console.log('Consent UI is now hidden');
});

// Errors
window.addEventListener('tcfapi:error', function(event) {
    console.error('CMP error:', event.detail);
});
```

### Programmatic Control

Access the CMP instance for advanced control:

```javascript
// Get the CMP instance
const cmp = window.tcfCMPInstance;

// Show consent UI manually
cmp.showUI();

// Hide consent UI
cmp.hideUI();

// Reset consent (clears data and shows UI)
cmp.resetConsent();

// Get current consent data
cmp.getConsentData().then(tcData => {
    console.log('Current consent:', tcData);
});
```

## 🧪 Testing & Validation

### Running Tests

```bash
npm test
```

### TCF Validator

Test your CMP implementation with the official IAB TCF Validator:
1. Visit the [IAB TCF Validator](https://www.iabgdpr.eu/tcf-2-0-validator/)
2. Enter your website URL with the CMP installed
3. Verify compliance with TCF 2.2 specifications

### Manual Testing Checklist

- [ ] CMP loads without errors
- [ ] Consent banner appears on first visit
- [ ] All three options work (Accept All, Reject All, Customize)
- [ ] Purpose toggles function correctly
- [ ] Vendor toggles function correctly
- [ ] Consent persists across page reloads
- [ ] TC String is valid and properly encoded
- [ ] __tcfapi responds to all commands
- [ ] Event listeners work correctly

## 🔐 Compliance & Privacy

### IAB TCF 2.2 Compliance

This CMP implements all required features of IAB TCF 2.2:

- ✅ Consent string generation (TC String)
- ✅ Global Vendor List integration
- ✅ Purpose and vendor consent management
- ✅ Special features and legitimate interests
- ✅ Consent persistence and expiration
- ✅ Publisher restrictions support
- ✅ Service-specific vs. global consent

### GDPR Compliance

- ✅ Clear consent mechanism
- ✅ Granular consent controls
- ✅ Consent withdrawal capability
- ✅ Data minimization principles
- ✅ Transparent privacy information

### Security Features

- 🔒 No third-party data leakage
- 🔒 Secure cookie attributes (Secure, SameSite)
- 🔒 XSS protection through proper escaping
- 🔒 Content Security Policy compatibility

## 🌍 Browser Support

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Support

The CMP UI is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Responsive layout
- Proper viewport handling
- Accessibility support

## 🎨 Customization

### Custom Styling

Override CSS variables to customize the appearance:

```css
:root {
    --tcf-primary-color: #your-color;
    --tcf-background-color: #ffffff;
    --tcf-text-color: #333333;
    --tcf-border-color: #dddddd;
}
```

### Custom UI

For complete UI customization, you can:

1. Extend the `ConsentUI` class
2. Override specific methods
3. Implement your own UI using the `CMPCore` class

```typescript
import { CMPCore } from './core/CMPCore';
import { CustomUI } from './ui/CustomUI';

const cmp = new CMPCore(config);
const ui = new CustomUI(cmp);
```

## 🚀 Development

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm test
```

### Project Structure

```
├── src/
│   ├── core/           # Core CMP logic
│   ├── storage/        # Data persistence
│   ├── gvl/           # Global Vendor List
│   ├── ui/            # User interface
│   ├── types/         # TypeScript types
│   └── config/        # Configuration
├── example/           # Demo implementation
├── dist/             # Built files
└── tests/            # Test files
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**CMP not initializing:**
- Check browser console for errors
- Verify script is loaded correctly
- Ensure configuration is valid

**Consent not persisting:**
- Check if cookies are enabled
- Verify domain configuration
- Check browser storage settings

**UI not appearing:**
- Check if consent already exists
- Verify CSS is loading correctly
- Check for JavaScript errors

### Getting Help

1. Check the [Issues](../../issues) page for similar problems
2. Review the [TCF 2.2 specification](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework)
3. Create a new issue with detailed information

## 📚 Resources

- [IAB TCF 2.2 Specification](https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework)
- [Global Vendor List](https://vendor-list.consensu.org/)
- [TCF Validator](https://www.iabgdpr.eu/tcf-2-0-validator/)
- [@iabtcf/core Documentation](https://www.npmjs.com/package/@iabtcf/core)
- [@iabtcf/cmpapi Documentation](https://www.npmjs.com/package/@iabtcf/cmpapi)

## 🏷️ Version History

### v1.0.0
- Initial release
- Full TCF 2.2 compliance
- Responsive UI
- Complete API implementation
- TypeScript support