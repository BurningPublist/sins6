import { Router } from 'express';
import { 
  ApiResponse, 
  Flow, 
  CreateFlowRequest, 
  UpdateFlowRequest, 
  FlowListQuery,
  PaginatedResponse 
} from '../types';
import { FlowService } from '../services/FlowService';
import { ApiError } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// 延迟实例化FlowService，避免在模块加载时就初始化数据库
function getFlowService(): FlowService {
  return new FlowService();
}

/**
 * 获取流程列表
 */
router.get('/', async (req, res) => {
  try {
    const query: FlowListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      search: req.query.search as string,
      isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
      isArchived: req.query.isArchived === 'true' ? true : req.query.isArchived === 'false' ? false : undefined,
      sortBy: req.query.sortBy as 'name' | 'createdAt' | 'updatedAt' || 'createdAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc'
    };

    const result = await getFlowService().getFlows(query);
    
    const response: ApiResponse<PaginatedResponse<Flow>> = {
      success: true,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get flows:', error);
    
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
 * 根据ID获取流程
 */
router.get('/:id', async (req, res) => {
  try {
    const flow = await getFlowService().getFlowById(req.params.id);
    
    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      });
    }
    
    const response: ApiResponse<Flow> = {
      success: true,
      data: flow
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get flow:', error);
    
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
 * 创建流程
 */
router.post('/', async (req, res) => {
  try {
    const createData: CreateFlowRequest = req.body;
    const flow = await getFlowService().createFlow(createData);
    
    const response: ApiResponse<Flow> = {
      success: true,
      data: flow
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create flow:', error);
    
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
 * 更新流程
 */
router.put('/:id', async (req, res) => {
  try {
    const updateData: UpdateFlowRequest = req.body;
    const flow = await getFlowService().updateFlow(req.params.id, updateData);
    
    const response: ApiResponse<Flow> = {
      success: true,
      data: flow
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to update flow:', error);
    
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
 * 删除流程
 */
router.delete('/:id', async (req, res) => {
  try {
    await getFlowService().deleteFlow(req.params.id);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to delete flow:', error);
    
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
 * 复制流程
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { name } = req.body;
    const flow = await getFlowService().duplicateFlow(req.params.id, name);
    
    const response: ApiResponse<Flow> = {
      success: true,
      data: flow
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to duplicate flow:', error);
    
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
 * 发布流程
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const flow = await getFlowService().publishFlow(req.params.id);
    
    const response: ApiResponse<Flow> = {
      success: true,
      data: flow
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to publish flow:', error);
    
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
 * 归档流程
 */
router.post('/:id/archive', async (req, res) => {
  try {
    const flow = await getFlowService().archiveFlow(req.params.id);
    
    const response: ApiResponse<Flow> = {
      success: true,
      data: flow
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to archive flow:', error);
    
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