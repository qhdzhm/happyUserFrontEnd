/**
 * Token管理器 - 实现用户无感知的Token刷新机制
 */

import { refreshToken, isTokenExpiringSoon } from './api';
import { shouldUseCookieAuth, getToken } from './auth';

class TokenManager {
  constructor() {
    this.refreshPromise = null; // 防止并发刷新
    this.refreshTimer = null; // 定时刷新器
    this.isRefreshing = false; // 刷新状态标记
    this.failedQueue = []; // 失败请求队列
    this.checkInterval = 300000; // 检查间隔：5分钟
    this.refreshThreshold = 15; // 刷新阈值：15分钟
    
    // 检查是否使用Cookie认证
    if (shouldUseCookieAuth()) {
      console.log('🍪 Cookie认证模式，TokenManager已禁用');
      return;
    }
    
    // 启动定时检查
    this.startPeriodicCheck();
    
    // 监听页面可见性变化
    this.setupVisibilityListener();
    
    // 监听用户活动
    this.setupActivityListener();
  }

  /**
   * 启动定时检查
   */
  startPeriodicCheck() {
    // 如果使用Cookie认证，不启动定时检查
    if (shouldUseCookieAuth()) {
      console.log('Cookie认证模式，跳过Token定时检查');
      return;
    }
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.checkInterval);
    
    // console.log('Token定时检查已启动');
  }

  /**
   * 停止定时检查
   */
  stopPeriodicCheck() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      // console.log('Token定时检查已停止');
    }
  }

  /**
   * 检查并刷新Token
   */
  async checkAndRefreshToken() {
    try {
      // 如果使用Cookie认证，跳过检查
      if (shouldUseCookieAuth()) {
        return { success: true, message: 'Cookie auth mode' };
      }

      const currentToken = getToken();
      if (!currentToken) {
        // console.log('没有找到Token，跳过刷新检查');
        return { success: false, error: 'No token found' };
      }

      // 检查Token是否即将过期
      if (isTokenExpiringSoon(currentToken, this.refreshThreshold)) {
        // console.log('Token即将过期，开始主动刷新...');
        return await this.refreshTokenSafely();
      }

      return { success: true, message: 'Token still valid' };
    } catch (error) {
      console.error('Token检查失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 安全刷新Token（防止并发）
   */
  async refreshTokenSafely() {
    // 如果已经在刷新中，返回现有的Promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Token刷新已在进行中，等待结果...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行Token刷新
   */
  async performTokenRefresh() {
    try {
      console.log('执行Token刷新...');
      const refreshResult = await refreshToken();
      
      if (refreshResult.success) {
        console.log('Token刷新成功');
        
        // 处理失败队列中的请求
        this.processFailedQueue(null, refreshResult.accessToken);
        
        // 触发刷新成功事件
        this.dispatchTokenRefreshEvent('success', refreshResult);
        
        return refreshResult;
      } else {
        console.error('Token刷新失败:', refreshResult.error);
        
        // 处理失败队列
        this.processFailedQueue(new Error(refreshResult.error), null);
        
        // 触发刷新失败事件
        this.dispatchTokenRefreshEvent('failed', refreshResult);
        
        // 如果需要重新登录，触发登出
        if (refreshResult.needLogin) {
          this.handleRefreshFailure();
        }
        
        return refreshResult;
      }
    } catch (error) {
      console.error('Token刷新过程出错:', error);
      
      // 处理失败队列
      this.processFailedQueue(error, null);
      
      // 触发刷新错误事件
      this.dispatchTokenRefreshEvent('error', { error: error.message });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 添加失败的请求到队列
   */
  addToFailedQueue(resolve, reject) {
    this.failedQueue.push({ resolve, reject });
  }

  /**
   * 处理失败队列中的请求
   */
  processFailedQueue(error, token) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * 处理刷新失败
   */
  handleRefreshFailure() {
    console.log('Token刷新失败，需要重新登录');
    
    // 触发登出事件
    this.dispatchTokenRefreshEvent('logout', { reason: 'refresh_failed' });
    
    // 清理定时器
    this.stopPeriodicCheck();
    
    // 可以在这里触发全局登出逻辑
    try {
      const { secureLogout } = require('./auth');
      secureLogout();
    } catch (error) {
      console.error('执行安全登出失败:', error);
    }
  }

  /**
   * 触发Token刷新事件
   */
  dispatchTokenRefreshEvent(type, data) {
    try {
      const event = new CustomEvent('tokenRefresh', {
        detail: { type, data }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('触发Token刷新事件失败:', error);
    }
  }

  /**
   * 监听页面可见性变化
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 页面变为可见时，立即检查Token
        console.log('页面变为可见，检查Token状态...');
        this.checkAndRefreshToken();
      }
    });
  }

  /**
   * 监听用户活动
   */
  setupActivityListener() {
    let lastActivity = Date.now();
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // 每5分钟检查用户活动，如果用户活跃则检查Token
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastActivity < fiveMinutes) {
        // 用户在过去5分钟内有活动，检查Token
        this.checkAndRefreshToken();
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次
  }

  /**
   * 手动触发Token刷新
   */
  async forceRefresh() {
    console.log('手动触发Token刷新...');
    return await this.refreshTokenSafely();
  }

  /**
   * 获取Token状态
   */
  getTokenStatus() {
    if (shouldUseCookieAuth()) {
      return { mode: 'cookie', valid: true };
    }

    const token = getToken();
    if (!token) {
      return { mode: 'localStorage', valid: false, reason: 'no_token' };
    }

    const expiringSoon = isTokenExpiringSoon(token, this.refreshThreshold);
    return {
      mode: 'localStorage',
      valid: !expiringSoon,
      expiringSoon,
      isRefreshing: this.isRefreshing
    };
  }

  /**
   * 销毁Token管理器
   */
  destroy() {
    this.stopPeriodicCheck();
    this.failedQueue = [];
    this.refreshPromise = null;
    this.isRefreshing = false;
    console.log('Token管理器已销毁');
  }
}

// 创建全局Token管理器实例
let tokenManagerInstance = null;

/**
 * 初始化Token管理器
 */
export function initTokenManager() {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
    console.log('Token管理器已初始化');
  }
  return tokenManagerInstance;
}

/**
 * 获取Token管理器实例
 */
export function getTokenManager() {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
  }
  return tokenManagerInstance;
}

/**
 * 销毁Token管理器
 */
export function destroyTokenManager() {
  if (tokenManagerInstance) {
    tokenManagerInstance.destroy();
    tokenManagerInstance = null;
    console.log('Token管理器实例已销毁');
  }
}

// 导出Token管理器类
export { TokenManager };

// 默认导出Token管理器实例获取函数
export default getTokenManager;


