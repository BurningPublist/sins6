/**
 * 通用工具类型定义
 */

// 深度可选类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深度必需类型
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// 选择性必需类型
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 选择性可选类型
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 键值对类型
export type KeyValuePair<K extends string | number | symbol = string, V = any> = {
  key: K;
  value: V;
};

// 时间戳类型
export type Timestamp = string; // ISO 8601 格式

// ID类型
export type ID = string;

// 颜色类型
export type Color = string; // 十六进制颜色值

// 坐标类型
export interface Position {
  x: number;
  y: number;
}

// 尺寸类型
export interface Size {
  width: number;
  height: number;
}

// 矩形区域类型
export interface Rectangle extends Position, Size {}

// 事件处理器类型
export type EventHandler<T = any> = (event: T) => void;

// 异步事件处理器类型
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 验证错误类型
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// 排序方向类型
export type SortDirection = 'asc' | 'desc';

// 排序配置类型
export interface SortConfig<T = any> {
  field: keyof T;
  direction: SortDirection;
}

// 过滤器类型
export interface Filter<T = any> {
  field: keyof T;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

// 搜索配置类型
export interface SearchConfig<T = any> {
  query: string;
  fields: (keyof T)[];
  caseSensitive: boolean;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'auto';

// 语言类型
export type Language = 'zh-CN' | 'en-US';

// 环境类型
export type Environment = 'development' | 'production' | 'test';

// 日志级别类型
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 状态类型
export type Status = 'idle' | 'loading' | 'success' | 'error';

// 权限类型
export type Permission = 'read' | 'write' | 'delete' | 'admin';

// 用户角色类型
export type UserRole = 'viewer' | 'editor' | 'admin' | 'owner';

// 文件类型
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  path: string;
}

// 配置项类型
export interface ConfigItem<T = any> {
  key: string;
  value: T;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required: boolean;
  defaultValue?: T;
}

// 菜单项类型
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  disabled?: boolean;
  hidden?: boolean;
}

// 面包屑项类型
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}