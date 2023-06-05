<script lang="ts">
import { openEditor } from '../api/remote-data';
</script>
<script lang="ts" setup>
import { ref, computed } from 'vue';

interface IListItem {
  label: string;
  value: string | number;
  children?: string[];
}
interface IColumn {
  label: string;
  prop: string;
  width?: string;
  open?: boolean;
}

const props = defineProps({
  modelValue: Boolean,
  title: String,
  path: String,
  baseList: {
    type: Array as () => IListItem[],
    default: () => [],
  },
  columns: {
    type: Array as () => IColumn[],
    default: () => [],
  },
  data: {
    type: Array as () => any[],
    default: () => [],
  },
});

const show = computed(() => props.modelValue);
const baseList = computed(() => props.baseList);
const data = computed(() => props.data);
const columns = computed(() => props.columns);
const title = computed(() => props.title);
const path = computed(() => props.path);
const emit = defineEmits(['update:modelValue']);

// 在编辑器中打开文件
const openFileInEditor = (url: string | undefined = path.value) => {
  url && openEditor(url);
};

const onClose = () => {
  emit('update:modelValue', false);
};

const showText = (c: any): any => {
  if (c === undefined || c === null) {
    return '--';
  }
  return c;
};
</script>
<template>
  <teleport to="body">
    <div v-if="show" class="file-detail-drawer" @click="onClose">
      <div class="p-8 text-sm pt-12 relative" @click.stop>
        <h2
          class="absolute left-0 top-0 p-4 w-full overflow-hidden mb-5 font-bold"
        >
          <span class="float-left">{{ title }}</span>
          <IconBtn
            icon="icon-icon-open"
            class="float-right"
            @click="openFileInEditor()"
          ></IconBtn>
        </h2>
        <div class="h-full overflow-y-auto">
          <h3 class="mb-4 font-bold">基础信息</h3>
          <p v-for="(item, index) in baseList" :key="index">
            <label
              class="w-24 inline-block font-bold text-sm"
              style="color: #909399"
              >{{ item.label }}:</label
            >
            <span>{{ item.value }}</span>
          </p>
          <h3 class="clear-both mt-5 mb-4 font-bold">导出信息</h3>
          <table class="table-fixed border border-gray w-full">
            <tr>
              <th
                v-for="(column, index) in columns"
                :key="index"
                :style="{
                  width: column.width || 'auto',
                }"
                class="text-left p-2 text-sm font-medium"
              >
                {{ column.label }}
              </th>
            </tr>
            <tr
              v-for="(item, index) in data"
              :key="index"
              class="border-t border-gray"
            >
              <td
                v-for="(column, index2) in columns"
                :key="index2"
                class="break-all py-2 px-2 text-gray-500 text-xs align-top"
              >
                <p
                  v-for="(text, index3) in Array.isArray(item[column.prop])
                    ? item[column.prop]
                    : [item[column.prop]]"
                  :key="index3"
                  class="flex justify-between pt-1 hover:bg-active"
                >
                  <span class="flex-1">{{ showText(text) }}</span>
                  <IconBtn
                    v-if="column.open"
                    size="sm"
                    icon="icon-icon-open"
                    @click="openFileInEditor(text)"
                  ></IconBtn>
                </p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </teleport>
</template>
<style lang="less" scoped>
.file-detail-drawer {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  > div {
    margin-top: 160px;
    width: 100%;
    height: calc(100vh - 160px);
    color: var(--an-c-normal);
    background: var(--an-bg);
    border-top-left-radius: 25px;
    border-top-right-radius: 25px;
  }
}
</style>
