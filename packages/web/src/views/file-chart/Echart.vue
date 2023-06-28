<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { chartEmitter } from './event';
import {
  useChart,
  restoreChart,
  reRoomChart,
  CHART_VIEW_TYPE,
  VIEW_NAME_MAP,
  switchChartView,
} from './echart';

const reversal = ref<boolean>(true);
const emit = defineEmits(['node-click', 'node-dblclick', 'chart-load']);

function handleReversalChange() {
  reversal.value = !reversal.value;

  switchChartView(
    reversal.value ? CHART_VIEW_TYPE.file : CHART_VIEW_TYPE.fileReversal,
  );
}

const viewName = ref(VIEW_NAME_MAP[CHART_VIEW_TYPE.file]);

chartEmitter.on('viewChange', (type) => {
  console.log(type, 'type');
  viewName.value = VIEW_NAME_MAP[type];
});

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
      class="absolute left-0 top-4 z-10 w-full flex items-center justify-between px-10 h-8 opacity-50"
    >
      <div class="bg-gray rounded-lg px-4 h-8 leading-8">
        <IconBtn
          icon="icon-relation-full"
          title="依赖反转"
          @click="handleReversalChange"
        ></IconBtn>
        <IconBtn
          icon="icon-relation"
          class="ml-4"
          title="依赖反转"
          @click="handleReversalChange"
        ></IconBtn>
        <IconBtn
          icon="icon-guanxi"
          class="ml-4"
          title="关系视图"
          @click="switchChartView(CHART_VIEW_TYPE.fileRelation)"
        ></IconBtn>
      </div>
      <div class="text-normal">{{ viewName }}</div>
      <div class="bg-gray rounded-lg px-4 h-8 leading-8">
        <IconBtn icon="icon-reset" title="重置" @click="restoreChart"></IconBtn>
        <IconBtn
          icon="icon-huanyuanhuabu"
          class="ml-4"
          title="缩放重置"
          @click="reRoomChart"
        ></IconBtn>
        <IconBtn
          icon="icon-wenjianxinxi"
          title="文件详情"
          class="ml-4"
          @click="$emit('action-show-file-detail')"
        ></IconBtn>
      </div>
    </div>

    <!-- chart -->
    <div id="chartRef" class="w-full h-full"></div>
  </div>
</template>
