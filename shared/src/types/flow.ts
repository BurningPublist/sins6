/**
 * 流程相关类型定义
 */

// 节点类型枚举
export enum NodeType {
  START = 'start',
  END = 'end',
  CONDITION = 'condition',
  ACTION = 'action',
  DELAY = 'delay',
  VARIABLE = 'variable'
}

// 节点状态枚举
export enum NodeStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

// 流程状态枚举
export enum FlowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// 数据类型枚举
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  ANY = 'any'
}

// 基础节点接口
export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  status: NodeStatus;
  config: Record<string, any>;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  createdAt: string;
  updatedAt: string;
}

// 节点输入定义
export interface NodeInput {
  id: string;
  name: string;
  type: DataType;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

// 节点输出定义
export interface NodeOutput {
  id: string;
  name: string;
  type: DataType;
  description?: string;
}

// 连接线接口
export interface Connection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
  label?: string;
}

// 流程接口
export interface Flow {
  id: string;
  name: string;
  description?: string;
  status: FlowStatus;
  nodes: BaseNode[];
  connections: Connection[];
  variables: FlowVariable[];
  metadata: FlowMetadata;
  createdAt: string;
  updatedAt: string;
}

// 流程变量
export interface FlowVariable {
  id: string;
  name: string;
  type: DataType;
  value: any;
  description?: string;
  isGlobal: boolean;
}

// 流程元数据
export interface FlowMetadata {
  version: string;
  author?: string;
  tags: string[];
  category?: string;
  isTemplate: boolean;
  executionCount: number;
  lastExecutedAt?: string;
}

// 执行上下文
export interface ExecutionContext {
  flowId: string;
  executionId: string;
  variables: Record<string, any>;
  currentNodeId?: string;
  startTime: string;
  endTime?: string;
  status: FlowStatus;
  error?: ExecutionError;
  logs: ExecutionLog[];
}

// 执行错误
export interface ExecutionError {
  nodeId: string;
  message: string;
  stack?: string;
  timestamp: string;
}

// 执行日志
export interface ExecutionLog {
  id: string;
  nodeId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
}

// 节点执行结果
export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  logs: ExecutionLog[];
  nextNodeIds: string[];
}