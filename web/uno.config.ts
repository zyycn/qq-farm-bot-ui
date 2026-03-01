import { presetAntd } from '@antdv-next/unocss'
import { defineConfig, presetAttributify, presetIcons, presetUno, presetWebFonts } from 'unocss'

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
    presetUno(),
    presetAttributify(),
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
    }),
    presetAntd({
      prefix: 'a',
      antPrefix: 'ant',
    }),
  ],
})
