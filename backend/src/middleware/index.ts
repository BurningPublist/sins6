/**
 * 中间件模块
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '../config';
import { ApiError, ApiResponse } from '../types';
import { logger } from '../utils/logger';

// CORS中间件配置
export const corsMiddleware = cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// 安全中间件配置
export const securityMiddleware = helmet({
  contentSecurityPolicy: config.isDevelopment ? false : undefined,
  crossOriginEmbedderPolicy: false
});

// 日志中间件配置
export const loggingMiddleware = morgan(
  config.isDevelopment ? 'dev' : 'combined',
  {
    skip: (req: Request) => {
      // 跳过健康检查和静态资源的日志
      return req.url === '/health' || req.url.startsWith('/static');
    }
  }
);

// JSON解析中间件
export const jsonMiddleware = express.json({
  limit: '10mb',
  type: ['application/json', 'text/plain']
});

// URL编码中间件
export const urlencodedMiddleware = express.urlencoded({
  extended: true,
  limit: '10mb'
});

// 请求ID中间件
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
};

// 错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`[${req.id}] Error:`, error);

  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(error);
  }

  // API错误
  if (error instanceof ApiError) {
    const response: ApiResponse<null> = {
      success: false,
      error: error.message
    };
    return res.status(error.statusCode).json(response);
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Request validation failed: ' + error.message
    };
    return res.status(400).json(response);
  }

  // 语法错误（JSON解析等）
  if (error instanceof SyntaxError && 'body' in error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Invalid JSON in request body'
    };
    return res.status(400).json(response);
  }

  // 默认服务器错误
  const response: ApiResponse<null> = {
    success: false,
    error: config.isDevelopment ? error.message : 'Internal server error'
  };

  res.status(500).json(response);
};

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  };

  res.status(404).json(response);
};

// 健康检查中间件
export const healthCheckMiddleware = (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string; uptime: number }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  };

  res.json(response);
};

// 设置所有中间件
export const setupMiddleware = (app: express.Application) => {
  // 基础中间件
  app.use(requestIdMiddleware);
  app.use(corsMiddleware);
  app.use(securityMiddleware);
  app.use(loggingMiddleware);
  
  // 解析中间件
  app.use(jsonMiddleware);
  app.use(urlencodedMiddleware);
  
  // 健康检查
  app.get('/health', healthCheckMiddleware);
};

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}