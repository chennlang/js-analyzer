<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { getConfig } from '@/api/remote-data';
const route = useRoute();

const menus = [
  { icon: 'icon-drxx06', path: '/file-chart' },
  { icon: 'icon-packages', path: '/package-chart' },
  { icon: 'icon-hot', path: '/hot-word' },
  { icon: 'icon-menu-unuse', path: '/unknown-chart' },
];

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
</script>

<template>
  <!-- menus -->
  <div class="w-full h-full">
    <ul
      style="width: 40px"
      class="relative float-left menu-bar h-full text-sm border-r border-solid border-gray"
    >
      <router-link
        v-for="(item, index) in menus"
        class="flex items-center w-full text-center h-10 cursor-pointer hover:text-active px-2 py-1"
        :class="{
          'text-active border-l-2 border-active border-solid': isActiveMenu(
            item.path,
          ),
        }"
        :key="index"
        :to="item.path"
      >
        <IconBtn :icon="item.icon" :active="isActiveMenu(item.path)"></IconBtn>
      </router-link>
      <div class="absolute left-0 bottom-0 w-full py-5 flex justify-center">
        <IconBtn
          :icon="isDarkModel ? 'icon-dark' : 'icon-baitianmoshi'"
          @click="onSwitchTheme"
        ></IconBtn>
      </div>
    </ul>
    <div class="float-left h-full" style="width: calc(100% - 40px)">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style lang="less">
:root {
  --an-c-active: #ff7f50;
  --an-c-normal: #606266;
  --an-c-black: #1a1a1a;
  --an-c-gray: #f0f2f7;
  --an-c-white: #ffffff;
  --an-c-light: #606266;
  --an-bg: #fff;
  --an-active-bg: rgba(248, 140, 140, 0.1);
}
.theme-dark {
  --an-c-active: #ff7f50;
  --an-c-normal: #fff;
  --an-c-black: #1a1a1a;
  --an-c-gray: #2c323d;
  --an-bg: #242424;
  --an-c-white: #ffffff;
  --an-c-light: #8e97a1;
  --an-active-bg: rgba(248, 140, 140, 0.1);
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  /*** 系统全局滚动条设置 ***/
  ::-webkit-scrollbar {
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
    background-color: #eaedf0;
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
</style>
