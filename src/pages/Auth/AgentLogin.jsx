import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import Loginpic from '../../assets/login/Login.jpg';
import LoginLogo from '../../assets/login/logo.png';
import './AgentLogin.css';

const AgentLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'agent' // 固定为代理商类型
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { error, isAuthenticated } = useSelector(state => state.auth);
  
  // 获取用户尝试访问的页面路径，如果没有则默认为立即预订页面
  const from = location.state?.from || '/booking-form';
  // 获取重定向消息
  const redirectMessage = location.state?.message || '';
  
  // 当认证状态改变时，重定向到代理商页面
  useEffect(() => {
    if (isAuthenticated) {
      // 代理商和操作员登录成功后跳转到booking-form页面
      console.log('🏢 代理商/操作员登录成功，跳转到预订搜索页面');
      navigate('/booking-form', { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // 组件卸载时清除错误
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!formData.username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    
    if (!formData.password) {
      toast.error('请输入密码');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('密码必须至少6个字符');
      return;
    }
    
    setLoading(true);
    
    // 添加网络诊断
    console.log('🔍 开始 Agent 登录调试...');
    console.log('📝 登录数据:', {
      username: formData.username,
      userType: 'agent'
    });
    
    // 测试网络连接
    try {
      console.log('🌐 测试网络连接和代理...');
      const testResponse = await fetch('/api/health', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ 网络连接测试:', testResponse.status, testResponse.statusText);
    } catch (networkError) {
      console.error('❌ 网络连接测试失败:', networkError);
      toast.error('网络连接失败，请检查网络设置');
      setLoading(false);
      return;
    }
    
    try {
      // 确保用户类型正确
      const loginData = {
        username: formData.username,
        password: formData.password,
        userType: 'agent' // 始终使用agent类型登录接口
      };
      
      console.log('🚀 发送登录请求...');
      // 分发登录action
      await dispatch(loginUser(loginData)).unwrap();
      
      // 触发登录状态变化事件，通知其他组件
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('loginStateChanged'));
      }, 100);
      
      // 显示成功提示
      toast.success('登录成功！');
      
    } catch (error) {
      console.error('登录错误:', error);
      
      // 根据错误类型显示更友好的提示
      if (error.includes('密码错误') || error.includes('账号或密码错误') || error.includes('用户名或密码错误')) {
        toast.error('账号或密码错误，请重新输入', { 
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else if (error.includes('不存在')) {
        toast.error('账号不存在，请检查输入或联系管理员');
      } else if (error.includes('服务器')) {
        toast.error('服务器连接异常，请稍后再试');
      } else {
        toast.error('登录失败，请检查您的输入或联系客服');
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  
  return (
    <div className="agent-login">
      <div className="agent-login-container">
        <div className="agent-login-image">
          <img src={Loginpic} alt="Login background" />
        </div>
        <div className="agent-login-form">
          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
          <div className="title">
            <img src={LoginLogo} alt="Logo" />
          </div>
          
          {error && (
            <div className="error-message">
              <strong>登录失败：</strong> {error}
              {error.includes('密码错误') && (
                <div className="error-hint">
                  <strong>提示：</strong> 如果您最近修改过密码，请使用新密码登录。如果您忘记了密码，请联系客服重置。
                </div>
              )}
              {error.includes('账号或密码错误') && (
                <div className="error-hint">
                  <strong>提示：</strong> 请检查您的输入是否正确。如果您忘记了密码，可以联系客服重置。
                </div>
              )}
            </div>
          )}
          
          {redirectMessage && (
            <div className="info-message">
              {redirectMessage}
            </div>
          )}
          
          
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-item">
              <div className="input-container">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="用户名"
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-item">
              <div className="input-container">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="密码"
                  className="form-input"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-form-button" 
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          
          
        </div>
      </div>
    </div>
  );
};

export default AgentLogin; 