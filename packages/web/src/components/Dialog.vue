<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '默认标题',
  },
});

const show = computed(() => props.modelValue);
</script>
<template>
  <teleport to="body">
    <div v-if="show" class="ui-dialog">
      <div>111</div>
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
    margin-top: 10%;
    width: 600px;
    background: #fff;
  }
}
</style>
