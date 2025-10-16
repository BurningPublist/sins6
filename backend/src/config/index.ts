/**
 * 配置管理模块
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

export interface AppConfig {
  port: number;
  env: string;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  wsPort: number;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  database: {
    path: string;
  };
  security: {
    jwtSecret: string;
    sessionSecret: string;
  };
  upload: {
    dir: string;
    maxFileSize: number;
  };
  execution: {
    timeout: number;
    maxConcurrentExecutions: number;
  };
}

// 默认配置
const defaultConfig: AppConfig = {
  port: 3001,
  env: 'development',
  nodeEnv: 'development',
  corsOrigin: 'http://localhost:5173',
  logLevel: 'info',
  wsPort: 3002,
  isDevelopment: true,
  isProduction: false,
  isTest: false,
  database: {
    path: path.join(process.cwd(), 'data', 'database.sqlite')
  },
  security: {
    jwtSecret: 'default-jwt-secret-change-in-production',
    sessionSecret: 'default-session-secret-change-in-production'
  },
  upload: {
    dir: path.join(process.cwd(), 'uploads'),
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  execution: {
    timeout: 30000, // 30秒
    maxConcurrentExecutions: 10
  }
};

// 从环境变量构建配置
const nodeEnv = process.env.NODE_ENV || defaultConfig.nodeEnv;

export const config: AppConfig = {
  port: parseInt(process.env.PORT || String(defaultConfig.port), 10),
  env: nodeEnv,
  nodeEnv: nodeEnv,
  corsOrigin: process.env.CORS_ORIGIN || defaultConfig.corsOrigin,
  logLevel: process.env.LOG_LEVEL || defaultConfig.logLevel,
  wsPort: parseInt(process.env.WS_PORT || String(defaultConfig.wsPort), 10),
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  database: {
    path: process.env.DATABASE_PATH || defaultConfig.database.path
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || defaultConfig.security.jwtSecret,
    sessionSecret: process.env.SESSION_SECRET || defaultConfig.security.sessionSecret
  },
  upload: {
    dir: process.env.UPLOAD_DIR || defaultConfig.upload.dir,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(defaultConfig.upload.maxFileSize), 10)
  },
  execution: {
    timeout: parseInt(process.env.EXECUTION_TIMEOUT || String(defaultConfig.execution.timeout), 10),
    maxConcurrentExecutions: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || String(defaultConfig.execution.maxConcurrentExecutions), 10)
  }
};

// 验证必要的配置
export function validateConfig(): void {
  const requiredEnvVars = [];
  
  if (config.nodeEnv === 'production') {
    if (config.security.jwtSecret === defaultConfig.security.jwtSecret) {
      requiredEnvVars.push('JWT_SECRET');
    }
    if (config.security.sessionSecret === defaultConfig.security.sessionSecret) {
      requiredEnvVars.push('SESSION_SECRET');
    }
  }
  
  if (requiredEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${requiredEnvVars.join(', ')}`);
  }
}

// 开发环境配置检查
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development';
}

// 生产环境配置检查
export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}

// 测试环境配置检查
export function isTest(): boolean {
  return config.nodeEnv === 'test';
}