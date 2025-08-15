# 🆔 CMP ID Configuration Guide

## What is a CMP ID?

A **CMP ID** (Consent Management Platform ID) is a unique identifier assigned by the IAB (Interactive Advertising Bureau) to registered Consent Management Platforms. This ID is used in TC Strings to identify which CMP generated the consent data.

## 🚨 The Problem

The error you encountered:
```
TCModelError: invalid value 1 passed for cmpId
```

This occurs because **CMP ID 1 is not a valid registered CMP ID** according to the IAB TCF specification.

## ✅ Valid CMP ID Ranges

According to the IAB TCF specification, valid CMP IDs fall into these ranges:

### **Registered CMP IDs (Production Use)**
- **Range**: 2-999
- **Status**: Reserved for registered CMPs
- **Usage**: Production websites must use a registered CMP ID

### **Development/Testing CMP IDs**
- **Range**: 1000-9999
- **Status**: Available for development and testing
- **Usage**: Safe to use for development, testing, and demos

### **Reserved Ranges**
- **1**: Reserved by IAB (causes validation errors)
- **10000+**: Reserved for future use

## 🔧 How to Fix the Issue

### **Option 1: Use Development CMP ID (Recommended for Testing)**

```javascript
// Use a development CMP ID (1000-9999 range)
window.TCF_CMP_CONFIG = {
    cmpId: 1234,  // Development CMP ID
    cmpVersion: 1,
    // ... other config
};
```

### **Option 2: Register Your CMP (Production Use)**

For production websites, you must register your CMP with the IAB:

1. **Visit**: [IAB Europe CMP Registration](https://www.iabeurope.eu/cmp-registration/)
2. **Submit**: Application for CMP registration
3. **Receive**: Official CMP ID (2-999 range)
4. **Use**: The assigned CMP ID in your configuration

### **Option 3: Use Existing CMP ID (If You Have One)**

If you already have a registered CMP ID:

```javascript
window.TCF_CMP_CONFIG = {
    cmpId: 123,  // Your registered CMP ID
    cmpVersion: 1,
    // ... other config
};
```

## 📝 Updated Configuration

### **Development Configuration**

```javascript
// For development and testing
window.TCF_CMP_CONFIG = {
    cmpId: 1234,                    // Development CMP ID
    cmpVersion: 1,                  // Your CMP version
    cookieMaxAgeSeconds: 33696000,  // 13 months
    defaultLang: 'en',
    gvlLocation: 'https://cdn.trydatacops.com/v3/vendor-list.json',
    storeConsentGlobally: false,
    uiOptions: {
        theme: 'light',
        position: 'bottom',
        primaryColor: '#1f56e3',
        showVendorCount: true,
        showPurposeDescriptions: true
    }
};
```

### **Production Configuration**

```javascript
// For production (after registering with IAB)
window.TCF_CMP_CONFIG = {
    cmpId: 123,                     // Your registered CMP ID
    cmpVersion: 1,                  // Your CMP version
    cookieMaxAgeSeconds: 33696000,  // 13 months
    defaultLang: 'en',
    gvlLocation: 'https://vendor-list.consensu.org/v2/vendor-list.json',
    storeConsentGlobally: false,
    uiOptions: {
        theme: 'light',
        position: 'bottom',
        primaryColor: '#1f56e3',
        showVendorCount: true,
        showPurposeDescriptions: true
    }
};
```

## 🧪 Testing with Development CMP ID

The CMP has been updated to use **CMP ID 123** for development purposes. This should resolve the validation error you encountered.

### **Test the Fix**

1. **Build the CMP**:
   ```bash
   npm run build
   ```

2. **Test locally**:
   ```bash
   npm run preview
   ```

3. **Open test page**: `test-enhanced-vendors.html`

4. **Try the consent flow**: The error should be resolved

## 🔍 Validation

### **Check CMP ID Validity**

```javascript
// In browser console
if (window.tcfCMPInstance) {
    const config = window.tcfCMPInstance.getCore().config;
    console.log('Current CMP ID:', config.cmpId);
    console.log('CMP Version:', config.cmpVersion);
}
```

### **Test TC String Generation**

```javascript
// Test consent saving
if (window.tcfCMPInstance) {
    const purposeConsents = { 1: true, 2: false };
    const vendorConsents = { 1: true, 2: false };
    
    window.tcfCMPInstance.getCore().saveConsent(
        purposeConsents, 
        vendorConsents, 
        {}
    ).then(() => {
        console.log('Consent saved successfully!');
    }).catch(error => {
        console.error('Consent save failed:', error);
    });
}
```

## 📋 CMP Registration Process

### **Step 1: Prepare Documentation**
- CMP technical specifications
- Privacy policy
- Data processing documentation
- Compliance documentation

### **Step 2: Submit Application**
- Visit [IAB Europe CMP Registration](https://www.iabeurope.eu/cmp-registration/)
- Complete the application form
- Submit required documentation

### **Step 3: Review Process**
- IAB reviews your application
- Technical compliance verification
- Privacy compliance verification

### **Step 4: Approval**
- Receive official CMP ID
- Get listed in IAB CMP registry
- Begin production use

## 🚀 Quick Start for Development

### **1. Use Development CMP ID**
```javascript
window.TCF_CMP_CONFIG = {
    cmpId: 1234,  // Any number between 1000-9999
    cmpVersion: 1
};
```

### **2. Test Functionality**
```bash
npm run dev
# Open http://localhost:5173
```

### **3. Verify No Errors**
- Check browser console for errors
- Test consent saving functionality
- Verify TC String generation

## 🔐 Production Considerations

### **Before Going Live**
1. ✅ Register CMP with IAB
2. ✅ Get official CMP ID
3. ✅ Update configuration
4. ✅ Test with production GVL
5. ✅ Validate with IAB TCF Validator

### **Compliance Requirements**
- GDPR compliance
- TCF 2.2 specification compliance
- Privacy policy requirements
- Data processing documentation

## 📞 Support

If you continue to experience issues:

1. **Check CMP ID range**: Ensure you're using 1000-9999 for development
2. **Verify configuration**: Double-check your CMP configuration
3. **Test with minimal config**: Start with just `cmpId` and `cmpVersion`
4. **Check browser console**: Look for additional error messages

## 🎯 Summary

- **Development**: Use CMP ID 1234 (or any 1000-9999)
- **Production**: Register with IAB and use assigned CMP ID (2-999)
- **Never use**: CMP ID 1 (reserved by IAB)
- **Test thoroughly**: Before deploying to production

The CMP should now work correctly with the updated development CMP ID!
