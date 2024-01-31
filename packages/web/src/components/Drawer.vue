<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: '600px',
  },
});
const show = computed(() => props.modelValue);
const emit = defineEmits(['update:modelValue']);

const onClose = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="ui-drawer" @click="onClose">
      <div
        :style="{
          width,
        }"
        class="p-4 overflow-y-auto text-sm"
        @click.stop
      >
        <h3>{{ title }}</h3>
        <div class="ui-drawer-body">
          <slot></slot>
        </div>
      </div>
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
  backdrop-filter: blur(4px);
  z-index: 999;
  > div {
    width: 600px;
    float: right;
    height: 100%;
    background: #fff;
  }
}
</style>
