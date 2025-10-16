import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
} from 'antd'
import {
  StopOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { workflowService } from '../services/workflowService'
import type { Execution } from '@shared/types'

const { Title } = Typography
const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select

const ExecutionList: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  // 获取执行记录列表
  const { data: executions, isLoading, refetch } = useQuery({
    queryKey: ['executions', { search: searchText, status: statusFilter, dateRange }],
    queryFn: () => workflowService.getExecutions({
      search: searchText,
      status: statusFilter || undefined,
      startDate: dateRange?.[0]?.toISOString(),
      endDate: dateRange?.[1]?.toISOString(),
    }),
  })

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'default', text: '等待中' },
      running: { color: 'processing', text: '运行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
      cancelled: { color: 'warning', text: '已取消' },
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const handleViewDetail = (execution: Execution) => {
    setSelectedExecution(execution)
    setDetailModalVisible(true)
  }

  const handleStopExecution = (id: string) => {
    Modal.confirm({
      title: '停止执行',
      content: '确定要停止此次执行吗？',
      onOk: async () => {
        try {
          await workflowService.stopExecution(id)
          refetch()
        } catch (error) {
          console.error('停止执行失败:', error)
        }
      },
    })
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) {
      return `${duration}秒`
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}分${duration % 60}秒`
    } else {
      const hours = Math.floor(duration / 3600)
      const minutes = Math.floor((duration % 3600) / 60)
      return `${hours}小时${minutes}分`
    }
  }

  const columns: ColumnsType<Execution> = [
    {
      title: '工作流',
      dataIndex: 'flowName',
      key: 'flowName',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            ID: {record.id}
          </span>
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
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '执行时长',
      key: 'duration',
      width: 120,
      render: (_, record) => formatDuration(record.startTime, record.endTime),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'running' && (
            <Button
              type="text"
              icon={<StopOutlined />}
              onClick={() => handleStopExecution(record.id)}
              danger
            >
              停止
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={3} style={{ margin: 0 }}>
                  执行记录
                </Title>
              </Col>
              <Col>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                >
                  刷新
                </Button>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Search
                  placeholder="搜索工作流名称"
                  allowClear
                  onSearch={setSearchText}
                  prefix={<SearchOutlined />}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="选择状态"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={setStatusFilter}
                >
                  <Option value="pending">等待中</Option>
                  <Option value="running">运行中</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="failed">失败</Option>
                  <Option value="cancelled">已取消</Option>
                </Select>
              </Col>
              <Col span={10}>
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                  onChange={setDateRange}
                />
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={executions?.data || []}
              rowKey="id"
              loading={isLoading}
              pagination={{
                total: executions?.total || 0,
                pageSize: executions?.pageSize || 10,
                current: executions?.page || 1,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="执行详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedExecution && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>执行ID:</strong> {selectedExecution.id}
              </Col>
              <Col span={12}>
                <strong>工作流:</strong> {selectedExecution.workflowName}
              </Col>
              <Col span={12}>
                <strong>状态:</strong> {getStatusTag(selectedExecution.status)}
              </Col>
              <Col span={12}>
                <strong>开始时间:</strong> {new Date(selectedExecution.startTime).toLocaleString()}
              </Col>
              {selectedExecution.endTime && (
                <Col span={12}>
                  <strong>结束时间:</strong> {new Date(selectedExecution.endTime).toLocaleString()}
                </Col>
              )}
              <Col span={12}>
                <strong>执行时长:</strong> {formatDuration(selectedExecution.startTime, selectedExecution.endTime)}
              </Col>
            </Row>
            
            {selectedExecution.error && (
              <div style={{ marginTop: 16 }}>
                <strong>错误信息:</strong>
                <div style={{ 
                  background: '#fff2f0', 
                  border: '1px solid #ffccc7',
                  borderRadius: 4,
                  padding: 12,
                  marginTop: 8,
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  {selectedExecution.error}
                </div>
              </div>
            )}

            {selectedExecution.result && (
              <div style={{ marginTop: 16 }}>
                <strong>执行结果:</strong>
                <div style={{ 
                  background: '#f6ffed', 
                  border: '1px solid #b7eb8f',
                  borderRadius: 4,
                  padding: 12,
                  marginTop: 8,
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  <pre>{JSON.stringify(selectedExecution.result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ExecutionList