<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { getConfig } from '@/api/remote-data';
import ProjectManage from './components/ProjectManage.vue';
const route = useRoute();

// relationship packages hot word unknowns
const menus = [
  { name: '关系图', icon: 'icon-drxx06', path: '/chart' },
  { name: '包管理', icon: 'icon-packages', path: '/packages' },
  { name: '热  词', icon: 'icon-hot', path: '/words' },
  { name: '隐式引用', icon: 'icon-menu-unuse', path: '/unknowns' },
];

const SIDEBAR_WIDTH = 120;

const isActiveMenu = (path: string) => {
  return route.path === path;
};

const isDarkModel = ref(false);
const onSwitchTheme = () => {
  const isDark = document.body.classList.contains('theme-dark');
  if (isDark) {
    isDarkModel.value = false;
    document.body.classList.remove('theme-dark');
  } else {
    isDarkModel.value = true;
    document.body.classList.add('theme-dark');
  }
};
onBeforeMount(() => {
  getConfig().then((res) => {
    window.CONFIG = res;
  });
});

const showProject = ref(false);
function openProject() {
  showProject.value = true;
}
</script>

<template>
  <!-- menus -->
  <div class="w-full h-full">
    <ul
      :style="`width: ${SIDEBAR_WIDTH}px`"
      class="relative float-left menu-bar h-full text-sm border-r border-solid border-gray"
    >
      <router-link
        v-for="(item, index) in menus"
        class="flex items-center w-full text-center h-10 cursor-pointer hover:text-active px-2 py-1"
        :class="
          isActiveMenu(item.path)
            ? 'text-active bg-active rounded-md'
            : 'text-normal'
        "
        :key="index"
        :to="item.path"
      >
        <IconBtn :icon="item.icon" :active="isActiveMenu(item.path)"></IconBtn>
        <span class="ml-1">{{ item.name }}</span>
      </router-link>
      <div
        class="absolute left-0 bottom-0 w-full py-8 px-2 flex-col justify-center"
      >
        <IconBtn
          :icon="isDarkModel ? 'icon-settings-fill' : 'icon-settings-fill'"
          class="mb-4"
          @click="openProject"
        ></IconBtn>
        <IconBtn
          :icon="isDarkModel ? 'icon-dark' : 'icon-baitianmoshi'"
          @click="onSwitchTheme"
        >
        </IconBtn>
      </div>
    </ul>
    <div
      class="float-left h-full"
      :style="`width: calc(100% - ${SIDEBAR_WIDTH}px)`"
    >
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <ProjectManage v-model="showProject" />
  </div>
</template>

<style lang="less">
:root {
  --an-c-active: #ff7f50;
  --an-c-active-light: #e3d6d2;
  --an-c-normal: #606266;
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  /*** 系统全局滚动条设置 ***/
  ::-webkit-scrollbar {
    transition: opacity 0.3s;
    width: 4px; /* 对垂直流动条有效 */
    height: 10px; /* 对水平流动条有效 */
  }

  /* 定义滚动条的轨道颜色、内阴影及圆角 */
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  /* 定义滑块颜色、内阴影及圆角 */
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
</style>
