import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import './ErrorHandler.css';

/**
 * 全局错误处理组件
 * 用于显示错误信息并提供重试选项
 */
class ErrorHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isCritical: false
    };
  }

  // 捕获渲染中的错误
  static getDerivedStateFromError(error) {
    console.error('全局错误捕获:', error.message);
    return { 
      hasError: true, 
      error: error,
      isCritical: error.message.includes('API') || error.message.includes('network')
    };
  }

  // 记录错误详情
  componentDidCatch(error, errorInfo) {
    console.error('错误详情:', {
      错误: error,
      组件堆栈: errorInfo.componentStack
    });
    this.setState({ errorInfo });
    
    // 记录到日志服务（在生产环境可实现）
    this.logErrorToService(error, errorInfo);
  }

  // 记录错误到服务
  logErrorToService(error, errorInfo) {
    // 这里可以实现发送错误到日志服务的逻辑
    // 例如：
    // api.logError({
    //   message: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack,
    //   userAgent: navigator.userAgent,
    //   url: window.location.href,
    //   timestamp: new Date().toISOString()
    // });
    
    console.log('错误已记录（模拟）');
  }

  // 重置错误状态
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isCritical: false
    });
    
    // 可选：刷新页面或重新加载数据
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    // 没有错误时正常渲染子组件
    if (!this.state.hasError) {
      return this.props.children;
    }

    // 显示错误信息
    return (
      <div className="error-container">
        <Alert variant={this.state.isCritical ? "danger" : "warning"}>
          <Alert.Heading>
            {this.state.isCritical ? "系统错误" : "发生错误"}
          </Alert.Heading>
          <p>
            {this.state.error?.message || '应用程序遇到问题'}
          </p>
          {this.state.errorInfo && (
            <details className="error-details">
              <summary>查看详情</summary>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
          <div className="d-flex justify-content-end mt-3">
            <Button onClick={this.resetError} variant="outline-secondary" className="me-2">
              重试
            </Button>
            <Button onClick={() => window.location.reload()} variant="primary">
              刷新页面
            </Button>
          </div>
        </Alert>
      </div>
    );
  }
}

export default ErrorHandler; 