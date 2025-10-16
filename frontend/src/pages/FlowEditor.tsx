import React, { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Button,
  Space,
  message,
  Modal,
  Input,
  Form,
  Typography,
} from 'antd'
import {
  SaveOutlined,
  PlayCircleOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import ReactFlow, {
  Node,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowService } from '../services/workflowService'
import Sidebar from '../components/FlowEditor/Sidebar'
import PropertiesPanel from '../components/FlowEditor/PropertiesPanel'
import CustomNode from '../components/FlowEditor/CustomNode'

const { Header, Sider, Content } = Layout

// 自定义节点类型
const nodeTypes = {
  custom: CustomNode,
}

const FlowEditorInner: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNewFlow = !id || id === 'new'
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null)
  const [draggedTemplate, setDraggedTemplate] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [flowName, setFlowName] = useState('')
  const [flowDescription, setFlowDescription] = useState('')
  const [saveModalVisible, setSaveModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)

  // 获取工作流详情
  const { data: flow, isLoading } = useQuery({
    queryKey: ['flow', id],
    queryFn: () => workflowService.getWorkflowById(id!),
    enabled: !isNewFlow,
  })

  // 处理工作流数据更新
  useEffect(() => {
    if (flow) {
      setFlowName(flow.name)
      setFlowDescription(flow.description || '')
      if (flow.nodes || flow.edges) {
        // 为现有节点添加onEdit回调
        const nodesWithEdit = (flow.nodes || []).map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onEdit: handleEditNode,
          },
        }))
        setNodes(nodesWithEdit)
        setEdges(flow.edges || [])
      }
    }
  }, [flow, setNodes, setEdges])

  // 保存工作流
  const saveFlowMutation = useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      definition: any
    }) => {
      if (isNewFlow) {
        return workflowService.createWorkflow(data)
      } else {
        return workflowService.updateWorkflow(id!, data)
      }
    },
    onSuccess: (data) => {
      message.success('保存成功')
      queryClient.invalidateQueries({ queryKey: ['flows'] })
      if (isNewFlow && data) {
        navigate(`/flows/${data.id}/edit`, { replace: true })
      }
      setSaveModalVisible(false)
    },
    onError: () => {
      message.error('保存失败')
    },
  })

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleSave = () => {
    if (!flowName.trim()) {
      setSaveModalVisible(true)
      return
    }
    
    const definition = {
      nodes,
      edges,
    }

    saveFlowMutation.mutate({
      name: flowName,
      description: flowDescription,
      definition,
    })
  }

  const handleSaveWithName = (values: { name: string; description?: string }) => {
    const definition = {
      nodes,
      edges,
    }

    saveFlowMutation.mutate({
      name: values.name,
      description: values.description,
      definition,
    })
  }

  const handleExecute = () => {
    // TODO: 实现执行逻辑
    message.info('执行功能开发中...')
  }

  const handleDragStart = (event: React.DragEvent, nodeType: string, template: any) => {
    setDraggedNodeType(nodeType)
    setDraggedTemplate(template)
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.setData('application/template', JSON.stringify(template))
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!draggedNodeType || !draggedTemplate) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: draggedTemplate.name,
          type: draggedTemplate.type,
          template: draggedTemplate,
          config: draggedTemplate.defaultConfig || {},
          onEdit: handleEditNode,
        },
      }

      setNodes((nds) => nds.concat(newNode))
      setDraggedNodeType(null)
      setDraggedTemplate(null)
    },
    [draggedNodeType, draggedTemplate, screenToFlowPosition, setNodes]
  )

  const handleNodeUpdate = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    )
  }

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedNode(null)
  }

  const handleDuplicateNode = (nodeId: string) => {
    const nodeToDuplicate = nodes.find((node) => node.id === nodeId)
    if (nodeToDuplicate) {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: `node_${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 50,
          y: nodeToDuplicate.position.y + 50,
        },
      }
      setNodes((nds) => [...nds, newNode])
    }
  }

  const handleEditNode = (nodeId: string) => {
    const nodeToEdit = nodes.find((node) => node.id === nodeId)
    if (nodeToEdit) {
      setEditingNode(nodeToEdit)
      setEditModalVisible(true)
    }
  }

  const handleSaveNodeEdit = (values: any) => {
    if (editingNode) {
      handleNodeUpdate(editingNode.id, {
        label: values.label,
        config: values.config || {},
        description: values.description,
      })
      setEditModalVisible(false)
      setEditingNode(null)
    }
  }

  if (isLoading) {
    return <div>加载中...</div>
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/flows')}
          >
            返回
          </Button>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>
            {flowName || '新建工作流'}
          </span>
        </Space>
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSaveModalVisible(true)}
          >
            设置
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saveFlowMutation.isPending}
          >
            保存
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
          >
            执行
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={280} style={{ background: '#fafafa' }}>
          <Sidebar onDragStart={handleDragStart} />
        </Sider>
        <Content style={{ position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </Content>
        <Sider width={320} style={{ background: '#fafafa' }}>
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdateNode={handleNodeUpdate}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
          />
        </Sider>
      </Layout>

      <Modal
        title="工作流设置"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={{
            name: flowName,
            description: flowDescription,
          }}
          onFinish={handleSaveWithName}
        >
          <Form.Item
            label="工作流名称"
            name="name"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="请输入工作流名称" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea
              placeholder="请输入工作流描述"
              rows={3}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setSaveModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saveFlowMutation.isPending}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑节点"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingNode(null)
        }}
        footer={null}
        width={600}
      >
        {editingNode && (
          <Form
            layout="vertical"
            initialValues={{
              label: editingNode.data.label,
              description: editingNode.data.description,
              config: editingNode.data.config,
            }}
            onFinish={handleSaveNodeEdit}
          >
            <Form.Item
              label="节点名称"
              name="label"
              rules={[{ required: true, message: '请输入节点名称' }]}
            >
              <Input placeholder="请输入节点名称" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea
                placeholder="请输入节点描述"
                rows={3}
              />
            </Form.Item>
            <Form.Item label="配置">
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <Typography.Text type="secondary">
                  节点类型: {editingNode.data.type}
                </Typography.Text>
                {editingNode.data.template && (
                  <div style={{ marginTop: '8px' }}>
                    <Typography.Text type="secondary">
                      模板: {editingNode.data.template.name}
                    </Typography.Text>
                  </div>
                )}
              </div>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={() => {
                  setEditModalVisible(false)
                  setEditingNode(null)
                }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  )
}

const FlowEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowEditorInner />
    </ReactFlowProvider>
  )
}

export default FlowEditor