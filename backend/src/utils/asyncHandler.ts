/**
 * 异步处理器工具
 */

import { Request, Response, NextFunction } from 'express';

/**
 * 异步路由处理器包装器
 * 自动捕获异步函数中的错误并传递给错误处理中间件
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 异步中间件包装器
 */
export function asyncMiddleware(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 带超时的异步处理器
 */
export function asyncHandlerWithTimeout(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  timeoutMs: number = 30000
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    Promise.race([
      Promise.resolve(fn(req, res, next)),
      timeoutPromise
    ]).catch(next);
  };
}

/**
 * 重试异步操作
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 指数退避延迟
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError!;
}

/**
 * 并发限制执行
 */
export async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * 批处理异步操作
 */
export async function batchAsync<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * 带缓存的异步操作
 */
export function memoizeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator?: (...args: T) => string,
  ttl: number = 60000 // 默认1分钟缓存
) {
  const cache = new Map<string, { value: R; expiry: number }>();

  const defaultKeyGenerator = (...args: T) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGenerator;

  return async (...args: T): Promise<R> => {
    const key = getKey(...args);
    const now = Date.now();

    // 检查缓存
    const cached = cache.get(key);
    if (cached && cached.expiry > now) {
      return cached.value;
    }

    // 执行函数并缓存结果
    const result = await fn(...args);
    cache.set(key, {
      value: result,
      expiry: now + ttl
    });

    // 清理过期缓存
    for (const [cacheKey, cacheValue] of cache.entries()) {
      if (cacheValue.expiry <= now) {
        cache.delete(cacheKey);
      }
    }

    return result;
  };
}

/**
 * 防抖异步操作
 */
export function debounceAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  let pendingPromise: Promise<R> | null = null;

  return (...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      // 清除之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 如果有待处理的Promise，等待它完成
      if (pendingPromise) {
        pendingPromise.then(resolve).catch(reject);
        return;
      }

      timeoutId = setTimeout(async () => {
        try {
          pendingPromise = fn(...args);
          const result = await pendingPromise;
          pendingPromise = null;
          resolve(result);
        } catch (error) {
          pendingPromise = null;
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * 节流异步操作
 */
export function throttleAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number = 1000
) {
  let lastExecution = 0;
  let pendingPromise: Promise<R> | null = null;

  return (...args: T): Promise<R> => {
    const now = Date.now();

    if (now - lastExecution >= delay) {
      lastExecution = now;
      pendingPromise = fn(...args);
      return pendingPromise;
    }

    // 如果在节流期间，返回上一次的Promise
    if (pendingPromise) {
      return pendingPromise;
    }

    // 如果没有待处理的Promise，创建一个延迟执行的Promise
    return new Promise((resolve, reject) => {
      const remainingDelay = delay - (now - lastExecution);
      setTimeout(async () => {
        try {
          lastExecution = Date.now();
          pendingPromise = fn(...args);
          const result = await pendingPromise;
          pendingPromise = null;
          resolve(result);
        } catch (error) {
          pendingPromise = null;
          reject(error);
        }
      }, remainingDelay);
    });
  };
}