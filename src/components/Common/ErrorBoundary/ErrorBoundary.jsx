import React, { Component } from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，下次渲染时显示错误UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 可以在这里将错误信息发送到错误跟踪服务
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // 渲染错误UI
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>哎呀，出错了！</Alert.Heading>
            <p>
              应用程序遇到了一个错误。请尝试刷新页面或返回首页。
            </p>
            <hr />
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-danger" 
                onClick={() => window.location.href = '/'}
              >
                返回首页
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={this.handleReset}
              >
                尝试恢复
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3">
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  <summary>错误详情</summary>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </details>
              </div>
            )}
          </Alert>
        </Container>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary; 