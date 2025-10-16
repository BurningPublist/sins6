// 工作流相关类型
export interface Workflow {
  id: string
  name: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    config?: Record<string, any>
    templateId?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

// 执行相关类型
export interface Execution {
  id: string
  workflowId: string
  workflowName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: string
  endTime?: string
  duration?: number
  result?: any
  error?: string
  logs?: ExecutionLog[]
  createdBy: string
}

export interface ExecutionLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  nodeId?: string
  data?: any
}

// 模板相关类型
export interface Template {
  id: string
  name: string
  description?: string
  type: 'trigger' | 'action' | 'condition' | 'transform'
  category: string
  icon?: string
  config: TemplateConfig
  createdAt: string
  updatedAt: string
  isBuiltIn: boolean
}

export interface TemplateConfig {
  inputs: TemplateInput[]
  outputs: TemplateOutput[]
  settings?: TemplateSetting[]
}

export interface TemplateInput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface TemplateOutput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
}

export interface TemplateSetting {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect'
  required: boolean
  description?: string
  defaultValue?: any
  options?: { label: string; value: any }[]
}

// API 请求/响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 查询参数类型
export interface WorkflowQuery {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface ExecutionQuery {
  search?: string
  status?: string
  workflowId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface TemplateQuery {
  search?: string
  type?: string
  category?: string
  page?: number
  pageSize?: number
}

// 创建/更新请求类型
export interface CreateWorkflowRequest {
  name: string
  description?: string
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  status?: 'draft' | 'published' | 'archived'
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  type: 'trigger' | 'action' | 'condition' | 'transform'
  category: string
  icon?: string
  config: TemplateConfig
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  type?: 'trigger' | 'action' | 'condition' | 'transform'
  category?: string
  icon?: string
  config?: TemplateConfig
}

export interface ExecuteWorkflowRequest {
  workflowId: string
  inputs?: Record<string, any>
}