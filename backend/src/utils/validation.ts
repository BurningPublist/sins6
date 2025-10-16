/**
 * 数据验证工具
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

/**
 * 验证中间件工厂函数
 */
export function validateSchema(schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 验证请求体
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // 验证查询参数
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // 验证路径参数
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        throw ApiError.validation('Validation failed', validationErrors);
      }
      
      throw error;
    }
  };
}

/**
 * 通用验证模式
 */
export const commonSchemas = {
  // ID参数验证
  id: z.object({
    id: z.string().min(1, 'ID is required')
  }),

  // 分页查询验证
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),

  // 搜索查询验证
  search: z.object({
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  // 时间范围验证
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
};

/**
 * 流程相关验证模式
 */
export const flowSchemas = {
  // 创建流程验证
  create: z.object({
    name: z.string().min(1, 'Flow name is required').max(100, 'Flow name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    category: z.string().min(1, 'Category is required'),
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      data: z.record(z.any()).optional(),
      config: z.record(z.any()).optional()
    })).default([]),
    connections: z.array(z.object({
      id: z.string(),
      sourceNodeId: z.string(),
      targetNodeId: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional()
    })).default([]),
    variables: z.record(z.any()).default({}),
    settings: z.object({
      timeout: z.number().min(1000).max(300000).default(30000),
      retryCount: z.number().min(0).max(5).default(0),
      retryDelay: z.number().min(1000).max(60000).default(5000)
    }).default({})
  }),

  // 更新流程验证
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    category: z.string().min(1).optional(),
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      data: z.record(z.any()).optional(),
      config: z.record(z.any()).optional()
    })).optional(),
    connections: z.array(z.object({
      id: z.string(),
      sourceNodeId: z.string(),
      targetNodeId: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional()
    })).optional(),
    variables: z.record(z.any()).optional(),
    settings: z.object({
      timeout: z.number().min(1000).max(300000).optional(),
      retryCount: z.number().min(0).max(5).optional(),
      retryDelay: z.number().min(1000).max(60000).optional()
    }).optional(),
    isPublished: z.boolean().optional(),
    isArchived: z.boolean().optional()
  }),

  // 查询流程验证
  query: commonSchemas.pagination.extend({
    category: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isPublished: z.coerce.boolean().optional(),
    isArchived: z.coerce.boolean().optional()
  }).merge(commonSchemas.search).merge(commonSchemas.dateRange)
};

/**
 * 执行相关验证模式
 */
export const executionSchemas = {
  // 执行流程验证
  execute: z.object({
    inputData: z.record(z.any()).default({}),
    variables: z.record(z.any()).default({})
  }),

  // 查询执行验证
  query: commonSchemas.pagination.extend({
    flowId: z.string().optional(),
    status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
    userId: z.string().optional()
  }).merge(commonSchemas.search).merge(commonSchemas.dateRange),

  // 执行日志查询验证
  logs: commonSchemas.pagination.extend({
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    nodeId: z.string().optional()
  }).merge(commonSchemas.dateRange)
};

/**
 * 模板相关验证模式
 */
export const templateSchemas = {
  // 创建模板验证
  create: z.object({
    name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
    category: z.string().min(1, 'Category is required'),
    type: z.string().min(1, 'Type is required'),
    description: z.string().max(500, 'Description too long').optional(),
    icon: z.string().optional(),
    configSchema: z.record(z.any()).default({}),
    inputSchema: z.record(z.any()).default({}),
    outputSchema: z.record(z.any()).default({})
  }),

  // 更新模板验证
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    category: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().optional(),
    configSchema: z.record(z.any()).optional(),
    inputSchema: z.record(z.any()).optional(),
    outputSchema: z.record(z.any()).optional()
  }),

  // 查询模板验证
  query: commonSchemas.pagination.extend({
    category: z.string().optional(),
    type: z.string().optional(),
    isSystem: z.coerce.boolean().optional()
  }).merge(commonSchemas.search)
};

/**
 * 验证JSON Schema
 */
export function validateJsonSchema(schema: any): boolean {
  try {
    // 基本的JSON Schema验证
    if (typeof schema !== 'object' || schema === null) {
      return false;
    }

    // 检查必需的字段
    if (schema.type && typeof schema.type !== 'string') {
      return false;
    }

    // 检查properties字段
    if (schema.properties && typeof schema.properties !== 'object') {
      return false;
    }

    // 检查required字段
    if (schema.required && !Array.isArray(schema.required)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 验证流程结构
 */
export function validateFlowStructure(nodes: any[], connections: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查是否有开始节点
  const startNodes = nodes.filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push('Flow must have at least one start node');
  } else if (startNodes.length > 1) {
    errors.push('Flow can only have one start node');
  }

  // 检查是否有结束节点
  const endNodes = nodes.filter(node => node.type === 'end');
  if (endNodes.length === 0) {
    errors.push('Flow must have at least one end node');
  }

  // 检查节点ID唯一性
  const nodeIds = nodes.map(node => node.id);
  const uniqueNodeIds = new Set(nodeIds);
  if (nodeIds.length !== uniqueNodeIds.size) {
    errors.push('Node IDs must be unique');
  }

  // 检查连接的有效性
  for (const connection of connections) {
    const sourceExists = nodes.some(node => node.id === connection.sourceNodeId);
    const targetExists = nodes.some(node => node.id === connection.targetNodeId);

    if (!sourceExists) {
      errors.push(`Connection source node ${connection.sourceNodeId} does not exist`);
    }

    if (!targetExists) {
      errors.push(`Connection target node ${connection.targetNodeId} does not exist`);
    }
  }

  // 检查是否有循环依赖
  if (hasCircularDependency(nodes, connections)) {
    errors.push('Flow contains circular dependencies');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 检查循环依赖
 */
function hasCircularDependency(nodes: any[], connections: any[]): boolean {
  const graph = new Map<string, string[]>();
  
  // 构建邻接表
  for (const node of nodes) {
    graph.set(node.id, []);
  }
  
  for (const connection of connections) {
    const targets = graph.get(connection.sourceNodeId) || [];
    targets.push(connection.targetNodeId);
    graph.set(connection.sourceNodeId, targets);
  }

  // DFS检查循环
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // 发现循环
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        return true;
      }
    }
  }

  return false;
}