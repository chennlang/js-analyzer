<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';
interface IHistoryItem {
  name: string;
  path: string;
}

const route = useRoute();

const queue = ref<IHistoryItem[]>([]);
watch(route, () => {
  if (route.name === 'FileChart') {
    const path = (route.query.file || '') as string;
    queue.value.unshift({
      name: path.split('/').pop() || '',
      path: path,
    });
  }
});
</script>
<template>
  <ul class="h-full overflow-y-auto relative py-4">
    <li v-if="!queue.length" class="p-2 text-normal text-center">
      {$tf('无历史数据')}
    </li>
    <li
      v-for="(item, index) in queue"
      :key="index"
      :title="item.path"
      class="px-2 h-6 leading-6 whitespace-nowrap overflow-hidden text-normal cursor-pointer hover:text-active hover:bg-active"
      @click="$emit('node-click', item.path)"
    >
      {{ item.name }}
    </li>
    <div
      class="absolute bottom-8 left-0 w-full h-8 leading-8 border border-light-100 text-center text-normal cursor-pointer"
      @click="queue = []"
    >
      清空
    </div>
  </ul>
</template>
<style lang="less"></style>
