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
          if (config.command === 'serve') {
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
    plugins: [
      vue(),
      vueJsx(),
      htmlPlugin({
        TITLE: env.TITLE,
        ROOT: env.VITE_ROOT_PATH,
      })
    ],
    server: {
      port: 3003
    },
    base: 'dist',
    build: {
      outDir: path.resolve(__dirname, '../server/public/dist'),
    },
    alias: {
      '@': path.join(__dirname, "./src")
    }
  }
})