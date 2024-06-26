<script setup lang="ts">
import Aside from './Aside.vue';
import Echart from './Echart.vue';
import InfoDrawer from '@/components/InfoDrawer.vue';
import Drawer from '@/components/Drawer.vue';
import VueJsonPretty from 'vue-json-pretty';
import { chartEmitter } from './event';
import {
  CHART_VIEW_TYPE,
  switchChartView,
  resize as resizeChart,
} from './echart';
import { ref, watch, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IQuoteInfo } from '@/types/index';
import { IChartExtendData } from '@/types/chart';
import { getImport, getExport } from '@/api/remote-data';
import type { ExportDepItem } from '@js-analyzer/core/types/index';
import { TNode } from '@/components/Tree/Tree.d';
import { $tf } from '@/language';

const router = useRouter();
const route = useRoute();
const isShowInfoDrawer = ref(false);
const isShowJsonDrawer = ref(false);
let currFile = ref<string>('');
const json = ref('{}');
const winHeight = window.innerHeight;

chartEmitter.on('dataChange', ({ nodes }) => {
  json.value = nodes;
});

const handleTreeNodeClick = (node: TNode) => {
  getInfoByFile(window.CONFIG.root + node.data.path);
  updateRouter(node.data.path, !node.isLeaf);
};

const updateRouter = (sortPath: string, isFolder = false) => {
  router.push({
    query: {
      file: encodeURI(sortPath),
      isFolder: String(isFolder),
    },
  });
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
  getInfoByFile(window.CONFIG.root + data.sortPath);
  updateRouter(data.sortPath);
};

let chartQueue: any[] = [];
const handleChartLoad = () => {
  chartQueue.forEach((item) => {
    item.apply(null, item.params);
  });
  chartQueue = [];
};

const updateViewByQuery = () => {
  const file = route.query.file;
  const isFolder = route.query.isFolder === 'true';
  if (file && typeof file === 'string') {
    currFile.value = file;
    switchChartView(
      isFolder ? CHART_VIEW_TYPE.folder : CHART_VIEW_TYPE.file,
      file,
    );
  } else {
    switchChartView(CHART_VIEW_TYPE.folder, '/');
  }
};

chartQueue.push(updateViewByQuery);

watch(route, updateViewByQuery);

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
      { label: $tf('文件名'), value: fileName },
      { label: $tf('被引用次数'), value: data.num },
      { label: $tf('绝对路径'), value: sortPath },
    ],
    columns: [
      { label: $tf('导出变量'), prop: 'vars', width: '200px' },
      { label: $tf('引用次数'), prop: 'num', width: '80px' },
      {
        label: $tf('引用文件'),
        prop: 'using',
        children: {
          preview: true,
          open: true,
        },
      },
    ],
    data: await getExportInfo(fullPath),
    path: fullPath,
    title: $tf('文件详情'),
  };
};
</script>

<template>
  <div class="w-full h-full">
    <div
      ref="leftTreeContainer"
      class="float-left dir-list h-full border-r border-solid border-gray"
    >
      <Aside @node-click="handleTreeNodeClick" />

      <!-- {{ currTab }} -->
      <div
        class="move-line"
        :class="lineInfo.active ? 'active' : ''"
        @mousedown="onMousedown"
      ></div>
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
        @action-show-json="isShowJsonDrawer = true"
      />
    </div>

    <InfoDrawer v-model="isShowInfoDrawer" v-bind="fileInfo" />
    <Drawer v-model="isShowJsonDrawer" width="800px">
      <VueJsonPretty
        v-if="isShowJsonDrawer"
        :virtual="true"
        :height="winHeight"
        :data="json"
        :deep="4"
      />
    </Drawer>
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
    width: 2px;
    height: 100%;
    user-select: none;
    background: var(--an-c-active-light);
    &:hover {
      width: 6px;
      background: var(--an-c-active);
      cursor: col-resize;
    }
    &:hover::before {
      left: -17px;
      border-top: 10px solid var(--an-c-active);
    }
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -19px;
      border-top: 10px solid var(--an-c-active-light);
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      transform: translateX(50%);
    }
    &.active {
      width: 6px;
      background: var(--an-c-active);
      cursor: col-resize;
      &::before {
        left: -17px;
        border-top: 10px solid var(--an-c-active);
      }
    }
  }
}

.chart-container {
  width: calc(100% - 240px);
}
</style>
