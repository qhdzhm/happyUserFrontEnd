import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth, validateToken } from './store/slices/authSlice';
import { getAgentDiscountRate, clearPriceCache } from './utils/api';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import Loading from './components/Loading';
import { STORAGE_KEYS } from './utils/constants';
import "./App.css";
import ErrorHandler from './components/Error/ErrorHandler';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalChatBot from './components/ChatBot/GlobalChatBot';

import { initTokenManager } from './utils/tokenManager';
import './utils/debugAuth'; // 导入调试工具
import { autoCleanupOnStart } from './utils/cleanupAuth'; // 导入认证清理工具

// 缓存自动清理的时间间隔 (30分钟)
const CACHE_AUTO_CLEAR_INTERVAL = 30 * 60 * 1000;

// Token检查间隔 (15分钟，延长检查时间)
const TOKEN_CHECK_INTERVAL = 15 * 60 * 1000;

function App() {
  const dispatch = useDispatch();
  const { loading, tokenValidated } = useSelector(state => state.auth);
  
  // 当组件挂载时，只进行基础初始化，不自动验证token
  useEffect(() => {
    // 🧹 首先运行认证清理，移除旧的token数据
    autoCleanupOnStart();
    
    // 检查当前页面是否需要立即验证token
    const currentPath = window.location.pathname;
    const isProtectedPage = currentPath.startsWith('/booking') || 
                           currentPath.startsWith('/checkout') || 
                           currentPath.startsWith('/profile') || 
                           currentPath.startsWith('/orders') || 
                           currentPath.startsWith('/payment') || 
                           currentPath.startsWith('/agent-center') || 
                           currentPath.startsWith('/credit-transactions');
    
    // 检查当前是否已经有有效认证
    const { isAuthenticated } = require('./utils/auth');
    const hasValidAuth = isAuthenticated();
    
    // 只在访问受保护页面或已经有认证状态时才进行token验证
    if (isProtectedPage || hasValidAuth) {
      console.log('🔒 需要token验证，原因:', isProtectedPage ? '访问受保护页面' : '已有认证状态');
      console.log('🔒 当前路径:', currentPath);
      dispatch(validateToken());
    } else {
      console.log('ℹ️ 当前页面无需立即验证token:', currentPath);
      // 手动设置tokenValidated为true，避免显示加载状态
      setTimeout(() => {
        const { setTokenValidated } = require('./store/slices/authSlice');
        dispatch(setTokenValidated());
      }, 100);
    }
    
    // 初始化TokenManager
    try {
      initTokenManager();
      console.log('TokenManager已初始化');
    } catch (error) {
      console.error('TokenManager初始化失败:', error);
    }
    
    // 初始化用户信息同步（CSRF已禁用）
    const initUserSync = async () => {
      try {
        const { syncUserInfoToLocalStorage } = require('./utils/auth');
        
        // 同步用户信息到localStorage（用于ChatBot等组件）
        syncUserInfoToLocalStorage();
      } catch (error) {
        // 静默处理初始化失败
      }
    };
    
    initUserSync();
  }, [dispatch]);

  /**
   * 检查会话状态并获取代理商折扣率（如果需要）
   */
  useEffect(() => {
    // 只有在token验证完成后才执行
    if (!tokenValidated) return;

    const checkSession = async () => {
      try {
        // 检查认证模式
        const { shouldUseCookieAuth, isAuthenticated } = require('./utils/auth');
        const useCookieAuth = shouldUseCookieAuth();
        
        // 从localStorage获取会话状态
        const sessionState = {
          token: localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('token'),
          userType: localStorage.getItem('userType'),
          username: localStorage.getItem('username'),
          agentId: localStorage.getItem('agentId')
        };

        console.log('检查本地存储的会话状态:', sessionState);

        // 检查是否已认证
        const authenticated = useCookieAuth ? isAuthenticated() : !!sessionState.token;
        
        if (authenticated) {
          // 根据用户类型和是否已经有折扣率决定是否需要获取折扣率
          const isAgent = sessionState.userType === 'agent' || sessionState.userType === 'agent_operator';
          
          // 如果是代理商，则获取最新的折扣率
          if (isAgent && sessionState.agentId) {
            console.log('检测到代理商登录，开始获取代理商折扣率...');
            try {
              // 调用后端API获取折扣率
              await getAgentDiscountRate(sessionState.agentId);
              console.log('成功获取代理商折扣率');
            } catch (error) {
              console.error('获取代理商折扣率失败:', error);
            }
          }
        } else {
          console.log('未检测到有效认证状态');
        }
      } catch (error) {
        console.error('检查会话状态失败:', error);
      }
    };

    checkSession();
  }, [dispatch, tokenValidated]); // 依赖tokenValidated
  
  // 添加缓存清理和监听localStorage变化的事件
  useEffect(() => {
    // 页面加载时清理价格缓存
    clearPriceCache();
    
    // 设置定时自动清理
    const autoCleanInterval = setInterval(() => {
      console.log('定时自动清理价格缓存');
      clearPriceCache();
    }, CACHE_AUTO_CLEAR_INTERVAL);
    
    // 设置定期Token检查机制
    const tokenCheckInterval = setInterval(() => {
      const { isAuthenticated } = require('./utils/auth');
      const hasToken = localStorage.getItem('token') || localStorage.getItem('authentication');
      
      // 如果有token但验证失败，可能是token过期了
      if (hasToken && !isAuthenticated()) {
        console.log('检测到token可能过期，重新验证...');
        dispatch(validateToken());
      }
    }, TOKEN_CHECK_INTERVAL);
    
    // 监听storage事件，当其他页面/标签修改localStorage时触发
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userType' || e.key === 'agentId') {
        clearPriceCache();
        
        // 只有在token被设置（而不是被清除）时才重新验证
        const newValue = e.newValue;
        if (newValue && newValue !== '' && newValue !== 'null') {
          dispatch(validateToken());
        }
      }
    };

    // 监听强制token验证事件
    const handleForceTokenValidation = () => {
      console.log('收到强制token验证事件，重新验证...');
      dispatch(validateToken());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('forceTokenValidation', handleForceTokenValidation);
    
    // 清理函数
    return () => {
      clearInterval(autoCleanInterval);
      clearInterval(tokenCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('forceTokenValidation', handleForceTokenValidation);
    };
  }, [dispatch]);
  
  return (
    <ErrorHandler>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <MainLayout>
          {(loading || !tokenValidated) ? <Loading /> : <AppRoutes />}
        </MainLayout>
        <GlobalChatBot />
      </Router>
    </ErrorHandler>
  );
}

export default App;
