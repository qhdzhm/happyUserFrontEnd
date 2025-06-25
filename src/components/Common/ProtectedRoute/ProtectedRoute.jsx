import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner, Alert } from 'react-bootstrap';
import { getUserInfoFromCookie, shouldUseCookieAuth, isAuthenticated } from '../../../utils/auth';

/**
 * 受保护的路由组件 - 增强权限验证
 * 用于需要用户登录才能访问的页面
 * 如果用户未登录或权限不足，将重定向到相应页面
 * 
 * @param {Object} props 组件参数
 * @param {React.ReactNode} props.children 子组件
 * @param {string[]} [props.requiredRoles] 需要的角色数组 ['user', 'agent', 'operator']
 * @param {boolean} [props.checkToken=true] 是否检查token
 * @param {boolean} [props.agentRedirect=false] 是否将代理商重定向到代理商中心
 */
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  checkToken = true,
  agentRedirect = false
}) => {
  const location = useLocation();
  const { isAuthenticated: reduxAuth, loading, user } = useSelector(state => state.auth);
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // 安全的用户信息获取
  const getUserInfo = () => {
    try {
      // 优先从Cookie获取（更安全）
      if (shouldUseCookieAuth()) {
        const cookieUserInfo = getUserInfoFromCookie();
        if (cookieUserInfo) {
          return {
            userType: cookieUserInfo.userType || cookieUserInfo.role || 'regular',
            username: cookieUserInfo.username,
            agentId: cookieUserInfo.agentId,
            operatorId: cookieUserInfo.operatorId,
            fromCookie: true
          };
        }
      }
      
      // 备用：从localStorage获取（验证一致性）
      const { getToken } = require('../../../utils/auth');
      const localUserType = localStorage.getItem('userType');
      const localUsername = localStorage.getItem('username');
      const token = getToken();
      
      if (token && token !== 'cookie-auth-enabled' && localUserType && localUsername) {
        return {
          userType: localUserType,
          username: localUsername,
          agentId: localStorage.getItem('agentId'),
          operatorId: localStorage.getItem('operatorId'),
          fromCookie: false
        };
      }
      
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setAuthError('用户信息验证失败，请重新登录');
      return null;
    }
  };
  
  const userInfo = getUserInfo();
  
  // 严格的权限检查
  const checkUserPermission = () => {
    if (requiredRoles.length === 0) return true;
    if (!userInfo) return false;
    
    const { userType } = userInfo;
    
    // 严格的角色映射 - 不允许跨类型访问
    const hasDirectMatch = requiredRoles.includes(userType);
    
    // 特殊处理：user角色可以匹配regular类型
    const hasUserMatch = requiredRoles.includes('user') && userType === 'regular';
    
    // 特殊处理：agent相关角色
    const isAgentRole = userType === 'agent' || userType === 'agent_operator';
    const hasAgentMatch = requiredRoles.includes('agent') && isAgentRole;
    
    // 特殊处理：operator角色
    const isOperatorRole = userType === 'operator' || userType === 'agent_operator';
    const hasOperatorMatch = requiredRoles.includes('operator') && isOperatorRole;
    
    const hasPermission = hasDirectMatch || hasUserMatch || hasAgentMatch || hasOperatorMatch;
    
    console.log('🔒 严格权限检查:', {
      userType,
      requiredRoles,
      hasDirectMatch,
      hasUserMatch,
      hasAgentMatch,
      hasOperatorMatch,
      finalPermission: hasPermission,
      location: location.pathname,
      userInfo: userInfo
    });
    
    // 安全日志：记录权限拒绝情况
    if (!hasPermission) {
      console.warn('🚫 权限验证失败:', {
        userType,
        requiredRoles,
        path: location.pathname,
        reason: '用户类型与所需角色不匹配'
      });
    }
    
    return hasPermission;
  };
  
  // 检查是否需要重定向到代理商中心
  const shouldRedirectToAgentCenter = () => {
    if (!agentRedirect || !userInfo) return false;
    
    const { userType } = userInfo;
    const isAgentUser = userType === 'agent' || userType === 'agent_operator' || userType === 'operator';
    const isProfilePage = location.pathname === '/profile';
    
    return isAgentUser && isProfilePage;
  };
  
  // 处理重定向消息显示
  useEffect(() => {
    if (shouldRedirectToAgentCenter()) {
      setShowRedirectMessage(true);
      
      const timer = setTimeout(() => {
        setShowRedirectMessage(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, userInfo]);
  
  // 如果加载中，显示加载指示器
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">验证权限中...</span>
      </div>
    );
  }
  
  // 如果认证出错，显示错误信息
  if (authError) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          <Alert.Heading>权限验证失败</Alert.Heading>
          <p>{authError}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button 
              className="btn btn-outline-danger" 
              onClick={() => window.location.href = '/login'}
            >
              重新登录
            </button>
          </div>
        </Alert>
      </div>
    );
  }
  
  // 如果不需要检查token，直接渲染子组件
  if (!checkToken) {
    return children;
  }
  
  // 检查是否已登录（使用多重验证）
  const isUserAuthenticated = () => {
    // 首先检查基本认证状态
    const basicAuth = isAuthenticated();
    if (!basicAuth) {
      console.log('🚫 基本认证检查失败');
      return false;
    }
    
    // 检查用户信息
    if (!userInfo) {
      console.log('🚫 无法获取用户信息');
      return false;
    }
    
    // 如果使用Cookie认证，认证状态OK且有用户信息就足够了
    if (shouldUseCookieAuth()) {
      console.log('✅ Cookie认证模式验证通过');
      return true;
    }
    
    // 对于Token认证，进行更宽松的检查
    const { getToken } = require('../../../utils/auth');
    const token = getToken();
    
    // 只要有token（任何形式的token）且基本认证通过就行
    if (token && basicAuth) {
      console.log('✅ Token认证模式验证通过');
      return true;
    }
    
    // 备用检查：如果Redux状态说已认证，也认为有效
    if (reduxAuth && userInfo.userType) {
      console.log('✅ Redux状态认证验证通过');
      return true;
    }
    
    console.log('🚫 所有认证检查都失败');
    return false;
  };
  
  if (!isUserAuthenticated()) {
    console.log('🚫 用户未认证，重定向到登录页');
    // 根据用户类型选择合适的登录页面
    const loginPath = userInfo?.userType === 'agent' || userInfo?.userType === 'agent_operator' 
      ? '/agent-login' 
      : '/login';
    
    return <Navigate to={loginPath} state={{ 
      from: location.pathname, 
      message: '您需要登录才能访问此页面' 
    }} replace />;
  }
  
  // 检查用户角色权限
  if (!checkUserPermission()) {
    console.log('🚫 权限不足，重定向到首页');
    return <Navigate to="/" state={{ 
      message: `权限不足：您的账号类型(${userInfo?.userType})无权访问此页面` 
    }} replace />;
  }
  
  // 如果需要重定向到代理商中心
  if (shouldRedirectToAgentCenter()) {
    if (showRedirectMessage) {
      return (
        <div className="container mt-4">
          <Alert variant="info" className="d-flex align-items-center">
            <span>检测到代理商账号，正在重定向到代理商中心...</span>
            <Spinner animation="border" size="sm" className="ms-2" />
          </Alert>
        </div>
      );
    }
    
    return <Navigate to="/agent-center" replace />;
  }
  
  // 权限验证通过，正常显示子组件
  console.log('✅ 权限验证通过，用户类型:', userInfo?.userType);
  return children;
};

export default ProtectedRoute; 