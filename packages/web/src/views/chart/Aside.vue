<script lang="ts">
import { getFiles, getImport } from '@/api/remote-data';
import { $tf } from '@/language';
</script>
<script setup lang="ts">
import { reactive, watch, computed, ref, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import Tree from '@/components/Tree/Tree.vue';
import path2tree, { ITreeListItem } from '@/utils/path2tree';
import Select from '@/components/Select.vue';

const emit = defineEmits(['node-click']);
const route = useRoute();
const activeFile = computed(() => (route.query.file as string) || '');

interface ITreeInfo {
  citedNum: number;
  loading: boolean;
  filterText: string;
  data: ITreeListItem[];
}

const treeInfo = reactive<ITreeInfo>({
  citedNum: -1,
  loading: true,
  filterText: '',
  data: [],
});
const originFiles = ref<string[]>([]);

// 加载数据
getFiles().then((list: any) => {
  originFiles.value = list;
  filterTreeData();
});

/**
 * ------------------------文件引用信息映射表---------------------------
 */
let importLoading = ref<boolean>(true);
let fileImportInfo: Record<string, any> = ref({});

getImport().then((res: any) => {
  fileImportInfo.value = res;
  importLoading.value = false;
});

const getFileImport = (sortPath: string) => {
  return fileImportInfo.value[window.CONFIG.root + sortPath]?.num ?? '-';
};

/**
 * --------------------------输入过滤--------------------------------
 */
const dirTreeRef = ref<any>(null);

// 输入过滤
const filterTreeData = (matchText = '', num = -1) => {
  treeInfo.loading = true;
  let list = originFiles.value;
  list = list.filter((path) => {
    const keyWords = matchText.split(',');
    const isMatchKeyWords = keyWords.some((key) => path.indexOf(key) > -1);
    const isMatchNum =
      num === -1 ? true : num === (fileImportInfo.value[path]?.num ?? 0);

    console.log(isMatchNum, path);
    return isMatchKeyWords && isMatchNum;
  });

  // list to tree
  treeInfo.data = path2tree(list, window.CONFIG.root);

  nextTick(() => {
    treeInfo.loading = false;
    nextTick(() => {
      if (dirTreeRef.value && !!matchText) {
        dirTreeRef.value.expandAllNode(true);
      }
    });
  });
};

// 输入监听
let timer: any = null;
watch([() => treeInfo.filterText, () => treeInfo.citedNum], () => {
  console.log('123');
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    filterTreeData(treeInfo.filterText, treeInfo.citedNum);
  }, 400);
});

/**
 * --------------------------other--------------------------------
 */
const handleTreeNodeClick = (tnode: any) => {
  emit('node-click', tnode);
};
</script>

<template>
  <div class="h-full overflow-y-auto px-2 py-4 flex flex-col">
    <div class="border-b border-gray border-solid">
      <Select
        v-model="treeInfo.citedNum"
        class="mb-2"
        width="100%"
        :optionsList="[
          { text: $tf('全部'), value: -1 },
          { text: $tf('未被引用文件'), value: 0 },
        ]"
      ></Select>
      <input
        v-model="treeInfo.filterText"
        class="ui-input mb-4"
        type="text"
        :placeholder="$tf('搜索')"
      />
    </div>
    <div class="pt-2 flex-1 overflow-y-auto">
      <Tree
        v-if="!treeInfo.loading && !importLoading"
        ref="dirTreeRef"
        :data="treeInfo.data"
        :default-value="activeFile"
        @node-click="handleTreeNodeClick"
      >
        <template v-slot:extend="{ node }">
          {{ getFileImport(node.path) }}
        </template>
      </Tree>
    </div>
  </div>
</template>

<style lang="less"></style>
