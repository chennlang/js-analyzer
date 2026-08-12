const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { JsAnalyzer } = require('@js-analyzer/core');

const CACHE_FILE_NAMES = [
  'files.json',
  'import-files.json',
  'import-package.json',
  'import-unknown.json',
  'export.json',
  'auto-imports.json',
];

const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  'out',
];

const DEFAULT_EXTENSIONS = ['.js', '.ts', '.tsx', '.vue', '.json', '.jsx'];

function createEmptyMaterialPackage() {
  return {
    files: [],
    'import-files': {},
    export: {},
    'import-package': {},
    'import-unknown': {},
    'auto-imports': {},
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    return null;
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function normalizeSlash(targetPath) {
  return targetPath.replace(/\\/g, '/');
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeAliasKey(key) {
  const normalized = normalizeSlash(String(key || ''))
    .replace(/\*+$/g, '')
    .replace(/\/+/g, '/');

  if (!normalized) {
    return '';
  }

  return ensureTrailingSlash(normalized);
}

function normalizeAliasValue(value) {
  let normalized = normalizeSlash(String(value || ''))
    .replace(/\*+$/g, '')
    .replace(/\/+/g, '/');

  normalized = normalized.replace(/^\.\//, '').replace(/^\//, '');
  normalized = ensureTrailingSlash(normalized || '');

  return `/${normalized}`.replace(/\/+/g, '/');
}

function normalizeExtensions(extensions) {
  const list = Array.isArray(extensions) ? extensions : [];
  const normalized = list
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((item) => (item.startsWith('.') ? item : `.${item}`));

  return Array.from(new Set(normalized));
}

function normalizeIgnore(ignore) {
  if (Array.isArray(ignore)) {
    return Array.from(
      new Set(
        ignore
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof ignore === 'string') {
    return Array.from(
      new Set(
        ignore
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  return [];
}

function normalizeAlias(alias) {
  if (!alias || Object.prototype.toString.call(alias) !== '[object Object]') {
    return {};
  }

  return Object.keys(alias).reduce((collector, key) => {
    const normalizedKey = normalizeAliasKey(key);
    const normalizedValue = normalizeAliasValue(alias[key]);

    if (normalizedKey && normalizedValue) {
      collector[normalizedKey] = normalizedValue;
    }

    return collector;
  }, {});
}

function buildProjectName(inputName, rootPath) {
  if (inputName && String(inputName).trim()) {
    return String(inputName).trim();
  }

  if (rootPath) {
    return path.basename(rootPath);
  }

  return 'Untitled Project';
}

function sanitizeProjectPayload(payload) {
  const root = payload.root ? path.resolve(String(payload.root).trim()) : '';
  const extensions = normalizeExtensions(payload.extensions);
  const ignore = normalizeIgnore(payload.ignore);
  const alias = normalizeAlias(payload.alias);

  return {
    name: buildProjectName(payload.name, root),
    root,
    extensions: extensions.length ? extensions : DEFAULT_EXTENSIONS.slice(),
    ignore,
    alias,
    ide: payload.ide ? String(payload.ide).trim() : 'code',
  };
}

function serializeProject(project) {
  return {
    id: project.id,
    name: project.name,
    source: project.source,
    version: project.version,
    status: project.status,
    lastError: project.lastError,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastAnalyzedAt: project.lastAnalyzedAt,
    config: {
      root: project.config.root,
      ignore: project.config.ignore,
      extensions: project.config.extensions,
      alias: project.config.alias,
      ide: project.config.ide,
    },
  };
}

function readPackageName(rootPath) {
  const packageJson = safeReadJson(path.join(rootPath, 'package.json'));
  return packageJson && packageJson.name ? String(packageJson.name) : '';
}

function readTsconfigAlias(rootPath) {
  const configFile =
    safeReadJson(path.join(rootPath, 'tsconfig.json')) ||
    safeReadJson(path.join(rootPath, 'jsconfig.json'));

  if (!configFile || !configFile.compilerOptions) {
    return {};
  }

  const compilerOptions = configFile.compilerOptions;
  const baseUrl = String(compilerOptions.baseUrl || '.');
  const paths = compilerOptions.paths || {};

  return Object.keys(paths).reduce((collector, key) => {
    const firstPath = Array.isArray(paths[key]) ? paths[key][0] : '';
    if (!firstPath) {
      return collector;
    }

    const normalizedKey = normalizeAliasKey(key);
    const relativePath = path.posix.normalize(
      normalizeSlash(path.posix.join(baseUrl, firstPath.replace(/\*+$/g, '')))
    );
    const normalizedValue = normalizeAliasValue(relativePath);

    if (normalizedKey && normalizedValue) {
      collector[normalizedKey] = normalizedValue;
    }

    return collector;
  }, {});
}

function collectProjectFiles(rootPath, limit = 4000) {
  const stack = [rootPath];
  const files = [];

  while (stack.length && files.length < limit) {
    const current = stack.pop();
    let entries = [];

    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      if (files.length >= limit) {
        break;
      }

      if (entry.name.startsWith('.git')) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (DEFAULT_IGNORE_DIRS.includes(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function inferExtensions(files) {
  const supportedExtensions = new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.vue',
    '.json',
    '.mjs',
    '.cjs',
    '.css',
    '.less',
    '.scss',
    '.html',
  ]);

  const found = files.reduce((collector, filePath) => {
    const ext = path.extname(filePath);
    if (supportedExtensions.has(ext)) {
      collector.add(ext);
    }
    return collector;
  }, new Set());

  const extensionList = Array.from(found);
  return extensionList.length ? extensionList.sort() : DEFAULT_EXTENSIONS.slice();
}

function inferAliasBySource(rootPath, files) {
  const aliasMap = {};
  const sampleFiles = files.filter((filePath) => {
    return ['.js', '.jsx', '.ts', '.tsx', '.vue'].includes(path.extname(filePath));
  });

  const patterns = [
    ['@@/', '/src/.umi/'],
    ['~~/', '/src/.umi/'],
    ['@/', '/src/'],
    ['~/', '/src/'],
  ];

  const srcExists = fs.existsSync(path.join(rootPath, 'src'));
  const umiExists = fs.existsSync(path.join(rootPath, 'src/.umi'));

  if (!srcExists) {
    return aliasMap;
  }

  for (const filePath of sampleFiles.slice(0, 200)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      patterns.forEach(([key, target]) => {
        if (content.includes(key)) {
          if (key.startsWith('@@') || key.startsWith('~~')) {
            if (umiExists) {
              aliasMap[key] = target;
            }
            return;
          }
          aliasMap[key] = target;
        }
      });
    } catch (error) {
      continue;
    }
  }

  if (!Object.keys(aliasMap).length) {
    aliasMap['@/'] = '/src/';
    aliasMap['~/'] = '/src/';
  }

  if (umiExists) {
    aliasMap['@@/'] = '/src/.umi/';
    aliasMap['~~/'] = '/src/.umi/';
  }

  return aliasMap;
}

function inferIgnore(rootPath) {
  return DEFAULT_IGNORE_DIRS.filter((dirName) => fs.existsSync(path.join(rootPath, dirName))).map(
    (dirName) => `**/${dirName}/**`
  );
}

function inferProjectPayload(rootPath, basePayload) {
  const resolvedRoot = path.resolve(rootPath);

  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    throw new Error(`Project root does not exist: ${resolvedRoot}`);
  }

  const files = collectProjectFiles(resolvedRoot);
  const packageName = readPackageName(resolvedRoot);
  const tsconfigAlias = readTsconfigAlias(resolvedRoot);
  const sourceAlias = inferAliasBySource(resolvedRoot, files);

  return sanitizeProjectPayload({
    ...basePayload,
    name: packageName || path.basename(resolvedRoot),
    root: resolvedRoot,
    extensions: inferExtensions(files),
    ignore: inferIgnore(resolvedRoot),
    alias: {
      ...sourceAlias,
      ...tsconfigAlias,
    },
  });
}

function clonePlugins(plugins) {
  if (!Array.isArray(plugins)) {
    return [];
  }

  return plugins.map((plugin) => ({
    ...plugin,
    output: plugin.output
      ? JSON.parse(JSON.stringify(plugin.output))
      : plugin.output,
  }));
}

class ProjectManager {
  constructor(baseConfig) {
    this.baseConfig = baseConfig;
    this.projects = [];
    this.activeProjectId = '';
    this.storeRoot = path.resolve(
      (baseConfig.server && baseConfig.server.storagePath) || process.cwd(),
      '.js-analyzer'
    );
    this.projectStateFile = path.join(this.storeRoot, 'projects.json');
    this.cacheRoot = path.join(this.storeRoot, 'cache');
    this.defaultEditableConfig = sanitizeProjectPayload({
      name: path.basename(baseConfig.root || process.cwd()),
      root: baseConfig.root,
      extensions: baseConfig.extensions,
      ignore: baseConfig.ignore,
      alias: baseConfig.alias,
      ide: baseConfig.ide,
    });
  }

  getProjectCacheDir(projectId) {
    return path.join(this.cacheRoot, projectId);
  }

  createProjectRecord(payload, source = 'manual', id = randomUUID()) {
    const now = new Date().toISOString();
    const config = sanitizeProjectPayload(payload);

    return {
      id,
      source,
      name: config.name,
      config: {
        root: config.root,
        ignore: config.ignore,
        extensions: config.extensions,
        alias: config.alias,
        ide: config.ide,
      },
      status: 'idle',
      lastError: '',
      version: 0,
      createdAt: now,
      updatedAt: now,
      lastAnalyzedAt: '',
      data: this.readProjectMaterial(id),
    };
  }

  loadState() {
    ensureDir(this.storeRoot);
    ensureDir(this.cacheRoot);

    const state = safeReadJson(this.projectStateFile);
    if (!state || !Array.isArray(state.projects)) {
      return;
    }

    this.activeProjectId = state.activeProjectId || '';
    this.projects = state.projects.map((item) => {
      const config = sanitizeProjectPayload({
        ...item.config,
        name: item.name,
      });

      return {
        id: item.id,
        source: item.source || 'manual',
        name: config.name,
        config: {
          root: config.root,
          ignore: config.ignore,
          extensions: config.extensions,
          alias: config.alias,
          ide: config.ide,
        },
        status: item.status || 'idle',
        lastError: item.lastError || '',
        version: Number(item.version || 0),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        lastAnalyzedAt: item.lastAnalyzedAt || '',
        data: this.readProjectMaterial(item.id),
      };
    });
  }

  saveState() {
    writeJson(this.projectStateFile, {
      activeProjectId: this.activeProjectId,
      projects: this.projects.map((project) => serializeProject(project)),
    });
  }

  readProjectMaterial(projectId) {
    const cacheDir = this.getProjectCacheDir(projectId);
    const material = createEmptyMaterialPackage();
    let hasData = false;

    CACHE_FILE_NAMES.forEach((fileName) => {
      const data = safeReadJson(path.join(cacheDir, fileName));
      if (data !== null) {
        material[fileName.replace(/\.json$/, '')] = data;
        hasData = true;
      }
    });

    return hasData ? material : createEmptyMaterialPackage();
  }

  getProjectById(projectId) {
    return this.projects.find((item) => item.id === projectId);
  }

  getActiveProject() {
    return this.getProjectById(this.activeProjectId) || null;
  }

  getProjectSnapshot() {
    return {
      activeProjectId: this.activeProjectId,
      projects: this.projects.map((project) => serializeProject(project)),
    };
  }

  async init() {
    this.loadState();
    await this.upsertStartupProject();

    const activeProject = this.getActiveProject();
    if (activeProject && !activeProject.data.files.length) {
      await this.analyzeProject(activeProject.id);
    }

    this.saveState();
    return this.getProjectSnapshot();
  }

  async upsertStartupProject() {
    const startupRoot = this.defaultEditableConfig.root;
    if (!startupRoot) {
      return null;
    }

    let startupProject = this.projects.find((item) => item.source === 'startup');
    const payload = {
      ...this.defaultEditableConfig,
      name: this.defaultEditableConfig.name || buildProjectName('', startupRoot),
    };

    if (!startupProject) {
      startupProject = this.createProjectRecord(payload, 'startup');
      this.projects.unshift(startupProject);
      if (!this.activeProjectId) {
        this.activeProjectId = startupProject.id;
      }
      await this.analyzeProject(startupProject.id);
      return startupProject;
    }

    startupProject.name = payload.name;
    startupProject.config = {
      root: payload.root,
      ignore: payload.ignore,
      extensions: payload.extensions,
      alias: payload.alias,
      ide: payload.ide,
    };
    startupProject.updatedAt = new Date().toISOString();
    await this.analyzeProject(startupProject.id);
    return startupProject;
  }

  buildAnalyzerConfig(project) {
    const cacheDir = this.getProjectCacheDir(project.id);
    ensureDir(cacheDir);

    return {
      ...this.baseConfig,
      ...project.config,
      plugins: clonePlugins(this.baseConfig.plugins),
      alias: {
        ...(this.baseConfig.alias || {}),
        ...(project.config.alias || {}),
      },
      ignore: project.config.ignore && project.config.ignore.length
        ? project.config.ignore
        : this.baseConfig.ignore,
      extensions: project.config.extensions && project.config.extensions.length
        ? project.config.extensions
        : this.baseConfig.extensions,
      ide: project.config.ide || this.baseConfig.ide,
      outputPath: cacheDir,
    };
  }

  async analyzeProject(projectId) {
    const project = this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (!project.config.root) {
      project.status = 'error';
      project.lastError = 'Project root is required';
      project.updatedAt = new Date().toISOString();
      this.saveState();
      return project;
    }

    const previousData = project.data;

    try {
      const analyzer = new JsAnalyzer(this.buildAnalyzerConfig(project));
      const material = await analyzer.init();
      project.data = material;
      project.status = 'ready';
      project.lastError = '';
      project.version += 1;
      project.lastAnalyzedAt = new Date().toISOString();
    } catch (error) {
      project.data = previousData;
      project.status = 'error';
      project.lastError = error && error.message ? error.message : String(error);
    }

    project.updatedAt = new Date().toISOString();
    this.saveState();
    return project;
  }

  async createProject(payload, source = 'manual') {
    const project = this.createProjectRecord(payload, source);
    this.projects.push(project);
    this.activeProjectId = project.id;
    await this.analyzeProject(project.id);
    return serializeProject(project);
  }

  async importProject(rootPath) {
    const importedPayload = inferProjectPayload(rootPath, this.defaultEditableConfig);
    return this.createProject(importedPayload, 'import');
  }

  async updateProject(projectId, payload) {
    const project = this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const config = sanitizeProjectPayload({
      ...project.config,
      ...payload,
      name: payload.name || project.name,
    });

    project.name = config.name;
    project.config = {
      root: config.root,
      ignore: config.ignore,
      extensions: config.extensions,
      alias: config.alias,
      ide: config.ide,
    };
    project.updatedAt = new Date().toISOString();

    await this.analyzeProject(project.id);
    return serializeProject(project);
  }

  async refreshProject(projectId) {
    const project = await this.analyzeProject(projectId);
    return serializeProject(project);
  }

  async setActiveProject(projectId) {
    const project = this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    this.activeProjectId = projectId;
    if (!project.data.files.length) {
      await this.analyzeProject(projectId);
    }
    this.saveState();
    return serializeProject(project);
  }

  deleteProject(projectId) {
    const index = this.projects.findIndex((item) => item.id === projectId);
    if (index === -1) {
      throw new Error('Project not found');
    }

    this.projects.splice(index, 1);
    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects[0] ? this.projects[0].id : '';
    }

    const cacheDir = this.getProjectCacheDir(projectId);
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }

    this.saveState();
    return this.getProjectSnapshot();
  }

  getProjectData(projectId, fileName) {
    const project = this.getProjectById(projectId || this.activeProjectId);
    if (!project) {
      return createEmptyMaterialPackage()[fileName] || null;
    }

    if (!project.data) {
      project.data = this.readProjectMaterial(project.id);
    }

    return project.data[fileName] || null;
  }

  getProjectCacheFile(projectId, fileName) {
    const targetId = projectId || this.activeProjectId;
    if (!targetId || !fileName) {
      return null;
    }

    return safeReadJson(path.join(this.getProjectCacheDir(targetId), fileName));
  }

  getActiveProjectConfig() {
    const activeProject = this.getActiveProject();
    return activeProject
      ? {
          name: activeProject.name,
          ...activeProject.config,
          id: activeProject.id,
          status: activeProject.status,
          version: activeProject.version,
          lastError: activeProject.lastError,
        }
      : null;
  }
}

module.exports = {
  ProjectManager,
  createEmptyMaterialPackage,
};
