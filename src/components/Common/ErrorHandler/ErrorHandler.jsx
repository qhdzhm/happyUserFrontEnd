import React from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { FaExclamationTriangle, FaWifi, FaServer, FaRedo } from 'react-icons/fa';
import './ErrorHandler.css';

const ErrorHandler = ({ 
  error, 
  loading = false, 
  onRetry = null, 
  showRetryButton = true,
  size = 'normal', // 'small', 'normal', 'large'
  className = ''
}) => {
  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className={`error-handler loading ${size} ${className}`}>
        <div className="d-flex align-items-center justify-content-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>处理中...</span>
        </div>
      </div>
    );
  }

  // 如果没有错误，不显示任何内容
  if (!error) {
    return null;
  }

  // 分析错误类型和获取用户友好的错误信息
  const getErrorInfo = (error) => {
    let icon = FaExclamationTriangle;
    let variant = 'danger';
    let title = '操作失败';
    let message = '请稍后再试';
    let suggestion = '';

    // 处理超时错误
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      icon = FaWifi;
      variant = 'warning';
      title = '连接超时';
      message = '网络连接超时，请检查网络状态';
      suggestion = '建议检查网络连接后重试';
    }
    // 处理网络错误
    else if (error.message?.includes('Network Error') || !error.response) {
      icon = FaWifi;
      variant = 'warning';
      title = '网络异常';
      message = '无法连接到服务器';
      suggestion = '请检查网络连接或稍后再试';
    }
    // 处理服务器错误
    else if (error.response?.status >= 500) {
      icon = FaServer;
      variant = 'danger';
      title = '服务暂时不可用';
      message = '服务器正在维护中';
      suggestion = '请稍后再试或联系客服';
    }
    // 处理客户端错误
    else if (error.response?.status >= 400 && error.response?.status < 500) {
      icon = FaExclamationTriangle;
      variant = 'warning';
      title = '请求失败';
      message = error.response?.data?.msg || error.response?.data?.message || '请求参数有误';
      suggestion = '请检查输入信息后重试';
    }
    // 使用用户友好的消息
    else if (error.userMessage) {
      message = error.userMessage;
    }

    return { icon, variant, title, message, suggestion };
  };

  const { icon: Icon, variant, title, message, suggestion } = getErrorInfo(error);

  return (
    <div className={`error-handler ${size} ${className}`}>
      <Alert variant={variant} className="m-0">
        <div className="d-flex align-items-start">
          <Icon className="error-icon me-2 mt-1" />
          <div className="flex-grow-1">
            <Alert.Heading as="h6" className="mb-1">{title}</Alert.Heading>
            <p className="mb-1">{message}</p>
            {suggestion && (
              <small className="text-muted">{suggestion}</small>
            )}
            {showRetryButton && onRetry && (
              <div className="mt-2">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={onRetry}
                  className="d-flex align-items-center"
                >
                  <FaRedo className="me-1" />
                  重试
                </Button>
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default ErrorHandler; 