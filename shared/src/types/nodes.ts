/**
 * 具体节点类型定义
 */

import { BaseNode, NodeType, DataType } from './flow';

// 开始节点
export interface StartNode extends BaseNode {
  type: NodeType.START;
  config: {
    triggerType: 'manual' | 'schedule' | 'webhook';
    scheduleConfig?: {
      cron: string;
      timezone: string;
    };
    webhookConfig?: {
      path: string;
      method: string;
    };
  };
}

// 结束节点
export interface EndNode extends BaseNode {
  type: NodeType.END;
  config: {
    returnValue?: any;
    successMessage?: string;
  };
}

// 条件节点
export interface ConditionNode extends BaseNode {
  type: NodeType.CONDITION;
  config: {
    conditions: ConditionRule[];
    operator: 'AND' | 'OR';
    defaultPath: 'true' | 'false';
  };
}

// 条件规则
export interface ConditionRule {
  id: string;
  leftOperand: string; // 变量名或值
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
  rightOperand: string; // 变量名或值
  dataType: DataType;
}

// 动作节点
export interface ActionNode extends BaseNode {
  type: NodeType.ACTION;
  config: {
    actionType: 'http_request' | 'file_operation' | 'data_transform' | 'notification' | 'custom_script';
    actionConfig: HttpRequestConfig | FileOperationConfig | DataTransformConfig | NotificationConfig | CustomScriptConfig;
  };
}

// HTTP请求配置
export interface HttpRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: any;
  timeout: number;
  retryCount: number;
  followRedirects: boolean;
}

// 文件操作配置
export interface FileOperationConfig {
  operation: 'read' | 'write' | 'delete' | 'copy' | 'move';
  sourcePath: string;
  targetPath?: string;
  content?: string;
  encoding: string;
  createDirectories: boolean;
}

// 数据转换配置
export interface DataTransformConfig {
  transformType: 'json_parse' | 'json_stringify' | 'csv_parse' | 'csv_stringify' | 'xml_parse' | 'xml_stringify' | 'custom';
  inputVariable: string;
  outputVariable: string;
  customScript?: string;
  options: Record<string, any>;
}

// 通知配置
export interface NotificationConfig {
  notificationType: 'email' | 'webhook' | 'console';
  recipient?: string;
  subject?: string;
  message: string;
  webhookUrl?: string;
  webhookMethod?: string;
}

// 自定义脚本配置
export interface CustomScriptConfig {
  language: 'javascript' | 'python';
  script: string;
  inputVariables: string[];
  outputVariable: string;
  timeout: number;
}

// 延迟节点
export interface DelayNode extends BaseNode {
  type: NodeType.DELAY;
  config: {
    delayType: 'fixed' | 'variable';
    duration: number; // 毫秒
    durationVariable?: string; // 变量名
    unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours';
  };
}

// 变量节点
export interface VariableNode extends BaseNode {
  type: NodeType.VARIABLE;
  config: {
    operation: 'set' | 'get' | 'increment' | 'decrement' | 'append';
    variableName: string;
    value?: any;
    valueVariable?: string; // 从其他变量获取值
    dataType: DataType;
    scope: 'local' | 'global';
  };
}

// 节点联合类型
export type FlowNode = StartNode | EndNode | ConditionNode | ActionNode | DelayNode | VariableNode;

// 节点配置联合类型
export type NodeConfig = 
  | StartNode['config']
  | EndNode['config']
  | ConditionNode['config']
  | ActionNode['config']
  | DelayNode['config']
  | VariableNode['config'];

// 节点模板
export interface NodeTemplate {
  id: string;
  type: NodeType;
  name: string;
  description: string;
  icon: string;
  category: string;
  defaultConfig: NodeConfig;
  inputs: Array<{
    name: string;
    type: DataType;
    required: boolean;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: DataType;
    description: string;
  }>;
}