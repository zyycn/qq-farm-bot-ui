import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'
import viteCompression from 'vite-plugin-compression'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

const TARGET = 'http://localhost:3000'

function createProxy(path: string, extra: Record<string, any> = {}) {
  return {
    [path]: {
      target: TARGET,
      changeOrigin: true,
      ...extra,
    },
  }
}

function createPlugins(mode: string) {
  const base = [
    vue(),
    UnoCSS(),
    viteCompression({
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ]

  if (mode === 'analyzer') {
    base.push(
      analyzer({
        openAnalyzer: true,
      }),
    )
  }

  return base
}

export default defineConfig(({ mode }) => {
  return {
    plugins: createPlugins(mode),

    define: {
      __APP_VERSION__: JSON.stringify(version),
    },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      proxy: {
        ...createProxy('/socket.io', { ws: true }),
        ...createProxy('/api'),
        ...createProxy('/game-config'),
      },
    },

    build: {
      chunkSizeWarningLimit: 1000,
    },
  }
})
