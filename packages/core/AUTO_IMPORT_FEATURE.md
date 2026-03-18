# 自动导入解析功能

## 概述

JS-Analyzer Core 现在支持解析由 `unplugin-vue-components` 和 `unplugin-auto-import` 插件生成的自动导入声明文件，解决了传统静态分析无法识别这些动态导入依赖的问题。

## 支持的文件类型

### 1. components.d.ts
由 `unplugin-vue-components` 生成的全局组件声明文件：
```typescript
declare module 'vue' {
  export interface GlobalComponents {
    ActionOutput: typeof import('./src/components/restock/ActionOutput.vue')['default']
    ActionReasoning: typeof import('./src/components/restock/ActionReasoning.vue')['default']
    VisibilityTrigger: typeof import('./src/components/VisibilityTrigger.vue')['default']
  }
}
```

### 2. auto-imports.d.ts
由 `unplugin-auto-import` 生成的全局变量声明文件：
```typescript
declare global {
  const ALL_CHAT_TYPE_LIST: typeof import('./src/composables/graph')['ALL_CHAT_TYPE_LIST']
  const BASE_MODULE: typeof import('./src/composables/graph')['BASE_MODULE']
}

declare module 'vue' {
  interface ComponentCustomProperties {
    readonly ALL_CHAT_TYPE_LIST: UnwrapRef<typeof import('./src/composables/graph')['ALL_CHAT_TYPE_LIST']>
    readonly BASE_MODULE: UnwrapRef<typeof import('./src/composables/graph')['BASE_MODULE']>
  }
}
```

## 核心功能

### AutoImportParser 类

```typescript
import { AutoImportParser } from '@js-analyzer/core'

const parser = new AutoImportParser(config)

// 解析单个声明文件
const imports = parser.parseDeclarationFile('./auto-imports.d.ts')

// 获取项目中所有自动导入
const allAutoImports = parser.getAllAutoImports('./project-root')
```

### 解析结果数据结构

```typescript
interface AutoImportQuote {
  name: string          // 变量名/组件名
  importPath: string    // 导入路径
  exportName: string    // 导出名
  type: 'vue-component' | 'auto-import' | 'type-re-export'
  sourceFile: string    // 来源的声明文件
  globalDeclaration?: boolean // 是否为全局变量声明
}
```

### 集成到 JsAnalyzer

自动导入信息已完全集成到核心分析流程中：

```typescript
const analyzer = new JsAnalyzer(config)
const result = await analyzer.init(config)

console.log(result.autoImports) // 自动导入信息
// 依赖分析中会自动包含自动导入的依赖关系
```

### 增强的依赖信息

传统的 `UsingItem` 接口现在包含自动导入标记：

```typescript
interface UsingItem {
  source: string,
  vars: string,
  fullPath?: string,
  loc: SourceLocation,
  autoImport?: boolean,                          // 是否为自动导入
  autoImportType?: 'vue-component' | 'auto-import' | 'type-re-export',
  autoImportName?: string                        // 原始变量名
}
```

## 主要特性

### 1. TypeScript AST 解析
- 使用 TypeScript Compiler API 精确解析声明文件
- 支持复杂的类型表达式（如 `UnwrapRef<T>`）
- 处理多层嵌套的模块声明

### 2. 智能路径解析
- 自动处理相对路径转换
- 支持项目别名配置
- 兼容现有的路径解析逻辑

### 3. 缓存机制
- 解析结果缓存，提升重复分析性能
- 支持手动清除缓存

### 4. 错误处理
- 解析失败时提供详细错误信息
- 优雅降级，不影响主分析流程

### 5. 类型安全
- 完整的 TypeScript 类型支持
- 严格的接口定义

## 使用场景

### 1. 项目重构
了解项目中实际使用的自动导入组件和工具函数，为重构提供准确信息。

### 2. 依赖分析
识别项目中的隐式依赖，避免移除看似未使用但被自动导入的代码。

### 3. 代码清理
发现不再需要的自动导入配置，清理冗余的声明。

### 4. 架构优化
分析自动导入的使用模式，优化项目结构和模块组织。

## 性能考虑

- 解析器采用增量设计，只解析存在的声明文件
- 使用缓存机制避免重复解析
- 与主分析流程并行执行，不显著影响整体性能

## 兼容性

- 向后兼容，不影响现有分析功能
- 可选功能，没有声明文件时静默跳过
- 支持各种 TypeScript 版本和配置

## 示例输出

```javascript
{
  autoImports: {
    '/project/components.d.ts': [
      {
        name: 'ActionOutput',
        importPath: '/project/src/components/restock/ActionOutput.vue',
        exportName: 'default',
        type: 'vue-component',
        sourceFile: '/project/components.d.ts'
      }
    ],
    '/project/auto-imports.d.ts': [
      {
        name: 'ALL_CHAT_TYPE_LIST',
        importPath: '/project/src/composables/graph',
        exportName: 'ALL_CHAT_TYPE_LIST',
        type: 'auto-import',
        sourceFile: '/project/auto-imports.d.ts',
        globalDeclaration: true
      }
    ]
  }
}
```

## 🔧 重要修正

经过实际测试和代码审查，我们发现了重要的逻辑问题并已修复：

### ❌ 原错误逻辑
- 将自动导入组件/变量识别为**导入依赖**
- 导致依赖关系混乱

### ✅ 修正后逻辑
- 自动导入声明文件中的组件和变量被识别为**导出信息**
- 使用自动导入的文件正确识别对这些导出的依赖关系

### 📊 正确的数据流
```
components.d.ts  →  导出: { MyButton: {...}, MyCard: {...} }
auto-imports.d.ts →  导出: { ref: {...}, computed: {...} }
App.vue         →  依赖: { source: 'vue', vars: 'MyButton', autoImportName: 'MyButton' }
```

### 🎯 实际使用示例
```typescript
const analyzer = new JsAnalyzer(config)
const result = await analyzer.init(config)

// ✅ 正确：自动导入在 export 信息中
console.log(result.export)  // 包含自动导出的组件和变量

// ✅ 正确：使用自动导入的文件有相应的依赖关系
console.log(result['import-files']['App.vue'].using)
// 输出包含对自动导入的引用

// 原始解析数据（调试用）
console.log(result.autoImports)
```

## Vue 模板使用分析

### 问题背景

在 Vue 项目中，自动导入的组件和变量经常在模板中直接使用：

```vue
<template>
  <!-- ❌ 传统静态分析无法捕获这些使用 -->
  <MyButton @click="handleClick" />
  <p>{{ formatMessage('hello') }}</p>
  <div v-show="isVisible"></div>
</template>
```

这些使用情况不在 JavaScript AST 中，因此 `script-parser` 无法捕获。

### 解决方案：二次依赖分析

我们实现了 `TemplateUsageAnalyzer` 类，专门分析 Vue 模板中的自动导入使用：

```typescript
import { TemplateUsageAnalyzer } from '@js-analyzer/core'

const analyzer = new TemplateUsageAnalyzer(autoImports)
const templateUsages = analyzer.analyzeVueTemplateUsings(vueFiles)
```

### 支持的模板使用模式

#### 1. 组件使用
- **自闭合标签**: `<MyButton />`, `<my-card />`
- **开始标签**: `<MyCard>`, `<my-modal>`
- **动态组件**: `<component :is="currentComponent" />`
- **kebab-case 支持**: `<my-modal>` ↔ `MyModal`

#### 2. 变量使用
- **插值表达式**: `{{ variableName }}`
- **指令绑定**: `v-if="showDialog"`, `v-show="isVisible"`
- **事件处理**: `@click="handleClick"`, `@submit="handleSubmit"`
- **属性绑定**: `:class="{ active: isActive }"`

### 实际使用效果

```typescript
// 分析结果示例
{
  "import-files": {
    "TestComponent.vue": {
      "deps": [
        // Script 中的使用（传统方式捕获）
        { source: "vue", vars: "ref", autoImport: false },
        // 模板中的自动导入使用（新功能捕获）
        {
          source: "./components/MyButton.vue",
          vars: "default",
          autoImport: true,
          autoImportType: "vue-component",
          autoImportName: "MyButton"
        },
        {
          source: "./utils/format",
          vars: "formatMessage",
          autoImport: true,
          autoImportType: "auto-import",
          autoImportName: "formatMessage"
        }
      ]
    }
  }
}
```

### 集成流程

1. **第一阶段**: 解析自动导入声明文件，生成导出信息
2. **第二阶段**: 分析 Vue 模板，识别自动导入使用
3. **合并结果**: 将模板使用情况合并到依赖分析中

### 优势和特性

- **完整覆盖**: 同时支持 script 和 template 中的使用
- **智能识别**: 区分普通导入和自动导入
- **性能优化**: 缓存机制避免重复分析
- **模式匹配**: 支持复杂的模板语法
- **类型安全**: 完整的 TypeScript 支持

这个功能显著提升了 JS-Analyzer 对现代前端项目的分析能力，特别是使用 Vue 3 + Vite + 插件生态系统的项目。