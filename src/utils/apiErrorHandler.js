/**
 * API错误处理工具函数
 * 提供统一的API错误处理机制
 */
import { store } from '../store';
import { showNotification } from '../store/slices/uiSlice';
import { clearToken } from './auth';

// 自定义API错误类
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isApiError = true;
  }
}

// 创建一个变量跟踪是否正在重定向，避免多次弹窗
let isRedirecting = false;

/**
 * 处理API响应错误
 * @param {Error} error - 捕获的错误对象
 * @param {string} fallbackMessage - 默认错误信息
 * @returns {ApiError} - 标准化的API错误
 */
export const handleApiError = (error, fallbackMessage = '请求失败') => {
  console.error('API错误:', error);
  
  // 已经是ApiError实例，直接返回
  if (error.isApiError) {
    return error;
  }
  
  // Axios错误
  if (error.response) {
    const { status, data } = error.response;
    
    // 服务器返回的错误信息
    const serverMessage = data?.message || data?.error || fallbackMessage;
    
    // 特殊处理401未授权错误
    if (status === 401) {
      // 检查错误响应中是否包含JWT过期相关信息
      const errorMsg = data?.msg || data?.message || '';
      const isJwtExpired = 
        errorMsg.includes('JWT') || 
        errorMsg.includes('令牌') || 
        errorMsg.includes('token') || 
        errorMsg.includes('过期') || 
        errorMsg.includes('expired') ||
        data?.code === 401;
      
      if (isJwtExpired && !isRedirecting) {
        isRedirecting = true;
        
        // 清除用户登录信息
        clearToken();
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        localStorage.removeItem('agentId');
        
        // 静默跳转，不显示提示
        // 立即跳转到登录页面
        window.location.href = '/login';
        
        // 延迟重置重定向状态
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
      
      return new ApiError('用户未授权，请重新登录', status, data);
    }
    
    // 根据状态码返回不同的错误信息
    switch (status) {
      case 400:
        return new ApiError(`请求无效: ${serverMessage}`, status, data);
      case 403:
        return new ApiError('没有权限执行此操作', status, data);
      case 404:
        return new ApiError('请求的资源不存在', status, data);
      case 500:
        return new ApiError('服务器内部错误', status, data);
      default:
        return new ApiError(`请求失败 (${status}): ${serverMessage}`, status, data);
    }
  }
  
  // 网络错误
  if (error.request && !error.response) {
    return new ApiError('网络连接失败，请检查网络设置', 0);
  }
  
  // 其他错误
  return new ApiError(error.message || fallbackMessage, 0);
};

/**
 * 创建带API错误处理的异步函数包装器
 * @param {Function} apiFunction - 要包装的API调用函数
 * @param {string} errorMessage - 默认错误信息
 * @returns {Function} - 包装后的函数
 */
export const withErrorHandling = (apiFunction, errorMessage) => {
  return async (...args) => {
    try {
      return await apiFunction(...args);
    } catch (error) {
      throw handleApiError(error, errorMessage);
    }
  };
};

/**
 * 尝试解析API响应
 * @param {Object} response - API响应对象
 * @returns {Object} - 解析后的响应数据
 * @throws {ApiError} - 如果响应无效
 */
export const parseApiResponse = (response) => {
  if (!response) {
    throw new ApiError('响应为空', 0);
  }
  
  // 检查响应数据
  const data = response.data !== undefined ? response.data : response;
  
  // 检查是否有错误
  if (data.error || data.errorMessage) {
    throw new ApiError(data.error || data.errorMessage, response.status || 0, data);
  }
  
  return data;
}; 