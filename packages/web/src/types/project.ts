import { Config } from '@js-analyzer/core/types/index';

export interface ProjectConfig
  extends Pick<Config, 'root' | 'ignore' | 'extensions' | 'alias' | 'ide'> {}

export interface EditableProjectConfig extends ProjectConfig {
  name: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  source: string;
  version: number;
  status: string;
  lastError: string;
  createdAt: string;
  updatedAt: string;
  lastAnalyzedAt: string;
  config: ProjectConfig;
}

export interface ProjectSnapshot {
  activeProjectId: string;
  projects: ProjectInfo[];
}

export interface ProjectResponse extends ProjectSnapshot {
  project: ProjectInfo;
}

export function createEmptyProjectDraft(): EditableProjectConfig {
  return {
    name: '',
    root: '',
    ignore: ['**/node_modules/**', '**/dist/**'],
    extensions: ['.js', '.ts', '.tsx', '.vue', '.json', '.jsx'],
    alias: {
      '@/': '/src/',
      '~/': '/src/',
    },
    ide: 'code',
  };
}
