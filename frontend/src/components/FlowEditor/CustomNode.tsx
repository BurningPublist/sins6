import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card, Tag, Typography } from 'antd'
import {
  PlayCircleOutlined,
  SettingOutlined,
  BranchesOutlined,
  SwapOutlined,
} from '@ant-design/icons'

const { Text } = Typography

export interface CustomNodeData {
  label: string
  type: 'trigger' | 'action' | 'condition' | 'transform'
  category?: string
  config?: any
  description?: string
  template?: any
  onEdit?: (nodeId: string) => void
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected, id }) => {
  const handleDoubleClick = () => {
    if (data.onEdit) {
      data.onEdit(id)
    }
  }
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <PlayCircleOutlined style={{ color: '#1890ff' }} />
      case 'action':
        return <SettingOutlined style={{ color: '#52c41a' }} />
      case 'condition':
        return <BranchesOutlined style={{ color: '#fa8c16' }} />
      case 'transform':
        return <SwapOutlined style={{ color: '#722ed1' }} />
      default:
        return <SettingOutlined />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return '#1890ff'
      case 'action':
        return '#52c41a'
      case 'condition':
        return '#fa8c16'
      case 'transform':
        return '#722ed1'
      default:
        return '#d9d9d9'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'trigger':
        return '触发器'
      case 'action':
        return '动作'
      case 'condition':
        return '条件'
      case 'transform':
        return '转换'
      default:
        return type
    }
  }

  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
        isConnectable={data.type !== 'trigger'}
      />
      
      <Card
        size="small"
        style={{
          minWidth: 180,
          border: selected ? `2px solid ${getNodeColor(data.type)}` : '1px solid #d9d9d9',
          borderRadius: 8,
          boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
        }}
        bodyStyle={{ padding: '12px' }}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {getNodeIcon(data.type)}
          <Text strong style={{ marginLeft: 8, fontSize: 14 }}>
            {data.label}
          </Text>
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <Tag color={getNodeColor(data.type)}>
            {getTypeText(data.type)}
          </Tag>
          {data.category && (
            <Tag style={{ marginLeft: 4 }}>
              {data.category}
            </Tag>
          )}
        </div>
        
        {data.description && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
            {data.description.length > 50 
              ? `${data.description.substring(0, 50)}...` 
              : data.description
            }
          </Text>
        )}
      </Card>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
        isConnectable={true}
      />
    </div>
  )
}

export default CustomNode