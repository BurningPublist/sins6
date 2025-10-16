/**
 * 执行服务类
 */

import { 
  ExecuteFlowRequest,
  ExecuteFlowResponse,
  ExecutionLog,
  PaginatedResponse,
  NodeExecutionResult,
  ExecutionContext,
  FlowNode,
  Flow
} from '../types';
import { getDatabase, getRow, getAllRows, runQuery } from '../database';
import { FlowService } from './FlowService';
import { ApiError } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ExecutionService {
  private db = getDatabase();
  private flowService = new FlowService();
  private activeExecutions = new Map<string, any>();

  /**
   * 执行流程
   */
  async executeFlow(request: ExecuteFlowRequest): Promise<ExecuteFlowResponse> {
    const { flowId, inputData = {} } = request;

    // 获取流程信息
    const flow = await this.flowService.getFlowById(flowId);
    
    if (!flow) {
      throw ApiError.notFound('Flow not found');
    }

    if (flow.status !== 'published') {
      throw ApiError.badRequest('Only published flows can be executed');
    }

    // 创建执行记录
    const executionId = uuidv4();
    const startTime = new Date().toISOString();

    const insertQuery = `
      INSERT INTO executions (id, flow_id, status, input_data, started_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      await runQuery(insertQuery, [
        executionId,
        flowId,
        'pending',
        JSON.stringify(inputData),
        startTime
      ]);

      // 异步执行流程
      this.executeFlowAsync(executionId, flow, inputData);

      return {
        executionId,
        status: 'pending',
        startTime
      };
    } catch (error) {
      console.error('Failed to create execution:', error);
      throw ApiError.internal('Failed to start execution');
    }
  }

  /**
   * 异步执行流程
   */
  private async executeFlowAsync(executionId: string, flow: any, inputData: any): Promise<void> {
    const context: ExecutionContext = {
      executionId,
      flowId: flow.id,
      variables: new Map(),
      inputData,
      outputData: {},
      currentNodeId: '',
      executionPath: [],
      startTime: Date.now()
    };

    // 初始化流程变量
    flow.variables.forEach((variable: any) => {
      context.variables.set(variable.name, variable.defaultValue);
    });

    try {
      // 更新执行状态为运行中
      await this.updateExecutionStatus(executionId, 'running');
      this.activeExecutions.set(executionId, context);

      // 记录开始日志
      await this.addExecutionLog(executionId, 'system', 'info', 'Flow execution started', {
        flowId: flow.id,
        flowName: flow.name,
        inputData
      });

      // 执行流程
      const result = await this.executeNodes(flow, context);

      // 更新执行结果
      const completedAt = new Date().toISOString();
      const duration = Date.now() - context.startTime;

      const updateQuery = `
        UPDATE executions 
        SET status = ?, output_data = ?, completed_at = ?, duration = ?
        WHERE id = ?
      `;

      await runQuery(updateQuery, [
        'completed',
        JSON.stringify(result),
        completedAt,
        duration,
        executionId
      ]);

      // 记录完成日志
      await this.addExecutionLog(executionId, 'system', 'info', 'Flow execution completed', {
        duration,
        outputData: result
      });

    } catch (error) {
      console.error(`Execution ${executionId} failed:`, error);

      // 更新执行状态为失败
      const completedAt = new Date().toISOString();
      const duration = Date.now() - context.startTime;

      const updateQuery = `
        UPDATE executions 
        SET status = ?, error_message = ?, completed_at = ?, duration = ?
        WHERE id = ?
      `;

      await runQuery(updateQuery, [
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
        completedAt,
        duration,
        executionId
      ]);

      // 记录错误日志
      await this.addExecutionLog(executionId, 'system', 'error', 'Flow execution failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * 执行节点
   */
  private async executeNodes(flow: any, context: ExecutionContext): Promise<any> {
    // 找到开始节点
    const startNode = flow.nodes.find((node: FlowNode) => node.type === 'start');
    if (!startNode) {
      throw new Error('No start node found in flow');
    }

    let currentNode = startNode;
    let result: any = context.inputData;

    while (currentNode) {
      context.currentNodeId = currentNode.id;
      context.executionPath.push(currentNode.id);

      // 记录节点开始执行
      await this.addExecutionLog(
        context.executionId,
        currentNode.id,
        'info',
        `Executing node: ${currentNode.name}`,
        { nodeType: currentNode.type }
      );

      try {
        // 执行节点
        const nodeResult = await this.executeNode(currentNode, context, result);
        result = nodeResult.outputData;

        // 记录节点执行成功
        await this.addExecutionLog(
          context.executionId,
          currentNode.id,
          'info',
          `Node executed successfully`,
          { outputData: result }
        );

        // 如果是结束节点，停止执行
        if (currentNode.type === 'end') {
          break;
        }

        // 找到下一个节点
        currentNode = this.getNextNode(flow, currentNode, result);

      } catch (error) {
        // 记录节点执行失败
        await this.addExecutionLog(
          context.executionId,
          currentNode.id,
          'error',
          `Node execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
        throw error;
      }
    }

    return result;
  }

  /**
   * 执行单个节点
   */
  private async executeNode(node: FlowNode, context: ExecutionContext, inputData: any): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      let outputData = inputData;

      switch (node.type) {
        case 'start':
          outputData = context.inputData;
          break;

        case 'end':
          context.outputData = inputData;
          break;

        case 'condition':
          // 条件节点逻辑
          outputData = await this.executeConditionNode(node, inputData, context);
          break;

        case 'action':
          // 动作节点逻辑
          outputData = await this.executeActionNode(node, inputData, context);
          break;

        case 'delay':
          // 延迟节点逻辑
          outputData = await this.executeDelayNode(node, inputData, context);
          break;

        case 'variable':
          // 变量节点逻辑
          outputData = await this.executeVariableNode(node, inputData, context);
          break;

        default:
          throw new Error(`Unsupported node type: ${node.type}`);
      }

      return {
        nodeId: node.id,
        success: true,
        status: 'completed',
        inputData,
        outputData,
        executionTime: Date.now() - startTime,
        logs: [],
        nextNodeIds: []
      };

    } catch (error) {
      return {
        nodeId: node.id,
        success: false,
        status: 'failed',
        inputData,
        outputData: null,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [],
        nextNodeIds: []
      };
    }
  }

  /**
   * 执行条件节点
   */
  private async executeConditionNode(node: any, inputData: any, context: ExecutionContext): Promise<any> {
    // 简单的条件判断实现
    const { condition } = node.config || {};
    
    if (!condition) {
      throw new Error('Condition node missing condition configuration');
    }

    // 这里可以实现更复杂的条件判断逻辑
    // 暂时返回输入数据
    return inputData;
  }

  /**
   * 执行动作节点
   */
  private async executeActionNode(node: any, inputData: any, context: ExecutionContext): Promise<any> {
    const { actionType, config } = node.config || {};

    switch (actionType) {
      case 'http_request':
        return await this.executeHttpRequest(config, inputData);
      
      case 'data_transform':
        return await this.executeDataTransform(config, inputData);
      
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }
  }

  /**
   * 执行延迟节点
   */
  private async executeDelayNode(node: any, inputData: any, context: ExecutionContext): Promise<any> {
    const { duration = 1000 } = node.config || {};
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return inputData;
  }

  /**
   * 执行变量节点
   */
  private async executeVariableNode(node: any, inputData: any, context: ExecutionContext): Promise<any> {
    const { operation, variableName, value } = node.config || {};

    switch (operation) {
      case 'set':
        context.variables.set(variableName, value);
        break;
      
      case 'get':
        return context.variables.get(variableName);
      
      default:
        throw new Error(`Unsupported variable operation: ${operation}`);
    }

    return inputData;
  }

  /**
   * 执行HTTP请求
   */
  private async executeHttpRequest(config: any, inputData: any): Promise<any> {
    // 简单的HTTP请求实现
    // 在实际项目中，这里应该使用更完善的HTTP客户端
    return inputData;
  }

  /**
   * 执行数据转换
   */
  private async executeDataTransform(config: any, inputData: any): Promise<any> {
    // 简单的数据转换实现
    return inputData;
  }

  /**
   * 获取下一个节点
   */
  private getNextNode(flow: any, currentNode: FlowNode, data: any): FlowNode | null {
    const connections = flow.connections.filter((conn: any) => conn.sourceNodeId === currentNode.id);
    
    if (connections.length === 0) {
      return null;
    }

    // 如果只有一个连接，直接返回目标节点
    if (connections.length === 1) {
      return flow.nodes.find((node: FlowNode) => node.id === connections[0].targetNodeId);
    }

    // 如果有多个连接（条件分支），需要根据条件选择
    // 这里简化处理，返回第一个连接的目标节点
    return flow.nodes.find((node: FlowNode) => node.id === connections[0].targetNodeId);
  }

  /**
   * 获取执行列表
   */
  async getExecutions(query: any): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, flowId, status, sortBy = 'started_at', sortOrder = 'desc' } = query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = '';
    const params: any[] = [];

    if (flowId) {
      whereClause += ' WHERE flow_id = ?';
      params.push(flowId);
    }

    if (status) {
      const statusClause = whereClause ? ' AND' : ' WHERE';
      whereClause += `${statusClause} status = ?`;
      params.push(status);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM executions${whereClause}`;
    const countResult = await getRow(countQuery, params) as { total: number };
    const total = countResult.total;

    // 获取数据
    const dataQuery = `
      SELECT e.*, f.name as flow_name 
      FROM executions e
      LEFT JOIN flows f ON e.flow_id = f.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    const executions = await getAllRows(dataQuery, [...params, limit, offset]) as any[];

    // 转换数据格式
    const items = executions.map(row => ({
      id: row.id,
      flowId: row.flow_id,
      flowName: row.flow_name,
      status: row.status,
      inputData: JSON.parse(row.input_data || '{}'),
      outputData: JSON.parse(row.output_data || '{}'),
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      duration: row.duration
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 根据ID获取执行详情
   */
  async getExecutionById(id: string): Promise<any> {
    const query = `
      SELECT e.*, f.name as flow_name 
      FROM executions e
      LEFT JOIN flows f ON e.flow_id = f.id
      WHERE e.id = ?
    `;
    const row = await getRow(query, [id]) as any;

    if (!row) {
      throw ApiError.notFound('Execution not found');
    }

    return {
      id: row.id,
      flowId: row.flow_id,
      flowName: row.flow_name,
      status: row.status,
      inputData: JSON.parse(row.input_data || '{}'),
      outputData: JSON.parse(row.output_data || '{}'),
      errorMessage: row.error_message,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      duration: row.duration
    };
  }

  /**
   * 取消执行
   */
  async cancelExecution(id: string): Promise<any> {
    const execution = await this.getExecutionById(id);

    if (execution.status !== 'pending' && execution.status !== 'running') {
      throw ApiError.badRequest('Execution cannot be cancelled');
    }

    // 更新状态
    await this.updateExecutionStatus(id, 'cancelled');

    // 从活动执行中移除
    this.activeExecutions.delete(id);

    // 记录取消日志
    await this.addExecutionLog(id, 'system', 'info', 'Execution cancelled by user');

    return await this.getExecutionById(id);
  }

  /**
   * 获取执行日志
   */
  async getExecutionLogs(executionId: string, query: any): Promise<PaginatedResponse<ExecutionLog>> {
    const { page = 1, limit = 50, level } = query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE execution_id = ?';
    const params: any[] = [executionId];

    if (level) {
      whereClause += ' AND level = ?';
      params.push(level);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM execution_logs ${whereClause}`;
    const countResult = await getRow(countQuery, params) as { total: number };
    const total = countResult.total;

    // 获取数据
    const dataQuery = `
      SELECT * FROM execution_logs
      ${whereClause}
      ORDER BY timestamp ASC
      LIMIT ? OFFSET ?
    `;
    const logs = await getAllRows(dataQuery, [...params, limit, offset]) as any[];

    // 转换数据格式
    const items: ExecutionLog[] = logs.map(row => ({
      id: row.id,
      executionId: row.execution_id,
      nodeId: row.node_id,
      level: row.level as 'info' | 'warn' | 'error',
      message: row.message,
      data: JSON.parse(row.data || '{}'),
      timestamp: row.timestamp
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 重新执行
   */
  async retryExecution(id: string): Promise<ExecuteFlowResponse> {
    const execution = await this.getExecutionById(id);

    return await this.executeFlow({
      flowId: execution.flowId,
      inputData: execution.inputData
    });
  }

  /**
   * 获取执行统计
   */
  async getExecutionStats(flowId?: string, period: string = '7d'): Promise<any> {
    // 计算时间范围
    const now = new Date();
    const days = parseInt(period.replace('d', ''), 10) || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let whereClause = 'WHERE started_at >= ?';
    const params: any[] = [startDate.toISOString()];

    if (flowId) {
      whereClause += ' AND flow_id = ?';
      params.push(flowId);
    }

    // 总执行次数
    const totalQuery = `SELECT COUNT(*) as total FROM executions ${whereClause}`;
    const totalResult = await getRow(totalQuery, params) as { total: number };

    // 按状态统计
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM executions ${whereClause}
      GROUP BY status
    `;
    const statusResults = await getAllRows(statusQuery, params) as any[];

    // 平均执行时间
    const avgDurationQuery = `
      SELECT AVG(duration) as avg_duration 
      FROM executions 
      ${whereClause} AND duration IS NOT NULL
    `;
    const avgDurationResult = await getRow(avgDurationQuery, params) as { avg_duration: number | null };

    return {
      total: totalResult.total,
      statusBreakdown: statusResults.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      averageDuration: avgDurationResult.avg_duration || 0,
      period: `${days}d`
    };
  }

  /**
   * 更新执行状态
   */
  private async updateExecutionStatus(id: string, status: string): Promise<void> {
    const query = 'UPDATE executions SET status = ? WHERE id = ?';
    await runQuery(query, [status, id]);
  }

  /**
   * 添加执行日志
   */
  private async addExecutionLog(
    executionId: string, 
    nodeId: string, 
    level: string, 
    message: string, 
    data?: any
  ): Promise<void> {
    const logId = uuidv4();
    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO execution_logs (id, execution_id, node_id, level, message, data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await runQuery(query, [
      logId,
      executionId,
      nodeId,
      level,
      message,
      JSON.stringify(data || {}),
      timestamp
    ]);
  }
}