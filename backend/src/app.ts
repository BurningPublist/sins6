/**
 * Express应用主文件
 */

import express from 'express';
import { createServer } from 'http';
import { config } from './config';
import { initDatabase } from './database';
import { initWebSocketService, closeWebSocketService } from './websocket';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { logger } from './utils/logger';

/**
 * 创建Express应用
 */
export function createApp(): { app: express.Application; server: any } {
  const app = express();
  const server = createServer(app);

  // 设置中间件
  setupMiddleware(app);

  // 设置路由
  setupRoutes(app);

  return { app, server };
}

/**
 * 启动应用
 */
export async function startApp(): Promise<void> {
  try {
    // 初始化数据库
    logger.info('Initializing database...');
    await initDatabase();
    logger.info('Database initialized successfully');

    // 创建应用
    const { app, server } = createApp();

    // 初始化WebSocket服务
    initWebSocketService(server);
    logger.info('WebSocket service initialized');

    // 启动服务器
    const port = config.port;
    server.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Database: ${config.database.path}`);
      logger.info(`CORS Origin: ${config.corsOrigin}`);
      
      if (config.isDevelopment) {
        logger.info(`API Documentation: http://localhost:${port}/api/docs`);
        logger.info(`Health Check: http://localhost:${port}/health`);
      }
    });

    // 优雅关闭处理
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown(server: any): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // 停止接受新连接
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // 关闭数据库连接
        const { closeDatabase } = await import('./database');
        await closeDatabase();
        logger.info('Database connection closed');

        // 关闭WebSocket服务
        closeWebSocketService();
        logger.info('WebSocket service closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // 强制关闭超时
    setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, 10000);
  };

  // 监听关闭信号
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    shutdown('unhandledRejection');
  });
}

// 如果直接运行此文件，启动应用
if (require.main === module) {
  startApp();
}