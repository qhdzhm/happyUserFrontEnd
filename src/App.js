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

// 缓存自动清理的时间间隔 (30分钟)
const CACHE_AUTO_CLEAR_INTERVAL = 30 * 60 * 1000;

function App() {
  const dispatch = useDispatch();
  const { loading, tokenValidated } = useSelector(state => state.auth);
  
  // 当组件挂载时，验证token有效性并初始化CSRF保护
  useEffect(() => {
    dispatch(validateToken());
    
    // 初始化CSRF保护和用户信息同步
    const initCSRF = async () => {
      try {
        const { initializeCSRFProtection, syncUserInfoToLocalStorage } = require('./utils/auth');
        await initializeCSRFProtection();
        
        // 同步用户信息到localStorage（用于ChatBot等组件）
        syncUserInfoToLocalStorage();
      } catch (error) {
        // 静默处理CSRF初始化失败
      }
    };
    
    initCSRF();
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
