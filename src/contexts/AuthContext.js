import React, { createContext, useState, useEffect } from 'react';
import { login, logout, clearPriceCache } from '../utils/api';
import { verifyTokenValidity } from '../utils/auth';

// 创建认证上下文
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化时从localStorage加载用户状态并验证token有效性
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      const userType = localStorage.getItem('userType');
      const agentId = localStorage.getItem('agentId');
      
      if (token && username) {
        // 验证token是否仍然有效
        const isTokenValid = await verifyTokenValidity();
        
        if (isTokenValid) {
          // token有效，设置用户信息
          setCurrentUser({
            username,
            userType: userType || 'regular', // 确保用户类型正确
            agentId: agentId ? parseInt(agentId, 10) : null,
            isAuthenticated: true
          });
          console.log('用户登录状态已恢复:', { username, userType, agentId });
        } else {
          // token无效，清除状态
          console.log('Token验证失败，清除登录状态');
          setCurrentUser(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // 登录方法
  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await login(credentials);
      
      if (response && response.code === 1 && response.data) {
        const userData = {
          username: response.data.username || credentials.username,
          userType: response.data.userType || credentials.userType || 'regular',
          agentId: response.data.agentId ? parseInt(response.data.agentId, 10) : null,
          isAuthenticated: true
        };
        
        setCurrentUser(userData);
        
        // 清空价格缓存，确保获取最新折扣价格
        clearPriceCache();
        
        console.log('登录成功:', userData);
        return true;
      } else {
        setError(response?.msg || '登录失败');
        return false;
      }
    } catch (err) {
      setError(err.message || '登录过程中出现错误');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    
    // 清空价格缓存，确保下一个用户获取正确的价格
    clearPriceCache();
  };

  // 提供全局认证上下文
  const value = {
    currentUser,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 