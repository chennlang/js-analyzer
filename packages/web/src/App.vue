<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProjectManage from './components/ProjectManage.vue';
import {
  $tf,
  languageOptions,
  switchLanguage,
  currentLanguage,
} from './language';
import Select from './components/Select.vue';
import { switchChartTheme } from './views/chart/echart';
import {
  activeProject,
  loadProjectSnapshot,
  projectState,
  refreshActiveProject,
  switchActiveProject,
} from './store/project';

const route = useRoute();
const router = useRouter();

const menus = [
  { name: $tf('关系图'), icon: 'icon-drxx06', path: '/chart' },
  { name: $tf('包管理'), icon: 'icon-packages', path: '/packages' },
  { name: $tf('热词'), icon: 'icon-hot', path: '/words' },
  { name: $tf('隐式引用'), icon: 'icon-menu-unuse', path: '/unknowns' },
];

const isActiveMenu = (path: string) => {
  return route.path === path;
};

const isDarkModel = ref(false);
const showProject = ref(false);
const routeViewKey = computed(() => {
  return `${route.path}:${projectState.activeProjectId}:${projectState.viewVersion}`;
});
const projectOptions = computed(() => {
  return projectState.projects.map((item) => ({
    text: item.name,
    value: item.id,
  }));
});
const activeProjectStatus = computed(() => {
  if (!activeProject.value) {
    return '';
  }

  if (activeProject.value.status === 'error') {
    return $tf('配置异常');
  }

  return $tf('已就绪');
});

const initTheme = () => {
  const isDark = localStorage.getItem('theme') === 'dark';
  onSwitchTheme(isDark);
};

const handleSwitchTheme = () => {
  const isDark = document.body.classList.contains('theme-dark');
  onSwitchTheme(!isDark);
};
const onSwitchTheme = (dark: boolean) => {
  switchChartTheme(dark ? 'dark' : 'default');
  if (!dark) {
    isDarkModel.value = false;
    document.body.classList.remove('theme-dark');
    localStorage.removeItem('theme');
  } else {
    isDarkModel.value = true;
    document.body.classList.add('theme-dark');
    localStorage.setItem('theme', 'dark');
  }
};

async function handleProjectChange(projectId: string | number) {
  const nextProjectId = String(projectId || '');
  if (!nextProjectId || nextProjectId === projectState.activeProjectId) {
    return;
  }

  await switchActiveProject(nextProjectId);
  router.replace({ path: route.path, query: {} });
}

async function handleRefreshProject() {
  if (!projectState.activeProjectId) {
    return;
  }

  await refreshActiveProject(projectState.activeProjectId);
  router.replace({ path: route.path, query: {} });
}

onBeforeMount(async () => {
  initTheme();
  await loadProjectSnapshot();
});

function openProject() {
  showProject.value = true;
}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <header class="app-header">
      <div class="app-header__brand">
        🧬 Js Analyzer
      </div>
      <ul class="app-header__menu menu-bar text-sm">
        <router-link
          v-for="(item, index) in menus"
          class="app-header__menu-item"
          :class="
            isActiveMenu(item.path)
              ? 'text-active app-header__menu-item--active'
              : 'text-normal'
          "
          :key="index"
          :to="item.path"
        >
          <IconBtn :icon="item.icon" :active="isActiveMenu(item.path)"></IconBtn>
          <span class="app-header__menu-text">{{ item.name }}</span>
        </router-link>
      </ul>
      <div class="app-header__actions text-sm">
        <div class="app-header__group project-switcher">
          <span class="app-header__label">{{ $tf('当前项目') }}</span>
          <Select
            :modelValue="projectState.activeProjectId"
            :optionsList="projectOptions"
            width="200px"
            class="app-header__select"
            :disabled="projectState.syncing || !projectOptions.length"
            @onChange="handleProjectChange"
          ></Select>
          <span
            v-if="activeProjectStatus"
            class="app-header__status project-status"
            :class="activeProject?.status === 'error' ? 'is-error' : 'is-ready'"
          >
            {{ activeProjectStatus }}
          </span>
          <button
            class="app-header__button"
            :disabled="projectState.syncing || !projectState.activeProjectId"
            @click="handleRefreshProject"
          >
            {{ projectState.syncing ? $tf('刷新中...') : $tf('刷新项目') }}
          </button>
        </div>
        <div class="app-header__group">
          <Select
            :modelValue="currentLanguage"
            :optionsList="languageOptions"
            width="112px"
            class="app-header__select"
            @onChange="(v) => switchLanguage(v)"
          ></Select>
          <IconBtn
            :icon="isDarkModel ? 'icon-dark' : 'icon-baitianmoshi'"
            class="app-header__icon-btn"
            @click="handleSwitchTheme"
          >
          </IconBtn>
          <IconBtn
            :icon="isDarkModel ? 'icon-settings-fill' : 'icon-settings-fill'"
            @click="openProject"
            class="app-header__icon-btn"
          ></IconBtn>
          <a
            href="https://github.com/chennlang/js-analyzer"
            class="app-header__link text-sm"
            target="_blank"
            >Github</a
          >
        </div>
      </div>
    </header>
    <div class="w-full h-full flex-1">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" :key="routeViewKey" />
        </keep-alive>
      </router-view>
    </div>
    <ProjectManage v-model="showProject" />
  </div>
</template>

<style lang="less">
@header-border: #e4e8eb;
@surface: #ffffff;
@background: #f8f9fa;
@text-primary: #181819;
@text-secondary: #70767f;
@border: #d8d9dc;
@hover: #eceeef;
@primary: #ff7f50;
@primary-hover: #ff9b7a;
@danger: #e02020;

:root {
  --an-c-active: #ff7f50;
  --an-c-active-light: #e3d6d2;
  --an-c-normal: #434343;
  --an-c-black: #1a1a1a;
  --an-c-gray: #f0f2f7;
  --an-c-white: #ffffff;
  --an-c-light: #606266;
  --an-bg: #fff;
  --an-bg-light: rgba(0, 0, 0, 0.5);
  --an-bg-gray: #f6f6f6;
  --an-active-bg: rgba(248, 140, 140, 0.1);
}
.theme-dark {
  --an-c-active: #ff7f50;
  --an-c-active-light: #54504e;
  --an-c-normal: #fff;
  --an-c-black: #1a1a1a;
  --an-c-gray: #2c323d;
  --an-bg: #242424;
  --an-c-white: #ffffff;
  --an-c-light: #5d636b;
  --an-bg-light: rgba(255, 255, 255, 0.3);
  --an-bg-gray: #f6f6f6;
  --an-active-bg: rgba(248, 140, 140, 0.1);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid @header-border;
  background: @surface;
  flex-shrink: 0;
}

.app-header__brand {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  color: @text-primary;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.app-header__menu {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: center;
}

.app-header__menu-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  white-space: nowrap;
  flex: 0 0 auto;
}

.app-header__menu-item:hover {
  background: @hover;
}

.app-header__menu-item--active {
  background: fade(@primary, 10%);
}

.app-header__menu-text {
  line-height: 1;
}

.app-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
  min-width: 0;
}

.app-header__group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 0 0 auto;
}

.app-header__label {
  color: @text-secondary;
  white-space: nowrap;
}

.app-header__select {
  flex: 0 0 auto;
}

.app-header__status {
  height: 28px;
  line-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
}

.app-header__button {
  height: 32px;
  padding: 0 12px;
  border: 1px solid @border;
  border-radius: 10px;
  background: @surface;
  color: @text-primary;
}

.app-header__button:hover:not(:disabled) {
  border-color: @primary;
  color: @primary;
  background: fade(@primary, 4%);
}

.app-header__button:disabled {
  color: @text-secondary;
  background: #f4f6f8;
}

.app-header__icon-btn {
  flex: 0 0 auto;
}

.app-header__link {
  color: @text-primary;
  white-space: nowrap;
}

.app-header__link:hover {
  color: @primary;
}

@media (max-width: 1280px) {
  .app-header {
    padding: 0 16px;
    gap: 12px;
  }

  .app-header__menu-text {
    display: none;
  }

  .app-header__label {
    display: none;
  }
}

@media (max-width: 1080px) {
  .app-header {
    flex-wrap: wrap;
    padding: 12px 16px;
  }

  .app-header__menu {
    order: 3;
    width: 100%;
    justify-content: flex-start;
  }

  .app-header__actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  ::-webkit-scrollbar {
    transition: opacity 0.3s;
    width: 4px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    width: 4px;
    background-color: rgba(248, 140, 140, 0.1);
    border-radius: 4px;
  }
}

li {
  list-style: none;
}
html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: var(--an-text-normal);
  background: var(--an-bg);
}

button:disabled,
button[disabled] {
  cursor: not-allowed;
  background-color: #cccccc;
  color: #666666;
}

.ui-input {
  -webkit-appearance: none;
  background-color: var(--an-bg);
  background-image: none;
  border-radius: 4px;
  border: 1px solid var(--an-c-light);
  box-sizing: border-box;
  color: var(--an-c-light);
  display: inline-block;
  font-size: inherit;
  height: 28px;
  line-height: 28px;
  outline: none;
  padding: 0 15px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  width: 100%;
  font-size: 12px;
}
.ui-textarea {
  display: block;
  resize: vertical;
  padding: 5px 15px;
  line-height: 1.5;
  box-sizing: border-box;
  width: 100%;
  font-size: inherit;
  color: var(--an-c-light);
  background-color: var(--an-bg);
  background-image: none;
  border: 1px solid var(--an-c-light);
  border-radius: 4px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}
.ui-text-justify {
  height: 30px;
  line-height: 30px;
  padding-left: 10px;
  padding-right: 10px;
  text-align: justify;
}
.ui-text-justify::after {
  display: inline-block;
  width: 100%;
  content: '';
}
.project-switcher {
  max-width: 460px;
}
.project-status {
  border: 1px solid transparent;
}
.project-status.is-ready {
  color: #ff7f50;
  border-color: rgba(255, 127, 80, 0.2);
  background: rgba(255, 127, 80, 0.08);
}
.project-status.is-error {
  color: #d64545;
  border-color: rgba(214, 69, 69, 0.2);
  background: rgba(214, 69, 69, 0.08);
}
</style>
