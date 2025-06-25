/**
 * Token管理器 - 实现用户无感知的Token刷新机制
 */

import { refreshToken, isTokenExpiringSoon } from './api';
import { shouldUseCookieAuth, getToken } from './auth';

class TokenManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.failedQueue = [];
    this.refreshTimer = null;
    this.refreshThreshold = 5; // 5分钟阈值
    this.failureCount = 0; // 添加失败计数器
    this.maxFailures = 3; // 最大失败次数
    this.backoffDelay = 1000; // 退避延迟（毫秒）
    
    // 检查认证模式
    const useCookieAuth = shouldUseCookieAuth();
    console.log('TokenManager初始化 - 认证模式:', useCookieAuth ? 'Cookie' : 'Token');
    
    if (useCookieAuth) {
      console.log('🍪 Cookie认证模式，TokenManager功能有限');
      // Cookie模式下仍然设置监听器，但不启动定时检查
      this.setupVisibilityListener();
      return;
    }
    
    // Token认证模式下设置监听器
    this.setupVisibilityListener();
    this.setupActivityListener();
    
    // 启动定时检查（延迟启动）
    setTimeout(() => {
      this.startPeriodicCheck();
    }, 5000); // 5秒后启动，避免初始化冲突
  }

  /**
   * 启动定时检查
   */
  startPeriodicCheck(intervalMinutes = 1) {
    this.stopPeriodicCheck();
    
    this.refreshTimer = setInterval(() => {
      // 只有在失败次数未超过限制时才进行检查
      if (this.failureCount < this.maxFailures) {
        this.checkAndRefreshToken();
      } else {
        console.warn('Token刷新失败次数过多，暂停自动检查');
      }
    }, intervalMinutes * 60 * 1000);
    
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
   * 重置失败计数器
   */
  resetFailureCount() {
    this.failureCount = 0;
    console.log('Token刷新失败计数器已重置');
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
    // 如果失败次数过多，先等待一段时间
    if (this.failureCount >= this.maxFailures) {
      console.warn(`Token刷新失败次数过多(${this.failureCount})，跳过此次刷新`);
      return { success: false, error: 'Too many failures, skipping refresh' };
    }

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
      
      // 添加退避延迟
      if (this.failureCount > 0) {
        const delay = this.backoffDelay * Math.pow(2, this.failureCount - 1);
        console.log(`等待退避延迟: ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const refreshResult = await refreshToken();
      
      if (refreshResult.success) {
        console.log('Token刷新成功');
        
        // 重置失败计数器
        this.resetFailureCount();
        
        // 处理失败队列中的请求
        this.processFailedQueue(null, refreshResult.accessToken);
        
        // 触发刷新成功事件
        this.dispatchTokenRefreshEvent('success', refreshResult);
        
        return refreshResult;
      } else {
        console.error('Token刷新失败:', refreshResult.error);
        
        // 增加失败计数器
        this.failureCount++;
        console.warn(`Token刷新失败次数: ${this.failureCount}/${this.maxFailures}`);
        
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
      
      // 增加失败计数器
      this.failureCount++;
      console.warn(`Token刷新失败次数: ${this.failureCount}/${this.maxFailures}`);
      
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
        // 检查认证模式，Cookie模式下跳过Token检查
        if (shouldUseCookieAuth()) {
          console.log('页面变为可见，Cookie认证模式，跳过Token检查');
          return;
        }
        
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


