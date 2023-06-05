module.exports = {
    name: 'AnalyPluginNames',
    output: {
        data: [],
        map: {},
        file: 'names.json'
    },
    ScriptParser ({ file, content }) {
        const _self = this
        function set (name) {
            if (!name) return
            if (_self.output.map[name]) {
                _self.output.map[name] += 1
            } else {
                _self.output.map[name] = 1
            }
        }
        return {
            VariableDeclarator (tPath) {
                const { node } = tPath
                set(node.id ? node.id.name : '')
            },
            FunctionDeclaration (tPath) {
                const { node } = tPath
                set(node.id ? node.id.name : '')
            },
            Identifier (tPath) {
                if (!file.endsWith('.vue')) return 
                
                const vueOptions = [
                    'computed',
                    'methods',
                ]
                if (vueOptions.includes(tPath.node.name)) {
                    try {
                        tPath.parent.value.properties.forEach(node => {
                            set(node.key.name)
                        })
                    } catch (error) {
                        // 暂不处理异常
                    }
                
                }
            }
        }
    },
    AfterScriptParser () {
        this.output.data = Object.keys(this.output.map)
            .map(name => ([name, this.output.map[name]]))
    }
}