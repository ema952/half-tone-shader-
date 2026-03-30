import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

const isLib = process.env.BUILD_LIB === 'true'

export default defineConfig({
  plugins: [
    react(),
    ...(isLib
      ? [dts({ include: ['src/index.ts', 'src/HalftoneCanvas.tsx', 'src/types.ts'] })]
      : []),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  ...(isLib && {
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'HalftoneShader',
        formats: ['es', 'cjs'],
        fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: { react: 'React', 'react-dom': 'ReactDOM' },
        },
      },
    },
  }),
})
