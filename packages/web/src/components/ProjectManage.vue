<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from './Dialog.vue';
import { $tf } from '@/language';
import JsonEditorVue from 'json-editor-vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import {
  projectState,
  createNewProject,
  createProjectDraft,
  refreshActiveProject,
  removeProject,
  updateExistingProject,
  getEditableProject,
} from '@/store/project';
import { EditableProjectConfig } from '@/types/project';

const jsonEditorRef = ref<any>(null);
const submitting = ref(false);
const selectedProjectId = ref('');
const editingProjectId = ref('');
const configValue = ref<EditableProjectConfig | null>(null);
const isCreatingProject = ref(false);

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue']);

function getProjectSourceLabel(source: string) {
  const sourceMap: Record<string, string> = {
    startup: $tf('启动配置'),
    import: $tf('导入项目'),
    manual: $tf('手动项目'),
  };
  return sourceMap[source] || source;
}

function syncSelectedProject(projectId?: string) {
  const targetId =
    projectId ||
    selectedProjectId.value ||
    projectState.activeProjectId ||
    projectState.projects[0]?.id ||
    '';

  if (!targetId) {
    selectedProjectId.value = '';
    editingProjectId.value = '';
    configValue.value = null;
    isCreatingProject.value = false;
    return;
  }

  const project = projectState.projects.find((item) => item.id === targetId);
  if (!project) {
    selectedProjectId.value = '';
    editingProjectId.value = '';
    configValue.value = null;
    isCreatingProject.value = false;
    return;
  }

  selectedProjectId.value = project.id;
  editingProjectId.value = project.id;
  configValue.value = getEditableProject(project);
  isCreatingProject.value = false;
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      syncSelectedProject();
    }
  }
);

watch(
  () => projectState.projects,
  () => {
    if (props.modelValue) {
      syncSelectedProject(editingProjectId.value || projectState.activeProjectId);
    }
  },
  { deep: true }
);

function pickProject(projectId: string) {
  syncSelectedProject(projectId);
}

function handleCreateProject() {
  selectedProjectId.value = '';
  editingProjectId.value = '';
  configValue.value = createProjectDraft();
  isCreatingProject.value = true;
}

function getPayload() {
  const value = configValue.value;
  if (!value) {
    return null;
  }

  return {
    name: String(value.name || '').trim(),
    root: String(value.root || '').trim(),
    ignore: Array.isArray(value.ignore) ? value.ignore : [],
    extensions: Array.isArray(value.extensions) ? value.extensions : [],
    alias: value.alias || {},
    ide: String(value.ide || 'code').trim() || 'code',
  };
}

async function submit() {
  const error = jsonEditorRef.value?.jsonEditor?.validate?.();
  if (error || (!editingProjectId.value && !isCreatingProject.value)) {
    return;
  }

  const payload = getPayload();
  if (!payload) {
    return;
  }

  submitting.value = true;
  try {
    if (isCreatingProject.value) {
      await createNewProject(payload);
      syncSelectedProject(projectState.activeProjectId);
    } else {
      await updateExistingProject(editingProjectId.value, payload);
      syncSelectedProject(editingProjectId.value);
    }
  } finally {
    submitting.value = false;
  }
}

async function handleDelete() {
  if (!editingProjectId.value) {
    return;
  }

  if (!window.confirm($tf('确认删除当前项目吗？'))) {
    return;
  }

  await removeProject(editingProjectId.value);
  syncSelectedProject();
}

async function handleRefresh() {
  const targetId = editingProjectId.value || selectedProjectId.value;
  if (!targetId) {
    return;
  }

  await refreshActiveProject(targetId);
  syncSelectedProject(targetId);
}
</script>

<template>
  <Dialog
    width="1040px"
    :title="$tf('项目管理')"
    :model-value="props.modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <div class="project-manage">
      <aside class="project-manage__aside">
        <div class="project-side-head">
          <div>
            <div class="project-side-head__title">{{ $tf('项目列表') }}</div>
            <div class="project-side-head__count">{{ projectState.projects.length }} {{ $tf('个项目') }}</div>
          </div>
        </div>
        <ul class="project-manage__list">
          <li
            v-for="project in projectState.projects"
            :key="project.id"
            class="project-card border border-transparent"
            :class="{
              active: selectedProjectId === project.id,
              'is-error': project.status === 'error',
            }"
            @click="pickProject(project.id)"
          >
            <div class="project-card__head">
              <strong class="project-card__name">{{ project.name }}</strong>
              <span class="project-card__tag">{{ getProjectSourceLabel(project.source) }}</span>
            </div>
            <p class="project-card__root">{{ project.config.root }}</p>
            <p class="project-card__status" :class="project.status === 'error' ? 'is-error' : 'is-ready'">
              {{ project.status === 'error' ? $tf('配置异常') : $tf('已就绪') }}
            </p>
          </li>
        </ul>
        <div class="project-side-actions">
          <button class="project-btn project-btn--primary" @click="handleCreateProject">
            {{ $tf('手动添加项目') }}
          </button>
          <button class="project-btn" :disabled="!editingProjectId" @click="handleRefresh">
            {{ $tf('刷新项目') }}
          </button>
          <button class="project-btn danger" :disabled="!editingProjectId" @click="handleDelete">
            {{ $tf('删除项目') }}
          </button>
        </div>
      </aside>
      <section class="project-manage__main">
        <template v-if="configValue">
          <div class="project-manage__editor overflow-auto">
            <JsonEditorVue
              ref="jsonEditorRef"
              class="project-json-editor"
              v-model="configValue"
              v-bind="{
                mode: 'text',
                mainMenuBar: false,
                theme: 'default',
              }"
            />
          </div>
          <div class="project-manage__footer">
            <button class="project-btn project-btn--primary" :disabled="submitting" @click="submit">
              {{ submitting ? $tf('保存中...') : $tf('保存配置') }}
            </button>
          </div>
        </template>
        <div v-else class="project-manage__empty">
          <div class="project-manage__empty-title">{{ $tf('手动添加项目') }}</div>
          <p class="text-light text-sm mt-2">
            {{ $tf('请输入本地项目目录') }}
          </p>
        </div>
      </section>
    </div>
  </Dialog>
</template>

<style scoped lang="less">
.project-manage {
  display: flex;
  min-height: 640px;
  gap: 24px;
}

.project-manage__aside {
  width: 340px;
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
  border-right: 1px solid #e4e8eb;
}

.project-side-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 2px 0 0;
}

.project-side-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.project-side-head__title {
  color: #181819;
  font-size: 14px;
  font-weight: 600;
}

.project-side-head__count {
  color: #70767f;
  font-size: 12px;
  margin-top: 4px;
}

.project-manage__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.project-card {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #d8d9dc;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.project-card:hover {
  border-color: #ff7f50;
  background: #f8f9fa;
}

.project-card.active {
  border-color: #ff7f50;
  background: rgba(255, 127, 80, 0.08);
}

.project-card.is-error {
  border-color: rgba(224, 32, 32, 0.28);
  background: rgba(224, 32, 32, 0.05);
}

.project-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.project-card__name {
  min-width: 0;
  color: #181819;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card__root {
  margin-top: 8px;
  color: #70767f;
  font-size: 12px;
  line-height: 1.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card__status {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
}

.project-card__status.is-ready {
  color: #ff7f50;
}

.project-card__status.is-error {
  color: #e02020;
}

.project-card__tag {
  padding: 0 8px;
  line-height: 20px;
  border-radius: 999px;
  font-size: 12px;
  background: #eceeef;
  color: #70767f;
  flex-shrink: 0;
}

.project-manage__main {
  flex: 1;
  padding-left: 24px;
  min-width: 0;
}

.project-manage__editor {
  max-height: 520px;
  border: 1px solid #d8d9dc;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.project-json-editor {
  --jse-theme: light;
  --jse-theme-color: #ff7f50;
  --jse-theme-color-highlight: #ff9b7a;
  --jse-background-color: #ffffff;
  --jse-text-color: #181819;
  --jse-text-color-inverse: #ffffff;
  --jse-main-border: 1px solid #d8d9dc;
  --jse-menu-color: #181819;
  --jse-modal-background: #ffffff;
  --jse-modal-overlay-background: rgba(0, 0, 0, 0.3);
  --jse-panel-background: #f8f9fa;
  --jse-panel-color: #181819;
  --jse-panel-border: 1px solid #e4e8eb;
  --jse-navigation-bar-background: #ffffff;
  --jse-navigation-bar-background-highlight: #eceeef;
  --jse-key-color: #ff7f50;
  --jse-value-color: #181819;
  --jse-value-color-number: #ff7f50;
  --jse-value-color-boolean: #e02020;
  --jse-value-color-null: #70767f;
  --jse-value-color-string: #ff7f50;
  --jse-delimiter-color: rgba(24, 24, 25, 0.45);
  --jse-edit-outline: 2px solid #ff7f50;
  --jse-selection-background-color: rgba(255, 127, 80, 0.12);
  --jse-selection-background-inactive-color: rgba(255, 127, 80, 0.06);
  --jse-hover-background-color: rgba(255, 127, 80, 0.05);
  --jse-active-line-background-color: rgba(255, 127, 80, 0.05);
  --jse-table-header-background: #f4f6f8;
  --jse-table-row-odd-background: rgba(0, 0, 0, 0.02);
  --jse-input-background: #ffffff;
  --jse-input-color: #181819;
  --jse-input-border: 1px solid #d8d9dc;
  --jse-input-border-focus: 1px solid #ff7f50;
  --jse-input-radius: 10px;
  --jse-button-background: #eceeef;
  --jse-button-background-highlight: #e4e8eb;
  --jse-button-color: #181819;
  --jse-button-primary-background: #ff7f50;
  --jse-button-primary-background-highlight: #ff9b7a;
  --jse-button-primary-color: #ffffff;
  --jse-button-secondary-background: #eceeef;
  --jse-button-secondary-background-highlight: #e4e8eb;
  --jse-button-secondary-color: #181819;
  --jse-a-color: #ff7f50;
  --jse-a-color-highlight: #ff9b7a;
}

.project-manage__empty {
  height: 100%;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border: 1px dashed #d8d9dc;
  border-radius: 12px;
  background: #ffffff;
}

.project-manage__empty-title {
  font-size: 18px;
  color: #181819;
  font-weight: 600;
}

.project-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d8d9dc;
  border-radius: 10px;
  cursor: pointer;
  background: #ffffff;
  color: #181819;
  white-space: nowrap;
}

.project-btn--primary {
  border-color: #ff7f50;
  background: #ff7f50;
  color: #fff;
}

.project-btn:hover:not(:disabled) {
  border-color: #ff7f50;
  color: #ff7f50;
  background: rgba(255, 127, 80, 0.04);
}

.project-btn--primary:hover:not(:disabled) {
  border-color: #ff9b7a;
  background: #ff9b7a;
  color: #fff;
}

.project-btn.danger {
  border-color: rgba(224, 32, 32, 0.28);
  color: #e02020;
}

.project-btn.danger:hover:not(:disabled) {
  border-color: #e02020;
  background: rgba(224, 32, 32, 0.06);
  color: #e02020;
}

.project-json-editor {
  display: block;
  min-height: 420px;
}

.project-manage__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
