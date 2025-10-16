/**
 * 路由模块
 */

import express, { Router } from 'express';
import { errorHandler, notFoundHandler } from '../middleware';
import flowRoutes from './flows';
import executionRoutes from './executions';
import templateRoutes from './templates';

const router = Router();

// API版本前缀
const apiV1 = Router();

// 注册各模块路由
apiV1.use('/workflows', flowRoutes);
apiV1.use('/executions', executionRoutes);
apiV1.use('/templates', templateRoutes);

// 挂载API路由
router.use('/api', apiV1);

// 设置路由
export const setupRoutes = (app: express.Application) => {
  // 挂载主路由
  app.use(router);
  
  // 404处理
  app.use(notFoundHandler);
  
  // 错误处理
  app.use(errorHandler);
};

export default router;