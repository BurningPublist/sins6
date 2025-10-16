/**
 * API相关类型定义
 */

// HTTP方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// API响应状态
export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  LOADING = 'loading'
}

// 基础API响应接口
export interface ApiResponse<T = any> {
  status: ApiStatus;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp: string;
}

// API错误接口
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 流程API相关类型
export interface CreateFlowRequest {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateFlowRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  nodes?: any[];
  connections?: any[];
}

export interface FlowListQuery extends PaginationParams {
  search?: string;
  category?: string;
  tags?: string[];
  status?: string;
}

export interface ExecuteFlowRequest {
  flowId: string;
  variables?: Record<string, any>;
  dryRun?: boolean;
}

export interface ExecuteFlowResponse {
  executionId: string;
  status: string;
  startTime: string;
  message?: string;
}

// WebSocket消息类型
export enum WebSocketMessageType {
  FLOW_EXECUTION_START = 'flow_execution_start',
  FLOW_EXECUTION_UPDATE = 'flow_execution_update',
  FLOW_EXECUTION_COMPLETE = 'flow_execution_complete',
  FLOW_EXECUTION_ERROR = 'flow_execution_error',
  NODE_EXECUTION_START = 'node_execution_start',
  NODE_EXECUTION_COMPLETE = 'node_execution_complete',
  NODE_EXECUTION_ERROR = 'node_execution_error',
  FLOW_SAVED = 'flow_saved',
  FLOW_DELETED = 'flow_deleted'
}

// WebSocket消息接口
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: string;
  executionId?: string;
  flowId?: string;
}

// 实时执行更新消息
export interface ExecutionUpdateMessage {
  executionId: string;
  flowId: string;
  currentNodeId?: string;
  status: string;
  progress: number;
  logs: any[];
  variables: Record<string, any>;
}

// 节点执行更新消息
export interface NodeExecutionMessage {
  executionId: string;
  nodeId: string;
  status: string;
  data?: any;
  error?: string;
  timestamp: string;
}