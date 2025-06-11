import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Common/Header/Header';
import Footer from '../components/Common/Footer/Footer';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const [isHomePage, setIsHomePage] = useState(false);
  
  // 检查用户是否是代理商
  const userRole = user?.role || localStorage.getItem('userType');
  const isAgent = userRole === 'agent';
  
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
    
    // 组件卸载时清除类名
    return () => {
      document.body.classList.remove('home-page');
      document.documentElement.classList.remove('fullscreen-scroll-active');
    };
  }, [location]);

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
