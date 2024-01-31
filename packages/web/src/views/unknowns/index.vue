<script setup lang="ts">
import InfoDrawer from '@/components/InfoDrawer.vue';
import { ref, onMounted } from 'vue';
import { getUnknown } from '../../api/remote-data';
import { ImportDepItem } from '@js-analyzer/core/types/index';

interface INode {
  name: string;
  value: number;
  extendData: ImportDepItem & { file: string };
}

const isShowInfoDrawer = ref(false);
const info = ref<Record<string, any>>({});
const unknownList = ref<INode[]>([]);

async function getList() {
  const result = await getUnknown();
  unknownList.value = Object.keys(result).map((key) => ({
    name: key.replace(window.CONFIG.root, ''),
    value: result[key].num,
    extendData: {
      ...result[key],
      file: key,
    },
  }));
}

function openDetail(data: INode) {
  const extendData = data.extendData;
  info.value = {
    tableTitle: '引用列表',
    title: data.name,
    baseList: [{ label: '引用次数', value: extendData.num }],
    columns: [
      { label: '引用名', prop: 'vars', width: '120px' },
      { label: '引用源', prop: 'source', width: '200px' },
      {
        label: '引用文件',
        prop: 'fullPath',
        open: true,
        preview: true,
        formatter: (m: any) => m.fullPath?.replace(window.CONFIG.root, ''),
      },
    ],
    data: extendData.using,
  };
  isShowInfoDrawer.value = true;
}

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="w-full h-full pb-10">
    <ul class="p-4 h-full overflow-y-auto">
      <li
        v-for="item in unknownList"
        :key="item.name"
        class="px-4 w-full h-5 leading-5 bg-gray mt-2 text-normal text-sm !hover:text-active hover:bg-active hover:shadow-lg cursor-pointer"
        @click="openDetail(item)"
      >
        {{ item.name }}
      </li>
    </ul>
    <InfoDrawer v-model="isShowInfoDrawer" v-bind="info" />
  </div>
</template>
