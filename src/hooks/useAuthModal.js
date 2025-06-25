import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * 登录弹窗管理Hook
 * 提供统一的登录检查和弹窗管理功能
 */
export const useAuthModal = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingActionData, setPendingActionData] = useState(null);
  
  const { isAuthenticated } = useSelector(state => state.auth);

  /**
   * 检查认证状态并执行操作
   * @param {Function} action - 需要认证的操作函数
   * @param {Object} actionData - 操作所需的数据
   * @param {Object} options - 配置选项
   * @returns {boolean} 是否立即执行了操作
   */
  const requireAuth = useCallback((action, actionData = null, options = {}) => {
    if (isAuthenticated) {
      // 已登录，直接执行操作
      action(actionData);
      return true;
    } else {
      // 未登录，保存操作并显示登录弹窗
      setPendingAction(() => action);
      setPendingActionData(actionData);
      setShowLoginModal(true);
      return false;
    }
  }, [isAuthenticated]);

  /**
   * 登录成功后的回调
   * @param {string} userType - 用户类型 ('user', 'guest')
   */
  const handleLoginSuccess = useCallback((userType = 'user') => {
    if (userType === 'guest') {
      // 游客模式的处理
      console.log('游客模式暂不支持此操作');
      setShowLoginModal(false);
      setPendingAction(null);
      setPendingActionData(null);
      return;
    }
    
    // 登录成功，执行暂停的操作
    if (pendingAction) {
      pendingAction(pendingActionData);
    }
    
    // 清理状态
    setShowLoginModal(false);
    setPendingAction(null);
    setPendingActionData(null);
  }, [pendingAction, pendingActionData]);

  /**
   * 隐藏登录弹窗
   */
  const hideLoginModal = useCallback(() => {
    setShowLoginModal(false);
    setPendingAction(null);
    setPendingActionData(null);
  }, []);

  /**
   * 检查是否已认证
   */
  const checkAuth = useCallback(() => {
    return isAuthenticated;
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    showLoginModal,
    requireAuth,
    handleLoginSuccess,
    hideLoginModal,
    checkAuth,
    pendingActionData
  };
};

export default useAuthModal; 