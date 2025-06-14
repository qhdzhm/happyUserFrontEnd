import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Common/Header/Header';
import Footer from '../components/Common/Footer/Footer';
import AgentNavBar from '../components/Agent/AgentNavBar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const [isHomePage, setIsHomePage] = useState(false);
  
  // 检查用户是否是代理商或操作员
  const userType = user?.userType || localStorage.getItem('userType');
  const isAgent = userType === 'agent' || userType === 'agent_operator';
  
  // 定义不需要显示Header和Footer的页面路径
  const authRoutes = ['/login', '/agent-login', '/register', '/wx-callback'];
  const isAuthPage = authRoutes.includes(location.pathname);
  
  // 检查是否为代理商模式（登录后的代理商或操作员）
  const isAgentMode = isAgent && !isAuthPage;

  
  useEffect(() => {
    // 检查当前路径是否为首页
    const isHome = location.pathname === '/';
    setIsHomePage(isHome);
    
    if (isHome) {
      document.body.classList.add('home-page');
      document.documentElement.classList.add('fullscreen-scroll-active');
    } else {
      document.body.classList.remove('home-page');
      document.documentElement.classList.remove('fullscreen-scroll-active');
    }
    
    // 为代理商模式添加特殊样式类
    if (isAgentMode) {
      document.body.classList.add('agent-mode');
    } else {
      document.body.classList.remove('agent-mode');
    }
    
    // 组件卸载时清除类名
    return () => {
      document.body.classList.remove('home-page');
      document.documentElement.classList.remove('fullscreen-scroll-active');
      document.body.classList.remove('agent-mode');
    };
  }, [location, isAgentMode]);

  // 如果是认证页面，只渲染children，不显示任何导航
  if (isAuthPage) {
    return <>{children}</>;
  }

  // 如果是代理商模式，显示代理商导航栏
  if (isAgentMode) {
    return (
      <div className="layout-container">
        <AgentNavBar />
        <main className="flex-grow-1">
          {children}
        </main>
      </div>
    );
  }

  // 普通用户模式，显示完整的Header和Footer
  return (
    <div className="layout-container">
      <Header />
      <main className="flex-grow-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
