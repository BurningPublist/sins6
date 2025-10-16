import type { Node, Edge } from 'reactflow'
import type { CustomNodeData } from '../components/FlowEditor/CustomNode'

// 自动布局算法 - 简单的层次布局
export const autoLayout = (nodes: Node<CustomNodeData>[], edges: Edge[]) => {
  if (nodes.length === 0) return { nodes, edges }

  // 构建图的邻接表
  const adjacencyList: Record<string, string[]> = {}
  const inDegree: Record<string, number> = {}
  
  // 初始化
  nodes.forEach(node => {
    adjacencyList[node.id] = []
    inDegree[node.id] = 0
  })
  
  // 构建图
  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target)
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1
  })
  
  // 拓扑排序分层
  const layers: string[][] = []
  const queue: string[] = []
  const visited = new Set<string>()
  
  // 找到所有入度为0的节点（起始节点）
  Object.keys(inDegree).forEach(nodeId => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId)
    }
  })
  
  // 如果没有入度为0的节点，选择第一个节点作为起始点
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id)
  }
  
  // 分层处理
  while (queue.length > 0) {
    const currentLayer: string[] = []
    const nextQueue: string[] = []
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (!visited.has(nodeId)) {
        visited.add(nodeId)
        currentLayer.push(nodeId)
        
        // 添加子节点到下一层
        adjacencyList[nodeId].forEach(childId => {
          if (!visited.has(childId)) {
            nextQueue.push(childId)
          }
        })
      }
    }
    
    if (currentLayer.length > 0) {
      layers.push(currentLayer)
    }
    
    queue.push(...nextQueue)
  }
  
  // 处理未访问的节点（可能存在循环或孤立节点）
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      layers.push([node.id])
    }
  })
  
  // 计算位置
  const nodeSpacing = { x: 250, y: 150 }
  const startPosition = { x: 100, y: 100 }
  
  const updatedNodes = nodes.map(node => {
    // 找到节点在哪一层
    let layerIndex = 0
    let positionInLayer = 0
    
    for (let i = 0; i < layers.length; i++) {
      const nodeIndex = layers[i].indexOf(node.id)
      if (nodeIndex !== -1) {
        layerIndex = i
        positionInLayer = nodeIndex
        break
      }
    }
    
    // 计算该层的总宽度，用于居中
    const layerWidth = (layers[layerIndex].length - 1) * nodeSpacing.x
    const startX = startPosition.x - layerWidth / 2
    
    return {
      ...node,
      position: {
        x: startX + positionInLayer * nodeSpacing.x,
        y: startPosition.y + layerIndex * nodeSpacing.y,
      },
    }
  })
  
  return { nodes: updatedNodes, edges }
}

// 验证工作流的有效性
export const validateWorkflow = (nodes: Node<CustomNodeData>[], edges: Edge[]) => {
  const errors: string[] = []
  
  // 检查是否有触发器节点
  const triggerNodes = nodes.filter(node => node.data.type === 'trigger')
  if (triggerNodes.length === 0) {
    errors.push('工作流必须包含至少一个触发器节点')
  }
  
  // 检查是否有孤立节点（除了触发器）
  const connectedNodes = new Set<string>()
  
  edges.forEach(edge => {
    connectedNodes.add(edge.source)
    connectedNodes.add(edge.target)
  })
  
  const isolatedNodes = nodes.filter(node => 
    node.data.type !== 'trigger' && !connectedNodes.has(node.id)
  )
  
  if (isolatedNodes.length > 0) {
    errors.push(`发现 ${isolatedNodes.length} 个孤立节点，请连接它们`)
  }
  
  // 检查循环依赖
  const hasCycle = detectCycle(nodes, edges)
  if (hasCycle) {
    errors.push('工作流中存在循环依赖，请检查节点连接')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

// 检测循环依赖
const detectCycle = (nodes: Node<CustomNodeData>[], edges: Edge[]): boolean => {
  const adjacencyList: Record<string, string[]> = {}
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  // 构建邻接表
  nodes.forEach(node => {
    adjacencyList[node.id] = []
  })
  
  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target)
  })
  
  // DFS检测循环
  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    for (const neighbor of adjacencyList[nodeId] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // 检查所有节点
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }
  
  return false
}

// 生成唯一ID
export const generateNodeId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 导出工作流为JSON
export const exportWorkflow = (nodes: Node<CustomNodeData>[], edges: Edge[]) => {
  return {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
    })),
    metadata: {
      version: '1.0',
      createdAt: new Date().toISOString(),
    },
  }
}

// 从JSON导入工作流
export const importWorkflow = (workflowData: any): { nodes: Node<CustomNodeData>[], edges: Edge[] } => {
  const nodes: Node<CustomNodeData>[] = workflowData.nodes.map((nodeData: any) => ({
    id: nodeData.id,
    type: nodeData.type || 'custom',
    position: nodeData.position,
    data: nodeData.data,
  }))
  
  const edges: Edge[] = workflowData.edges.map((edgeData: any) => ({
    id: edgeData.id,
    source: edgeData.source,
    target: edgeData.target,
    type: edgeData.type || 'smoothstep',
    animated: true,
  }))
  
  return { nodes, edges }
}