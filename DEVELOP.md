# 开发环境启动指南

## 快速启动

```bash
pnpm dev
```

## 启动说明

项目现在使用自定义的开发启动脚本，具有以下特性：

### 启动顺序

1. **Core 包** 首先启动，等待构建完成
2. **Server 包** 其次启动，等待服务就绪
3. **Web 包** 最后启动，提供前端界面

### 自动重启机制

- **Core 包**更新时：重启所有服务（core + server + web）
- **Server 包**更新时：仅重启 web 服务
- **Web 包**更新时：由 Vite 的 HMR 处理

### 服务地址

- Web 界面：http://localhost:3003
- Server API：http://localhost:8088

### 手动启动单个服务

如果需要单独启动某个服务：

```bash
# 仅启动 core
pnpm dev:core

# 仅启动 server
pnpm dev:server

# 仅启动 web
pnpm dev:web
```

### 停止服务

使用 `Ctrl+C` 停止所有服务，脚本会自动清理所有子进程。

## 配置文件说明

### packages/server/config.js

这是本地启动必须要先设置的配置文件，包含以下重要配置：

```javascript
module.exports = {
  root: "/Users/ll/Desktop/work/deepexi/textin-open-demo", // 要分析的项目根目录
  extensions: [".js", ".ts", ".tsx", ".vue", ".json", ".jsx"], // 支持的文件扩展名
  ignore: ["**/node_modules/**", "**/dist/**", "**/static/**"], // 忽略的目录
  server: {
    port: 8088, // Server 服务端口
  },
  alias: {
    "@@/": "/src/.umi/", // 路径别名配置
    "@/": "/src/",
  },
  plugins: [], // 插件配置
  ide: "cursor", // 使用的编辑器，支持 vscode、cursor 等
};
```

**重要：** 在启动开发环境前，请确保：

1. 修改 `root` 路径为您要分析的项目的实际路径
2. 根据需要调整 `extensions` 和 `ignore` 配置
3. 确认 `server.port` 与其他服务不冲突

## 注意事项

- 确保 `packages/server/public/data/test.json` 文件不会被删除（已修改 core 的清理逻辑）
- 脚本会监听文件变化并自动重启相关服务
- 启动过程中会有彩色日志输出，显示各服务的状态
- 修改 `config.js` 配置后需要重启 server 服务才能生效
