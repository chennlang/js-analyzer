<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import Dialog from './Dialog.vue';
import { updateConfig } from '@/api/remote-data';

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const localForm = reactive({
  name: '我的项目',
  root: '',
  alias: [{ name: '', map: '' }],
  ignore: '',
});

function transformRemoteToLocal() {
  const { alias = {}, root, ignore = '' } = window.CONFIG;
  localForm.root = root;
  localForm.alias = Object.keys(alias || []).map((key) => ({
    name: key,
    map: alias[key],
  }));
  if (Array.isArray(ignore)) {
    localForm.ignore = ignore.join('\n');
  } else {
    localForm.ignore = ignore;
  }
}

function transformLocalToRemote() {
  const ignore = Array.from(
    new Set(localForm.ignore.split('\n').filter(Boolean)),
  );
  return Object.assign({}, window.CONFIG, {
    root: localForm.root,
    alias: localForm.alias.reduce((pre, item) => {
      pre[item.name] = item.map;
      return pre;
    }, {} as any),
    ignore,
  });
}

// open
watch(
  () => props.modelValue,
  (val) => {
    val && transformRemoteToLocal();
  },
);

function reduceAlias(index: number) {
  localForm.alias.splice(index, 1);
}

function addAlias(index: number) {
  localForm.alias.splice(index + 1, 0, {
    name: '',
    map: '',
  });
}

const submitting = ref(false);
function submit() {
  submitting.value = true;
  updateConfig(transformLocalToRemote()).finally(() => {
    submitting.value = false;
    location.href = location.origin;
  });
}
</script>
<template>
  <Dialog
    title="项目管理"
    :model-value="props.modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <p class="text-active p-2 border border-active border-dashed mb-2">
      请尽量完善以下信息，这能分析结果更加准确！
    </p>
    <!-- <div class="flex mt-2">
      <span class="bg-gray p-2 rounded-sm text-active font-bold">项目配置</span>
    </div> -->
    <div class="border p-4">
      <div class="flex items-center mt-5">
        <label class="w-[120px] flex-shrink-0">项目名称</label>
        <input
          v-model="localForm.name"
          type="text"
          class="ui-input ml-4"
          placeholder="例如：我的项目"
        />
      </div>
      <div class="flex items-center mt-5">
        <label class="w-[120px] flex-shrink-0">项目路径</label>
        <input
          v-model="localForm.root"
          type="text"
          class="ui-input ml-4"
          placeholder="例如：/user/app/my-project"
        />
      </div>
      <div class="flex items-center mt-5">
        <label class="w-[120px] flex-shrink-0 self-start">别名映射</label>
        <div>
          <div
            v-for="(item, index) in localForm.alias"
            class="flex justify-between w-full items-center mb-2"
          >
            <input
              v-model="item.name"
              type="text"
              class="ui-input ml-4"
              placeholder="别名,例如：@/"
            />
            <span class="text-center w-40">~</span>
            <input
              v-model="item.map"
              type="text"
              class="ui-input"
              placeholder="映射名，例如：src/"
            />
            <span class="ml-2 w-10 flex-shrink-0 text-center cursor-pointer">
              <IconBtn
                icon="icon-roundclosefill"
                @click="reduceAlias(index)"
              ></IconBtn>
            </span>
            <span class="w-4 flex-shrink-0 text-center cursor-pointer">
              <IconBtn icon="icon-add" @click="addAlias(index)"></IconBtn>
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center mt-5">
        <label class="w-[120px] flex-shrink-0">忽略路径</label>
        <textarea
          v-model="localForm.ignore"
          :rows="4"
          :cols="50"
          type="textarea"
          class="ui-textarea ml-4"
          placeholder="逗号隔开，默认：node_modules,dist"
        />
      </div>
    </div>
    <div class="flex justify-end mt-4">
      <button
        :disabled="submitting"
        class="inline-block leading-8 px-2 cursor-pointer bg-gray"
        @click="submit"
      >
        {{ submitting ? '更新中...' : '更新' }}
      </button>
    </div>
  </Dialog>
</template>
