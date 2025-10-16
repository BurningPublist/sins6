/**
 * 日志工具
 */

import { config } from '../config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = this.parseLogLevel(config.logLevel);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  /**
   * 记录HTTP请求
   */
  request(method: string, url: string, statusCode: number, duration: number, userAgent?: string): void {
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    const meta = userAgent ? { userAgent } : undefined;
    
    if (statusCode >= 500) {
      this.error(message, meta);
    } else if (statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  /**
   * 记录数据库操作
   */
  database(operation: string, table: string, duration?: number, error?: Error): void {
    const message = `DB ${operation} ${table}${duration ? ` - ${duration}ms` : ''}`;
    
    if (error) {
      this.error(message, { error: error.message, stack: error.stack });
    } else {
      this.debug(message);
    }
  }

  /**
   * 记录WebSocket事件
   */
  websocket(event: string, clientId?: string, data?: any): void {
    const message = `WS ${event}${clientId ? ` [${clientId}]` : ''}`;
    this.debug(message, data);
  }

  /**
   * 记录执行流程
   */
  execution(executionId: string, nodeId: string, status: string, duration?: number, error?: Error): void {
    const message = `Execution ${executionId} - Node ${nodeId}: ${status}${duration ? ` (${duration}ms)` : ''}`;
    
    if (error) {
      this.error(message, { error: error.message, stack: error.stack });
    } else if (status === 'failed') {
      this.warn(message);
    } else {
      this.info(message);
    }
  }

  /**
   * 记录性能指标
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric} = ${value}${unit}`);
  }

  /**
   * 记录安全事件
   */
  security(event: string, details: any): void {
    this.warn(`Security: ${event}`, details);
  }
}

export const logger = new Logger();