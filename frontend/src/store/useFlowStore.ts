import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Node, Edge, Connection } from 'reactflow'
import type { CustomNodeData } from '../components/FlowEditor/CustomNode'

interface FlowState {
  nodes: Node<CustomNodeData>[]
  edges: Edge[]
  selectedNode: Node<CustomNodeData> | null
  
  // Actions
  setNodes: (nodes: Node<CustomNodeData>[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: Node<CustomNodeData>) => void
  updateNode: (nodeId: string, data: Partial<CustomNodeData>) => void
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  setSelectedNode: (node: Node<CustomNodeData> | null) => void
  addEdge: (connection: Connection) => void
  deleteEdge: (edgeId: string) => void
  clearFlow: () => void
  
  // History
  history: { nodes: Node<CustomNodeData>[], edges: Edge[] }[]
  historyIndex: number
  addToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useFlowStore = create<FlowState>()(
  devtools(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNode: null,
      history: [],
      historyIndex: -1,

      setNodes: (nodes) => set({ nodes }),
      
      setEdges: (edges) => set({ edges }),
      
      addNode: (node) => {
        set((state) => ({
          nodes: [...state.nodes, node],
        }))
        get().addToHistory()
      },
      
      updateNode: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          selectedNode: state.selectedNode?.id === nodeId
            ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...data } }
            : state.selectedNode,
        }))
        get().addToHistory()
      },
      
      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
          selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
        }))
        get().addToHistory()
      },
      
      duplicateNode: (nodeId) => {
        const state = get()
        const nodeToDuplicate = state.nodes.find((node) => node.id === nodeId)
        if (nodeToDuplicate) {
          const newNode: Node<CustomNodeData> = {
            ...nodeToDuplicate,
            id: `${nodeId}_copy_${Date.now()}`,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50,
            },
            data: {
              ...nodeToDuplicate.data,
              label: `${nodeToDuplicate.data.label} (副本)`,
            },
          }
          get().addNode(newNode)
        }
      },
      
      setSelectedNode: (node) => set({ selectedNode: node }),
      
      addEdge: (connection) => {
        const newEdge: Edge = {
          id: `edge_${connection.source}_${connection.target}`,
          source: connection.source!,
          target: connection.target!,
          type: 'smoothstep',
          animated: true,
        }
        set((state) => ({
          edges: [...state.edges, newEdge],
        }))
        get().addToHistory()
      },
      
      deleteEdge: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
        }))
        get().addToHistory()
      },
      
      clearFlow: () => {
        set({
          nodes: [],
          edges: [],
          selectedNode: null,
          history: [],
          historyIndex: -1,
        })
      },
      
      addToHistory: () => {
        const state = get()
        const newHistoryItem = {
          nodes: [...state.nodes],
          edges: [...state.edges],
        }
        
        // Remove any history items after current index
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(newHistoryItem)
        
        // Limit history size
        const maxHistorySize = 50
        if (newHistory.length > maxHistorySize) {
          newHistory.shift()
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        })
      },
      
      undo: () => {
        const state = get()
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1
          const historyItem = state.history[newIndex]
          set({
            nodes: [...historyItem.nodes],
            edges: [...historyItem.edges],
            historyIndex: newIndex,
            selectedNode: null,
          })
        }
      },
      
      redo: () => {
        const state = get()
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1
          const historyItem = state.history[newIndex]
          set({
            nodes: [...historyItem.nodes],
            edges: [...historyItem.edges],
            historyIndex: newIndex,
            selectedNode: null,
          })
        }
      },
      
      canUndo: () => {
        const state = get()
        return state.historyIndex > 0
      },
      
      canRedo: () => {
        const state = get()
        return state.historyIndex < state.history.length - 1
      },
    }),
    {
      name: 'flow-store',
    }
  )
)