<script setup lang="ts">
import Dialog from '../Dialog.vue';
import { ref, watch, defineEmits, onMounted } from 'vue';
import { getFileContent } from '../../api/remote-data';
import { $tf } from '@/language';
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin';

const hljsVue = hljsVuePlugin.component;

const props = defineProps({
  remove: Function,
  show: Boolean,
  file: {
    type: String,
    default: '',
  },
  highlight: {
    type: Object,
  },
});

const emit = defineEmits(['update:modelValue']);

let show = ref(false);
let code = ref('');

function loadFileContent() {
  const root = window.CONFIG.root;
  const path = props.file.includes(root) ? props.file : root + props.file;
  getFileContent(path)
    .then((res) => {
      code.value = res;
    })
    .catch((err) => {
      console.log(err);
    });
}

function scrollToTarget() {
  if (props.highlight) {
    setTimeout(() => {
      const { line, content } = props.highlight || {};
      document.querySelector('#codeContainer')!.scrollTop = line;
    });
  }
}

function handleClose() {
  show.value = false;
  props.remove && props.remove();
}

watch(
  () => props.show,
  (val) => {
    show.value = val;
    val && loadFileContent();
  },
  {
    immediate: true,
  },
);
</script>
<template>
  <Dialog
    :title="$tf('代码预览')"
    v-model="show"
    width="80%"
    height="70%"
    @update:model-value="handleClose"
  >
    <div
      id="codeContainer"
      class="w-full h-full overflow-auto border border-solid border-gray"
    >
      <hljsVue language="vue" :code="code" />
    </div>
  </Dialog>
</template>
<style style="less">
#codeContainer .hljs {
  color: #999;
  background: var(--an-bg);
}
.theme-dark {
  .hljs-subst {
    color: #c1666d;
  }
}
</style>
