import axios from 'axios'
import type { Template } from '@shared/types'

const API_BASE_URL = '/api'

export interface TemplateListResponse {
  data: Template[]
  total: number
  page: number
  pageSize: number
}

export interface TemplateQueryParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  category?: string
}

export interface CreateTemplateData {
  name: string
  description: string
  type: string
  category: string
  config: any
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

class TemplateService {
  async getTemplates(params?: TemplateQueryParams): Promise<TemplateListResponse> {
    const response = await axios.get(`${API_BASE_URL}/templates`, { params })
    const backendResponse = response.data
    
    // 转换后端响应格式为前端期望格式
    if (backendResponse.success && backendResponse.data) {
      return {
        data: backendResponse.data.items || [],
        total: backendResponse.data.total || 0,
        page: backendResponse.data.page || 1,
        pageSize: backendResponse.data.limit || 20
      }
    }
    
    // 如果响应格式不符合预期，返回空数据
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 20
    }
  }

  async getTemplateById(id: string): Promise<Template> {
    const response = await axios.get(`${API_BASE_URL}/templates/${id}`)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to get template')
  }

  async createTemplate(data: CreateTemplateData): Promise<Template> {
    const response = await axios.post(`${API_BASE_URL}/templates`, data)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to create template')
  }

  async updateTemplate(id: string, data: UpdateTemplateData): Promise<Template> {
    const response = await axios.put(`${API_BASE_URL}/templates/${id}`, data)
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data
    }
    
    throw new Error('Failed to update template')
  }

  async deleteTemplate(id: string): Promise<void> {
    const response = await axios.delete(`${API_BASE_URL}/templates/${id}`)
    const backendResponse = response.data
    
    if (!backendResponse.success) {
      throw new Error('Failed to delete template')
    }
  }

  async getTemplatesByType(type: string): Promise<Template[]> {
    const response = await axios.get(`${API_BASE_URL}/templates`, { params: { type } })
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data.items || []
    }
    
    return []
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    const response = await axios.get(`${API_BASE_URL}/templates`, { params: { category } })
    const backendResponse = response.data
    
    if (backendResponse.success && backendResponse.data) {
      return backendResponse.data.items || []
    }
    
    return []
  }
}

export const templateService = new TemplateService()