/**
 * 节点模板服务类
 */

import { 
  NodeTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  TemplateListQuery,
  PaginatedResponse
} from '../types';
import { getDatabase, runQuery, getRow, getAllRows } from '../database';
import { ApiError } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class TemplateService {
  private db = getDatabase();

  /**
   * 获取模板列表
   */
  async getTemplates(options: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    search?: string;
  } = {}): Promise<PaginatedResponse<NodeTemplate>> {
    try {
      const { page = 1, limit = 20, category, type, search } = options;
      const offset = (page - 1) * limit;

      let whereConditions: string[] = [];
      let params: any[] = [];

      if (category) {
        whereConditions.push('category = ?');
        params.push(category);
      }

      if (type) {
        whereConditions.push('type = ?');
        params.push(type);
      }

      if (search) {
        whereConditions.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM node_templates ${whereClause}`;
      const countResult = await getRow(countQuery, params);

      // 获取模板列表
      const query = `
        SELECT * FROM node_templates 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const templates = await getAllRows(query, [...params, limit, offset]);

      const total = countResult?.total || 0;
      return {
        items: templates.map(row => this.mapRowToTemplate(row)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get templates:', error);
      throw ApiError.internal('Failed to get templates');
    }
  }

  /**
   * 根据ID获取模板
   */
  async getTemplateById(id: string): Promise<NodeTemplate | null> {
    try {
      const query = 'SELECT * FROM node_templates WHERE id = ?';
      const row = await getRow(query, [id]);
      
      return row ? this.mapRowToTemplate(row) : null;
    } catch (error) {
      logger.error('Failed to get template by id:', error);
      throw ApiError.internal('Failed to get template');
    }
  }

  /**
   * 创建模板
   */
  async createTemplate(data: CreateTemplateRequest): Promise<NodeTemplate> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const template: NodeTemplate = {
        id,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        icon: data.icon,
        config: data.config || {},
        inputs: data.inputs || [],
        outputs: data.outputs || [],
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now
      };

      const query = `
        INSERT INTO node_templates (
          id, name, description, type, category, icon, config,
          inputs, outputs, is_built_in, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await runQuery(query, [
        template.id,
        template.name,
        template.description,
        template.type,
        template.category,
        template.icon,
        JSON.stringify(template.config),
        JSON.stringify(template.inputs),
        JSON.stringify(template.outputs),
        template.isBuiltIn ? 1 : 0,
        template.createdAt,
        template.updatedAt
      ]);

      return template;
    } catch (error) {
      logger.error('Failed to create template:', error);
      throw ApiError.internal('Failed to create template');
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<NodeTemplate> {
    try {
      const existingTemplate = await this.getTemplateById(id);
      if (!existingTemplate) {
        throw ApiError.notFound('Template not found');
      }

      if (existingTemplate.isBuiltIn) {
        throw ApiError.validation('Cannot update built-in template');
      }

      const now = new Date().toISOString();
      const updateFields: string[] = [];
      const params: any[] = [];

      if (data.name !== undefined) {
        updateFields.push('name = ?');
        params.push(data.name);
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        params.push(data.description);
      }
      if (data.category !== undefined) {
        updateFields.push('category = ?');
        params.push(data.category);
      }
      if (data.icon !== undefined) {
        updateFields.push('icon = ?');
        params.push(data.icon);
      }
      if (data.config !== undefined) {
        updateFields.push('config = ?');
        params.push(JSON.stringify(data.config));
      }
      if (data.inputs !== undefined) {
        updateFields.push('inputs = ?');
        params.push(JSON.stringify(data.inputs));
      }
      if (data.outputs !== undefined) {
        updateFields.push('outputs = ?');
        params.push(JSON.stringify(data.outputs));
      }

      updateFields.push('updated_at = ?');
      params.push(now);
      params.push(id);

      const query = `UPDATE node_templates SET ${updateFields.join(', ')} WHERE id = ?`;
      await runQuery(query, params);

      const updatedTemplate = await this.getTemplateById(id);
      return updatedTemplate!;
    } catch (error) {
      logger.error('Failed to update template:', error);
      throw ApiError.internal('Failed to update template');
    }
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const existingTemplate = await this.getTemplateById(id);
      if (!existingTemplate) {
        throw ApiError.notFound('Template not found');
      }

      if (existingTemplate.isBuiltIn) {
        throw ApiError.validation('Cannot delete built-in template');
      }

      const query = 'DELETE FROM node_templates WHERE id = ?';
      await runQuery(query, [id]);
    } catch (error) {
      logger.error('Failed to delete template:', error);
      throw ApiError.internal('Failed to delete template');
    }
  }

  /**
   * 根据类型获取模板
   */
  async getTemplatesByType(type: string): Promise<NodeTemplate[]> {
    try {
      const query = 'SELECT * FROM node_templates WHERE type = ? ORDER BY name';
      const rows = await getAllRows(query, [type]);
      
      return rows.map(row => this.mapRowToTemplate(row));
    } catch (error) {
      logger.error('Failed to get templates by type:', error);
      throw ApiError.internal('Failed to get templates by type');
    }
  }

  /**
   * 根据分类获取模板
   */
  async getTemplatesByCategory(category: string): Promise<NodeTemplate[]> {
    try {
      const query = 'SELECT * FROM node_templates WHERE category = ? ORDER BY name';
      const rows = await getAllRows(query, [category]);
      
      return rows.map(row => this.mapRowToTemplate(row));
    } catch (error) {
      logger.error('Failed to get templates by category:', error);
      throw ApiError.internal('Failed to get templates by category');
    }
  }

  /**
   * 将数据库行映射为NodeTemplate对象
   */
  private mapRowToTemplate(row: any): NodeTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      category: row.category,
      icon: row.icon,
      config: JSON.parse(row.config || '{}'),
      inputs: JSON.parse(row.inputs || '[]'),
      outputs: JSON.parse(row.outputs || '[]'),
      isBuiltIn: Boolean(row.is_built_in),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}