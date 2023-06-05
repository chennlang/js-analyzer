<script lang="tsx" setup>
import { defineComponent, PropType, ref } from 'vue';
import { emitter, nodeMethods, ALL_NODE_ID } from '../use';
import { INode, TNode } from './Tree.d';

function generateUUID() {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7) | 0x8).toString(16);
    },
  );
  return uuid;
}

const activeNodeId = ref('');

// tree node component
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: {
      type: Object as PropType<INode>,
      default: () => ({}),
    },
    level: {
      type: Number as PropType<number>,
      default: 0,
    },
  },
  setup({ node, level }, { emit, slots }) {
    const isChildren = !node.children;
    let isOpen = ref(false);
    const nodeId = generateUUID();

    const onContainerClick = (e: Event) => {
      activeNodeId.value = nodeId;
      e.stopPropagation();
      isOpen.value = !isOpen.value;
      handleNodeClick({
        data: node,
        isLeaf: false,
      });
    };

    const onNodeClick = (e: Event) => {
      activeNodeId.value = nodeId;
      e.stopPropagation();
      handleNodeClick({
        data: node,
        isLeaf: true,
      });
    };

    emitter.on('expand', ({ id, val }) => {
      if (id === ALL_NODE_ID || id === nodeId) {
        isOpen.value = val;
      }
    });

    emitter.on('select', ({ id }) => {
      if (id === nodeId) {
        activeNodeId.value = id;
      }
    });

    if (isChildren) {
      return () => (
        <li
          style={{
            paddingLeft: level * 10 + 'px',
          }}
          class={
            activeNodeId.value === nodeId ? 'tree-node active' : 'tree-node'
          }
          data-name={node.label}
          onClick={(e) => onNodeClick(e)}
        >
          <span class="tree-node-label">{node.label}</span>
          <span class="tree-node-extend">
            {slots.extend?.({ cNode: node })}
          </span>
        </li>
      );
    } else {
      // class={isOpen.value ? 'tree-container open' : 'tree-container'}
      return () => (
        <ul
          class={[
            'tree-container',
            isOpen.value ? 'open' : false,
            activeNodeId.value === nodeId ? 'active' : false,
          ]
            .filter(Boolean)
            .join(' ')}
          data-name={node.label}
          onClick={(e) => onContainerClick(e)}
        >
          <div
            style={{
              paddingLeft: level * 10 + 'px',
            }}
            class="tree-container-label"
          >
            <span
              style={{
                left: (level - 1) * 10 + 'px',
              }}
              class="tree-container-triangle"
            ></span>
            {node.label}
          </div>
          {node.children &&
            node.children.map((item) => (
              <TreeNode node={item} level={level + 1} v-slots={slots} />
            ))}
        </ul>
      );
    }
  },
});

const props = defineProps({
  data: Array as PropType<INode[]>,
});
const emit = defineEmits(['node-click']);
let list = ref(props.data);

const handleNodeClick = (tnode: TNode) => {
  emit('node-click', tnode);
};

defineExpose({
  // 展开所有节点
  expandAllNode: () => {
    nodeMethods.expand(ALL_NODE_ID, true);
  },
});
</script>
<template>
  <div class="tree-wrap">
    <TreeNode
      v-for="(node, index) in list"
      :key="index"
      :node="node"
      :level="1"
    >
      <template v-slot:extend="{ cNode }">
        <slot name="extend" :node="cNode"></slot>
      </template>
    </TreeNode>
  </div>
</template>

<style lang="less">
.tree-container {
  position: relative;
  white-space: nowrap;
  height: 24px;
  overflow: hidden;
  color: var(--an-c-light);
  cursor: pointer;
  &.active {
    color: var(--an-c-active);
  }
}

.tree-container-label {
  position: relative;
  &:hover {
    color: var(--an-c-active);
    background-color: var(--an-active-bg);
  }
  .tree-container-triangle {
    position: absolute;
    left: 0px;
    top: 8px;
    border: 4px solid transparent;
    border-left-color: #c0c4cc;
    width: 0;
    height: 0;
    transition: transform 0.3s;
    transform: rotate(0deg);
    transform-origin: ;
  }
}

.tree-container.open {
  height: auto;
}

.tree-container.open > .tree-container-label > .tree-container-triangle {
  top: 10px;
  transform: rotate(90deg);
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 10px;
  cursor: pointer;
  color: var(--an-c-light);
  &.active {
    color: #ff5f5f;
  }
  &:hover {
    color: #ff5f5f;
    background-color: var(--an-active-bg);
  }
  .tree-node-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tree-node-extend {
    color: #ccc;
    font-size: 14px;
  }
}
</style>
