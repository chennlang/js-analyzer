
const path = require("upath")
import { Config } from '../types/index'

const config: Config = {
    root: '/Users/ll/Desktop/work/deepexi/deepexi-daas-catalog-web',
    ignore: ['**/node_modules/**', '**/dist/**'],
    extensions: ['.js', '.vue', '.json', 'jsx'],
    alias: {
        '@@/': '/',
        '~~/': '/',
        '@/': '/src/',
        '~/': '/src/',
    },
    outputPath: path.resolve(__dirname, './data')
}
export default config