import axios from 'axios'
import type { Workflow, Execution } from '@shared/types'

const API_BASE_URL = '/api'

export interface WorkflowListResponse {
  data: Workflow[]
  total: number
  page: number
  pageSize: number
}

export interface ExecutionListResponse {
  data: Execution[]
  total: number
  page: number
  pageSize: number
}

export interface WorkflowQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface ExecutionQueryParams {
  page?: number
  limit?: number
  workflowId?: string
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface CreateWorkflowData {
  name: string
  description?: string
  definition: any
}

export interface UpdateWorkflowData extends Partial<CreateWorkflowData> {}

class WorkflowService {
  // 工作流管理
  async getWorkflows(params?: WorkflowQueryParams): Promise<WorkflowListResponse> {
    const response = await axios.get(`${API_BASE_URL}/workflows`, { params })
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return {
        data: backendResponse.data.flows || backendResponse.data.items || [],
        total: backendResponse.data.total || 0,
        page: backendResponse.data.page || 1,
        pageSize: backendResponse.data.limit || 20
      }
    }
    
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  }

  async getWorkflowById(id: string): Promise<Workflow> {
    const response = await axios.get(`${API_BASE_URL}/workflows/${id}`)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to get workflow')
  }

  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    const response = await axios.post(`${API_BASE_URL}/workflows`, data)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to create workflow')
  }

  async updateWorkflow(id: string, data: UpdateWorkflowData): Promise<Workflow> {
    const response = await axios.put(`${API_BASE_URL}/workflows/${id}`, data)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to update workflow')
  }

  async deleteWorkflow(id: string): Promise<void> {
    const response = await axios.delete(`${API_BASE_URL}/workflows/${id}`)
    const backendResponse = response.data
    
    if (!backendResponse.success) {
      throw new Error('Failed to delete workflow')
    }
  }

  async duplicateWorkflow(id: string): Promise<Workflow> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${id}/duplicate`)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to duplicate workflow')
  }

  async publishWorkflow(id: string): Promise<Workflow> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${id}/publish`)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to publish workflow')
  }

  // 工作流执行
  async executeWorkflow(id: string, input?: any): Promise<Execution> {
    const response = await axios.post(`${API_BASE_URL}/workflows/${id}/execute`, { input })
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to execute workflow')
  }

  async getExecutions(params?: ExecutionQueryParams): Promise<ExecutionListResponse> {
    const response = await axios.get(`${API_BASE_URL}/executions`, { params })
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
       return {
         data: backendResponse.data.executions || backendResponse.data.items || [],
         total: backendResponse.data.total || 0,
         page: backendResponse.data.page || 1,
         pageSize: backendResponse.data.limit || 20
       }
     }
    
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  }

  async getExecutionById(id: string): Promise<Execution> {
    const response = await axios.get(`${API_BASE_URL}/executions/${id}`)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to get execution')
  }

  async stopExecution(id: string): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/executions/${id}/stop`)
    const backendResponse = response.data
    
    if (!backendResponse.success) {
      throw new Error('Failed to stop execution')
    }
  }

  async getExecutionLogs(id: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE_URL}/executions/${id}/logs`)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    return []
  }
}

export const workflowService = new WorkflowService()