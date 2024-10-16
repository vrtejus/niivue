import commonjs from '@rollup/plugin-commonjs'
import { defineConfig } from 'vite'
import { glob } from 'glob'

const inputFiles = glob.sync('demos/**/*.html')
// eslint-disable-next-line no-console
console.log('input files', inputFiles)

export default defineConfig({
  root: './demos',
  optimizeDeps: {
    include: ['nifti-reader-js']
  },
  plugins: [
    commonjs({
      include: /node_modules/
    })
  ],
  build: {
    outDir: '../dist_demo',
    emptyOutDir: false,
    rollupOptions: {
      input: inputFiles,
      // input: ['demos/features/basic.multiplanar.html'],
      output: {
        inlineDynamicImports: false
      }
    }
  }
})
