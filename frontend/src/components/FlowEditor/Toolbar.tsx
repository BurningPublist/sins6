import React from 'react'
import { Button, Space, Divider, Tooltip } from 'antd'
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  ExpandOutlined,
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  CopyOutlined,
  AlignCenterOutlined,
} from '@ant-design/icons'

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected: () => void
  onCopySelected: () => void
  onAutoLayout: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onDeleteSelected,
  onCopySelected,
  onAutoLayout,
  canUndo,
  canRedo,
  hasSelection,
}) => {
  return (
    <div
      className="toolbar"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '8px 12px',
      }}
    >
      <Space split={<Divider type="vertical" />}>
        {/* 视图控制 */}
        <Space>
          <Tooltip title="放大">
            <Button
              type="text"
              icon={<ZoomInOutlined />}
              onClick={onZoomIn}
              size="small"
            />
          </Tooltip>
          <Tooltip title="缩小">
            <Button
              type="text"
              icon={<ZoomOutOutlined />}
              onClick={onZoomOut}
              size="small"
            />
          </Tooltip>
          <Tooltip title="适应画布">
            <Button
              type="text"
              icon={<ExpandOutlined />}
              onClick={onFitView}
              size="small"
            />
          </Tooltip>
        </Space>

        {/* 编辑操作 */}
        <Space>
          <Tooltip title="撤销">
            <Button
              type="text"
              icon={<UndoOutlined />}
              onClick={onUndo}
              disabled={!canUndo}
              size="small"
            />
          </Tooltip>
          <Tooltip title="重做">
            <Button
              type="text"
              icon={<RedoOutlined />}
              onClick={onRedo}
              disabled={!canRedo}
              size="small"
            />
          </Tooltip>
        </Space>

        {/* 节点操作 */}
        <Space>
          <Tooltip title="复制选中">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={onCopySelected}
              disabled={!hasSelection}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除选中">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              size="small"
            />
          </Tooltip>
        </Space>

        {/* 布局 */}
        <Space>
          <Tooltip title="自动布局">
            <Button
              type="text"
              icon={<AlignCenterOutlined />}
              onClick={onAutoLayout}
              size="small"
            />
          </Tooltip>
        </Space>
      </Space>
    </div>
  )
}

export default Toolbar