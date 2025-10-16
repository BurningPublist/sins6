/**
 * 速率限制工具
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  message?: string; // 自定义错误消息
  keyGenerator?: (req: Request) => string; // 键生成器
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
}

interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  reset(key: string): Promise<void>;
}

/**
 * 内存存储实现
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; expiry: number }>();

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.count;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count: value,
      expiry: Date.now() + ttl
    });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const current = await this.get(key);
    const newCount = (current || 0) + 1;
    await this.set(key, newCount, ttl);
    return newCount;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // 清理过期条目
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiry < now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * 速率限制器类
 */
export class RateLimiter {
  private store: RateLimitStore;
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions, store?: RateLimitStore) {
    this.store = store || new MemoryStore();
    this.options = {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      message: options.message || 'Too many requests, please try again later',
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false
    };

    // 如果使用内存存储，定期清理过期条目
    if (this.store instanceof MemoryStore) {
      setInterval(() => {
        (this.store as MemoryStore).cleanup();
      }, this.options.windowMs);
    }
  }

  private defaultKeyGenerator(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * 创建中间件
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.options.keyGenerator(req);
        const current = await this.store.increment(key, this.options.windowMs);

        // 设置响应头
        res.set({
          'X-RateLimit-Limit': this.options.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, this.options.maxRequests - current).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + this.options.windowMs).toISOString()
        });

        if (current > this.options.maxRequests) {
          throw ApiError.tooManyRequests(this.options.message);
        }

        // 如果配置了跳过某些请求，在响应后处理
        if (this.options.skipSuccessfulRequests || this.options.skipFailedRequests) {
          const originalSend = res.send;
          const self = this;
          res.send = function(body) {
            const statusCode = res.statusCode;
            const shouldSkip = 
              (statusCode < 400 && self.options.skipSuccessfulRequests) ||
              (statusCode >= 400 && self.options.skipFailedRequests);

            if (shouldSkip) {
              // 减少计数
              self.store.increment(key, self.options.windowMs).then(newCount => {
                self.store.set(key, Math.max(0, newCount - 1), self.options.windowMs);
              });
            }

            return originalSend.call(this, body);
          };
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 重置指定键的限制
   */
  async reset(key: string): Promise<void> {
    await this.store.reset(key);
  }

  /**
   * 获取指定键的当前计数
   */
  async getCount(key: string): Promise<number> {
    return (await this.store.get(key)) || 0;
  }
}

/**
 * 预定义的速率限制器
 */
export const rateLimiters = {
  // 通用API限制：每分钟100次请求
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again after a minute'
  }),

  // 严格限制：每分钟10次请求
  strict: new RateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10,
    message: 'Rate limit exceeded, please try again later'
  }),

  // 执行限制：每分钟5次执行
  execution: new RateLimiter({
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5,
    message: 'Too many flow executions, please wait before trying again'
  }),

  // 创建限制：每小时20次创建
  creation: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1小时
    maxRequests: 20,
    message: 'Too many creation requests, please try again later'
  }),

  // 登录限制：每15分钟5次尝试
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5,
    message: 'Too many login attempts, please try again after 15 minutes',
    keyGenerator: (req) => `login:${req.ip}:${req.body?.email || 'unknown'}`
  })
};

/**
 * 导出默认限制器
 */
export const rateLimiter = rateLimiters.general;

/**
 * 创建自定义速率限制器的工厂函数
 */
export function createRateLimiter(options: RateLimitOptions, store?: RateLimitStore): RateLimiter {
  return new RateLimiter(options, store);
}

/**
 * 基于用户的速率限制器
 */
export function createUserRateLimiter(options: Omit<RateLimitOptions, 'keyGenerator'>): RateLimiter {
  return new RateLimiter({
    ...options,
    keyGenerator: (req) => {
      // 假设用户ID存储在req.user.id中
      const userId = (req as any).user?.id || req.ip;
      return `user:${userId}`;
    }
  });
}

/**
 * 基于API端点的速率限制器
 */
export function createEndpointRateLimiter(options: Omit<RateLimitOptions, 'keyGenerator'>): RateLimiter {
  return new RateLimiter({
    ...options,
    keyGenerator: (req) => {
      const ip = req.ip || 'unknown';
      const endpoint = `${req.method}:${req.route?.path || req.path}`;
      return `endpoint:${ip}:${endpoint}`;
    }
  });
}