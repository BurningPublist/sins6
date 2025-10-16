/**
 * 共享常量定义
 */

// API端点
export const API_ENDPOINTS = {
  FLOWS: '/api/flows',
  EXECUTE: '/api/execute',
  NODES: '/api/nodes',
  TEMPLATES: '/api/templates',
  HEALTH: '/api/health'
} as const;

// WebSocket事件
export const WS_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  FLOW_EXECUTION: 'flow_execution',
  NODE_EXECUTION: 'node_execution'
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  // 节点默认尺寸
  NODE_SIZE: {
    width: 200,
    height: 80
  },
  
  // 连接线样式
  CONNECTION_STYLE: {
    strokeWidth: 2,
    stroke: '#b1b1b7',
    strokeDasharray: '0'
  },
  
  // 网格配置
  GRID_CONFIG: {
    size: 20,
    color: '#f0f0f0'
  },
  
  // 执行超时时间（毫秒）
  EXECUTION_TIMEOUT: 30000,
  
  // 重试次数
  RETRY_COUNT: 3,
  
  // 分页大小
  PAGE_SIZE: 20,
  
  // 最大文件大小（字节）
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // 支持的文件类型
  SUPPORTED_FILE_TYPES: [
    'application/json',
    'text/csv',
    'text/plain',
    'application/xml'
  ]
} as const;

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // 流程相关错误
  FLOW_NOT_FOUND: 'FLOW_NOT_FOUND',
  FLOW_INVALID: 'FLOW_INVALID',
  FLOW_EXECUTION_FAILED: 'FLOW_EXECUTION_FAILED',
  
  // 节点相关错误
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_EXECUTION_FAILED: 'NODE_EXECUTION_FAILED',
  NODE_TIMEOUT: 'NODE_TIMEOUT',
  
  // 连接相关错误
  CONNECTION_INVALID: 'CONNECTION_INVALID',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  
  // 网络相关错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // 文件相关错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_SUPPORTED: 'FILE_TYPE_NOT_SUPPORTED'
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  FLOW_CREATED: '流程创建成功',
  FLOW_UPDATED: '流程更新成功',
  FLOW_DELETED: '流程删除成功',
  FLOW_EXECUTED: '流程执行成功',
  NODE_CREATED: '节点创建成功',
  NODE_UPDATED: '节点更新成功',
  NODE_DELETED: '节点删除成功',
  CONNECTION_CREATED: '连接创建成功',
  CONNECTION_DELETED: '连接删除成功'
} as const;

// 节点类别
export const NODE_CATEGORIES = {
  TRIGGER: '触发器',
  ACTION: '动作',
  CONDITION: '条件',
  UTILITY: '工具',
  DATA: '数据处理'
} as const;

// 节点图标
export const NODE_ICONS = {
  START: '▶️',
  END: '⏹️',
  CONDITION: '❓',
  ACTION: '⚡',
  DELAY: '⏰',
  VARIABLE: '📝',
  HTTP_REQUEST: '🌐',
  FILE_OPERATION: '📁',
  DATA_TRANSFORM: '🔄',
  NOTIFICATION: '📢',
  CUSTOM_SCRIPT: '💻'
} as const;

// 主题颜色
export const THEME_COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#ff4d4f',
  INFO: '#1890ff',
  
  // 节点颜色
  NODE_START: '#52c41a',
  NODE_END: '#ff4d4f',
  NODE_CONDITION: '#faad14',
  NODE_ACTION: '#1890ff',
  NODE_DELAY: '#722ed1',
  NODE_VARIABLE: '#13c2c2'
} as const;

// 动画持续时间
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const;

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Ctrl+S',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  DELETE: 'Delete',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  SELECT_ALL: 'Ctrl+A'
} as const;