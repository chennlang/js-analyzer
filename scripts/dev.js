#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\x1b[32m🚀 Starting JS-Analyzer development environment...\x1b[0m');

// 启动进程的函数
function startProcess(name, command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\x1b[33m📦 Starting ${name}...\x1b[0m`);

    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`\x1b[36m[${name}]\x1b[0m ${output}`);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`\x1b[31m[${name} ERROR]\x1b[0m ${output}`);
      }
    });

    child.on('error', (error) => {
      console.error(`\x1b[31m❌ Failed to start ${name}:\x1b[0m`, error.message);
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`\x1b[31m❌ ${name} process exited with code ${code}\x1b[0m`);
      }
    });

    // 等待一小段时间确保进程启动
    setTimeout(() => {
      console.log(`\x1b[32m✅ ${name} started successfully\x1b[0m`);
      resolve(child);
    }, 2000);
  });
}

// 检查文件是否存在
function waitForFile(filePath, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkFile = () => {
      if (fs.existsSync(filePath)) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${filePath}`));
      } else {
        setTimeout(checkFile, 500);
      }
    };

    checkFile();
  });
}

// 检查服务是否可用
function waitForService(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const http = require('http');

    const checkService = () => {
      const req = http.get(url, () => {
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(checkService, 1000);
        }
      });
    };

    checkService();
  });
}

async function main() {
  try {
    const rootDir = path.dirname(__dirname);
    const packagesDir = path.join(rootDir, 'packages');

    let coreProcess, serverProcess, webProcess;

    // 启动函数
    const startServices = async () => {
      // 1. 首先启动 core 包
      coreProcess = await startProcess(
        'core',
        'npm',
        ['run', 'dev'],
        path.join(packagesDir, 'core')
      );

      // 等待 core 包构建完成
      console.log('\x1b[33m⏳ Waiting for core package to build...\x1b[0m');
      await waitForFile(path.join(packagesDir, 'core', 'dist', 'js-analyzer-core.cjs.js'));

      // 2. 启动 server 包
      serverProcess = await startProcess(
        'server',
        'npm',
        ['run', 'dev'],
        path.join(packagesDir, 'server')
      );

      // 等待 server 启动
      console.log('\x1b[33m⏳ Waiting for server to start...\x1b[0m');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. 启动 web 包
      webProcess = await startProcess(
        'web',
        'npm',
        ['run', 'dev'],
        path.join(packagesDir, 'web')
      );

      console.log('\x1b[32m🎉 All services started successfully!\x1b[0m');
      console.log('\x1b[32m📍 Web interface: http://localhost:3003\x1b[0m');
      console.log('\x1b[32m📍 Server API: http://localhost:8088\x1b[0m');
    };

    // 重启函数
    const restartService = async (serviceName) => {
      console.log(`\x1b[33m🔄 Restarting ${serviceName} due to dependency changes...\x1b[0m`);

      if (serviceName === 'core') {
        // core 更新需要重启所有服务
        [serverProcess, webProcess].forEach(p => p && p.kill());
        await new Promise(resolve => setTimeout(resolve, 1000));
        await startServices();
      } else if (serviceName === 'server') {
        // server 更新只重启 web
        webProcess && webProcess.kill();
        await new Promise(resolve => setTimeout(resolve, 1000));
        webProcess = await startProcess('web', 'npm', ['run', 'dev'], path.join(packagesDir, 'web'));
      }
    };

    // 启动服务
    await startServices();

    // 监听 core 包变化
    const coreWatcher = fs.watch(path.join(packagesDir, 'core', 'src'), { recursive: true }, (_eventType, filename) => {
      if (filename && filename.endsWith('.ts')) {
        console.log(`\x1b[35m📝 Core file changed: ${filename}\x1b[0m`);
        restartService('core');
      }
    });

    // 监听 server 包变化
    const serverWatcher = fs.watch(path.join(packagesDir, 'server', 'src'), { recursive: true }, (_eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`\x1b[35m📝 Server file changed: ${filename}\x1b[0m`);
        restartService('server');
      }
    });

    // 处理进程退出
    process.on('SIGINT', () => {
      console.log('\n\x1b[33m🛑 Shutting down services...\x1b[0m');
      coreWatcher.close();
      serverWatcher.close();
      [coreProcess, serverProcess, webProcess].forEach(p => p && p.kill());
      process.exit(0);
    });

  } catch (error) {
    console.error('\x1b[31m❌ Failed to start development environment:\x1b[0m', error.message);
    process.exit(1);
  }
}

main();