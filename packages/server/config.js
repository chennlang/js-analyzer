
module.exports = {
    root: '/Users/ll/Downloads/react-admin-master',
    extensions: ['.js', '.ts','.tsx','.vue', '.json', '.jsx'],
    ignore: ['**/node_modules/**', '**/dist/**', '**/static/**'],
    server: {
        port: 8088,
    },
    alias: {
        '@@/': '/',
        '~~/': '/',
        '@/': '/examples/',
        '~/': '/examples/',
        '@p/': '/packages/',
    },
    plugins: []
}