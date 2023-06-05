<script setup lang="ts">
import { ref } from 'vue';
import { getUnknown } from '../../api/remote-data';
import 'vue-json-pretty/lib/styles.css';
/**eslint-disable */
import VueJsonPretty from 'vue-json-pretty';
const packageJson = ref<any>(null);
getUnknown().then((res) => {
  packageJson.value = res;
});
</script>

<template>
  <div class="w-full h-full overflow-auto">
    <VueJsonPretty :data="packageJson" :deep="1" />
  </div>
</template>
