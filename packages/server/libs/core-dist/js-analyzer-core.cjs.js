'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var compiler = require('@vue/compiler-dom');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var compiler__default = /*#__PURE__*/_interopDefaultLegacy(compiler);

function addNum(obj, key, origin) {
    if (obj[key]) {
        obj[key].num += 1;
        obj[key].using.push(origin);
    }
    else {
        obj[key] = {
            num: 1,
            using: [origin]
        };
    }
}
/**
 * 将引用信息插入到导入物料包中
 * @param quoteMap 引用物料
 * @param exportMap 导出物料
 */
function injectExportQuoteNum(quoteMap, exportMap) {
    Object.keys(quoteMap).forEach(function (key) {
        var depMap = quoteMap[key];
        var files = Object.keys(depMap);
        var _loop_1 = function (i) {
            var file = files[i];
            var dep = depMap[file];
            dep.using.forEach(function (varItem) {
                var targetFile = exportMap[file];
                if (targetFile) {
                    var vars = varItem.vars.split(',');
                    vars.forEach(function (m) {
                        addNum(targetFile, m, varItem.fullPath);
                    });
                }
            });
        };
        for (var i = 0; i < files.length; i++) {
            _loop_1(i);
        }
    });
}

var _a = require("winston"), createLogger = _a.createLogger, format = _a.format, transports = _a.transports;
var logger = createLogger({
    format: format.combine(format.colorize(), format.label({ label: 'Js Analyzer' }), format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }), format.align(), format.prettyPrint()),
    transports: [
        new transports.Console(),
    ]
});

var traverse = require("@babel/traverse")["default"];
var parser = require("@babel/parser");
var t = require('@babel/types');
/**
 * js 文件解析器
 * @param {String} content js 文件 source
 * @returns importDeps 引用信息
 * @returns exportInfo 导出信息
 */
function scriptParser(content, file, config) {
    // 收集依赖
    var importDeps = [];
    var exportInfo = {};
    // 转为 AST 语法树
    var ast = parser.parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        presets: ['@babel/preset-env'],
        plugins: [
            ["decorators", { decoratorsBeforeExport: true }],
            'asyncGenerators',
            'bigInt',
            'classProperties',
            'classPrivateProperties',
            'classPrivateMethods',
            'legacy-decorators',
            'doExpressions',
            'dynamicImport',
            'exportDefaultFrom',
            'exportNamespaceFrom',
            'functionBind',
            'functionSent',
            'importMeta',
            'logicalAssignment',
            'nullishCoalescingOperator',
            'numericSeparator',
            'objectRestSpread',
            'optionalCatchBinding',
            'optionalChaining',
            ['pipelineOperator', { proposal: 'minimal' }],
            'throwExpressions',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            'typescript',
            'jsx',
        ]
    });
    // custom plugins
    var plugins = config.plugins || [];
    var scriptsPlugins = plugins.filter(function (p) { return p.ScriptParser; });
    scriptsPlugins.forEach(function (plugin) {
        var opt = plugin.ScriptParser ? plugin.ScriptParser({
            file: file,
            content: content
        }) : {};
        traverse(ast, opt);
        plugin.AfterScriptParser && plugin.AfterScriptParser();
    });
    traverse(ast, {
        // 静态 Import
        ImportDeclaration: function (tPath) {
            var node = tPath.node;
            var vars = node.specifiers.map(function (specifier) {
                switch (specifier.type) {
                    case 'ImportNamespaceSpecifier': {
                        // 引入的别名
                        // 例如：import * as api from '@/api', 获取到的就是 api
                        var specifierName = specifier.local.name;
                        var binding = tPath.scope.getBinding(specifierName);
                        // 遍历使用别名的地方
                        var localVars = binding.referencePaths.map(function (referencePath) {
                            // 没有引用别名的地方
                            if (referencePath.parentPath.node && referencePath.parentPath.node.property) {
                                return referencePath.parentPath.node.property.name;
                            }
                            return undefined;
                        });
                        return localVars.filter(Boolean).join(',');
                    }
                    case 'ImportDefaultSpecifier': {
                        return 'Default';
                    }
                    case 'ImportSpecifier': {
                        return specifier.imported.name;
                    }
                }
            });
            importDeps.push({
                source: node.source.value,
                vars: vars.join(','),
                loc: node.loc
            });
        },
        // export
        ExportNamedDeclaration: function (tPath) {
            // export { a,b,c }
            if (tPath.node.specifiers.length) {
                tPath.node.specifiers.forEach(function (item) {
                    exportInfo[item.local.name] = {
                        num: 0,
                        using: []
                    };
                });
            }
            else { // export const a = 'aaa' / export function a
                if (!tPath.node.declaration) {
                    logger.info('unknown export: ' + file);
                    return;
                }
                if (tPath.node.declaration.id) {
                    exportInfo[tPath.node.declaration.id.name] = {
                        num: 0,
                        using: []
                    };
                }
                else if (tPath.node.declaration.declarations) {
                    tPath.node.declaration.declarations.forEach(function (item) {
                        exportInfo[item.id.name] = {
                            num: 0,
                            using: []
                        };
                    });
                }
                else {
                    logger.info('unknown export: ' + file);
                }
            }
        },
        // export default
        ExportDefaultDeclaration: function () {
            exportInfo['Default'] = {
                num: 0,
                using: []
            };
        },
        // require | 动态 Import
        CallExpression: function (tPath) {
            var node = tPath.node;
            if (node.callee.type === 'Import' && node.arguments[0].value) {
                importDeps.push({
                    source: node.arguments[0].value,
                    vars: 'Default',
                    loc: node.loc
                });
            }
            if (node.callee &&
                node.callee.name === 'require'
                && node.arguments[0]
                && node.arguments[0].value) {
                importDeps.push({
                    source: node.arguments[0].value,
                    vars: 'requireDefault',
                    loc: node.loc
                });
            }
        },
        // module.exports
        AssignmentExpression: function (tPath) {
            var node = tPath.node;
            var left = node.left;
            // module.exports = {} || module.exports.x = xxx
            if ((t.isMemberExpression(left) &&
                left.object.name === 'module' &&
                left.property.name === 'exports') ||
                (t.isMemberExpression(left) &&
                    left.object.object &&
                    left.object.object.name === 'module' &&
                    left.object.property.name === 'exports')) {
                exportInfo['Default'] = {
                    num: 0,
                    using: []
                };
            }
        }
    });
    return {
        importDeps: importDeps,
        exportInfo: exportInfo
    };
}

/**
 * doc
 * https://astexplorer.net/#/2uBU1BLuJ1
 * https://www.postcss.com.cn/api/#atrule-type
 */
var postcss = require('postcss');
var postcssLess = require('postcss-less');
var postcssSass = require('postcss-sass');
var postcssScss = require('postcss-scss');
/**
 *
 * @param {String} content js 文件 source
 * @returns importDeps 引用信息
 * @returns exportInfo 导出信息
 */
// @ts-ignore
var parserRules = {
    'background': function (val) {
        var res = val.match(/url\((.+)\)/i);
        return res ? res[1] : null;
    },
    'background-image': function (val) {
        var res = val.match(/url\((.+)\)/i);
        return res ? res[1] : null;
    }
};
var getParser = function (lang) {
    switch (lang) {
        case 'css':
            return postcss.parse;
        case 'less':
            return postcssLess.parse;
        case 'sass':
            return postcssSass.parse;
        case 'scss':
            return postcssScss.parse;
        default:
            return postcss.parse;
    }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function styleParser(content, lang, _config) {
    if (lang === void 0) { lang = 'css'; }
    // 收集依赖
    var importDeps = [];
    var exportInfo = {};
    var parser = getParser(lang);
    var root = parser(content);
    // rule
    root.walkRules(function (rule) {
        rule.nodes.forEach(function (node) {
            var prop = node.prop;
            if (parserRules[prop]) {
                var path = parserRules[prop](node.value);
                path && importDeps.push({
                    source: path,
                    vars: 'css@background',
                    loc: node.loc
                });
            }
        });
    });
    // at root
    root.walkAtRules(function (rule) {
        if (rule.name === 'import') {
            importDeps.push({
                source: rule.params.replace(/['"]/g, ''),
                vars: 'css@import',
                loc: {}
            });
        }
    });
    return {
        importDeps: importDeps,
        exportInfo: exportInfo
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function htmlParser(html, _file, _config) {
    // 收集依赖
    var importDeps = [];
    var exportInfo = {};
    var parse = compiler__default["default"].parse, transform = compiler__default["default"].transform;
    var visitor = function (node) {
        if (node.type !== 1 /* NodeTypes.ELEMENT */) {
            return;
        }
        node.props.forEach(function (attr) {
            var _a;
            if (['img'].includes(node.tag) && 'value' in attr && attr.name === 'src') { // eg: src="../xxx.png"
                importDeps.push({
                    source: ((_a = attr.value) === null || _a === void 0 ? void 0 : _a.content) || '',
                    vars: 'html@src',
                    loc: node.loc
                });
            }
            if ('exp' in attr && attr.exp && 'content' in attr.exp) { // eg: :src="require('./xxx.png')"
                var match = attr.exp.content.match(/require\(['"].+['"]\)/g); // ['require('a')', 'require('b')']
                match === null || match === void 0 ? void 0 : match.forEach(function (item) {
                    var _a, _b;
                    importDeps.push({
                        source: (_b = (_a = item.match(/require\(['"](.+)['"]\)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : '',
                        vars: 'html@src',
                        loc: node.loc
                    });
                });
            }
        });
    };
    var ast = parse(html, { comments: true });
    transform(ast, {
        nodeTransforms: [visitor]
    });
    return {
        importDeps: importDeps,
        exportInfo: exportInfo
    };
}

var del = require('del');
var fs$1 = require('fs');
var path$1 = require("path");
// function isArray (v: unknown) {
//     return Object.prototype.toString.call(v) === '[object Array]'
// }
/**
 * 写入文件
 * @param {String} name 文件名
 * @param {String} data 文件内容
 */
function writeFile(name, data, outputPath) {
    if (!outputPath) {
        throw new Error('outputPath must be in the config file');
    }
    !fs$1.existsSync(outputPath) && fs$1.mkdirSync(outputPath);
    // logger.info('文件写入中：' + name)
    // 修复：data 过长导致 JSON.stringify 报错
    // if (isArray(data)) {
    //     data = '[' + data.map((m: any) => JSON.stringify(m, null, 2)).join(",")  +']'
    // }
    fs$1.writeFile(path$1.resolve(outputPath, name), JSON.stringify(data, null, 2), 'utf-8', function (error) {
        if (error)
            logger.error("write\uFF1A\u5199\u5165\u6587\u4EF6\u5931\u8D25 ".concat(name));
    });
}
/**
 * 清理文件
 */
function clearDist(outputPath) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!fs$1.existsSync(outputPath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, del.sync(["".concat(outputPath, "/**"), '!publicDir'], {
                            force: true
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}

var fs = require('fs');
var path = require("path");
var fg = require('fast-glob');
var vueParse = require('@vue/compiler-sfc').parse;
// --------------------------------------------------------global variable-------------------------------------
var defEmptyDeps = function () { return ({
    importDeps: [],
    exportInfo: {}
}); };
// --------------------------------------------------------functions-------------------------------------
function defDependencies(filePath) {
    var dependenciesFile = fs.readFileSync(filePath);
    // 生产依赖
    var dependencies = Object.keys(JSON.parse(dependenciesFile).dependencies || {});
    var dep = dependencies.reduce(function (obj, key) {
        obj[key] = { num: 0, using: [] };
        return obj;
    }, {});
    return {
        dep: dep,
        dependencies: dependencies
    };
}
/**
 * 解析路径中的别名
 * @param {String} targetPath 带解析目标文件路径
 * @param {String} filePath 当前所在文件路径
 * @returns
 */
function resolvePath(targetPath, filePath, config) {
    var alias = config.alias;
    // 相对|绝对路径
    var relativePathReg = /^\.\/|^\.\.\//;
    if (relativePathReg.test(targetPath)) {
        var dir = path.dirname(filePath);
        return path.resolve(dir, targetPath);
    }
    // 别名倒序，先匹配较长的：例如 'ant/c' | 'ant' 会先匹配 'ant/c', 匹配到就结束
    var aliasKeys = Object.keys(alias).sort().reverse();
    for (var _i = 0, aliasKeys_1 = aliasKeys; _i < aliasKeys_1.length; _i++) {
        var key = aliasKeys_1[_i];
        var val = alias[key];
        if (targetPath.indexOf(key) === 0) {
            return path.join(config.root, val, targetPath.substring(key.length));
        }
    }
    return targetPath;
}
/**
 * 自动添加文件扩展名
 * @param {*} filePath 文件路径
 * @returns 待后缀名的文件路径
 */
function addExtension(filePath, config) {
    if (path.extname(filePath) === '' && filePath.indexOf(config.root) > -1) {
        var extFile = config.extensions.find(function (ext) { return fs.existsSync(filePath + ext); });
        // 是否存在 name.ext
        if (!extFile) {
            var indexExt = config.extensions.find(function (ext) { return fs.existsSync(path.resolve(filePath, 'index' + ext)); });
            // 是否存在 name/index.ext
            if (!indexExt) {
                var baseName_1 = path.basename(filePath);
                var sameNameExt = config.extensions.find(function (ext) { return fs.existsSync(path.resolve(filePath, baseName_1 + ext)); });
                // 是否存在 name/name.ext
                if (!sameNameExt) {
                    return filePath;
                }
                return path.resolve(filePath, baseName_1 + sameNameExt);
            }
            return path.resolve(filePath, 'index' + indexExt);
        }
        return filePath + extFile;
    }
    return filePath;
}
/**
 * 解析返回依赖全路径
 * @param {String} targetPath 需要解析的路径
 * @param {String} filePath 当前所在文件路径
 * @returns targetPath 的全路径
 */
function getDepFullPath(targetPath, filePath, config) {
    // 去掉前单引号 | 双引号
    var s = targetPath.replace(/(^['"])|(['"]$)/g, '');
    var r = resolvePath(s, filePath, config);
    var f = addExtension(r, config);
    return f;
}
/**
 * 搜集文件依赖信息和导出信息
 * @param {String} file 文件路径
 * @returns importDeps, exportInfo
 */
function getFileDeps(file, config) {
    var extname = path.extname(file);
    // 目前仅支持以下文件解析
    var supportExts = [
        '.js',
        '.mjs',
        '.jsx',
        '.ts',
        '.tsx',
        '.vue',
        '.scss',
        '.less',
        '.css',
        '.html'
    ];
    if (!supportExts.includes(extname)) {
        return defEmptyDeps();
    }
    // 读取文件
    var fileContent = fs.readFileSync(file, 'utf-8');
    if (['.js', '.mjs', '.jsx', '.ts', '.tsx',].includes(extname)) {
        return scriptParser(fileContent, file, config);
    }
    if (['.css', '.less', '.scss'].includes(extname)) {
        return styleParser(fileContent, extname.replace('.', ''));
    }
    if (extname === '.html') {
        return htmlParser(fileContent);
    }
    if (extname === '.vue') {
        var descriptor = vueParse(fileContent).descriptor;
        // script deps
        var scriptDeps = defEmptyDeps();
        if (descriptor.script || descriptor.scriptSetup) {
            var content = '';
            if (descriptor.script) {
                content = descriptor.script.content;
            }
            if (descriptor.scriptSetup) {
                content = descriptor.scriptSetup.content;
            }
            scriptDeps = scriptParser(content, file, config);
        }
        // style deps
        var styleDeps = descriptor.styles.reduce(function (pre, style) {
            var d = styleParser(style.content, style.lang);
            Object.assign(pre.importDeps, d.importDeps);
            Object.assign(pre.exportInfo, d.exportInfo);
            return pre;
        }, defEmptyDeps());
        // html deps
        var htmlDeps = defEmptyDeps();
        if (descriptor.template) {
            htmlDeps = htmlParser(descriptor.template.content);
        }
        return {
            importDeps: Object.assign([], scriptDeps.importDeps, styleDeps.importDeps, htmlDeps.importDeps),
            // TODO: 由于 exportInfo 是一个对象，会导致 assign 合并时存在重名覆盖
            // 目前看来问题不到，因为引用了同一个文件两次只采集到一次也合理
            // 但是如果 source 不一样就有问题了，例如 @import './css.css', @import '~/css.css'
            // 上面的情况是同一个文件会被认为是两个文件
            exportInfo: Object.assign({}, scriptDeps.exportInfo, styleDeps.exportInfo, htmlDeps.exportInfo)
        };
    }
    logger.error("getFileDeps\uFF1A\u672A\u88AB\u5904\u7406\u7684\u6587\u4EF6\u683C\u5F0F".concat(extname));
    return defEmptyDeps();
}
/**
 * 注入 export 依赖
 * @param {Object} info 文件导出信息
 * @param {String} file 文件路径
 */
function injectExportInfo(info, file, exportQuote) {
    exportQuote[file] = info;
}
/**
 * 注入依赖
 * @param {Array} deps 文件依赖信息
 * @param {String} file 文件路径
 */
function injectFileDeps(deps, file, fileQuote, packageQuote, dependencies, unknownQuote, config) {
    var _loop_1 = function (item) {
        var source = item.source, vars = item.vars, loc = item.loc;
        var depName = getDepFullPath(source, file, config);
        var targetKey = dependencies.find(function (key) {
            if (depName.startsWith('@')) { // package name has namespace
                return depName.startsWith(key);
            }
            else {
                return depName.split('/')[0] === key;
            }
        });
        // 生产依赖
        if (targetKey) {
            packageQuote[targetKey].num += 1;
            packageQuote[targetKey].using.push({ source: source, vars: vars, fullPath: file, loc: loc });
        }
        else if (fileQuote[depName]) { // 文件依赖
            fileQuote[depName].num += 1;
            fileQuote[depName].using.push({ source: source, vars: vars, fullPath: file, loc: loc });
        }
        else { // 未知依赖
            if (unknownQuote[depName]) {
                unknownQuote[depName].num += 1;
                unknownQuote[depName].using.push({
                    source: source,
                    vars: vars,
                    fullPath: file,
                    loc: loc
                });
            }
            else {
                unknownQuote[depName] = {
                    num: 1,
                    using: [{
                            source: source,
                            vars: vars,
                            fullPath: file,
                            loc: loc
                        }]
                };
            }
        }
    };
    for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
        var item = deps_1[_i];
        _loop_1(item);
    }
}
// ---------------------------------------------execute------------------------------------------------
/**
 * 主程序
 */
function main(config) {
    return tslib.__awaiter(this, void 0, void 0, function () {
        var fileQuote, exportQuote, unknownQuote, configPath, searchPath, files, packages, packageQuote, dependencies;
        return tslib.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!config.root) {
                        throw new Error('root must be in the config file');
                    }
                    fileQuote = {};
                    exportQuote = {};
                    unknownQuote = {};
                    configPath = config.path || config.root;
                    searchPath = fs.lstatSync(configPath).isDirectory()
                        ? configPath + '/**/*'
                        : configPath;
                    return [4 /*yield*/, fg([searchPath], {
                            ignore: config.ignore || ['**/node_modules/**', '**/dist/**']
                        })
                        // 同一个项目下可能存在多个 package.json 文件，这里主要是合并所有依赖信息
                    ];
                case 1:
                    files = _a.sent();
                    packages = files.filter(function (file) { return file.endsWith('package.json'); })
                        .map(function (file) { return defDependencies(file); });
                    packageQuote = packages
                        .reduce(function (collector, item) {
                        Object.assign(collector, item.dep);
                        return collector;
                    }, {});
                    dependencies = packages
                        .reduce(function (collector, item) {
                        collector = Array.from(new Set(tslib.__spreadArray(tslib.__spreadArray([], collector, true), item.dependencies, true)));
                        return collector;
                    }, []);
                    files.forEach(function (file) {
                        fileQuote[file] = {
                            num: 0,
                            using: [],
                            deps: []
                        };
                    });
                    files.forEach(function (file) {
                        try {
                            var _a = getFileDeps(file, config), importDeps = _a.importDeps, exportInfo = _a.exportInfo;
                            fileQuote[file].deps = importDeps;
                            injectFileDeps(importDeps, file, fileQuote, packageQuote, dependencies, unknownQuote, config);
                            injectExportInfo(exportInfo, file, exportQuote);
                        }
                        catch (error) {
                            logger.error(error, {
                                fn: 'main',
                                file: file
                            });
                        }
                    });
                    injectExportQuoteNum({
                        packageQuote: packageQuote,
                        unknownQuote: unknownQuote,
                        fileQuote: fileQuote
                    }, exportQuote);
                    return [2 /*return*/, {
                            files: files,
                            fileQuote: fileQuote,
                            exportQuote: exportQuote,
                            packageQuote: packageQuote,
                            unknownQuote: unknownQuote
                        }];
            }
        });
    });
}
var JsAnalyzer = /** @class */ (function () {
    function JsAnalyzer(config) {
        this.materialPackage = {
            'import-files': {},
            'import-package': {},
            'import-unknown': {},
            'files': [],
            'export': {}
        };
        this.config = config;
    }
    /**
     *
     * @param config 配置文件
     * @returns MaterialPackage 物料包
     */
    JsAnalyzer.prototype.init = function (config) {
        return tslib.__awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return tslib.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.config = Object.assign(this.config, config);
                        _a = this.config.outputPath;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, clearDist(this.config.outputPath)];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        return [2 /*return*/, main(this.config)
                                .then(function (res) {
                                _this.materialPackage = {
                                    'import-files': res.fileQuote,
                                    'import-package': res.packageQuote,
                                    'import-unknown': res.unknownQuote,
                                    'files': res.files,
                                    'export': res.exportQuote
                                };
                                _this.config.outputPath && _this.write();
                                _this.config.outputPath && _this.writeFromPlugin();
                                return _this.materialPackage;
                            })];
                }
            });
        });
    };
    /**
     * 获取依赖信息
     * @returns data 依赖信息
     */
    JsAnalyzer.prototype.getData = function () {
        return this.materialPackage;
    };
    /**
     * 将输出信息写入文件
     */
    JsAnalyzer.prototype.write = function () {
        var _this = this;
        Object.keys(this.materialPackage).forEach(function (name) {
            writeFile(name + '.json', _this.materialPackage[name], _this.config.outputPath);
        });
    };
    JsAnalyzer.prototype.writeFromPlugin = function () {
        var _this = this;
        var plugins = this.config.plugins || [];
        var dataPlugins = plugins.filter(function (plugin) { return plugin.output && plugin.output.data; });
        dataPlugins.forEach(function (plugin) {
            writeFile(plugin.output.file, plugin.output.data, _this.config.outputPath);
        });
    };
    return JsAnalyzer;
}());

exports.JsAnalyzer = JsAnalyzer;
