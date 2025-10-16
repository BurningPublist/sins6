/**
 * WebSocket服务
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

/**
 * 初始化WebSocket服务
 */
export function initWebSocketService(httpServer: HttpServer): void {
  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // 设置连接处理
    io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      // 基本的ping/pong处理
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // 处理断开连接
      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
      });

      // 处理错误
      socket.on('error', (error) => {
        logger.error(`WebSocket error for client ${socket.id}:`, error);
      });
    });

    logger.info('WebSocket service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize WebSocket service:', error);
    throw error;
  }
}

/**
 * 获取WebSocket服务实例
 */
export function getWebSocketService(): SocketIOServer | null {
  return io;
}

/**
 * 关闭WebSocket服务
 */
export function closeWebSocketService(): void {
  if (io) {
    logger.info('Closing WebSocket service...');
    io.close();
    io = null;
    logger.info('WebSocket service closed');
  }
}

/**
 * 向所有客户端广播消息
 */
export function broadcast(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * 向特定房间广播消息
 */
export function broadcastToRoom(room: string, event: string, data: any): void {
  if (io) {
    io.to(room).emit(event, data);
  }
}