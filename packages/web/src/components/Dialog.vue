<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '默认标题',
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
    <div v-if="show" class="ui-dialog" @click="onClose">
      <div class="p-8 text-sm pt-12 relative" @click.stop>
        <h2
          class="absolute left-0 top-0 p-4 w-full overflow-hidden mb-5 font-bold flex justify-between"
        >
          <span class="float-left">{{ title }}</span>
          <span class="cursor-pointer" @click="onClose">
            <IconBtn icon="icon-close"></IconBtn>
          </span>
        </h2>
        <div>
          <slot></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style lang="css" scoped>
.ui-dialog {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  > div {
    margin: auto;
    margin-top: 10%;
    width: 600px;
    background: #fff;
    border-radius: 8px;
  }
}
</style>
