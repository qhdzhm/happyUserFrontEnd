/**
 * 安全的认证工具函数 - 支持HttpOnly Cookies和CSRF保护
 */
import { STORAGE_KEYS } from './constants';

// CSRF Token管理
let csrfToken = null;

// 加密密钥（实际项目中应该从环境变量获取）


/**
 * 简单的加密函数（实际项目中应使用更强的加密算法）
 */
const encrypt = (text) => {
  try {
    return btoa(encodeURIComponent(text));
  } catch (e) {
    return text;
  }
};

/**
 * 简单的解密函数
 */
const decrypt = (encryptedText) => {
  try {
    return decodeURIComponent(atob(encryptedText));
  } catch (e) {
    return encryptedText;
  }
};

/**
 * 检查token是否过期
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (e) {
    return true;
  }
};

/**
 * 获取CSRF Token
 */
export const getCSRFToken = () => {
  // 优先从内存获取
  if (csrfToken) return csrfToken;
  
  // 从meta标签获取
  const metaToken = document.querySelector('meta[name="csrf-token"]');
  if (metaToken) {
    csrfToken = metaToken.getAttribute('content');
    return csrfToken;
  }
  
  // 从localStorage获取（临时方案）
  const storedToken = localStorage.getItem('csrf_token');
  if (storedToken) {
    csrfToken = storedToken;
    return csrfToken;
  }
  
  return null;
};

/**
 * 设置CSRF Token
 */
export const setCSRFToken = (token) => {
  csrfToken = token;
  
  // 设置到meta标签
  let metaToken = document.querySelector('meta[name="csrf-token"]');
  if (!metaToken) {
    metaToken = document.createElement('meta');
    metaToken.setAttribute('name', 'csrf-token');
    document.head.appendChild(metaToken);
  }
  metaToken.setAttribute('content', token);
  
  // 临时也存储到localStorage（后续可移除）
  localStorage.setItem('csrf_token', token);
  

};

/**
 * 清除CSRF Token
 */
export const clearCSRFToken = () => {
  csrfToken = null;
  
  const metaToken = document.querySelector('meta[name="csrf-token"]');
  if (metaToken) {
    metaToken.remove();
  }
  
  localStorage.removeItem('csrf_token');
};

/**
 * 获取所有cookies
 */
const getCookies = () => {
  const cookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
};

/**
 * 检查是否有认证cookie（只能检测非HttpOnly的Cookie）
 */
export const hasAuthCookie = () => {
  const cookies = getCookies();
  return !!(cookies.authToken || cookies.auth_token || cookies.token);
};

/**
 * 检查是否有用户信息Cookie（非HttpOnly，可以检测）
 */
export const hasUserInfoCookie = () => {
  const cookies = getCookies();
  return !!(cookies.userInfo);
};

/**
 * 检查是否支持HttpOnly Cookie认证
 * 通过检测用户信息Cookie来判断是否启用了Cookie认证
 */
export const supportsHttpOnlyCookieAuth = () => {
  return hasUserInfoCookie();
};

/**
 * 检查是否应该使用Cookie认证模式
 */
export const shouldUseCookieAuth = () => {
  return supportsHttpOnlyCookieAuth();
};

/**
 * 从localStorage获取token（向后兼容）
 */
const getTokenFromStorage = () => {
  const userType = localStorage.getItem('userType');
  
  if (userType === 'agent' || userType === 'agent_operator') {
    const agentToken = localStorage.getItem('token');
    if (agentToken && !isTokenExpired(agentToken)) {
      return agentToken;
    }
  }
  
  const token = (
    localStorage.getItem('authentication') ||
    localStorage.getItem('token') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('jwt')
  );
  
  if (token && !isTokenExpired(token)) {
    return token;
  }
  
  return null;
};

/**
 * 从localStorage获取token - 主要导出函数
 */
export const getToken = () => {
  // 首先尝试从localStorage获取token（向后兼容）
  const token = getTokenFromStorage();
  if (token) {
    return token;
  }
  
  // 如果使用Cookie认证模式且有用户信息，返回标识符
  if (shouldUseCookieAuth() && (localStorage.getItem('user') || localStorage.getItem('userType'))) {
    return 'cookie-auth-enabled';
  }
  
  // 尝试安全方法获取token
  const secureToken = getTokenSecure();
  if (secureToken) {
    return secureToken;
  }
  
  return null;
};

/**
 * 安全获取token
 */
export const getTokenSecure = () => {
  // 检查token元数据
  const tokenMetaStr = localStorage.getItem('token_meta');
  if (!tokenMetaStr) return null;
  
  try {
    const tokenMeta = JSON.parse(tokenMetaStr);
    
    // 检查是否过期
    if (Date.now() > tokenMeta.expires) {
      console.log('Token已过期，清除数据');
      clearAllTokens();
      return null;
    }
    
    // 根据类型获取对应的token
    const tokenKey = tokenMeta.type === 'agent' || tokenMeta.type === 'agent_operator' 
      ? 'agent_token' 
      : 'user_token';
    
    const encryptedToken = localStorage.getItem(tokenKey);
    if (!encryptedToken) return null;
    
    // 解密token
    const token = decrypt(encryptedToken);
    
    // 双重检查token有效性
    if (isTokenExpired(token)) {
      console.log('Token验证失败，清除数据');
      clearAllTokens();
      return null;
    }
    
    return token;
  } catch (e) {
    console.error('获取token时出错:', e);
    clearAllTokens();
    return null;
  }
};

/**
 * 设置认证token
 */
export const setToken = (token, userType = 'regular') => {
  console.warn('setToken已废弃，请使用基于Cookie的认证');
  // 临时保持兼容性
  if (userType === 'agent' || userType === 'agent_operator') {
    localStorage.setItem('token', token);
  } else {
    localStorage.setItem('authentication', token);
  }
};

/**
 * 安全设置认证token
 */
export const setTokenSecure = (token, userType = 'regular') => {
  if (!token) return;
  
  // 检查token有效性
  if (isTokenExpired(token)) {
    console.warn('尝试设置已过期的token');
    return;
  }
  
  // 清除旧的token数据
  clearAllTokens();
  
  // 根据用户类型使用不同的存储策略
  const tokenKey = userType === 'agent' || userType === 'agent_operator' ? 'agent_token' : 'user_token';
  
  // 加密存储token
  const encryptedToken = encrypt(token);
  localStorage.setItem(tokenKey, encryptedToken);
  
  // 存储token元数据（不包含敏感信息）
  const tokenMeta = {
    type: userType,
    timestamp: Date.now(),
    expires: getTokenExpiry(token)
  };
  localStorage.setItem('token_meta', JSON.stringify(tokenMeta));
  
  console.log(`安全设置${userType}类型token`);
};

/**
 * 获取token过期时间
 */
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // 转换为毫秒
  } catch (e) {
    return Date.now() + 24 * 60 * 60 * 1000; // 默认24小时
  }
};

/**
 * 清除所有token数据
 */
const clearAllTokens = () => {
  // 清除所有可能的token存储
  const tokenKeys = [
    'token', 'authentication', 'userToken', 'jwt',
    'agent_token', 'user_token', 'token_meta',
    STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER
  ];
  
  tokenKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

/**
 * 清除所有本地存储数据
 */
const clearAllLocalStorage = () => {
  // 清理所有可能的token字段
  const keysToRemove = [
    'token', 'authentication', 'userToken', 'jwt',
    'agent_token', 'user_token', 'token_meta',
    'user', 'userType', 'username', 'userId',
    'agentId', 'operatorId', 'discountRate',
    'canSeeDiscount', 'canSeeCredit',
    'userProfile', 'loginTime', 'last_activity',
    STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

/**
 * 清除认证token
 */
export const clearToken = () => {
  console.warn('clearToken已废弃，请使用secureLogout');
  clearAllLocalStorage();
};

/**
 * 为请求添加认证头部（支持Cookie和CSRF）
 */
export const addAuthHeaders = (headers = {}) => {
  const authHeaders = { ...headers };
  
  // 添加CSRF Token
  const csrf = getCSRFToken();
  if (csrf) {
    authHeaders['X-CSRF-Token'] = csrf;
    authHeaders['X-Requested-With'] = 'XMLHttpRequest';
  }
  
  // 如果仍有localStorage token（向后兼容），也添加
  const token = getTokenFromStorage();
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
    authHeaders.authentication = token;
  }
  
  // 确保请求包含cookies
  authHeaders['credentials'] = 'include';
  
  return authHeaders;
};

/**
 * 检查用户是否已登录（基于Cookie）
 */
export const isAuthenticated = () => {
  // 首先检查localStorage中的token
  const token = localStorage.getItem('token') || localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token && !isTokenExpired(token)) {
    console.log('✓ 检测到有效的localStorage token');
    return true;
  }
  
  // 检查localStorage中是否有用户信息
  const user = localStorage.getItem('user');
  const userType = localStorage.getItem('userType');
  const username = localStorage.getItem('username');
  
  if (user || (userType && username)) {
    console.log('✓ 检测到localStorage中的用户信息');
    return true;
  }
  
  // 检查Cookie认证
  if (hasUserInfoCookie()) {
    console.log('✓ 检测到Cookie认证模式');
    return true;
  }
  
  if (hasAuthCookie()) {
    console.log('✓ 检测到传统Cookie认证');
    return true;
  }
  
  console.log('✗ 未检测到任何有效认证');
  return false;
};

/**
 * 从cookie获取用户信息（如果后端提供）
 */
export const getUserInfoFromCookie = () => {
  const cookies = getCookies();
  
  // 如果后端在cookie中提供了用户信息
  if (cookies.userInfo) {
    try {
      // 解码URL编码的Cookie值
      const decodedUserInfo = decodeURIComponent(cookies.userInfo);
      return JSON.parse(decodedUserInfo);
    } catch (e) {
      console.error('解析用户信息cookie失败:', e);
    }
  }
  
  // 从localStorage获取（向后兼容）
  const userInfo = localStorage.getItem('user');
  if (userInfo) {
    try {
      return JSON.parse(userInfo);
    } catch (e) {
      console.error('解析localStorage用户信息失败:', e);
    }
  }
  
  return null;
};

/**
 * 安全登出（清除Cookie和localStorage）
 */
export const secureLogout = async () => {
  try {
    // 调用后端登出API（清除HttpOnly Cookie）
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCSRFToken() || '',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      console.warn('后端登出失败，继续前端清理');
    }
  } catch (error) {
    console.error('登出请求失败:', error);
  }
  
  // 清除前端数据
  clearCSRFToken();
  clearAllLocalStorage();
  
  console.log('安全登出完成');
};

/**
 * 初始化CSRF保护
 */
export const initializeCSRFProtection = async () => {
  try {
    // 从后端获取CSRF Token
    const response = await fetch('http://localhost:8080/auth/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.csrfToken) {
        setCSRFToken(data.data.csrfToken);
        return true;
      } else if (data.csrfToken) {
        setCSRFToken(data.csrfToken);
        return true;
      }
    } else {
      console.error('CSRF Token请求失败:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('初始化CSRF保护失败:', error);
  }
  
  return false;
};

/**
 * 获取用户类型
 */
export const getUserType = () => {
  return localStorage.getItem('userType') || 'regular';
};

/**
 * 检查用户是否为代理商
 */
export const isAgent = () => {
  const userType = getUserType();
  return userType === 'agent' || userType === 'agent_operator';
};

/**
 * 检查是否为代理商主账号
 */
export const isAgentMain = () => {
  return getUserType() === 'agent';
};

/**
 * 检查当前用户是否为代理商操作员
 */
export const isOperator = () => {
  const userType = localStorage.getItem('userType');
  return userType === 'agent_operator';
};

/**
 * 检查是否可以查看折扣信息
 */
export const canSeeDiscount = () => {
  const canSee = localStorage.getItem('canSeeDiscount');
  if (canSee !== null) {
    return canSee === 'true';
  }
  // 如果没有明确设置，根据用户类型判断
  const userType = getUserType();
  // Agent主账号和普通用户可以看折扣，操作员不能看
  return userType === 'agent' || userType === 'regular';
};

/**
 * 检查是否可以查看信用额度信息
 */
export const canSeeCredit = () => {
  const canSee = localStorage.getItem('canSeeCredit');
  if (canSee !== null) {
    return canSee === 'true';
  }
  // 如果没有明确设置，根据用户类型判断
  const userType = getUserType();
  // Agent主账号可以看信用额度，操作员和普通用户不能看
  return userType === 'agent';
};

/**
 * 获取代理商ID
 */
export const getAgentId = () => {
  return localStorage.getItem('agentId');
};

/**
 * 获取操作员ID
 */
export const getOperatorId = () => {
  return localStorage.getItem('operatorId');
};

/**
 * 获取折扣率
 */
export const getDiscountRate = () => {
  const rate = localStorage.getItem('discountRate');
  return rate ? parseFloat(rate) : 1.0;
};

/**
 * 获取用户显示名称
 */
export const getUserDisplayName = () => {
  // 首先尝试从Cookie获取
  const cookieUserInfo = getUserInfoFromCookie();
  if (cookieUserInfo) {
    return cookieUserInfo.name || cookieUserInfo.username || '用户';
  }
  
  // 回退到localStorage
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.name || userData.username || '用户';
    } catch (e) {
      // 解析失败，使用用户名
    }
  }
  
  return localStorage.getItem('username') || '用户';
};

/**
 * 同步用户信息到localStorage（用于ChatBot等组件）
 * 只同步非敏感信息
 */
export const syncUserInfoToLocalStorage = () => {
  try {
    // 从Cookie获取用户信息
    const cookieUserInfo = getUserInfoFromCookie();
    
    if (cookieUserInfo) {
      // 只同步非敏感信息到localStorage
      const safeUserInfo = {
        username: cookieUserInfo.username,
        name: cookieUserInfo.name || cookieUserInfo.username,
        userType: cookieUserInfo.userType || cookieUserInfo.role,
        agentId: cookieUserInfo.agentId,
        operatorId: cookieUserInfo.operatorId,
        isAuthenticated: true
      };
      
      // 清理不必要的数据
      if (safeUserInfo.userType === 'agent' || safeUserInfo.userType === 'agent_operator') {
        // Agent用户，清除userId
        localStorage.removeItem('userId');
        // 不存储token到localStorage（使用Cookie认证）
        localStorage.removeItem('token');
      }
      
      // 同步到localStorage
      localStorage.setItem('user', JSON.stringify(safeUserInfo));
      localStorage.setItem('username', safeUserInfo.username);
      localStorage.setItem('userType', safeUserInfo.userType);
      
      if (safeUserInfo.agentId) {
        localStorage.setItem('agentId', safeUserInfo.agentId.toString());
      } else {
        localStorage.removeItem('agentId');
      }
      
      if (safeUserInfo.operatorId) {
        localStorage.setItem('operatorId', safeUserInfo.operatorId.toString());
      } else {
        localStorage.removeItem('operatorId');
      }
      
      // 设置权限信息
      const userType = safeUserInfo.userType;
      if (userType === 'agent') {
        // Agent主账号：可以看折扣和信用额度
        localStorage.setItem('canSeeDiscount', 'true');
        localStorage.setItem('canSeeCredit', 'true');
      } else if (userType === 'agent_operator') {
        // Agent操作员：不能看折扣和信用额度
        localStorage.setItem('canSeeDiscount', 'false');
        localStorage.setItem('canSeeCredit', 'false');
      } else {
        // 普通用户：可以看折扣，不能看信用额度
        localStorage.setItem('canSeeDiscount', 'true');
        localStorage.setItem('canSeeCredit', 'false');
      }
      
      console.log('✓ 用户信息已同步到localStorage:', safeUserInfo);
      console.log('✓ 权限设置:', {
        canSeeDiscount: localStorage.getItem('canSeeDiscount'),
        canSeeCredit: localStorage.getItem('canSeeCredit')
      });
      return true;
    }
  } catch (error) {
    console.error('同步用户信息到localStorage失败:', error);
  }
  
  return false;
};

/**
 * 验证token有效性
 */
export const verifyTokenValidity = async () => {
  const token = getToken();
  if (!token) {
    return { isValid: false, error: 'No token found' };
  }

  try {
    // 检查token格式
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' };
    }

    // 解析payload
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查过期时间
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return { isValid: false, error: 'Token expired' };
    }

    return { 
      isValid: true, 
      payload,
      expiresIn: payload.exp ? (payload.exp - currentTime) : null
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

/**
 * 清理冲突的token数据，确保只保留当前用户类型对应的token
 */
export const cleanupConflictingTokens = () => {
  const userType = localStorage.getItem('userType');
  
  if (userType === 'agent' || userType === 'agent_operator') {
    // 如果是代理商，清除普通用户token，保留代理商token
    const agentToken = localStorage.getItem('token');
    if (agentToken) {

      localStorage.removeItem('authentication'); // 清除普通用户token
      localStorage.removeItem('userToken'); // 清除普通用户token
      localStorage.removeItem('userId'); // 清除普通用户ID
      // 保留代理商相关数据

    }
  } else if (userType === 'regular') {
    // 如果是普通用户，清除代理商token，保留普通用户token
    const userToken = localStorage.getItem('authentication') || localStorage.getItem('userToken');
    if (userToken) {

      localStorage.removeItem('agentId'); // 清除代理商ID
      localStorage.removeItem('discountRate'); // 清除折扣率
      localStorage.removeItem('canSeeDiscount'); // 清除折扣权限
      localStorage.removeItem('canSeeCredit'); // 清除信用权限
      // 确保使用正确的token字段
      if (!localStorage.getItem('authentication') && userToken) {
        localStorage.setItem('authentication', userToken);
      }
    }
  }
};

/**
 * 调试认证状态 - 帮助排查认证问题
 */
export const debugAuthState = () => {
  const authState = {
    // Cookie检查
    hasUserInfoCookie: hasUserInfoCookie(),
    hasAuthCookie: hasAuthCookie(),
    shouldUseCookieAuth: shouldUseCookieAuth(),
    
    // localStorage检查
    localStorageData: {
      token: localStorage.getItem('token') ? '存在' : '不存在',
      storageToken: localStorage.getItem('authentication') ? '存在' : '不存在',
      user: localStorage.getItem('user') ? '存在' : '不存在',
      userType: localStorage.getItem('userType'),
      username: localStorage.getItem('username'),
      agentId: localStorage.getItem('agentId'),
      discountRate: localStorage.getItem('discountRate')
    },
    
    // 认证状态
    isAuthenticated: isAuthenticated(),
    tokenFromGetToken: getToken() ? '存在' : '不存在'
  };
  
  console.log('认证状态调试信息:', authState);
  return authState;
};

/**
 * 测试logout功能 - 手动检查cookie清理情况
 */
export const testLogoutFunction = async () => {
  console.log('🧪 开始测试logout功能...');
  
  // 记录logout前的状态
  console.log('Logout前的状态:');
  console.log('- localStorage数据:', debugAuthState().localStorageData);
  console.log('- Cookies:', document.cookie);
  
  try {
    // 调用logout函数
    const { logout } = require('./api');
    await logout();
    
    // 检查logout后的状态
    setTimeout(() => {
      console.log('Logout后的状态:');
      console.log('- localStorage数据:', debugAuthState().localStorageData);
      console.log('- Cookies:', document.cookie);
      console.log('✅ Logout测试完成');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Logout测试失败:', error);
  }
};
