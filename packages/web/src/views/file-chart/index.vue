<script setup lang="ts">
import Aside from './Aside.vue';
import Echart from './Echart.vue';
import History from './History.vue';
import InfoDrawer from '@/components/InfoDrawer.vue';
import {
  updateChartByFile,
  updateChartByFolder,
  resize as resizeChart,
} from './echart';
import { ref, watch, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { IQuoteInfo } from '@/types/index';
import { IChartExtendData } from '@/types/chart';
import { getImport, getExport } from '@/api/remote-data';
import type { ExportDepItem } from '@js-analyzer/core/dist/js-analyzer-core';
import { TNode } from '@/components/Tree/Tree.d';

const router = useRouter();
const isShowInfoDrawer = ref(false);
let currFile = ref<string>('');

const handleTreeNodeClick = (node: TNode) => {
  updateChartView({
    sortPath: node.data.path,
    fullPath: window.CONFIG.root + node.data.path,
    isFolder: !node.isLeaf,
  });
};

/**
 * 更新视图
 * @param opt
 */
const updateChartView = (opt: {
  sortPath: string;
  fullPath: string;
  isFolder: boolean;
}) => {
  const { sortPath, fullPath, isFolder = false } = opt;
  currFile.value = sortPath;

  router.push({
    name: 'FileChart',
    query: {
      file: encodeURI(sortPath),
    },
  });

  if (isFolder) {
    updateChartByFolder(sortPath);
  } else {
    getInfoByFile(fullPath);
    updateChartByFile(sortPath);
  }
};

let clickTimer: any;
const handleChartNodeClick = (data: IChartExtendData) => {
  clickTimer && clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    getInfoByFile(data.fullPath);
    isShowInfoDrawer.value = true;
  }, 200);
};

const handleChartNodeDblclick = (data: IChartExtendData) => {
  clickTimer && clearTimeout(clickTimer);
  updateChartView({
    sortPath: data.sortPath,
    fullPath: data.fullPath,
    isFolder: false,
  });
};

let chartQueue: any[] = [];
const handleChartLoad = () => {
  chartQueue.forEach((item) => {
    item.fn.apply(null, item.params);
  });
  chartQueue = [];
};

const leftTreeContainer = ref<HTMLElement>();
const rightChartContainer = ref<HTMLElement>();
const lineInfo = reactive({
  base: 240,
  sx: 0,
  ex: 0,
  ey: 0,
  cw: 0,
  active: false,
});

const onMousedown = (e: MouseEvent) => {
  lineInfo.active = true;
  lineInfo.sx = e.pageX;
};

document.addEventListener(
  'mousemove',
  (e: MouseEvent) => {
    const { sx, active, base } = lineInfo;
    if (!active) return;
    const mx = e.pageX - sx;
    updateWidth(mx);
  },
  false,
);

document.addEventListener(
  'mouseup',
  (e: MouseEvent) => {
    const { active } = lineInfo;
    if (active) {
      lineInfo.active = false;
      lineInfo.base = lineInfo.cw;
      resizeChart();
    }
  },
  false,
);

const updateWidth = (mx: number) => {
  window.requestAnimationFrame(() => {
    const { base } = lineInfo;
    if (leftTreeContainer.value && rightChartContainer.value) {
      let width = base + mx;
      if (width < 240) width = 240;
      if (width > 800) width = 800;
      leftTreeContainer.value.style.width = width + 'px';
      rightChartContainer.value.style.width = `calc(100% - ${width}px)`;
      lineInfo.cw = width;
    }
  });
};

const fileInfo = ref<Record<string, any>>();

const getExportInfo = async (file: string) => {
  const res = await getExport();
  const data: ExportDepItem = res[file] || {};
  return Object.keys(data).map((vars) => {
    const detail = data[vars];
    detail.using = detail.using.map((path: string) =>
      path.replace(window.CONFIG.root, ''),
    );
    return {
      vars: vars,
      num: detail.num,
      using: detail.using,
    };
  });
};

const getInfoByFile = async (fullPath: string) => {
  const res = await getImport();
  const fileName = fullPath.split('/').pop() || '';
  const sortPath = fullPath.replace(window.CONFIG.root, '');

  const data = res[fullPath];
  fileInfo.value = {
    baseList: [
      { label: '文件名', value: fileName },
      { label: '被引用次数', value: data.num },
      { label: '绝对路径', value: sortPath },
    ],
    columns: [
      { label: '导出变量', prop: 'vars', width: '120px' },
      { label: '引用次数', prop: 'num', width: '80px' },
      { label: '引用文件', prop: 'using', open: true },
    ],
    data: await getExportInfo(fullPath),
    path: fullPath,
    title: sortPath.split('/').pop(),
  };
};

const currTab = ref('0');
const tabs = ref([
  { label: '文件', value: '0' },
  { label: '历史', value: '1' },
]);
</script>

<template>
  <!-- menus -->
  <div class="w-full h-full">
    <!-- tree -->
    <div
      ref="leftTreeContainer"
      class="float-left dir-list h-full border-r border-solid border-gray"
    >
      <Aside @node-click="handleTreeNodeClick" />

      {{ currTab }}
      <div class="move-line" @mousedown="onMousedown"></div>
    </div>

    <!-- chart -->
    <div ref="rightChartContainer" class="chart-container h-full float-left">
      <div
        class="px-5 w-full h-10 leading-10 flex text-normal justify-between items-center border-b border-gray"
      >
        <span>{{ currFile }}</span>
      </div>

      <Echart
        @node-click="handleChartNodeClick"
        @node-dblclick="handleChartNodeDblclick"
        @chart-load="handleChartLoad"
        @action-show-file-detail="isShowInfoDrawer = true"
      />
    </div>

    <InfoDrawer v-model="isShowInfoDrawer" v-bind="fileInfo" />
  </div>
</template>

<style lang="less">
.dir-list {
  position: relative;
  min-width: 240px;
  width: 240px;
  .move-line {
    position: absolute;
    right: 0;
    top: 0;
    width: 4px;
    height: 100%;
    user-select: none;
    &:hover {
      background: var(--an-c-active);
      cursor: col-resize;
    }
  }
}

.chart-container {
  width: calc(100% - 240px);
}
</style>
