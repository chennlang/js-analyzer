<script setup lang="ts">
import IconBtn from './icon-btn.vue';
import { computed, watch } from 'vue';
import { useIndex } from './z-index';
const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '默认标题',
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
        class="p-8 text-sm pt-12 relative"
        @click.stop
      >
        <h2
          class="absolute left-0 top-0 p-4 w-full overflow-hidden mb-5 font-bold flex justify-between text-normal"
        >
          <span class="float-left">{{ title }}</span>
          <span class="cursor-pointer" @click="onClose">
            <IconBtn icon="icon-close"></IconBtn>
          </span>
        </h2>
        <div class="h-full overflow-y-auto">
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
    width: 600px;
    background: var(--an-bg);
    border-radius: 8px;
  }
}
</style>
