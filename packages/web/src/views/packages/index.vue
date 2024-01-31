<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChart } from './echart';
import { IChartNode } from '@/types/chart';
import InfoDrawer from '../../components/InfoDrawer.vue';
const isShowInfoDrawer = ref(false);
const info = ref<Record<string, any>>({});

onMounted(() => {
  const { instance } = useChart(document.getElementById('packageChartRef'));
  instance.on('click', (node: any) => {
    const data = node.data as IChartNode;
    const extendData = data.extendData;
    info.value = {
      title: data.name,
      baseList: [
        { label: '名称', value: data.name },
        { label: '引用次数', value: extendData.num },
      ],
      columns: [
        { label: '引用名', prop: 'vars', width: '120px' },
        { label: '引用源', prop: 'source', width: '200px' },
        { label: '引用文件', prop: 'path', open: true, preview: true },
      ],
      data: extendData.using.map((m) => ({
        ...m,
        path: m.fullPath?.replace(window.CONFIG.root, ''),
      })),
    };
    isShowInfoDrawer.value = true;
  });
});
</script>

<template>
  <div id="packageChartRef" class="w-full h-full pb-10"></div>
  <InfoDrawer v-model="isShowInfoDrawer" v-bind="info" />
</template>
