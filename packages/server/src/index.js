const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const router = require('koa-router')();
const open = require('open');
const koaStatic = require('koa-static');
const cors = require('koa2-cors');
const launch = require('launch-editor');
const template = require('art-template');
const portfinder = require('portfinder');
const { koaBody } = require('koa-body');
const { ProjectManager, createEmptyMaterialPackage } = require('./project-manager');

const app = new Koa();
app.use(cors());
app.use(koaBody());
app.use(koaStatic(path.join(__dirname, '../public/')));
app.use(koaStatic(path.join(__dirname, '../libs/web-dist')));

function getProjectManager(ctx) {
  return ctx.projectManager || app.context.projectManager;
}

function getProjectId(ctx) {
  return ctx.query.projectId || (ctx.request.body && ctx.request.body.projectId) || '';
}

function getActiveProjectConfig(ctx) {
  const projectManager = getProjectManager(ctx);
  return projectManager.getActiveProjectConfig();
}

function sendError(ctx, error, status = 500) {
  ctx.status = status;
  ctx.body = {
    message: error && error.message ? error.message : String(error),
  };
}

function getProjectRoot(ctx, projectId) {
  const projectManager = getProjectManager(ctx);
  const project = projectManager.getProjectById(projectId || projectManager.activeProjectId);
  return project && project.config ? project.config.root : '';
}

function getProjectIde(ctx, projectId) {
  const projectManager = getProjectManager(ctx);
  const project = projectManager.getProjectById(projectId || projectManager.activeProjectId);
  return project && project.config ? project.config.ide : 'code';
}

function resolveLaunchFile(filePath, rootPath) {
  if (!filePath) {
    return '';
  }

  if (rootPath && filePath.startsWith(rootPath)) {
    return filePath;
  }

  if (rootPath && filePath.startsWith('/')) {
    return path.join(rootPath, filePath);
  }

  return filePath;
}

router.get('/', async (ctx) => {
  ctx.set('Content-Type', 'text/html;charset=UTF-8');
  const content = template(path.resolve(__dirname, '../libs/web-dist/index.html'), {
    TITLE: 'JsAnalyzer | 依赖分析工具',
    ROOT: (getActiveProjectConfig(ctx) || {}).root || '',
  });
  ctx.body = content;
});

router.get('/config', (ctx) => {
  ctx.body = getActiveProjectConfig(ctx);
});

router.put('/config', async (ctx) => {
  const config = ctx.request.body;
  const projectManager = getProjectManager(ctx);
  const activeProject = projectManager.getActiveProject();

  if (!activeProject) {
    sendError(ctx, new Error('No active project'), 400);
    return;
  }

  try {
    await projectManager.updateProject(activeProject.id, {
      ...config,
      name: config.name || activeProject.name,
    });
    ctx.body = projectManager.getActiveProjectConfig();
  } catch (error) {
    sendError(ctx, error);
  }
});

router.get('/api/projects', (ctx) => {
  ctx.body = getProjectManager(ctx).getProjectSnapshot();
});

router.post('/api/projects', async (ctx) => {
  try {
    const project = await getProjectManager(ctx).createProject(ctx.request.body || {});
    ctx.body = {
      project,
      ...getProjectManager(ctx).getProjectSnapshot(),
    };
  } catch (error) {
    sendError(ctx, error);
  }
});

router.post('/api/projects/import', async (ctx) => {
  try {
    const root = ctx.request.body && ctx.request.body.root;
    if (!root) {
      sendError(ctx, new Error('Project root is required'), 400);
      return;
    }

    const project = await getProjectManager(ctx).importProject(root);
    ctx.body = {
      project,
      ...getProjectManager(ctx).getProjectSnapshot(),
    };
  } catch (error) {
    sendError(ctx, error);
  }
});

router.put('/api/projects/active', async (ctx) => {
  try {
    const projectId = ctx.request.body && ctx.request.body.projectId;
    if (!projectId) {
      sendError(ctx, new Error('projectId is required'), 400);
      return;
    }

    const project = await getProjectManager(ctx).setActiveProject(projectId);
    ctx.body = {
      project,
      ...getProjectManager(ctx).getProjectSnapshot(),
    };
  } catch (error) {
    sendError(ctx, error, 404);
  }
});

router.put('/api/projects/:id', async (ctx) => {
  try {
    const project = await getProjectManager(ctx).updateProject(ctx.params.id, ctx.request.body || {});
    ctx.body = {
      project,
      ...getProjectManager(ctx).getProjectSnapshot(),
    };
  } catch (error) {
    sendError(ctx, error, 404);
  }
});

router.put('/api/projects/:id/refresh', async (ctx) => {
  try {
    const project = await getProjectManager(ctx).refreshProject(ctx.params.id);
    ctx.body = {
      project,
      ...getProjectManager(ctx).getProjectSnapshot(),
    };
  } catch (error) {
    sendError(ctx, error, 404);
  }
});

router.delete('/api/projects/:id', (ctx) => {
  try {
    ctx.body = getProjectManager(ctx).deleteProject(ctx.params.id);
  } catch (error) {
    sendError(ctx, error, 404);
  }
});

router.get('/api/projects/:id/data/:fileName', (ctx) => {
  const fileName = ctx.params.fileName;
  const defaults = createEmptyMaterialPackage();
  if (!(fileName in defaults)) {
    sendError(ctx, new Error(`Unknown data file: ${fileName}`), 404);
    return;
  }

  ctx.body = getProjectManager(ctx).getProjectData(ctx.params.id, fileName) || defaults[fileName];
});

router.get('/api/projects/:id/cache/:fileName', (ctx) => {
  const data = getProjectManager(ctx).getProjectCacheFile(
    ctx.params.id,
    ctx.params.fileName
  );

  if (data === null) {
    sendError(ctx, new Error(`Cache file not found: ${ctx.params.fileName}`), 404);
    return;
  }

  ctx.body = data;
});

router.get('/launch', async (ctx) => {
  const file = ctx.query.file;
  const projectId = getProjectId(ctx);
  const rootPath = getProjectRoot(ctx, projectId);
  const targetFile = resolveLaunchFile(file, rootPath);

  launch(targetFile, getProjectIde(ctx, projectId), (name, error) => {
    ctx.body = error;
  });
  ctx.body = 'ok';
});

router.get('/api/launch', async (ctx) => {
  const file = ctx.query.file;
  const projectId = getProjectId(ctx);
  const rootPath = getProjectRoot(ctx, projectId);
  const targetFile = resolveLaunchFile(file, rootPath);

  launch(targetFile, getProjectIde(ctx, projectId), (name, error) => {
    ctx.body = error;
  });
  ctx.body = { ok: true };
});

router.get('/code', async (ctx) => {
  ctx.set('Content-Type', 'text/text;charset=UTF-8');
  const file = ctx.query.file;
  try {
    const data = fs.readFileSync(file, 'utf-8');
    ctx.body = data;
  } catch (error) {
    ctx.body = error;
  }
});

router.get('/api/code', async (ctx) => {
  ctx.set('Content-Type', 'text/text;charset=UTF-8');
  const file = ctx.query.file;
  try {
    const data = fs.readFileSync(file, 'utf-8');
    ctx.body = data;
  } catch (error) {
    sendError(ctx, error, 404);
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
      console.log('\u001b[32m Service started:  \u001b[0m' + url);
    }
  });
}

async function startServer(c) {
  const config = {
    ...c,
    server: {
      port: 8666,
      host: 'localhost',
      openBrowser: true,
      storagePath: process.cwd(),
      ...(c.server || {}),
    },
  };

  const projectManager = new ProjectManager(config);
  app.context.projectManager = projectManager;

  console.log('\u001b[32m Generating dependency information...  \u001b[0m');
  await projectManager.init();
  startListen(config);
}

module.exports = {
  start: startServer,
};
