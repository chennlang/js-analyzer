#!/usr/bin/env node

const server = require('../src/index')
const path = require('path')
const AnalyPluginNames  = require('../plugins/analy-plugin-names')
const { program } = require('commander');


// 默认配置
const defaultConfig = {
    root: '',
    ignore: ['**/node_modules/**', '**/dist/**'],
    extensions: ['.js', '.ts','.tsx','.vue', '.json', 'jsx'],
    alias: {
        '@@/': '/',
        '~~/': '/',
        '@/': '/src/',
        '~/': '/src/',
    },
    outputPath: path.resolve(__dirname, '../public/data'),
    server: {
        port: 8088,
        host: 'localhost',
        openBrowser: false,
    },
    plugins: [
        AnalyPluginNames,
    ],
}


program
  .version(`${require('../package').version}`, '-v, --version')
  .option('-c, --config [file]', 'config file path')
  .option('-r, --root [file]', 'root path');

program.parse(process.argv);

function isObject (v) {
    return Object.prototype.toString.call(v) === '[object Object]'
}

function isArray (v) {
    return Object.prototype.toString.call(v) === '[object Array]'
}

function mergeConfig (config, target) {
    const appendAttrs = [
        'ignore',
        'plugins',
        'server',
    ]
    const res = {}
    Object.keys(config).forEach(attr => {
        // replace attrs
        if (!appendAttrs.includes(attr)) {
            res[attr] = target[attr] || config[attr]
        } else {
            // need merger
            if (isObject(config[attr]) && isObject(target[attr])) {
                res[attr] = Object.assign(config[attr], target[attr])
            } else if (isArray(config[attr]) && isArray(target[attr])) {
                res[attr] = config[attr].concat(target[attr])
            } else {
                res[attr] = target[attr] || config[attr]
            }
        }
        
    })
    return res
}

let config = defaultConfig
if (program._optionValues.config) {
    const configPath = program._optionValues.config
    config = mergeConfig(config, require(path.resolve(process.cwd(), configPath)))
}
if (program._optionValues.root) {
    config.root = path.resolve(process.cwd(), program._optionValues.root)
}

server.start(config)

