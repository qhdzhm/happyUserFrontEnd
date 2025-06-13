/**
 * useTokenRefresh Hook - 用于在组件中使用token刷新功能
 */

import { useState, useEffect, useCallback } from 'react';
import { getTokenManager } from '../utils/tokenManager';
import { ensureValidToken } from '../utils/api';

export const useTokenRefresh = () => {
  const [tokenStatus, setTokenStatus] = useState({
    valid: true,
    expiringSoon: false,
    isRefreshing: false,
    mode: 'unknown'
  });
  const [refreshError, setRefreshError] = useState(null);

  // 获取token状态
  const updateTokenStatus = useCallback(() => {
    try {
      const manager = getTokenManager();
      const status = manager.getTokenStatus();
      setTokenStatus(status);
    } catch (error) {
      console.error('获取token状态失败:', error);
      setTokenStatus({
        valid: false,
        expiringSoon: false,
        isRefreshing: false,
        mode: 'error'
      });
    }
  }, []);

  // 手动刷新token
  const refreshToken = useCallback(async () => {
    try {
      setRefreshError(null);
      const manager = getTokenManager();
      const result = await manager.forceRefresh();
      
      if (result.success) {
        updateTokenStatus();
        return { success: true };
      } else {
        setRefreshError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error.message || 'Token刷新失败';
      setRefreshError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [updateTokenStatus]);

  // 确保token有效（在执行重要操作前调用）
  const ensureToken = useCallback(async () => {
    try {
      setRefreshError(null);
      const result = await ensureValidToken();
      
      if (result.success) {
        updateTokenStatus();
        return { success: true, refreshed: result.refreshed };
      } else {
        setRefreshError(result.error);
        return { success: false, error: result.error, needLogin: result.needLogin };
      }
    } catch (error) {
      const errorMsg = error.message || 'Token验证失败';
      setRefreshError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [updateTokenStatus]);

  // 监听token刷新事件
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'success':
          setRefreshError(null);
          updateTokenStatus();
          break;
        case 'failed':
          setRefreshError(data.error);
          updateTokenStatus();
          break;
        case 'error':
          setRefreshError(data.error);
          updateTokenStatus();
          break;
        default:
          break;
      }
    };

    document.addEventListener('tokenRefresh', handleTokenRefresh);
    
    // 初始化时获取token状态
    updateTokenStatus();

    return () => {
      document.removeEventListener('tokenRefresh', handleTokenRefresh);
    };
  }, [updateTokenStatus]);

  return {
    tokenStatus,
    refreshError,
    refreshToken,
    ensureToken,
    updateTokenStatus
  };
};

export default useTokenRefresh; 
 
 
 
 