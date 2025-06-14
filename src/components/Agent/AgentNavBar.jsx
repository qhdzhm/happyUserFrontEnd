import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { canSeeCredit } from '../../utils/auth';
import { toast } from 'react-toastify';
import './AgentNavBar.css';

const AgentNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  // 优先从Redux状态获取用户信息，只有在已认证状态下才回退到localStorage
  const username = isAuthenticated ? 
    (user?.username || localStorage.getItem('username')) : 
    null;
  const userType = isAuthenticated ? 
    (user?.userType || localStorage.getItem('userType')) : 
    null;
  
  // 检查是否有权限查看信用记录
  const canViewCredit = canSeeCredit();
  
  // 如果用户未认证，不显示导航栏
  if (!isAuthenticated || !username) {
    return null;
  }
  
  // 导航菜单项 - 根据权限显示不同菜单
  const baseNavItems = [
    { path: '/booking-form', label: '立即预订', icon: '📝' },
    { path: '/agent-center', label: '代理商中心', icon: '🏢' },
    { path: '/orders', label: '订单管理', icon: '📋' }
  ];
  
  // 只有有权限的用户才能看到信用记录
  const navItems = canViewCredit ? [
    ...baseNavItems,
    { path: '/credit-transactions', label: '信用记录', icon: '💳' }
  ] : baseNavItems;
  
  // 登出处理
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('已安全退出');
      navigate('/agent-login', { replace: true });
    } catch (error) {
      console.error('登出失败:', error);
      toast.error('登出失败，请重试');
    }
  };
  
  return (
    <div className="agent-navbar">
      <div className="agent-navbar-content">
        {/* Logo和标题 */}
        <div className="agent-navbar-brand">
          <span className="agent-navbar-logo">🏢</span>
          <span className="agent-navbar-title">代理商控制台</span>
        </div>
        
        {/* 导航菜单 */}
        <nav className="agent-navbar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`agent-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* 用户信息和登出 */}
        <div className="agent-navbar-user">
          <span className="user-info">
            <span className="user-type">
              {userType === 'agent' ? '代理商' : '操作员'}
            </span>
            <span className="username">{username}</span>
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>退出</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentNavBar; 