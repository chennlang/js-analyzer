const path = require('path')
const Koa = require('koa')
const router = require("koa-router")()
const koaStatic = require("koa-static")
const cors  = require('koa2-cors')
const launch = require('launch-editor')
const open = require('open')
const template = require('art-template')
const fs = require('fs')
const { JsAnalyzer } = require('@js-analyzer/core')
// const { Analy } = require('../../core/dist/js-analyzer-core.cjs')

const app = new Koa();
app.use(cors())
app.use(koaStatic(
  path.join( __dirname,  '../public/')
));

// index.html
router.get("/", async ctx => {
  ctx.set('Content-Type', 'text/html;charset=UTF-8')
  const content = template(path.resolve(__dirname, '../public/dist/index.html'), {
    TITLE: 'JsAnalyzer | 依赖分析工具',
    ROOT: ctx.config.root,
  })
  ctx.body = content
});

// open file in editor
router.get("/launch", async ctx => {
  const file = ctx.query.file
  launch(file, 'code', (name, error) => {
    ctx.body = error
  })
  ctx.body = 'ok'
});

router.get("/code", async ctx => {
  ctx.set('Content-Type', 'text/text;charset=UTF-8')
  const file = ctx.query.file
  try {
    const data = fs.readFileSync(file, 'utf-8')
    ctx.body = data
  } catch (error) {
    ctx.body = error
  }
  
});

app.use(router.routes()).use(router.allowedMethods());

function startServer (config) {
    const serverOpts = config.server = Object.assign({
      port: 8666,
      host: 'localhost',
      openBrowser: true,
    }, config.server || {})

    app.context.config = config
    
    const instance = new JsAnalyzer(config)

    instance.init().then(() => {
      app.listen(serverOpts.port, () => {
        const url = `http://${serverOpts.host}:${serverOpts.port}`
        serverOpts.openBrowser && open(url)
        console.log('\033[32m Service started:  \033[0m' + url)
      })
    })
}

module.exports = {
    start: startServer
}