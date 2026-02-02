import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/test_cases/**/*.test.mjs'],
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    environment: 'node'
  }
})