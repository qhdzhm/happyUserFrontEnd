/**
 * TokenStatus组件 - 显示Token状态和提供手动刷新功能
 * 主要用于开发调试，生产环境可以隐藏
 */

import React from 'react';
import { Badge, Button, Card, Alert } from 'react-bootstrap';
import { FaSync, FaCheckCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import useTokenRefresh from '../../hooks/useTokenRefresh';
import './TokenStatus.css';

const TokenStatus = ({ showDetails = false, className = '' }) => {
  const { tokenStatus, refreshError, refreshToken, ensureToken, updateTokenStatus } = useTokenRefresh();

  const getStatusBadge = () => {
    if (tokenStatus.mode === 'cookie') {
      return <Badge bg="success"><FaCheckCircle className="me-1" />Cookie认证</Badge>;
    }

    if (!tokenStatus.valid) {
      return <Badge bg="danger"><FaExclamationTriangle className="me-1" />Token无效</Badge>;
    }

    if (tokenStatus.expiringSoon) {
      return <Badge bg="warning"><FaClock className="me-1" />即将过期</Badge>;
    }

    if (tokenStatus.isRefreshing) {
      return <Badge bg="info"><FaSync className="me-1 spin" />刷新中</Badge>;
    }

    return <Badge bg="success"><FaCheckCircle className="me-1" />Token有效</Badge>;
  };

  const handleRefresh = async () => {
    const result = await refreshToken();
    if (result.success) {
      console.log('手动刷新Token成功');
    } else {
      console.error('手动刷新Token失败:', result.error);
    }
  };

  const handleEnsureToken = async () => {
    const result = await ensureToken();
    if (result.success) {
      console.log('Token验证成功', result.refreshed ? '(已刷新)' : '(无需刷新)');
    } else {
      console.error('Token验证失败:', result.error);
    }
  };

  if (!showDetails) {
    // 简化显示模式
    return (
      <div className={`token-status-simple ${className}`}>
        {getStatusBadge()}
        {refreshError && (
          <Badge bg="danger" className="ms-2">
            <FaExclamationTriangle className="me-1" />错误
          </Badge>
        )}
      </div>
    );
  }

  // 详细显示模式
  return (
    <Card className={`token-status-card ${className}`}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Token状态</span>
        <div>
          {getStatusBadge()}
          <Button
            variant="outline-secondary"
            size="sm"
            className="ms-2"
            onClick={updateTokenStatus}
            title="刷新状态"
          >
            <FaSync />
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {refreshError && (
          <Alert variant="danger" className="mb-3">
            <FaExclamationTriangle className="me-2" />
            {refreshError}
          </Alert>
        )}

        <div className="token-info">
          <div className="info-row">
            <span className="label">认证模式:</span>
            <span className="value">
              {tokenStatus.mode === 'cookie' ? 'HttpOnly Cookie' : 'localStorage'}
            </span>
          </div>
          
          {tokenStatus.mode !== 'cookie' && (
            <>
              <div className="info-row">
                <span className="label">Token状态:</span>
                <span className="value">
                  {tokenStatus.valid ? '有效' : '无效'}
                </span>
              </div>
              
              {tokenStatus.expiringSoon && (
                <div className="info-row">
                  <span className="label">过期状态:</span>
                  <span className="value text-warning">即将过期</span>
                </div>
              )}
              
              {tokenStatus.isRefreshing && (
                <div className="info-row">
                  <span className="label">刷新状态:</span>
                  <span className="value text-info">正在刷新...</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="token-actions mt-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleEnsureToken}
            disabled={tokenStatus.isRefreshing}
            className="me-2"
          >
            验证Token
          </Button>
          
          {tokenStatus.mode !== 'cookie' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={tokenStatus.isRefreshing}
            >
              <FaSync className={tokenStatus.isRefreshing ? 'spin' : ''} />
              {tokenStatus.isRefreshing ? ' 刷新中...' : ' 手动刷新'}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default TokenStatus; 
 
 
 
 