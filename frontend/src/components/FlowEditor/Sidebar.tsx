import React, { useState } from 'react'
import { Card, Collapse, Input, Typography, Space, Tag, Spin, Alert } from 'antd'
import { SearchOutlined, DragOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { templateService } from '../../services/templateService'
import type { Template } from '@shared/types'

const { Panel } = Collapse
const { Search } = Input
const { Text } = Typography

interface SidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string, template: Template) => void
}

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
  const [searchText, setSearchText] = useState('')

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates', { search: searchText }],
    queryFn: () => templateService.getTemplates({ search: searchText }),
  })

  const groupedTemplates = React.useMemo(() => {
    if (!templates?.data) return {}
    
    return templates.data.reduce((acc, template) => {
      const category = template.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(template)
      return acc
    }, {} as Record<string, Template[]>)
  }, [templates])

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      trigger: 'blue',
      action: 'green',
      condition: 'orange',
      transform: 'purple',
    }
    return typeColors[type] || 'default'
  }

  const getTypeText = (type: string) => {
    const typeTexts: Record<string, string> = {
      trigger: '触发器',
      action: '动作',
      condition: '条件',
      transform: '转换',
    }
    return typeTexts[type] || type
  }

  const getCategoryText = (category: string) => {
    const categoryTexts: Record<string, string> = {
      http: 'HTTP',
      database: '数据库',
      file: '文件',
      email: '邮件',
      schedule: '定时',
      webhook: 'Webhook',
      other: '其他',
    }
    return categoryTexts[category] || category
  }

  if (error) {
    return (
      <div className="sidebar" style={{ width: 280, height: '100%', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px' }}>
          <Alert
            message="加载模板失败"
            description={error instanceof Error ? error.message : '请检查网络连接'}
            type="error"
            showIcon
          />
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar" style={{ width: 280, height: '100%', borderRight: '1px solid #f0f0f0' }}>
      <div style={{ padding: '16px' }}>
        <Search
          placeholder="搜索节点模板"
          allowClear
          onSearch={setSearchText}
          prefix={<SearchOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">加载模板中...</Text>
            </div>
          </div>
        ) : (
          <Collapse
            defaultActiveKey={Object.keys(groupedTemplates)}
            ghost
            size="small"
          >
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <Panel
              header={
                <Space>
                  <Text strong>{getCategoryText(category)}</Text>
                  <Text type="secondary">({categoryTemplates.length})</Text>
                </Space>
              }
              key={category}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categoryTemplates.map((template) => (
                  <Card
                    key={template.id}
                    size="small"
                    hoverable
                    style={{
                      cursor: 'grab',
                      border: '1px solid #f0f0f0',
                    }}
                    bodyStyle={{ padding: '8px 12px' }}
                    draggable
                    onDragStart={(event) => onDragStart(event, template.type, template)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <DragOutlined style={{ color: '#999', marginRight: 8 }} />
                      <Text strong style={{ fontSize: 12 }}>
                        {template.name}
                      </Text>
                    </div>
                    
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={getTypeColor(template.type)}>
                        {getTypeText(template.type)}
                      </Tag>
                    </div>
                    
                    {template.description && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: 'block',
                          lineHeight: '14px',
                        }}
                      >
                        {template.description.length > 40
                          ? `${template.description.substring(0, 40)}...`
                          : template.description
                        }
                      </Text>
                    )}
                  </Card>
                ))}
              </div>
            </Panel>
          ))}
          </Collapse>
        )}
        
        {!isLoading && (!templates?.data || templates.data.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">暂无模板数据</Text>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar