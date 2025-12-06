import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Content script 构建配置 - 打包成 IIFE 格式
export default defineConfig({
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
        // 内联所有依赖
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: 'terser',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
