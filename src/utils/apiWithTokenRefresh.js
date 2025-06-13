/**
 * API包装器 - 为重要API调用自动添加token验证和刷新功能
 */

import { ensureValidToken } from './api';

/**
 * 包装API调用，确保token有效
 * @param {Function} apiCall - 要执行的API调用函数
 * @param {Object} options - 选项
 * @param {boolean} options.requireAuth - 是否需要认证（默认true）
 * @param {boolean} options.autoRefresh - 是否自动刷新token（默认true）
 * @param {number} options.retryCount - 重试次数（默认1）
 * @returns {Function} 包装后的API调用函数
 */
export const withTokenRefresh = (apiCall, options = {}) => {
  const {
    requireAuth = true,
    autoRefresh = true,
    retryCount = 1
  } = options;

  return async (...args) => {
    // 如果不需要认证，直接调用
    if (!requireAuth) {
      return apiCall(...args);
    }

    let attempts = 0;
    let lastError = null;

    while (attempts <= retryCount) {
      try {
        // 在执行API调用前确保token有效
        if (autoRefresh) {
          const tokenResult = await ensureValidToken();
          
          if (!tokenResult.success && tokenResult.needLogin) {
            throw new Error('需要重新登录');
          }
          
          if (tokenResult.refreshed) {
            console.log('Token已自动刷新，继续执行API调用');
          }
        }

        // 执行实际的API调用
        const result = await apiCall(...args);
        return result;

      } catch (error) {
        lastError = error;
        attempts++;

        // 如果是认证错误且还有重试机会，尝试刷新token
        if (
          autoRefresh &&
          attempts <= retryCount &&
          (error.response?.status === 401 || error.message?.includes('token'))
        ) {
          console.log(`API调用失败，尝试刷新token并重试 (${attempts}/${retryCount + 1})`);
          
          try {
            const refreshResult = await ensureValidToken();
            if (!refreshResult.success) {
              throw new Error('Token刷新失败');
            }
          } catch (refreshError) {
            console.error('Token刷新失败:', refreshError);
            throw refreshError;
          }
        } else {
          // 不是认证错误或已达到重试上限，直接抛出错误
          throw error;
        }
      }
    }

    // 如果所有重试都失败了，抛出最后一个错误
    throw lastError;
  };
};

/**
 * 创建需要认证的API调用
 * @param {Function} apiCall - API调用函数
 * @param {Object} options - 选项
 * @returns {Function} 包装后的API调用函数
 */
export const createAuthenticatedAPI = (apiCall, options = {}) => {
  return withTokenRefresh(apiCall, {
    requireAuth: true,
    autoRefresh: true,
    retryCount: 1,
    ...options
  });
};

/**
 * 创建高优先级的API调用（更多重试次数）
 * @param {Function} apiCall - API调用函数
 * @param {Object} options - 选项
 * @returns {Function} 包装后的API调用函数
 */
export const createCriticalAPI = (apiCall, options = {}) => {
  return withTokenRefresh(apiCall, {
    requireAuth: true,
    autoRefresh: true,
    retryCount: 2,
    ...options
  });
};

/**
 * 批量包装API调用
 * @param {Object} apiMethods - API方法对象
 * @param {Object} options - 选项
 * @returns {Object} 包装后的API方法对象
 */
export const wrapAPIWithTokenRefresh = (apiMethods, options = {}) => {
  const wrappedMethods = {};
  
  Object.keys(apiMethods).forEach(methodName => {
    const method = apiMethods[methodName];
    
    if (typeof method === 'function') {
      wrappedMethods[methodName] = withTokenRefresh(method, options);
    } else {
      wrappedMethods[methodName] = method;
    }
  });
  
  return wrappedMethods;
};

/**
 * 用于支付等关键操作的API包装器
 * @param {Function} apiCall - API调用函数
 * @returns {Function} 包装后的API调用函数
 */
export const withPaymentTokenRefresh = (apiCall) => {
  return withTokenRefresh(apiCall, {
    requireAuth: true,
    autoRefresh: true,
    retryCount: 3 // 支付操作允许更多重试
  });
};

/**
 * 用于预订等重要操作的API包装器
 * @param {Function} apiCall - API调用函数
 * @returns {Function} 包装后的API调用函数
 */
export const withBookingTokenRefresh = (apiCall) => {
  return withTokenRefresh(apiCall, {
    requireAuth: true,
    autoRefresh: true,
    retryCount: 2 // 预订操作允许适度重试
  });
};

/**
 * 使用示例：
 * 
 * // 包装单个API调用
 * const secureCreateBooking = withTokenRefresh(createBooking);
 * 
 * // 包装支付API
 * const secureCreatePayment = withPaymentTokenRefresh(createPayment);
 * 
 * // 批量包装API
 * const secureAPI = wrapAPIWithTokenRefresh({
 *   createBooking,
 *   createPayment,
 *   getUserProfile
 * });
 * 
 * // 使用包装后的API
 * try {
 *   const result = await secureCreateBooking(bookingData);
 *   console.log('预订成功:', result);
 * } catch (error) {
 *   console.error('预订失败:', error);
 * }
 */

export default {
  withTokenRefresh,
  createAuthenticatedAPI,
  createCriticalAPI,
  wrapAPIWithTokenRefresh,
  withPaymentTokenRefresh,
  withBookingTokenRefresh
}; 
 
 
 
 