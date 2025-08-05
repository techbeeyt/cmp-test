import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  
  return {
    // Development server configuration
    server: {
      port: 5173,
      open: true,
      host: true
    },
    
    // Build configuration for library
    build: isDev ? {} : {
      lib: {
        entry: resolve(__dirname, 'src/main.ts'),
        name: 'TCFCMP',
        fileName: 'cmp.bundle',
        formats: ['iife']
      },
      rollupOptions: {
        output: {
          // Ensure the global variable name is accessible
          extend: true,
          globals: {
            // No external dependencies for the bundle
          }
        }
      },
      minify: 'terser',
      sourcemap: true
    },
    
    // Common configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production')
    }
  };
});