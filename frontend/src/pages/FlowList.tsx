import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Dropdown,
  Modal,
  message,
  Input,
  Row,
  Col,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { workflowService } from '../services/workflowService'
import type { Workflow } from '@shared/types'

const { Title } = Typography
const { Search } = Input

const FlowList: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 获取工作流列表
  const { data: flows, isLoading } = useQuery({
    queryKey: ['flows', { search: searchText }],
    queryFn: () => workflowService.getWorkflows({ search: searchText }),
  })

  // 删除工作流
  const deleteFlowMutation = useMutation({
    mutationFn: workflowService.deleteWorkflow,
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
    onError: () => {
      message.error('删除失败')
    },
  })

  // 复制工作流
  const duplicateFlowMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) =>
      workflowService.duplicateWorkflow(id),
    onSuccess: () => {
      message.success('复制成功')
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
    onError: () => {
      message.error('复制失败')
    },
  })

  // 发布工作流
  const publishFlowMutation = useMutation({
    mutationFn: workflowService.publishWorkflow,
    onSuccess: () => {
      message.success('发布成功')
      queryClient.invalidateQueries({ queryKey: ['flows'] })
    },
    onError: () => {
      message.error('发布失败')
    },
  })

  const handleEdit = (id: string) => {
    navigate(`/flows/${id}/edit`)
  }

  const handleExecute = (_id: string) => {
    // TODO: 实现执行逻辑
    message.info('执行功能开发中...')
  }

  const handleDuplicate = (flow: Workflow) => {
    Modal.confirm({
      title: '复制工作流',
      content: `确定要复制工作流 "${flow.name}" 吗？`,
      onOk: () => {
        duplicateFlowMutation.mutate({
          id: flow.id,
          name: `${flow.name} - 副本`,
        })
      },
    })
  }

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '删除工作流',
      content: `确定要删除工作流 "${name}" 吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: () => {
        deleteFlowMutation.mutate(id)
      },
    })
  }

  const handlePublish = (id: string, name: string) => {
    Modal.confirm({
      title: '发布工作流',
      content: `确定要发布工作流 "${name}" 吗？`,
      onOk: () => {
        publishFlowMutation.mutate(id)
      },
    })
  }

  const getStatusTag = (status: string) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      published: { color: 'success', text: '已发布' },
      archived: { color: 'warning', text: '已归档' },
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns: ColumnsType<Workflow> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Button type="link" onClick={() => handleEdit(record.id)} style={{ padding: 0 }}>
            {text}
          </Button>
          {record.description && (
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.description}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecute(record.id)}
          >
            执行
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'duplicate',
                  icon: <CopyOutlined />,
                  label: '复制',
                  onClick: () => handleDuplicate(record),
                },
                {
                  key: 'publish',
                  icon: <PlayCircleOutlined />,
                  label: record.status === 'published' ? '取消发布' : '发布',
                  onClick: () => handlePublish(record.id, record.name),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  danger: true,
                  onClick: () => handleDelete(record.id, record.name),
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  工作流管理
                </Title>
              </Col>
              <Col>
                <Space>
                  <Search
                    placeholder="搜索工作流"
                    allowClear
                    style={{ width: 300 }}
                    onSearch={setSearchText}
                    prefix={<SearchOutlined />}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/flows/new')}
                  >
                    新建工作流
                  </Button>
                </Space>
              </Col>
            </Row>
            <Table
              columns={columns}
              dataSource={flows?.data || []}
              rowKey="id"
              loading={isLoading}
              rowSelection={rowSelection}
              pagination={{
                total: flows?.total || 0,
                pageSize: flows?.pageSize || 10,
                current: flows?.page || 1,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default FlowList