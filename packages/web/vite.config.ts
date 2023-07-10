import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
const path = require('path')

const htmlPlugin = (vs: Record<string, any> = {}) => {
  let config
  return {
      name: "html-transform",
      configResolved(resolvedConfig) {
        config = resolvedConfig
      },
      transformIndexHtml(html: string) {
          // dev
          // if (config.command === 'serve') {
          if (1) {
            return html.replace(/{{(.*?)}}/g, function (match, p1) {
                return vs[p1.trim()]
            })
          }
          return html
          
      },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    optimizeDeps: {
      include: ['dagre']
    },
    plugins: [
      vue(),
      vueJsx(),
      htmlPlugin({
        TITLE: env.TITLE,
      }),
    ],
    server: {
      port: 3003
    },
    base: './',
    build: {
      outDir: path.resolve(__dirname, '../server/public'),
      commonjsOptions: {
        include: [/dagre/, /node_modules/],
      },
      // sourcemap: 'inline',
      // minify: false,
    },
    resolve: {
      alias: {
        '@': path.join(__dirname, "./src"),
      }
    },
  }
})