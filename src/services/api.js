import axios from 'axios';
import { withErrorHandling, parseApiResponse } from '../utils/apiErrorHandler';
import { STORAGE_KEYS } from '../utils/constants';
import { addAuthHeaders, clearToken } from '../utils/auth';
import { store } from '../store';
import { showNotification } from '../store/slices/uiSlice';

// API 基础URL，从环境变量或配置中获取
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 创建一个变量跟踪是否正在重定向，避免多次弹窗
let isRedirecting = false;

// 请求拦截器
apiClient.interceptors.request.use(config => {
  // 从localStorage获取token
  const token = localStorage.getItem('token') || localStorage.getItem(STORAGE_KEYS.TOKEN);
  const userType = localStorage.getItem('userType') || 'regular';
  
  // 记录详细的请求信息，帮助调试
  console.log(`API请求: ${config.url}，用户类型: ${userType || 'regular'}`);
  
  // 如果已经有Authorization或authentication头，不覆盖
  if (config.headers && (config.headers.Authorization || config.headers.authentication || config.headers.token || config.headers.Authentication)) {
    console.log(`使用已有的认证头: ${JSON.stringify(Object.keys(config.headers))}`);
    return config;
  }
  
  // 添加认证头部
  if (token) {
    // 使用辅助函数添加所有认证头部
    Object.assign(config.headers, addAuthHeaders());
    console.log(`已添加认证头部到请求: ${config.url}`);
  }
  
  return config;
}, error => {
  console.error('请求配置错误:', error);
  return Promise.reject(error);
});

// 响应拦截器
apiClient.interceptors.response.use(response => {
  return response.data;
}, error => {
  // 静默处理错误，不在控制台输出详细错误信息
  console.log('⚠️ API请求异常，正在处理...');
  
  // 处理JWT过期情况
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    
    // 检查错误响应中是否包含JWT过期相关信息
    const errorMsg = error.response.data?.msg || error.response.data?.message || '';
    const isJwtExpired = 
      errorMsg.includes('JWT') || 
      errorMsg.includes('令牌') || 
      errorMsg.includes('token') || 
      errorMsg.includes('过期') || 
      errorMsg.includes('expired') ||
      error.response.data?.code === 401;
    
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
      
      // 延迟重置重置重定向状态
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }
  }
  
  // 处理超时错误，自动重试一次
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    if (!error.config._retryCount) {
      error.config._retryCount = 1;
      console.log('🔄 检测到超时，正在自动重试...');
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(apiClient.request(error.config));
        }, 1000);
      }).catch(() => {
        // 重试失败，返回友好的错误信息
        const timeoutError = new Error('网络连接超时，请检查网络后重试');
        timeoutError.userFriendly = true;
        return Promise.reject(timeoutError);
      });
    }
  }
  
  // 包装错误信息，使其更用户友好
  const wrappedError = { ...error };
  
  if (error.response?.status >= 500) {
    wrappedError.userMessage = '服务暂时不可用，请稍后再试';
  } else if (error.response?.status >= 400) {
    wrappedError.userMessage = error.response.data?.msg || error.response.data?.message || '请求失败，请检查输入信息';
  } else if (error.message?.includes('Network Error')) {
    wrappedError.userMessage = '网络连接异常，请检查网络设置';
  } else {
    wrappedError.userMessage = '操作失败，请稍后再试';
  }
  
  return Promise.reject(wrappedError);
});

/**
 * 计算代理商折扣价格
 * @param {Object} params - 参数对象
 * @param {number} params.originalPrice - 原价
 * @param {string} params.agentId - 代理商ID
 * @returns {Promise<Object>} - 含折扣信息的对象
 */
export const calculateDiscount = withErrorHandling(async (params) => {
  try {
    console.log('调用折扣计算API，参数:', params);
    
    // 检查是否提供了必要参数
    if (!params.originalPrice) {
      console.error('缺少原价参数');
      return { discountedPrice: params.originalPrice };
    }
    
    // 检查是否有代理商ID
    if (!params.agentId) {
      console.warn('未提供代理商ID，将使用原价');
      return { discountedPrice: params.originalPrice };
    }
    
    // 添加认证头部
    const headers = addAuthHeaders();
    
    const response = await apiClient.post('/agent/calculate-discount', params, { headers });
    console.log('折扣计算API响应:', response);
    
    return parseApiResponse(response);
  } catch (error) {
    console.error('折扣计算失败:', error);
    // 出错时返回原价
    return { discountedPrice: params.originalPrice };
  }
}, '获取折扣价格失败');

/**
 * 计算代理商旅游产品折扣价格
 * @param {Object} params - 参数对象
 * @param {number} params.tourId - 旅游产品ID
 * @param {string} params.tourType - 旅游类型
 * @param {number} params.originalPrice - 原价
 * @param {string} params.agentId - 代理商ID
 * @returns {Promise<Object>} - 含折扣信息的对象
 */
export const calculateTourDiscount = withErrorHandling(async (params) => {
  try {
    console.log('调用旅游折扣计算API，参数:', params);
    
    // 参数验证
    if (!params.tourId || !params.tourType || !params.originalPrice) {
      console.error('缺少必要参数', params);
      return { 
        originalPrice: params.originalPrice, 
        discountedPrice: params.originalPrice,
        discountRate: 1,
        savings: 0
      };
    }
    
    // 检查是否有代理商ID
    if (!params.agentId) {
      console.warn('未提供代理商ID，将使用原价');
      return { 
        originalPrice: params.originalPrice, 
        discountedPrice: params.originalPrice,
        discountRate: 1,
        savings: 0
      };
    }
    
    // 添加认证头部
    const headers = addAuthHeaders();
    
    const response = await apiClient.post('/agent/calculate-tour-discount', params, { headers });
    console.log('旅游折扣计算API响应:', response);
    
    const result = parseApiResponse(response);
    
    // 确保返回规范化的数据结构
    return {
      originalPrice: Number(params.originalPrice),
      discountedPrice: Number(result.discountedPrice || params.originalPrice),
      discountRate: Number(result.discountRate || 1),
      savings: Number(result.savings || 0)
    };
  } catch (error) {
    console.error('旅游折扣计算失败:', error);
    // 出错时返回原价
    return { 
      originalPrice: Number(params.originalPrice), 
      discountedPrice: Number(params.originalPrice),
      discountRate: 1,
      savings: 0
    };
  }
}, '获取旅游折扣价格失败');

/**
 * API服务接口
 */
export const apiService = {
  // 折扣计算相关
  calculateDiscount,
  calculateTourDiscount,
  
  // 通用请求方法
  get: (url, params = {}) => {
    const headers = addAuthHeaders();
    return apiClient.get(url, { params, headers });
  },
  post: (url, data = {}) => {
    const headers = addAuthHeaders();
    return apiClient.post(url, data, { headers });
  },
  put: (url, data = {}) => {
    const headers = addAuthHeaders();
    return apiClient.put(url, data, { headers });
  },
  delete: (url) => {
    const headers = addAuthHeaders();
    return apiClient.delete(url, { headers });
  },
  patch: (url, data = {}) => {
    const headers = addAuthHeaders();
    return apiClient.patch(url, data, { headers });
  }
};

// 导出 api 对象别名，便于导入
export const api = apiService;

// 导出默认对象，便于使用
export default apiService; 