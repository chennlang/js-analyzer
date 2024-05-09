const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const router = require("koa-router")();
const open = require("open");
const koaStatic = require("koa-static");
const cors = require("koa2-cors");
const launch = require("launch-editor");
const template = require("art-template");
const portfinder = require("portfinder");
const { koaBody } = require("koa-body");
const { JsAnalyzer } = require("@js-analyzer/core");

const app = new Koa();
app.use(cors());
app.use(koaBody());
app.use(koaStatic(path.join(__dirname, "../public/")));

// index.html
router.get("/", async (ctx) => {
  ctx.set("Content-Type", "text/html;charset=UTF-8");
  const content = template(
    path.resolve(__dirname, "../libs/web-dist/index.html"),
    {
      TITLE: "JsAnalyzer | 依赖分析工具",
      ROOT: ctx.config.root,
    }
  );
  ctx.body = content;
});

router.get("/config", (ctx) => {
  ctx.body = ctx.config;
});

router.put("/config", async (ctx) => {
  if (!ctx.request.body) {
    ctx.status = 500;
    ctx.body = "config error or null";
    return;
  }

  app.context.config = ctx.request.body;
  const instance = new JsAnalyzer(ctx.request.body);
  await instance
    .init()
    .then(() => {
      ctx.body = "ok";
    })
    .catch((error) => {
      console.log(error);
      ctx.status = 500;
      ctx.body = error.toString();
    });
});

// open file in editor
router.get("/launch", async (ctx) => {
  const file = ctx.query.file;
  launch(file, "code", (name, error) => {
    ctx.body = error;
  });
  ctx.body = "ok";
});

router.get("/code", async (ctx) => {
  ctx.set("Content-Type", "text/text;charset=UTF-8");
  const file = ctx.query.file;
  try {
    const data = fs.readFileSync(file, "utf-8");
    ctx.body = data;
  } catch (error) {
    ctx.body = error;
  }
});

app.use(router.routes()).use(router.allowedMethods());

function startListen(config) {
  portfinder.setBasePort(config.server.port);
  portfinder.getPort({ port: 8000, stopPort: 9000 }, function (err, port) {
    if (err) {
      console.log(err);
    } else {
      app.listen(port);
      const url = `http://${config.server.host}:${port}`;
      config.server.openBrowser && open(url);
      console.log("\033[32m Service started:  \033[0m" + url);
    }
  });
}

function startServer(c) {
  const config = {
    ...c,
    server: {
      port: 8666,
      host: "localhost",
      openBrowser: true,
      ...(c.server || {}),
    },
  };

  app.context.config = config;
  const instance = new JsAnalyzer(config);
  console.log("\033[32m Generating dependency information...  \033[0m");
  instance.init().then(() => {
    startListen(config);
  });
}

module.exports = {
  start: startServer,
};
