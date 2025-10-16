import { Router } from 'express';
import { 
  ApiResponse, 
  NodeTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateListQuery,
  PaginatedResponse 
} from '../types';
import { TemplateService } from '../services/TemplateService';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const router = Router();

// 延迟实例化TemplateService，避免在模块加载时就初始化数据库
function getTemplateService(): TemplateService {
  return new TemplateService();
}

/**
 * 获取模板列表
 */
router.get('/', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category: req.query.category as string,
      type: req.query.type as string,
      search: req.query.search as string
    };

    const result = await getTemplateService().getTemplates(options);
    
    const response: ApiResponse<PaginatedResponse<NodeTemplate>> = {
      success: true,
      data: result
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get templates:', error);
    
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
 * 根据ID获取模板
 */
router.get('/:id', async (req, res) => {
  try {
    const template = await getTemplateService().getTemplateById(req.params.id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const response: ApiResponse<NodeTemplate> = {
      success: true,
      data: template
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get template:', error);
    
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
 * 创建模板
 */
router.post('/', async (req, res) => {
  try {
    const createData: CreateTemplateRequest = req.body;
    const template = await getTemplateService().createTemplate(createData);
    
    const response: ApiResponse<NodeTemplate> = {
      success: true,
      data: template
    };
    
    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create template:', error);
    
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
 * 更新模板
 */
router.put('/:id', async (req, res) => {
  try {
    const updateData: UpdateTemplateRequest = req.body;
    const template = await getTemplateService().updateTemplate(req.params.id, updateData);
    
    const response: ApiResponse<NodeTemplate> = {
      success: true,
      data: template
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to update template:', error);
    
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
 * 删除模板
 */
router.delete('/:id', async (req, res) => {
  try {
    await getTemplateService().deleteTemplate(req.params.id);
    
    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to delete template:', error);
    
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
 * 根据类型获取模板
 */
router.get('/type/:type', async (req, res) => {
  try {
    const templates = await getTemplateService().getTemplatesByType(req.params.type);
    
    const response: ApiResponse<NodeTemplate[]> = {
      success: true,
      data: templates
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get templates by type:', error);
    
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
 * 根据分类获取模板
 */
router.get('/category/:category', async (req, res) => {
  try {
    const templates = await getTemplateService().getTemplatesByCategory(req.params.category);
    
    const response: ApiResponse<NodeTemplate[]> = {
      success: true,
      data: templates
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Failed to get templates by category:', error);
    
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