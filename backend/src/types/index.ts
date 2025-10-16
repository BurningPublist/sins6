/**
 * Backend专用类型定义
 */

// 节点类型（简化版本，用于backend）
export interface FlowNode {
  id: string;
  type: string;
  name: string;
  description?: string;
  position?: {
    x: number;
    y: number;
  };
  config: Record<string, any>;
}

// 连接类型（简化版本，用于backend）
export interface FlowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  label?: string;
}

// 流程设置
export interface FlowSettings {
  timeout: number;
  retryCount: number;
  [key: string]: any;
}

// Backend专用Flow类型
export interface Flow {
  id: string;
  name: string;
  description?: string;
  category: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  variables: Record<string, any>;
  settings: FlowSettings;
  status: string;
  isPublished: boolean;
  isArchived: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// API请求类型
export interface CreateFlowRequest {
  name: string;
  description?: string;
  category: string;
  nodes?: FlowNode[];
  connections?: FlowConnection[];
  variables?: Record<string, any>;
  settings?: FlowSettings;
}

export interface UpdateFlowRequest {
  name?: string;
  description?: string;
  category?: string;
  nodes?: FlowNode[];
  connections?: FlowConnection[];
  variables?: Record<string, any>;
  settings?: FlowSettings;
}

export interface FlowListQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: 'all' | 'published' | 'draft' | 'archived';
  isPublished?: boolean;
  isArchived?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  items?: T[];
  flows?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API响应
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 执行相关类型
export interface ExecuteFlowRequest {
  flowId: string;
  variables?: Record<string, any>;
  inputData?: any;
  dryRun?: boolean;
}

export interface ExecuteFlowResponse {
  executionId: string;
  status: string;
  startTime: string;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  data?: any;
  inputData?: any;
  outputData?: any;
  error?: string;
  status?: string;
  executionTime?: number;
  logs: ExecutionLog[];
  nextNodeIds: string[];
}

export interface ExecutionContext {
  flowId: string;
  executionId: string;
  variables: Map<string, any>;
  inputData: any;
  outputData: any;
  currentNodeId: string;
  executionPath: string[];
  startTime: number;
}

// 模板相关类型
export interface NodeTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  config: Record<string, any>;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  config: Record<string, any>;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  icon?: string;
  category?: string;
  config?: Record<string, any>;
  inputs?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

export interface TemplateListQuery {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  search?: string;
}

// 错误处理类
export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    
    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static badRequest(message: string = 'Bad Request'): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Not Found'): ApiError {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string = 'Conflict'): ApiError {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }

  static validation(message: string = 'Validation Error', details?: any): ApiError {
    const error = new ApiError(message, 400, 'VALIDATION_ERROR');
    (error as any).details = details;
    return error;
  }

  static tooManyRequests(message: string = 'Too Many Requests'): ApiError {
    return new ApiError(message, 429, 'TOO_MANY_REQUESTS');
  }
}