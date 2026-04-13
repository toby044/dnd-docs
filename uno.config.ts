import { defineConfig, presetUno, presetIcons, presetWebFonts } from 'unocss'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'JetBrains Mono:400,500',
      },
    }),
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    'btn-primary': 'btn bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
    'btn-ghost': 'btn hover:bg-white/10 text-stone-300',
    'btn-danger': 'btn bg-red-600 text-white hover:bg-red-700',
    'input-field': 'w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
    'sidebar-item': 'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors',
    'sidebar-item-active': 'sidebar-item bg-indigo-600/20 text-indigo-300',
    'sidebar-item-inactive': 'sidebar-item text-stone-400 hover:bg-stone-800 hover:text-stone-200',
  },
  theme: {
    colors: {
      surface: {
        DEFAULT: '#1c1917',
        light: '#292524',
        lighter: '#44403c',
      },
    },
  },
})
