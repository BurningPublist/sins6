import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Select, Button, Typography, Space, Divider, message, Switch, Tooltip } from 'antd'
import { DeleteOutlined, CopyOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { Node } from 'reactflow'
import type { CustomNodeData } from './CustomNode'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface PropertiesPanelProps {
  selectedNode: Node<CustomNodeData> | null
  onUpdateNode: (nodeId: string, data: Partial<CustomNodeData>) => void
  onDeleteNode: (nodeId: string) => void
  onDuplicateNode: (nodeId: string) => void
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
}) => {
  const [form] = Form.useForm()
  const [isConfigValid, setIsConfigValid] = useState(true)
  const [autoSave, setAutoSave] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data.label,
        description: selectedNode.data.description,
        type: selectedNode.data.type,
        category: selectedNode.data.category,
        config: selectedNode.data.config ? JSON.stringify(selectedNode.data.config, null, 2) : '',
      })
      setHasUnsavedChanges(false)
    } else {
      form.resetFields()
      setHasUnsavedChanges(false)
    }
  }, [selectedNode, form])

  const validateConfig = (configString: string) => {
    if (!configString.trim()) {
      setIsConfigValid(true)
      return true
    }
    
    try {
      JSON.parse(configString)
      setIsConfigValid(true)
      return true
    } catch (error) {
      setIsConfigValid(false)
      return false
    }
  }

  const handleFormChange = () => {
    setHasUnsavedChanges(true)
    
    if (autoSave) {
      const values = form.getFieldsValue()
      if (values.config) {
        if (validateConfig(values.config)) {
          handleSave(values)
        }
      } else {
        handleSave(values)
      }
    }
  }

  const handleSave = (values: any) => {
    if (!selectedNode) return

    try {
      const config = values.config ? JSON.parse(values.config) : {}
      onUpdateNode(selectedNode.id, {
        ...values,
        config,
      })
      setHasUnsavedChanges(false)
      message.success('节点属性已保存')
    } catch (error) {
      console.error('Invalid JSON config:', error)
      message.error('配置格式错误，请检查JSON格式')
    }
  }

  const handleDelete = () => {
    if (selectedNode) {
      onDeleteNode(selectedNode.id)
    }
  }

  const handleDuplicate = () => {
    if (selectedNode) {
      onDuplicateNode(selectedNode.id)
    }
  }

  if (!selectedNode) {
    return (
      <div className="properties-panel" style={{ width: 320, padding: 16 }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">请选择一个节点来编辑属性</Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="properties-panel" style={{ width: 320, padding: 16 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0 }}>
              节点属性
            </Title>
            <Space>
              {hasUnsavedChanges && (
                <Text type="warning" style={{ fontSize: 12 }}>
                  未保存
                </Text>
              )}
              <Tooltip title="开启后修改会自动保存">
                <Switch
                  size="small"
                  checked={autoSave}
                  onChange={setAutoSave}
                  checkedChildren="自动"
                  unCheckedChildren="手动"
                />
              </Tooltip>
            </Space>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {selectedNode.id}
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={handleFormChange}
          size="small"
        >
          <Form.Item
            label="节点名称"
            name="label"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea placeholder="请输入节点描述" rows={2} />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择节点类型' }]}
          >
            <Select placeholder="请选择节点类型">
              <Option value="trigger">触发器</Option>
              <Option value="action">动作</Option>
              <Option value="condition">条件</Option>
              <Option value="transform">转换</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
          >
            <Select placeholder="请选择节点分类" allowClear>
              <Option value="http">HTTP</Option>
              <Option value="database">数据库</Option>
              <Option value="file">文件</Option>
              <Option value="email">邮件</Option>
              <Option value="schedule">定时</Option>
              <Option value="webhook">Webhook</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <Space>
                配置
                <Tooltip title="节点的配置参数，必须是有效的JSON格式">
                  <InfoCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="config"
            help={isConfigValid ? "请输入有效的JSON格式配置" : "JSON格式错误"}
            validateStatus={isConfigValid ? undefined : 'error'}
          >
            <TextArea
              placeholder='{"key": "value"}'
              rows={8}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: 12,
                borderColor: isConfigValid ? undefined : '#ff4d4f'
              }}
              onChange={(e) => validateConfig(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              icon={<SaveOutlined />}
              disabled={!isConfigValid || (!hasUnsavedChanges && !autoSave)}
            >
              {hasUnsavedChanges ? '保存更改' : '已保存'}
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            icon={<CopyOutlined />}
            onClick={handleDuplicate}
            block
          >
            复制节点
          </Button>
          
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            block
          >
            删除节点
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default PropertiesPanel