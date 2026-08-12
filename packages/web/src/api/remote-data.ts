import $ from 'jquery';
import { MaterialPackage } from '@js-analyzer/core/types/index';
import {
  EditableProjectConfig,
  ProjectResponse,
  ProjectSnapshot,
} from '@/types/project';

const DEV_API_PROXY = (import.meta.env.VITE_API_PROXY || 'http://localhost:8088').replace(/\/$/, '');

const BASE_URL = import.meta.env.DEV
  ? DEV_API_PROXY
  : location.origin +
    (import.meta.env.VITE_HAS_API_PATH_PREFIX ? location.pathname : '');

const dataCache: Record<string, any> = {};
const pendingCache: Record<string, Promise<any> | undefined> = {};
const projectContext = {
  projectId: '',
  version: 0,
};

function buildUrl(url: string) {
  return BASE_URL + url;
}

function loadJson<T>(url: string, cacheKey?: string): Promise<T> {
  if (cacheKey && dataCache[cacheKey] !== undefined) {
    return Promise.resolve(dataCache[cacheKey]);
  }

  if (cacheKey && pendingCache[cacheKey]) {
    return pendingCache[cacheKey] as Promise<T>;
  }

  const request = new Promise<T>((resolve, reject) => {
    $.getJSON(buildUrl(url), (res: T) => {
      if (cacheKey) {
        dataCache[cacheKey] = res;
        delete pendingCache[cacheKey];
      }
      resolve(res);
    }).fail((error) => {
      if (cacheKey) {
        delete pendingCache[cacheKey];
      }
      reject(error);
    });
  });

  if (cacheKey) {
    pendingCache[cacheKey] = request;
  }

  return request;
}

function load<T>(url: string) {
  return new Promise<T>((resolve, reject) => {
    $.ajax({
      url: buildUrl(url),
      method: 'GET',
      success: resolve,
      error: reject,
    });
  });
}

function request<T>(method: string, url: string, data?: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    $.ajax({
      url: buildUrl(url),
      method,
      data: data === undefined ? undefined : JSON.stringify(data),
      dataType: 'json',
      success: resolve,
      error: reject,
      contentType: 'application/json; charset=utf-8',
    });
  });
}

function buildProjectDataUrl(fileName: keyof MaterialPackage) {
  if (!projectContext.projectId) {
    return '';
  }

  const projectId = encodeURIComponent(projectContext.projectId);
  return `/api/projects/${projectId}/data/${fileName}?v=${projectContext.version}`;
}

function getProjectData<T>(fileName: keyof MaterialPackage) {
  const url = buildProjectDataUrl(fileName);
  if (!url) {
    if (fileName === 'files') {
      return Promise.resolve([] as T);
    }
    return Promise.resolve({} as T);
  }

  return loadJson<T>(url, url);
}

export function setProjectRequestContext(projectId: string, version = 0) {
  projectContext.projectId = projectId;
  projectContext.version = version;
}

export function clearRemoteCache() {
  Object.keys(dataCache).forEach((key) => delete dataCache[key]);
  Object.keys(pendingCache).forEach((key) => delete pendingCache[key]);
}

export const getFiles = () => {
  return getProjectData<MaterialPackage['files']>('files');
};

export const getImport = () => {
  return getProjectData<MaterialPackage['import-files']>('import-files');
};

export const getExport = () => {
  return getProjectData<MaterialPackage['export']>('export');
};

export const getPackage = () => {
  return getProjectData<MaterialPackage['import-package']>('import-package');
};

export const getUnknown = () => {
  return getProjectData<MaterialPackage['import-unknown']>('import-unknown');
};

export const getNames = () => {
  if (!projectContext.projectId) {
    return Promise.resolve([] as any[]);
  }

  const projectId = encodeURIComponent(projectContext.projectId);
  const url = `/api/projects/${projectId}/cache/names.json?v=${projectContext.version}`;
  return loadJson(url, url);
};

export const openEditor = (targetPath: string) => {
  const filePath = targetPath.startsWith(window.CONFIG.root)
    ? targetPath
    : `${window.CONFIG.root}${targetPath}`;
  const projectId = encodeURIComponent(projectContext.projectId);
  return load(`/api/launch?projectId=${projectId}&file=${encodeURIComponent(filePath)}`);
};

export const getFileContent = (targetPath: string) => {
  return load<string>(`/api/code?file=${encodeURIComponent(targetPath)}`);
};

export const getConfig = () => {
  return load('/config');
};

export const updateConfig = (config: typeof window.CONFIG) => {
  return request('put', '/config', config);
};

export const getProjects = () => {
  return loadJson<ProjectSnapshot>('/api/projects');
};

export const createProject = (config: EditableProjectConfig) => {
  return request<ProjectResponse>('post', '/api/projects', config);
};

export const importProjectByRoot = (root: string) => {
  return request<ProjectResponse>('post', '/api/projects/import', { root });
};

export const updateProject = (projectId: string, config: EditableProjectConfig) => {
  return request<ProjectResponse>('put', `/api/projects/${encodeURIComponent(projectId)}`, config);
};

export const deleteProject = (projectId: string) => {
  return request<ProjectSnapshot>('delete', `/api/projects/${encodeURIComponent(projectId)}`);
};

export const switchProject = (projectId: string) => {
  return request<ProjectResponse>('put', '/api/projects/active', { projectId });
};

export const refreshProject = (projectId: string) => {
  return request<ProjectResponse>('put', `/api/projects/${encodeURIComponent(projectId)}/refresh`);
};
