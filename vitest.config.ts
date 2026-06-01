import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

process.env.NODE_ENV = 'test'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: [],
    },
  }),
)
