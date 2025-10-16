/**
 * API错误类
 */

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // 确保错误堆栈正确显示
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * 转换为JSON格式
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details
      }
    };
  }

  /**
   * 创建验证错误
   */
  static validation(message: string, details?: any): ApiError {
    return new ApiError('VALIDATION_ERROR', message, 400, details);
  }

  /**
   * 创建未找到错误
   */
  static notFound(resource: string): ApiError {
    return new ApiError('NOT_FOUND', `${resource} not found`, 404);
  }

  /**
   * 创建未授权错误
   */
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  /**
   * 创建禁止访问错误
   */
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError('FORBIDDEN', message, 403);
  }

  /**
   * 创建冲突错误
   */
  static conflict(message: string): ApiError {
    return new ApiError('CONFLICT', message, 409);
  }

  /**
   * 创建内部服务器错误
   */
  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError('INTERNAL_ERROR', message, 500, details);
  }

  /**
   * 创建请求过于频繁错误
   */
  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError('TOO_MANY_REQUESTS', message, 429);
  }

  /**
   * 创建请求超时错误
   */
  static timeout(message: string = 'Request timeout'): ApiError {
    return new ApiError('TIMEOUT', message, 408);
  }

  /**
   * 创建请求体过大错误
   */
  static payloadTooLarge(message: string = 'Payload too large'): ApiError {
    return new ApiError('PAYLOAD_TOO_LARGE', message, 413);
  }

  /**
   * 创建不支持的媒体类型错误
   */
  static unsupportedMediaType(message: string = 'Unsupported media type'): ApiError {
    return new ApiError('UNSUPPORTED_MEDIA_TYPE', message, 415);
  }

  /**
   * 创建服务不可用错误
   */
  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError('SERVICE_UNAVAILABLE', message, 503);
  }
}