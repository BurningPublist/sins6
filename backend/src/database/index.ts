/**
 * 数据库管理模块
 */

import sqlite3 from 'sqlite3';
import { config } from '../config';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

let db: sqlite3.Database | null = null;

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<void> {
  try {
    // 确保数据库目录存在
    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 创建数据库连接
    db = new sqlite3.Database(config.database.path, (err) => {
      if (err) {
        logger.error('Failed to connect to database:', err);
        throw err;
      }
      logger.info(`Connected to SQLite database: ${config.database.path}`);
    });

    // 启用外键约束
    await runQuery('PRAGMA foreign_keys = ON');
    
    // 设置WAL模式以提高并发性能
    await runQuery('PRAGMA journal_mode = WAL');
    
    // 创建表
    await createTables();
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    return new Promise((resolve, reject) => {
      db!.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          db = null;
          resolve();
        }
      });
    });
  }
}

/**
 * 执行SQL查询
 */
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.run(sql, params, function(err) {
      if (err) {
        logger.error('Database query error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * 获取单行数据
 */
export function getRow(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.get(sql, params, (err, row) => {
      if (err) {
        logger.error('Database query error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * 获取多行数据
 */
export function getAllRows(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error('Database query error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * 执行事务
 */
export async function runTransaction(queries: Array<{ sql: string; params?: any[] }>): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await runQuery('BEGIN TRANSACTION');
  
  try {
    for (const query of queries) {
      await runQuery(query.sql, query.params || []);
    }
    await runQuery('COMMIT');
  } catch (error) {
    await runQuery('ROLLBACK');
    throw error;
  }
}

/**
 * 创建数据库表
 */
async function createTables(): Promise<void> {
  const tables = [
    // 流程表
    `CREATE TABLE IF NOT EXISTS flows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      nodes TEXT NOT NULL DEFAULT '[]',
      connections TEXT NOT NULL DEFAULT '[]',
      variables TEXT NOT NULL DEFAULT '{}',
      settings TEXT NOT NULL DEFAULT '{}',
      is_published BOOLEAN DEFAULT FALSE,
      is_archived BOOLEAN DEFAULT FALSE,
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    // 执行记录表
    `CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      input_data TEXT NOT NULL DEFAULT '{}',
      output_data TEXT,
      variables TEXT NOT NULL DEFAULT '{}',
      current_node_id TEXT,
      progress REAL DEFAULT 0,
      error_message TEXT,
      started_at TEXT,
      completed_at TEXT,
      duration INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (flow_id) REFERENCES flows (id) ON DELETE CASCADE
    )`,

    // 执行日志表
    `CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      node_id TEXT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (execution_id) REFERENCES executions (id) ON DELETE CASCADE
    )`,

    // 节点模板表
    `CREATE TABLE IF NOT EXISTS node_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      config TEXT NOT NULL DEFAULT '{}',
      inputs TEXT NOT NULL DEFAULT '[]',
      outputs TEXT NOT NULL DEFAULT '[]',
      is_built_in BOOLEAN DEFAULT FALSE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ];

  for (const table of tables) {
    await runQuery(table);
  }

  // 创建索引
  const indices = [
    'CREATE INDEX IF NOT EXISTS idx_flows_category ON flows (category)',
    'CREATE INDEX IF NOT EXISTS idx_flows_published ON flows (is_published)',
    'CREATE INDEX IF NOT EXISTS idx_flows_archived ON flows (is_archived)',
    'CREATE INDEX IF NOT EXISTS idx_executions_flow_id ON executions (flow_id)',
    'CREATE INDEX IF NOT EXISTS idx_executions_status ON executions (status)',
    'CREATE INDEX IF NOT EXISTS idx_executions_created_at ON executions (created_at)',
    'CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON execution_logs (execution_id)',
    'CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON execution_logs (timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_node_templates_category ON node_templates (category)',
    'CREATE INDEX IF NOT EXISTS idx_node_templates_type ON node_templates (type)',
    'CREATE INDEX IF NOT EXISTS idx_node_templates_built_in ON node_templates (is_built_in)'
  ];

  for (const index of indices) {
    await runQuery(index);
  }

  // 创建触发器来自动更新 updated_at 字段
  const triggers = [
    `CREATE TRIGGER IF NOT EXISTS update_flows_timestamp 
     AFTER UPDATE ON flows 
     BEGIN 
       UPDATE flows SET updated_at = datetime('now') WHERE id = NEW.id;
     END`,

    `CREATE TRIGGER IF NOT EXISTS update_node_templates_timestamp 
     AFTER UPDATE ON node_templates 
     BEGIN 
       UPDATE node_templates SET updated_at = datetime('now') WHERE id = NEW.id;
     END`
  ];

  for (const trigger of triggers) {
    await runQuery(trigger);
  }

  logger.info('Database tables created successfully');
  
  // 初始化默认模板数据
  await initDefaultTemplates();
}

/**
 * 初始化默认模板数据
 */
async function initDefaultTemplates(): Promise<void> {
  try {
    // 检查是否已有模板数据
    const existingTemplates = await getRow('SELECT COUNT(*) as count FROM node_templates');
    if (existingTemplates.count > 0) {
      logger.info('Templates already exist, skipping initialization');
      return;
    }

    const defaultTemplates = [
      // 触发器模板
      {
        id: 'trigger-webhook',
        name: 'Webhook触发器',
        category: 'webhook',
        type: 'trigger',
        description: '通过HTTP请求触发工作流',
        icon: 'webhook',
        config: JSON.stringify({
          method: 'POST',
          path: '/webhook',
          authentication: false
        }),
        inputs: JSON.stringify([]),
        outputs: JSON.stringify([
          { name: 'body', type: 'object', description: '请求体数据' },
          { name: 'headers', type: 'object', description: '请求头' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'trigger-schedule',
        name: '定时触发器',
        category: 'schedule',
        type: 'trigger',
        description: '按照设定的时间间隔触发工作流',
        icon: 'clock',
        config: JSON.stringify({
          cron: '0 0 * * *',
          timezone: 'Asia/Shanghai'
        }),
        inputs: JSON.stringify([]),
        outputs: JSON.stringify([
          { name: 'timestamp', type: 'string', description: '触发时间' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 动作模板
      {
        id: 'action-http-request',
        name: 'HTTP请求',
        category: 'http',
        type: 'action',
        description: '发送HTTP请求到指定URL',
        icon: 'api',
        config: JSON.stringify({
          url: '',
          method: 'GET',
          headers: {},
          timeout: 30000
        }),
        inputs: JSON.stringify([
          { name: 'url', type: 'string', description: '请求URL', required: true },
          { name: 'method', type: 'string', description: '请求方法' },
          { name: 'body', type: 'object', description: '请求体' }
        ]),
        outputs: JSON.stringify([
          { name: 'response', type: 'object', description: '响应数据' },
          { name: 'status', type: 'number', description: '状态码' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'action-email-send',
        name: '发送邮件',
        category: 'email',
        type: 'action',
        description: '发送电子邮件',
        icon: 'mail',
        config: JSON.stringify({
          smtp: {
            host: '',
            port: 587,
            secure: false
          }
        }),
        inputs: JSON.stringify([
          { name: 'to', type: 'string', description: '收件人邮箱', required: true },
          { name: 'subject', type: 'string', description: '邮件主题', required: true },
          { name: 'body', type: 'string', description: '邮件内容', required: true }
        ]),
        outputs: JSON.stringify([
          { name: 'messageId', type: 'string', description: '邮件ID' },
          { name: 'success', type: 'boolean', description: '发送状态' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 条件模板
      {
        id: 'condition-if',
        name: '条件判断',
        category: 'logic',
        type: 'condition',
        description: '根据条件执行不同的分支',
        icon: 'branch',
        config: JSON.stringify({
          operator: 'equals',
          value: ''
        }),
        inputs: JSON.stringify([
          { name: 'input', type: 'any', description: '输入值', required: true },
          { name: 'condition', type: 'string', description: '判断条件' }
        ]),
        outputs: JSON.stringify([
          { name: 'true', type: 'any', description: '条件为真时的输出' },
          { name: 'false', type: 'any', description: '条件为假时的输出' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 转换模板
      {
        id: 'transform-data-map',
        name: '数据映射',
        category: 'data',
        type: 'transform',
        description: '转换和映射数据结构',
        icon: 'transform',
        config: JSON.stringify({
          mapping: {}
        }),
        inputs: JSON.stringify([
          { name: 'data', type: 'object', description: '输入数据', required: true }
        ]),
        outputs: JSON.stringify([
          { name: 'result', type: 'object', description: '转换后的数据' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'action-database-query',
        name: '数据库查询',
        category: 'database',
        type: 'action',
        description: '执行数据库查询操作',
        icon: 'database',
        config: JSON.stringify({
          connection: {
            type: 'mysql',
            host: '',
            port: 3306,
            database: ''
          }
        }),
        inputs: JSON.stringify([
          { name: 'query', type: 'string', description: 'SQL查询语句', required: true },
          { name: 'params', type: 'array', description: '查询参数' }
        ]),
        outputs: JSON.stringify([
          { name: 'result', type: 'array', description: '查询结果' },
          { name: 'rowCount', type: 'number', description: '影响行数' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'action-file-read',
        name: '读取文件',
        category: 'file',
        type: 'action',
        description: '读取本地或远程文件内容',
        icon: 'file',
        config: JSON.stringify({
          encoding: 'utf8'
        }),
        inputs: JSON.stringify([
          { name: 'path', type: 'string', description: '文件路径', required: true }
        ]),
        outputs: JSON.stringify([
          { name: 'content', type: 'string', description: '文件内容' },
          { name: 'size', type: 'number', description: '文件大小' }
        ]),
        is_built_in: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 插入默认模板
    for (const template of defaultTemplates) {
      await runQuery(
        `INSERT INTO node_templates (
          id, name, category, type, description, icon, config, 
          inputs, outputs, is_built_in, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          template.id, template.name, template.category, template.type,
          template.description, template.icon, template.config,
          template.inputs, template.outputs, template.is_built_in,
          template.created_at, template.updated_at
        ]
      );
    }

    logger.info(`Initialized ${defaultTemplates.length} default templates`);
  } catch (error) {
    logger.error('Failed to initialize default templates:', error);
    throw error;
  }
}

/**
 * 数据库健康检查
 */
export async function checkDatabaseHealth(): Promise<{ status: string; message: string }> {
  try {
    if (!db) {
      return { status: 'error', message: 'Database not initialized' };
    }

    // 执行简单查询测试连接
    await getRow('SELECT 1 as test');
    
    return { status: 'healthy', message: 'Database connection is working' };
  } catch (error) {
    return { 
      status: 'error', 
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  flows: number;
  executions: number;
  templates: number;
  logs: number;
}> {
  try {
    const [flowsCount, executionsCount, templatesCount, logsCount] = await Promise.all([
      getRow('SELECT COUNT(*) as count FROM flows'),
      getRow('SELECT COUNT(*) as count FROM executions'),
      getRow('SELECT COUNT(*) as count FROM node_templates'),
      getRow('SELECT COUNT(*) as count FROM execution_logs')
    ]);

    return {
      flows: flowsCount?.count || 0,
      executions: executionsCount?.count || 0,
      templates: templatesCount?.count || 0,
      logs: logsCount?.count || 0
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return { flows: 0, executions: 0, templates: 0, logs: 0 };
  }
}