<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue';
import Dialog from './Dialog.vue';
import { updateConfig } from '@/api/remote-data';
import { $tf } from '@/language';
import JsonEditorVue from 'json-editor-vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';

const jsonEditorRef = ref<any>(null);
const CAN_CHANGE_CONFIG_NAMES: (keyof Window['CONFIG'])[] = [
  'root',
  'alias',
  'ignore',
];
const configValue = ref<any>({});

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const localForm = reactive({
  name: $tf('我的项目'),
  root: '',
  alias: [{ name: '', map: '' }],
  ignore: '',
});

// open
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      CAN_CHANGE_CONFIG_NAMES.forEach((name) => {
        configValue.value[name] = window.CONFIG[name];
      });
    }
  },
);

const submitting = ref(false);
async function submit() {
  const error = jsonEditorRef.value.jsonEditor.validate();
  if (error) return;

  submitting.value = true;
  updateConfig(Object.assign({}, window.CONFIG, configValue.value)).finally(
    () => {
      submitting.value = false;
      location.href = location.origin;
    },
  );
}
</script>
<template>
  <Dialog
    width="800px"
    :title="$tf('项目管理')"
    :model-value="props.modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <p class="text-active p-2 border border-active border-dashed mb-2">
      {{ $tf('请尽量完善以下信息，这能分析结果更加准确！') }}
    </p>
    <div style="max-height: 500px" class="overflow-auto">
      <JsonEditorVue
        ref="jsonEditorRef"
        class="jse-theme-dark"
        v-model="configValue"
        v-bind="{
          mode: 'text',
          mainMenuBar: false,
          theme: 'dark',
          /* local props & attrs */
        }"
      />
    </div>
    <div class="flex justify-end mt-4">
      <button
        :disabled="submitting"
        class="inline-block leading-8 px-2 cursor-pointer bg-gray text-normal"
        @click="submit"
      >
        {{ submitting ? $tf('更新中...') : $tf('更新') }}
      </button>
    </div>
  </Dialog>
</template>
