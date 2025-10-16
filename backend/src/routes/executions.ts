import { Router } from 'express';
import { 
  ApiResponse, 
  ExecuteFlowRequest, 
  ExecuteFlowResponse, 
  ExecutionLog,
  PaginatedResponse 
} from '../types';
import { ExecutionService } from '../services/ExecutionService';
import { ApiError } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// 延迟实例化ExecutionService，避免在模块加载时就初始化数据库
function getExecutionService(): ExecutionService {
  return new ExecutionService();
}

/**
 * 执行流程
 */
router.post('/execute', async (req, res) => {
  try {
    const executeRequest: ExecuteFlowRequest = req.body;
    const result = await getExecutionService().executeFlow(executeRequest);
    
    const response: ApiResponse<ExecuteFlowResponse> = {
      success: true,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to execute flow:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * 获取执行记录列表
 */
router.get('/', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      flowId: req.query.flowId as string,
      status: req.query.status as 'running' | 'completed' | 'failed' | 'cancelled',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const result = await getExecutionService().getExecutions(options);
    
    const response: ApiResponse<PaginatedResponse<ExecutionLog>> = {
      success: true,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get executions:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * 根据ID获取执行记录
 */
router.get('/:id', async (req, res) => {
  try {
    const execution = await getExecutionService().getExecutionById(req.params.id);
    
    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }
    
    const response: ApiResponse<ExecutionLog> = {
      success: true,
      data: execution
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get execution:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * 停止执行
 */
router.post('/:id/stop', async (req, res) => {
  try {
    await getExecutionService().cancelExecution(req.params.id);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to stop execution:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

export default router;