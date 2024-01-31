<script lang="tsx">
import { openEditor } from '../api/remote-data';
</script>
<script lang="tsx" setup>
import { ref, defineComponent, computed, PropType } from 'vue';
import { useCodePreview } from '../components/CodePreview/use-code-preview';
import IconBtn from '../components/icon-btn.vue';

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
  formatter?: (item: any) => string;
  children?: IColumn;
}

const TableItem = defineComponent({
  props: {
    prop: String,
    width: String,
    open: Boolean,
    preview: Boolean,
    formatter: Function,
    data: Object as PropType<any>,
  },
  setup(props) {
    const { data, prop, width, open, preview, formatter } = props;

    const isObject = Object.prototype.toString.call(data) === '[object Object]';
    let result = '';
    if (isObject) {
      result = formatter ? formatter(data) : data[prop || ''];
    } else {
      result = data;
    }

    const previewContent = open && (
      <IconBtn
        size="sm"
        icon="icon-preview"
        class="mr-4"
        onClick={() => openCodePreview(result)}
      ></IconBtn>
    );

    const openContent = preview && (
      <IconBtn
        size="sm"
        icon="icon-icon-open"
        class="mr-4"
        onClick={() => openFileInEditor(result)}
      ></IconBtn>
    );

    return () => (
      <div
        style={{ width: width || 'auto' }}
        class="flex justify-between p-2 hover:text-active hover:bg-active"
      >
        <div>{result}</div>
        <div class="flex-shrink-0">
          {previewContent}
          {openContent}
        </div>
      </div>
    );
  },
});

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
  tableTitle: {
    type: String,
    default: '导出信息',
  },
});

const show = computed(() => props.modelValue);
const baseList = computed(() => props.baseList);
const data = computed(() => props.data);
const columns = computed(() => props.columns);
const title = computed(() => props.title);
const path = computed(() => props.path);
const emit = defineEmits(['update:modelValue']);
const { openCodePreview } = useCodePreview();

// 在编辑器中打开文件
const openFileInEditor = (url: string | undefined = path.value) => {
  url && openEditor(url);
};

const onClose = () => {
  emit('update:modelValue', false);
};
</script>
<template>
  <teleport to="body">
    <div v-if="show" class="file-detail-drawer" @click="onClose">
      <div class="p-8 text-sm pt-12 relative" @click.stop>
        <h2
          class="absolute left-0 top-0 p-4 w-full overflow-hidden mb-5 border-b border-solid border-gray"
        >
          <span class="float-left text-lg">{{ title }}</span>
          <IconBtn
            icon="icon-icon-open"
            class="float-right"
            @click="openFileInEditor()"
          ></IconBtn>
        </h2>
        <div class="h-full overflow-y-auto mt-6">
          <h3 class="mb-4 font-bold text-base">基础信息</h3>
          <div class="flex">
            <p v-for="(item, index) in baseList" :key="index" class="ml-4">
              <label class="inline-block font-bold text-sm text-light"
                >{{ item.label }}:</label
              >
              <span class="ml-2">{{ item.value }}</span>
            </p>
          </div>
          <h3 class="clear-both mt-5 mb-4 font-bold text-base">
            {{ tableTitle }}
          </h3>
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
                <template v-if="column.children">
                  <TableItem
                    v-for="(cItem, cIndex) in item[column.prop]"
                    v-bind="column.children"
                    :data="cItem"
                    :key="cIndex"
                  />
                </template>
                <TableItem v-else v-bind="column" :data="item" />
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
  backdrop-filter: blur(4px);
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
