import { presetAntd } from '@antdv-next/unocss'
import presetWebFonts from '@unocss/preset-web-fonts'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import axios from 'axios'
import { defineConfig, presetIcons, presetWind3 } from 'unocss'

export default defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'src/**/*.{js,ts}',
      ],
    },
  },
  theme: {
    colors: {
      'fill': 'var(--ant-color-fill)',
      'fill-secondary': 'var(--ant-color-fill-secondary)',
      'fill-tertiary': 'var(--ant-color-fill-tertiary)',
      'fill-quaternary': 'var(--ant-color-fill-quaternary)',
      'primary-text': 'var(--ant-color-primary-text)',
    },
  },
  presets: [
    presetWind3(),
    presetAntd({
      prefix: 'a',
      antPrefix: 'ant',
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
      processors: createLocalFontProcessor({
        cacheDir: 'node_modules/.cache/unocss/fonts',
        fontAssetsDir: 'public/assets/fonts',
        fontServeBaseUrl: '/assets/fonts',
      }),
    }),
  ],
})
