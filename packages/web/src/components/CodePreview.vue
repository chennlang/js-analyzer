<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getFileContent } from '../api/remote-data';

const props = defineProps({
  path: {
    type: String,
    default: '',
  },
});

let show = true;
let code = ref('');
const onClose = () => {
  show = false;
};

function loadFileContent() {
  getFileContent(props.path)
    .then((res) => {
      code.value = res;
    })
    .catch((err) => {
      console.log(err);
    });
}

onMounted(() => {
  loadFileContent();
});

// watch(
//   () => show,
//   (val) => {
//     val && loadFileContent();
//   },
// );
</script>
<template>
  <teleport to="body">
    <div
      v-if="show"
      class="w-full h-full absolute left-0 top-0 overflow-scroll"
      @click="onClose"
    >
      <pre>
        {{ code }}
      </pre>
    </div>
  </teleport>
</template>
