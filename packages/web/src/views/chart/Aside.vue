<script lang="ts">
import { getFiles, getImport } from '@/api/remote-data';
</script>
<script setup lang="ts">
import { reactive, watch, computed, ref, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import Tree from '@/components/Tree/Tree.vue';
import path2tree, { ITreeListItem } from '@/utils/path2tree';

const emit = defineEmits(['node-click']);
const route = useRoute();
const activeFile = computed(() => (route.query.file as string) || '');

interface ITreeInfo {
  loading: boolean;
  filterText: string;
  data: ITreeListItem[];
}

const treeInfo = reactive<ITreeInfo>({
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
const filterTreeData = (matchText = '') => {
  treeInfo.loading = true;
  let list = originFiles.value;

  if (matchText) {
    const keyWords = matchText.split(',');
    list = list.filter((path) =>
      keyWords.some((key) => path.indexOf(key) > -1),
    );
  }

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
watch(
  () => treeInfo.filterText,
  () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      filterTreeData(treeInfo.filterText);
    }, 400);
  },
);

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
      <input
        v-model="treeInfo.filterText"
        class="ui-input"
        type="text"
        placeholder="搜索"
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
