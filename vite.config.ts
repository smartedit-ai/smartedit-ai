import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// Content script 单独构建配置
const contentScriptConfig = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.tsx'),
      name: 'SmartEditContent',
      formats: ['iife'],
      fileName: () => 'content/content.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        assetFileNames: 'content/[name][extname]',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

// 主构建配置
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // 复制 manifest.json 到 dist
        copyFileSync('manifest.json', 'dist/manifest.json')
        // 复制图标
        const iconsDir = 'dist/assets/icons'
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })
        const sizes = [16, 32, 48, 128]
        sizes.forEach(size => {
          const src = `assets/icons/icon${size}.png`
          const dest = `dist/assets/icons/icon${size}.png`
          if (existsSync(src)) copyFileSync(src, dest)
        })
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background/background.js'
          return '[name]/[name].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name][extname]'
        }
      }
    },
    cssCodeSplit: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})

export { contentScriptConfig }
