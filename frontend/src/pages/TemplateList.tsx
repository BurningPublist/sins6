import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  message,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '../services/templateService'
import type { Template } from '@shared/types'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

const TemplateList: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [form] = Form.useForm()

  // 获取模板列表
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', { search: searchText, type: typeFilter, category: categoryFilter }],
    queryFn: () => templateService.getTemplates({
      search: searchText,
      type: typeFilter || undefined,
      category: categoryFilter || undefined,
    }),
  })

  // 创建/更新模板
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingTemplate) {
        return templateService.updateTemplate(editingTemplate.id, data)
      } else {
        return templateService.createTemplate(data)
      }
    },
    onSuccess: () => {
      message.success(editingTemplate ? '更新成功' : '创建成功')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setModalVisible(false)
      setEditingTemplate(null)
      form.resetFields()
    },
    onError: () => {
      message.error(editingTemplate ? '更新失败' : '创建失败')
    },
  })

  // 删除模板
  const deleteTemplateMutation = useMutation({
    mutationFn: templateService.deleteTemplate,
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  const handleCreate = () => {
    setEditingTemplate(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      config: JSON.stringify(template.config, null, 2),
    })
    setModalVisible(true)
  }

  const handleDelete = (template: Template) => {
    Modal.confirm({
      title: '删除模板',
      content: `确定要删除模板 "${template.name}" 吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: () => {
        deleteTemplateMutation.mutate(template.id)
      },
    })
  }

  const handleSave = (values: any) => {
    try {
      const config = values.config ? JSON.parse(values.config) : {}
      saveTemplateMutation.mutate({
        ...values,
        config,
      })
    } catch (error) {
      message.error('配置格式错误，请检查JSON格式')
    }
  }

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

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  节点模板
                </Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  新建模板
                </Button>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Search
                  placeholder="搜索模板名称"
                  allowClear
                  onSearch={setSearchText}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="选择类型"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={setTypeFilter}
                >
                  <Option value="trigger">触发器</Option>
                  <Option value="action">动作</Option>
                  <Option value="condition">条件</Option>
                  <Option value="transform">转换</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="选择分类"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={setCategoryFilter}
                >
                  <Option value="http">HTTP</Option>
                  <Option value="database">数据库</Option>
                  <Option value="file">文件</Option>
                  <Option value="email">邮件</Option>
                  <Option value="schedule">定时</Option>
                  <Option value="webhook">Webhook</Option>
                </Select>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {templates?.data?.map((template) => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <EditOutlined key="edit" onClick={() => handleEdit(template)} />,
                      <DeleteOutlined key="delete" onClick={() => handleDelete(template)} />,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          <span>{template.name}</span>
                          <Tag color={getTypeColor(template.type)}>
                            {getTypeText(template.type)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {template.description}
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Tag>{template.category}</Tag>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {(!templates?.data || templates.data.length === 0) && !isLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">暂无模板数据</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingTemplate(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="模板名称"
            name="name"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <TextArea placeholder="请输入模板描述" rows={2} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="类型"
                name="type"
                rules={[{ required: true, message: '请选择模板类型' }]}
              >
                <Select placeholder="请选择模板类型">
                  <Option value="trigger">触发器</Option>
                  <Option value="action">动作</Option>
                  <Option value="condition">条件</Option>
                  <Option value="transform">转换</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择模板分类' }]}
              >
                <Select placeholder="请选择模板分类">
                  <Option value="http">HTTP</Option>
                  <Option value="database">数据库</Option>
                  <Option value="file">文件</Option>
                  <Option value="email">邮件</Option>
                  <Option value="schedule">定时</Option>
                  <Option value="webhook">Webhook</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="配置"
            name="config"
            help="请输入有效的JSON格式配置"
          >
            <TextArea
              placeholder='{"key": "value"}'
              rows={6}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saveTemplateMutation.isPending}
              >
                {editingTemplate ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TemplateList