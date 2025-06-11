import request from '../utils/request';
import { addAuthHeaders, setToken } from '../utils/auth';

/**
 * 用户服务 - 处理与用户相关的API请求
 */

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @returns {Promise} - 请求Promise
 */
export const login = (data) => {
  return request.post('/api/auth/login', data).then(response => {
    // 如果登录成功，保存token
    if (response && response.code === 1 && response.data) {
      const { token, userId, userType } = response.data;
      
      // 保存token
      setToken(token);
      
      // 保存其他用户信息
      if (userId) localStorage.setItem('userId', userId);
      if (userType) localStorage.setItem('userType', userType);
    }
    
    return response;
  });
};

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @returns {Promise} - 请求Promise
 */
export const register = (data) => {
  return request.post('/api/user/register', data).then(response => {
    // 如果注册成功，保存token
    if (response && response.code === 1 && response.data) {
      const { token, id, username, userType } = response.data;
      
      // 保存token
      setToken(token);
      
      // 保存其他用户信息
      if (id) localStorage.setItem('userId', id);
      if (username) localStorage.setItem('username', username);
      if (userType) localStorage.setItem('userType', userType);
    }
    
    return response;
  });
};

/**
 * 获取用户信息
 * @returns {Promise} - 请求Promise
 */
export const getUserInfo = () => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 使用缓存，缓存时间为10分钟
  return request.get('/api/users/profile', {}, { 
    useCache: true, 
    cacheTime: 10 * 60 * 1000,
    headers
  });
};

/**
 * 更新用户信息
 * @param {Object} data - 用户数据
 * @returns {Promise} - 请求Promise
 */
export const updateUserInfo = (data) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 更新用户信息后清除缓存
  const response = request.put('/api/users/profile', data, { headers });
  request.clearCache('/api/users/profile');
  return response;
};

/**
 * 更新用户密码
 * @param {Object} data - 密码数据
 * @returns {Promise} - 请求Promise
 */
export const updatePassword = (data) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  return request.put('/api/user/password', data, { headers })
    .then(response => {
      // 如果密码修改成功，清除token和用户状态
      if (response && response.code === 1) {
        // 导入清除token和登出函数
        const { clearToken } = require('../utils/auth');
        const { logout } = require('../store/slices/authSlice');
        const store = require('../store').default;
        
        // 清除所有认证信息
        clearToken();
        
        // 派发登出action
        store.dispatch(logout());
        
        // 通知用户需要重新登录
        console.log('密码已修改，需要重新登录');
      }
      
      return response;
    });
};

/**
 * 获取用户收藏列表
 * @returns {Promise} - 请求Promise
 */
export const getUserFavorites = () => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 使用缓存，缓存时间为5分钟
  return request.get('/api/users/favorites', {}, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000,
    headers
  });
};

/**
 * 添加收藏
 * @param {string} tourId - 旅游产品ID
 * @returns {Promise} - 请求Promise
 */
export const addFavorite = (tourId) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 添加收藏后清除缓存
  const response = request.post('/api/users/favorites', { tourId }, { headers });
  request.clearCache('/api/users/favorites');
  return response;
};

/**
 * 删除收藏
 * @param {string} tourId - 旅游产品ID
 * @returns {Promise} - 请求Promise
 */
export const removeFavorite = (tourId) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 删除收藏后清除缓存
  const response = request.delete(`/api/users/favorites/${tourId}`, { headers });
  request.clearCache('/api/users/favorites');
  return response;
};

/**
 * 获取用户积分信息
 * @returns {Promise} - 请求Promise
 */
export const getUserCreditInfo = () => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 使用缓存，缓存时间为5分钟
  return request.get('/api/user/credit/info', {}, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000,
    headers
  });
};

export default {
  login,
  register,
  getUserInfo,
  updateUserInfo,
  updatePassword,
  getUserFavorites,
  addFavorite,
  removeFavorite,
  getUserCreditInfo
}; 