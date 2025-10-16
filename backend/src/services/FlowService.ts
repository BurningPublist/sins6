/**
 * 流程服务类
 */

import { 
  Flow, 
  CreateFlowRequest, 
  UpdateFlowRequest,
  FlowListQuery,
  PaginatedResponse,
  FlowNode,
  FlowConnection,
  FlowSettings
} from '../types';
import { getDatabase, runQuery, getRow, getAllRows } from '../database';
import { ApiError } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class FlowService {
  private db = getDatabase();

  /**
   * 获取流程列表
   */
  async getFlows(options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: 'all' | 'published' | 'draft' | 'archived';
  } = {}): Promise<{ flows: Flow[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const { page = 1, limit = 20, category, search, status = 'all' } = options;
      const offset = (page - 1) * limit;

      let whereConditions: string[] = [];
      let params: any[] = [];

      // 状态过滤
      if (status === 'published') {
        whereConditions.push('is_published = ?');
        params.push(1);
      } else if (status === 'draft') {
        whereConditions.push('is_published = ? AND is_archived = ?');
        params.push(0, 0);
      } else if (status === 'archived') {
        whereConditions.push('is_archived = ?');
        params.push(1);
      }

      // 分类过滤
      if (category) {
        whereConditions.push('category = ?');
        params.push(category);
      }

      // 搜索过滤
      if (search) {
        whereConditions.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM flows ${whereClause}`;
      const countResult = await getRow(countQuery, params);

      // 获取流程列表
      const query = `
        SELECT * FROM flows 
        ${whereClause}
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
      `;
      const flows = await getAllRows(query, [...params, limit, offset]);

      const total = countResult?.total || 0;
      return {
        flows: flows.map(row => this.mapRowToFlow(row)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get flows:', error);
      throw ApiError.internal('Failed to get flows');
    }
  }

  /**
   * 根据ID获取流程
   */
  async getFlowById(id: string): Promise<Flow | null> {
    try {
      const query = 'SELECT * FROM flows WHERE id = ?';
      const row = await getRow(query, [id]);
      
      return row ? this.mapRowToFlow(row) : null;
    } catch (error) {
      logger.error('Failed to get flow by id:', error);
      throw ApiError.internal('Failed to get flow');
    }
  }

  /**
   * 创建流程
   */
  async createFlow(data: {
    name: string;
    description?: string;
    category: string;
    nodes?: FlowNode[];
    connections?: FlowConnection[];
    variables?: Record<string, any>;
    settings?: FlowSettings;
  }): Promise<Flow> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const flow: Flow = {
        id,
        name: data.name,
        description: data.description,
        category: data.category,
        nodes: data.nodes || [],
        connections: data.connections || [],
        variables: data.variables || {},
        settings: data.settings || { timeout: 300000, retryCount: 0 },
        isPublished: false,
        isArchived: false,
        version: 1,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      };

      const query = `
        INSERT INTO flows (
          id, name, description, category, nodes, connections, 
          variables, settings, is_published, is_archived, version,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await runQuery(query, [
        flow.id,
        flow.name,
        flow.description,
        flow.category,
        JSON.stringify(flow.nodes),
        JSON.stringify(flow.connections),
        JSON.stringify(flow.variables),
        JSON.stringify(flow.settings),
        flow.isPublished ? 1 : 0,
        flow.isArchived ? 1 : 0,
        flow.version,
        flow.createdAt,
        flow.updatedAt
      ]);

      return flow;
    } catch (error) {
      logger.error('Failed to create flow:', error);
      throw ApiError.internal('Failed to create flow');
    }
  }

  /**
   * 更新流程
   */
  async updateFlow(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    nodes?: FlowNode[];
    connections?: FlowConnection[];
    variables?: Record<string, any>;
    settings?: FlowSettings;
  }): Promise<Flow> {
    try {
      // 先检查流程是否存在
      const existingFlow = await this.getFlowById(id);
      if (!existingFlow) {
        throw ApiError.notFound('Flow not found');
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
      if (data.nodes !== undefined) {
        updateFields.push('nodes = ?');
        params.push(JSON.stringify(data.nodes));
      }
      if (data.connections !== undefined) {
        updateFields.push('connections = ?');
        params.push(JSON.stringify(data.connections));
      }
      if (data.variables !== undefined) {
        updateFields.push('variables = ?');
        params.push(JSON.stringify(data.variables));
      }
      if (data.settings !== undefined) {
        updateFields.push('settings = ?');
        params.push(JSON.stringify(data.settings));
      }

      updateFields.push('updated_at = ?');
      params.push(now);
      params.push(id);

      const query = `UPDATE flows SET ${updateFields.join(', ')} WHERE id = ?`;
      await runQuery(query, params);

      // 返回更新后的流程
      const updatedFlow = await this.getFlowById(id);
      return updatedFlow!;
    } catch (error) {
      logger.error('Failed to update flow:', error);
      throw ApiError.internal('Failed to update flow');
    }
  }

  /**
   * 删除流程
   */
  async deleteFlow(id: string): Promise<void> {
    try {
      const existingFlow = await this.getFlowById(id);
      if (!existingFlow) {
        throw ApiError.notFound('Flow not found');
      }

      const query = 'DELETE FROM flows WHERE id = ?';
      await runQuery(query, [id]);
    } catch (error) {
      logger.error('Failed to delete flow:', error);
      throw ApiError.internal('Failed to delete flow');
    }
  }

  /**
   * 复制流程
   */
  async duplicateFlow(id: string, newName?: string): Promise<Flow> {
    try {
      const originalFlow = await this.getFlowById(id);
      if (!originalFlow) {
        throw ApiError.notFound('Flow not found');
      }

      const duplicatedFlow = await this.createFlow({
        name: newName || `${originalFlow.name} (Copy)`,
        description: originalFlow.description,
        category: originalFlow.category,
        nodes: originalFlow.nodes,
        connections: originalFlow.connections,
        variables: originalFlow.variables,
        settings: originalFlow.settings
      });

      return duplicatedFlow;
    } catch (error) {
      logger.error('Failed to duplicate flow:', error);
      throw ApiError.internal('Failed to duplicate flow');
    }
  }

  /**
   * 发布流程
   */
  async publishFlow(id: string): Promise<Flow> {
    try {
      const flow = await this.getFlowById(id);
      if (!flow) {
        throw ApiError.notFound('Flow not found');
      }

      // 验证流程结构
      this.validateFlowStructure(flow);

      const query = 'UPDATE flows SET is_published = ?, updated_at = ? WHERE id = ?';
      await runQuery(query, [1, new Date().toISOString(), id]);

      const updatedFlow = await this.getFlowById(id);
      return updatedFlow!;
    } catch (error) {
      logger.error('Failed to publish flow:', error);
      throw ApiError.internal('Failed to publish flow');
    }
  }

  /**
   * 归档流程
   */
  async archiveFlow(id: string): Promise<Flow> {
    try {
      const flow = await this.getFlowById(id);
      if (!flow) {
        throw ApiError.notFound('Flow not found');
      }

      const query = 'UPDATE flows SET is_archived = ?, updated_at = ? WHERE id = ?';
      await runQuery(query, [1, new Date().toISOString(), id]);

      const updatedFlow = await this.getFlowById(id);
      return updatedFlow!;
    } catch (error) {
      logger.error('Failed to archive flow:', error);
      throw ApiError.internal('Failed to archive flow');
    }
  }

  /**
   * 验证流程结构
   */
  private validateFlowStructure(flow: Flow): void {
    if (!flow.nodes || flow.nodes.length === 0) {
      throw ApiError.validation('Flow must have at least one node');
    }

    const hasStartNode = flow.nodes.some(node => node.type === 'start');
    const hasEndNode = flow.nodes.some(node => node.type === 'end');

    if (!hasStartNode) {
      throw ApiError.validation('Flow must have a start node');
    }

    if (!hasEndNode) {
      throw ApiError.validation('Flow must have an end node');
    }

    // 验证节点ID唯一性
    const nodeIds = flow.nodes.map(node => node.id);
    const uniqueIds = new Set(nodeIds);
    if (nodeIds.length !== uniqueIds.size) {
      throw ApiError.validation('Node IDs must be unique');
    }

    // 验证连接的有效性
    for (const connection of flow.connections) {
      const sourceExists = flow.nodes.some(node => node.id === connection.sourceId);
      const targetExists = flow.nodes.some(node => node.id === connection.targetId);
      
      if (!sourceExists || !targetExists) {
        throw ApiError.validation('Invalid connection: source or target node not found');
      }
    }
  }

  /**
   * 将数据库行映射为Flow对象
   */
  private mapRowToFlow(row: any): Flow {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      nodes: JSON.parse(row.nodes || '[]'),
      connections: JSON.parse(row.connections || '[]'),
      variables: JSON.parse(row.variables || '{}'),
      settings: JSON.parse(row.settings || '{}'),
      isPublished: Boolean(row.is_published),
      isArchived: Boolean(row.is_archived),
      version: row.version,
      status: row.status || 'draft',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}