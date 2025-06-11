import { useState, useCallback } from 'react';

/**
 * 错误处理 Hook
 * 用于优雅地处理API错误和显示用户友好的错误信息
 */
const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 处理错误
  const handleError = useCallback((error) => {
    console.log('🎯 处理错误:', error?.message || '未知错误');
    
    // 如果是已经处理过的友好错误，直接使用
    if (error?.userMessage) {
      setError(error);
      return;
    }

    // 根据错误类型生成用户友好的错误对象
    let userFriendlyError = {
      ...error,
      userMessage: '操作失败，请稍后再试'
    };

    // 处理超时错误
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      userFriendlyError.userMessage = '请求超时，请检查网络连接';
      userFriendlyError.isTimeout = true;
    }
    // 处理网络错误
    else if (error?.message?.includes('Network Error') || !error?.response) {
      userFriendlyError.userMessage = '网络连接异常，请检查网络设置';
      userFriendlyError.isNetworkError = true;
    }
    // 处理服务器错误
    else if (error?.response?.status >= 500) {
      userFriendlyError.userMessage = '服务暂时不可用，请稍后再试';
      userFriendlyError.isServerError = true;
    }
    // 处理客户端错误
    else if (error?.response?.status >= 400 && error?.response?.status < 500) {
      userFriendlyError.userMessage = error?.response?.data?.msg || 
                                     error?.response?.data?.message || 
                                     '请求失败，请检查输入信息';
      userFriendlyError.isClientError = true;
    }

    setError(userFriendlyError);
  }, []);

  // 执行异步操作并处理错误
  const executeWithErrorHandling = useCallback(async (asyncOperation, options = {}) => {
    const { 
      showLoading = true, 
      clearErrorOnStart = true,
      onSuccess = null,
      onError = null 
    } = options;

    try {
      if (clearErrorOnStart) {
        clearError();
      }
      
      if (showLoading) {
        setLoading(true);
      }

      const result = await asyncOperation();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      handleError(error);
      
      if (onError) {
        onError(error);
      }

      throw error; // 重新抛出错误，让调用者决定如何处理
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [handleError, clearError]);

  // 重试函数
  const retry = useCallback((asyncOperation, options = {}) => {
    return executeWithErrorHandling(asyncOperation, options);
  }, [executeWithErrorHandling]);

  return {
    error,
    loading,
    clearError,
    handleError,
    executeWithErrorHandling,
    retry,
    // 便利的状态检查
    hasError: !!error,
    isTimeout: error?.isTimeout || false,
    isNetworkError: error?.isNetworkError || false,
    isServerError: error?.isServerError || false,
    isClientError: error?.isClientError || false
  };
};

export default useErrorHandler; 