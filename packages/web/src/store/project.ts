import { computed, reactive } from 'vue';
import {
  clearRemoteCache,
  deleteProject,
  getProjects,
  importProjectByRoot,
  refreshProject,
  selectProjectDirectory,
  setProjectRequestContext,
  switchProject,
  updateProject,
} from '@/api/remote-data';
import {
  createEmptyProjectDraft,
  EditableProjectConfig,
  ProjectInfo,
  ProjectSnapshot,
} from '@/types/project';

interface ProjectState {
  activeProjectId: string;
  projects: ProjectInfo[];
  ready: boolean;
  syncing: boolean;
  viewVersion: number;
}

export const projectState = reactive<ProjectState>({
  activeProjectId: '',
  projects: [],
  ready: false,
  syncing: false,
  viewVersion: 0,
});

export const activeProject = computed(() => {
  return (
    projectState.projects.find((item) => item.id === projectState.activeProjectId) ||
    null
  );
});

function applySnapshot(snapshot: ProjectSnapshot, bumpView = true) {
  projectState.activeProjectId = snapshot.activeProjectId;
  projectState.projects = snapshot.projects || [];
  projectState.ready = true;

  const current =
    projectState.projects.find((item) => item.id === projectState.activeProjectId) ||
    null;

  window.CONFIG = current
    ? { ...current.config }
    : {
        root: '',
        ignore: [],
        extensions: [],
        alias: {},
        ide: 'code',
      };

  clearRemoteCache();
  setProjectRequestContext(current ? current.id : '', current ? current.version : 0);

  if (bumpView) {
    projectState.viewVersion += 1;
  }
}

async function withSync<T>(runner: () => Promise<T>) {
  projectState.syncing = true;
  try {
    return await runner();
  } finally {
    projectState.syncing = false;
  }
}

export async function loadProjectSnapshot() {
  return withSync(async () => {
    const snapshot = await getProjects();
    applySnapshot(snapshot, false);
    return snapshot;
  });
}

export async function switchActiveProject(projectId: string) {
  return withSync(async () => {
    const snapshot = await switchProject(projectId);
    applySnapshot(snapshot);
    return snapshot;
  });
}

export async function refreshActiveProject(projectId?: string) {
  const targetId = projectId || projectState.activeProjectId;
  if (!targetId) {
    return null;
  }

  return withSync(async () => {
    const snapshot = await refreshProject(targetId);
    applySnapshot(snapshot);
    return snapshot;
  });
}

export async function importNewProject(root: string) {
  return withSync(async () => {
    const snapshot = await importProjectByRoot(root);
    applySnapshot(snapshot);
    return snapshot;
  });
}

export async function importNewProjectFromPicker() {
  return withSync(async () => {
    const selected = await selectProjectDirectory();
    const snapshot = await importProjectByRoot(selected.root);
    applySnapshot(snapshot);
    return {
      root: selected.root,
      snapshot,
    };
  });
}

export async function updateExistingProject(projectId: string, config: EditableProjectConfig) {
  return withSync(async () => {
    const snapshot = await updateProject(projectId, config);
    applySnapshot(snapshot);
    return snapshot;
  });
}

export async function removeProject(projectId: string) {
  return withSync(async () => {
    const snapshot = await deleteProject(projectId);
    applySnapshot(snapshot);
    return snapshot;
  });
}

export function getEditableProject(project: ProjectInfo | null | undefined) {
  if (!project) {
    return createEmptyProjectDraft();
  }

  return {
    name: project.name,
    root: project.config.root || '',
    ignore: [...(project.config.ignore || [])],
    extensions: [...(project.config.extensions || [])],
    alias: { ...(project.config.alias || {}) },
    ide: project.config.ide || 'code',
  };
}

export function createProjectDraft() {
  return createEmptyProjectDraft();
}
