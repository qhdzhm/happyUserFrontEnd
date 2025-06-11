/**
 * 认证工具函数
 */
import { STORAGE_KEYS } from './constants';

/**
 * 设置认证token
 * @param {string} token - 认证token
 */
export const setToken = (token) => {
  if (!token) return;
  
  // 设置主要的认证token
  localStorage.setItem('authentication', token);
  // 同时为了兼容性设置其他token键
  localStorage.setItem('token', token);
  localStorage.setItem('userToken', token);
};

/**
 * 清除认证token
 */
export const clearToken = () => {
  // 清除所有可能存在的token存储位置
  localStorage.removeItem('authentication');
  localStorage.removeItem('token');
  localStorage.removeItem('userToken');
  localStorage.removeItem('jwt');
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem('userType');
  localStorage.removeItem('username');
  localStorage.removeItem('agentId');
  localStorage.removeItem('discountRate');
  
  // 清除sessionStorage中的token
  sessionStorage.removeItem('authentication');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('jwt');
  
  // 清除可能设置的cookie
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'authentication=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

/**
 * 从localStorage获取token
 * @returns {string|null} - token或null
 */
export const getToken = () => {
  // 按照优先级检查各种可能的token存储位置
  return (
    localStorage.getItem('authentication') || // 官方配置的token字段名
    localStorage.getItem('token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('jwt') ||
    sessionStorage.getItem('authentication') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('userToken')
  );
};

/**
 * 为请求添加认证头部
 * @param {Object} headers - 请求头对象
 * @returns {Object} - 添加了认证头部的请求头对象
 */
export const addAuthHeaders = (headers = {}) => {
  const token = getToken();
  if (!token) return headers;
  
  // 使用官方配置的token字段名
  const authHeaders = { ...headers };
  
  // 设置主要token字段名
  authHeaders.authentication = token;
  
  // 为了兼容性，也添加其他可能的token字段
  authHeaders.Authorization = `Bearer ${token}`;
  authHeaders.token = token;
  authHeaders.Authentication = token;
  
  return authHeaders;
};

/**
 * 检查用户是否已登录
 * @returns {boolean} - 是否已登录
 */
export const isAuthenticated = () => {
  const token = getToken();
  
  // 没有token表示未登录
  if (!token) return false;
  
  try {
    // 额外检查其他必要参数是否存在
    const userType = localStorage.getItem('userType');
    if (!userType) return false;
    
    // 如果是代理商，检查是否有agentId
    if (userType === 'agent' && !localStorage.getItem('agentId')) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('验证登录状态时出错:', error);
    return false;
  }
};

/**
 * 获取用户类型
 * @returns {string} - 用户类型(agent/regular)
 */
export const getUserType = () => {
  return localStorage.getItem('userType') || 'regular';
};

/**
 * 检查用户是否为代理商
 * @returns {boolean} - 是否为代理商
 */
export const isAgent = () => {
  const userType = getUserType();
  return userType === 'agent' || userType === 'agent_operator';
};

/**
 * 检查是否为代理商主账号
 * @returns {boolean}
 */
export const isAgentMain = () => {
  return getUserType() === 'agent';
};

/**
 * 检查当前用户是否为代理商操作员
 * @returns {boolean} - 是否为操作员
 */
export const isOperator = () => {
  const userType = localStorage.getItem('userType');
  return userType === 'agent_operator';
};

/**
 * 检查是否可以查看折扣信息
 * @returns {boolean}
 */
export const canSeeDiscount = () => {
  const canSee = localStorage.getItem('canSeeDiscount');
  if (canSee !== null) {
    return canSee === 'true';
  }
  // 如果没有明确设置，根据用户类型判断
  return !isOperator();
};

/**
 * 检查是否可以查看信用额度信息
 * @returns {boolean}
 */
export const canSeeCredit = () => {
  const canSee = localStorage.getItem('canSeeCredit');
  if (canSee !== null) {
    return canSee === 'true';
  }
  // 如果没有明确设置，根据用户类型判断
  return !isOperator();
};

/**
 * 获取代理商ID
 * @returns {string|null}
 */
export const getAgentId = () => {
  return localStorage.getItem('agentId');
};

/**
 * 获取操作员ID
 * @returns {string|null}
 */
export const getOperatorId = () => {
  return localStorage.getItem('operatorId');
};

/**
 * 获取折扣率
 * @returns {number}
 */
export const getDiscountRate = () => {
  const rate = localStorage.getItem('discountRate');
  return rate ? parseFloat(rate) : 1.0;
};

/**
 * 获取用户显示名称
 * @returns {string}
 */
export const getUserDisplayName = () => {
  const userType = getUserType();
  switch (userType) {
    case 'agent':
      return '代理商';
    case 'agent_operator':
      return '操作员';
    case 'regular':
    default:
      return '用户';
  }
};

/**
 * 验证token有效性
 * @returns {Promise<boolean>} - token是否有效
 */
export const verifyTokenValidity = async () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // 调用一个简单的认证接口来验证token
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'authentication': token,
        'token': token,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 如果返回401，说明token已过期
    if (response.status === 401) {
      console.log('Token已过期，清除登录状态');
      clearToken();
      return false;
    }
    
    // 如果返回200，说明token有效
    if (response.status === 200) {
      console.log('Token验证成功');
      return true;
    }
    
    // 其他状态码，可能是网络问题，暂时认为token有效
    console.log('Token验证遇到网络问题，暂时保持登录状态');
    return true;
    
  } catch (error) {
    // 网络错误，暂时认为token有效，避免因网络问题导致用户退出登录
    console.log('Token验证遇到网络错误，暂时保持登录状态:', error.message);
    return true;
  }
};

export default {
  getToken,
  addAuthHeaders,
  isAuthenticated,
  getUserType,
  isAgent,
  isAgentMain,
  isOperator,
  canSeeDiscount,
  canSeeCredit,
  getAgentId,
  getOperatorId,
  getDiscountRate,
  getUserDisplayName
}; 