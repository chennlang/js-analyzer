const fs = require('fs')
const postcss = require('postcss')
const path = require('path');

const css = fs.readFileSync(path.resolve(__dirname, '../test/test.less'));
const root = postcss.parse(css);

const parsers = {
    'background': (val) => {
        const res = val.match(/url\((.+)\)/i)
        return res ? res[1] : null
    },
    'background-image': (val) => {
        const res = val.match(/url\((.+)\)/i)
        return res ? res[1] : null
    },
}

const imports = []
console.log(root.nodes)
root.walkRules(rule => {
    rule.nodes.forEach(node => {
        if (parsers[node.prop]) {
            const path = parsers[node.prop](node.value)
            path && imports.push(path)
        }
    })
})

// at root
root.walkAtRules((rule) => {
    if (rule.name === 'import') {
        imports.push(rule.params.replace(/['"]/g, ''))
    }
})

console.log(imports)

