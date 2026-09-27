import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
  version: '1.109.5',
  files: 'dist/test/**/*.test.js',
})
