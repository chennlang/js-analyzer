<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useChart, dependReversal, restoreChart, reRoomChart } from './echart';

const route = useRoute();
const reversal = ref<boolean>(true);
const emit = defineEmits(['node-click', 'node-dblclick', 'chart-load']);

function handleReversalChange() {
  reversal.value = !reversal.value;
  dependReversal(reversal.value);
}

onMounted(() => {
  const { instance, init } = useChart(document.getElementById('chartRef'));
  instance.on('click', (node: any) => {
    if (node.dataType === 'node') {
      emit('node-click', node.data.extendData);
    }
  });

  instance.on('dblclick', (node: any) => {
    if (node.dataType === 'node') {
      emit('node-dblclick', node.data.extendData);
    }
  });

  init.then(() => {
    emit('chart-load');
  });
});
</script>

<template>
  <div class="w-full h-full relative">
    <!-- toolbar -->
    <div
      class="absolute left-4 top-4 z-10 w-auto flex items-center justify-center px-4 h-8 opacity-50 bg-gray rounded-lg"
    >
      <IconBtn
        icon="icon-wenjianxinxi"
        title="文件详情"
        @click="$emit('action-show-file-detail')"
      ></IconBtn>
      <IconBtn
        v-if="reversal"
        icon="icon-relation-full"
        class="ml-4"
        title="依赖反转"
        @click="handleReversalChange"
      ></IconBtn>
      <IconBtn
        v-else
        icon="icon-relation"
        class="ml-4"
        title="依赖反转"
        @click="handleReversalChange"
      ></IconBtn>
      <IconBtn
        icon="icon-reset"
        class="ml-4"
        title="重置"
        @click="restoreChart"
      ></IconBtn>
      <IconBtn
        icon="icon-huanyuanhuabu"
        class="ml-4"
        title="缩放重置"
        @click="reRoomChart"
      ></IconBtn>
    </div>

    <!-- chart -->
    <div id="chartRef" class="w-full h-full"></div>
  </div>
</template>
