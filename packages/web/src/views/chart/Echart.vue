<script setup lang="ts">
import { $tf } from '@/language';
import { onMounted, ref, computed } from 'vue';
import { chartEmitter } from './event';
import {
  useChart,
  restoreChart,
  CHART_VIEW_TYPE,
  VIEW_NAME_MAP,
  switchChartView,
  switchChartLabel,
  getActiveFile,
} from './echart';
import { useCodePreview } from '../../components/CodePreview/use-code-preview';
import Select from '../../components/Select.vue';
import SplitLine from '../../components/SplitLine.vue';

const emit = defineEmits([
  'node-click',
  'node-dblclick',
  'chart-load',
  'action-show-json',
  'action-show-file-detail',
]);
const { openCodePreview } = useCodePreview();

function handleCodePreview() {
  openCodePreview(getActiveFile());
}

const viewName = computed(() => VIEW_NAME_MAP[currentViewType.value]);
const currentViewType = ref(CHART_VIEW_TYPE.file);

chartEmitter.on('viewChange', (type) => {
  currentViewType.value = type;
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

const options = Object.entries(VIEW_NAME_MAP)
  .map(([key, value]) => {
    return {
      text: value,
      value: parseInt(key, 10),
      disabled: [CHART_VIEW_TYPE.folder, CHART_VIEW_TYPE.json].includes(
        parseInt(key, 10),
      ),
    };
  })
  .filter((m) => m.value !== CHART_VIEW_TYPE.json);
</script>

<template>
  <div class="w-full h-full relative">
    <!-- toolbar -->
    <div
      class="absolute left-0 top-4 z-10 w-full flex items-center justify-between px-10 h-8 opacity-50"
    >
      <div class="flex items-center bg-gray rounded-lg px-4 py-1">
        <Select
          v-model="currentViewType"
          :optionsList="options"
          :disabled="
            [CHART_VIEW_TYPE.folder, CHART_VIEW_TYPE.json].includes(
              currentViewType,
            )
          "
          @onChange="
            (v) => {
              switchChartView(v);
            }
          "
        >
        </Select>
        <SplitLine />
        <IconBtn
          icon="icon-reset"
          :title="$tf('重置')"
          @click="restoreChart"
        ></IconBtn>
        <SplitLine />
        <IconBtn
          icon="icon-wenzi"
          :title="$tf('显示节点文字')"
          @click="switchChartLabel"
        ></IconBtn>
      </div>
      <div class="text-normal">{{ viewName }}</div>
      <div class="bg-gray rounded-lg px-4 py-1">
        <IconBtn
          v-if="
            [
              CHART_VIEW_TYPE.file,
              CHART_VIEW_TYPE.fileReversal,
              CHART_VIEW_TYPE.fileRelation,
            ].includes(currentViewType)
          "
          icon="icon-wenjianxinxi"
          :title="$tf('文件详情')"
          @click="$emit('action-show-file-detail')"
        ></IconBtn>
        <SplitLine />
        <IconBtn
          v-if="
            [
              CHART_VIEW_TYPE.file,
              CHART_VIEW_TYPE.fileReversal,
              CHART_VIEW_TYPE.fileRelation,
            ].includes(currentViewType)
          "
          icon="icon-preview"
          :title="$tf('代码预览')"
          @click="handleCodePreview"
        ></IconBtn>
      </div>
    </div>

    <!-- chart -->
    <div id="chartRef" class="w-full h-full"></div>
  </div>
</template>
