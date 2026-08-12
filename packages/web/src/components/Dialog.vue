<script setup lang="ts">
import IconBtn from './icon-btn.vue';
import { computed, watch } from 'vue';
import { useIndex } from './z-index';
import { $tf } from '@/language';
const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: $tf('默认标题'),
  },
  width: {
    type: [String, Number],
    default: '600px',
  },
  height: {
    type: [String, Number],
    default: '',
  },
});

const show = computed(() => props.modelValue);
const emit = defineEmits(['update:modelValue']);
const { zIndex, getZIndex } = useIndex();

const contentStyles = computed(() => {
  let result = {};

  // if (props.height) {
  //   result = {
  //     ...result,
  //     height: props.height,
  //     overflowY: 'auto',
  //   };
  // }
  return result;
});

watch(
  show,
  (val) => {
    val && getZIndex();
  },
  { immediate: true },
);

const onClose = () => {
  emit('update:modelValue', false);
};
</script>
<template>
  <teleport to="body">
    <div
      v-if="show"
      class="ui-dialog"
      @click="onClose"
      :style="{
        zIndex: zIndex,
      }"
    >
      <div
        :style="{ width: width, height: height }"
        class="ui-dialog__panel text-sm relative"
        @click.stop
      >
        <h2 class="ui-dialog__title">
          <span class="ui-dialog__title-text">{{ title }}</span>
          <span class="cursor-pointer" @click="onClose">
            <IconBtn icon="icon-close"></IconBtn>
          </span>
        </h2>
        <div class="ui-dialog__body">
          <slot></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style lang="css" scoped>
.ui-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: var(--an-bg-light);
  backdrop-filter: blur(4px);
  > div {
    margin-top: -5%;
    background: var(--an-bg);
    border-radius: 12px;
    box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
  }
}

.ui-dialog__panel {
  padding: 16px 20px 20px;
  max-height: min(84vh, 900px);
  overflow: hidden;
}

.ui-dialog__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--an-c-black);
  font-weight: 600;
  line-height: 1.5;
}

.ui-dialog__title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-dialog__body {
  height: calc(100% - 44px);
  overflow-y: auto;
}
</style>
