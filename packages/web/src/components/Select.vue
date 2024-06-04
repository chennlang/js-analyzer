<template>
  <select
    v-model="selectedValue"
    :disabled="disabled"
    :style="{
      width: width,
    }"
    class="bg-gray active:border-active rounded text-normal h-7 leading-7 cursor-pointer"
    @change="handleChange"
  >
    <option
      v-for="item in optionsList"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled === true"
    >
      {{ item.text }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';

// 定义传入的 props 类型
interface Option {
  text: string | number;
  value: string | number;
  disabled?: boolean;
}

// 定义 props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  optionsList: {
    type: Array as () => Option[],
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
  },
});

// 定义 emit 事件
const emit = defineEmits(['update:modelValue', 'onChange']);

// 创建一个响应式的 ref 来存储选择的值
const selectedValue = ref(props.modelValue);

// 监听 selectedValue 的变化，并通知父组件
watch(selectedValue, (newValue) => {
  emit('update:modelValue', newValue);
});

// 当父组件更新 modelValue 时，也更新 selectedValue
watch(
  () => props.modelValue,
  (newVal) => {
    selectedValue.value = newVal;
  },
);

const handleChange = (event: Event) => {
  // 获取 select 元素及其值
  const selectElement = event.target as HTMLSelectElement;
  let value: string | number = selectElement.value;

  // 判断原始 optionsList 中的 value 类型，如果是数字则转换
  const originalOption = props.optionsList.find(
    (o) => o.value.toString() === value,
  );
  if (originalOption && typeof originalOption.value === 'number') {
    value = parseFloat(value); // 或者使用 Number(value)
  }
  emit('onChange', value); // 触发自定义的 change 事件，将选中的值传出
};
</script>
