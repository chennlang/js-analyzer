<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps({
  title: {
    type: String,
    default: '默认标题',
  },
});
const title = computed(() => props.title);

let show = false;
const onClose = () => {
  show = false;
};
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="ui-drawer" @click="onClose">
      <div class="p-4 overflow-y-auto text-sm" @click.stop>
        <h3>{{ title }}</h3>
        <div class="ui-drawer-body">
          <slot></slot>
        </div>
      </div>
      <style>
        body {
          filter: blur(1px);
        }
      </style>
    </div>
  </teleport>
</template>

<style lang="less">
.ui-drawer {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  > div {
    width: 600px;
    float: right;
    height: 100%;
    background: #fff;
  }
}
</style>
