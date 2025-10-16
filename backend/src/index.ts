/**
 * 后端应用入口文件
 */

import { startApp } from './app';

// 启动应用
startApp().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});