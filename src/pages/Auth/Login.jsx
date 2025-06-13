import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Alert, Spinner, Button, Form } from 'react-bootstrap';
import WechatLogin from '../../components/WechatLogin/WechatLogin';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'regular' // 固定为普通用户
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  // 获取用户尝试访问的页面路径，如果没有则默认为首页
  const from = location.state?.from || '/';
  // 获取重定向消息
  const redirectMessage = location.state?.message || '';
  // 获取从详情页传递的旅游详情数据
  const tourDetails = location.state?.tourDetails || null;
  
  // 当认证状态改变时，重定向到之前的页面
  useEffect(() => {
    if (isAuthenticated) {
      // 普通用户登录成功后跳转到首页
      console.log('🏠 普通用户登录成功，跳转到首页');
      
      // 判断是否有旅游详情数据需要传递
      if (tourDetails) {
        // 将详情页的数据传递给预订页面
        navigate('/', { 
          replace: true,
          state: {
            ...tourDetails,
            // 保留其他可能的状态数据
            ...(location.state && location.state !== tourDetails ? 
               Object.entries(location.state)
                .filter(([key]) => key !== 'from' && key !== 'message' && key !== 'tourDetails')
                .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {}) 
               : {})
          } 
        });
      } else {
        // 普通用户统一跳转到首页
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, tourDetails, location.state]);
  
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
    
    try {
      // 确保用户类型正确
      const loginData = {
        username: formData.username,
        password: formData.password,
        userType: 'regular' // 固定为普通用户类型
      };
      
      // 分发登录action
      await dispatch(loginUser(loginData)).unwrap();
      
      // 触发登录状态变化事件，通知其他组件
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('loginStateChanged'));
      }, 100);
    } catch (error) {
      // 错误会被authSlice中的rejected处理器捕获并显示
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
        toast.error('用户账号不存在，请检查输入或注册新账号');
      } else if (error.includes('服务器')) {
        toast.error('服务器连接异常，请稍后再试');
      } else {
        toast.error('登录失败，请检查您的输入或联系客服');
      }
    }
  };
  
  
  
  // 处理登录成功后的回调
  const handleLoginSuccess = () => {
    // 登录成功后的处理逻辑已经在useEffect中实现
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>普通用户登录</h2>
        
        
        
        {error && (
          <Alert variant="danger">
            <strong>登录失败：</strong> {error}
            {error.includes('密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 如果您最近修改过密码，请使用新密码登录。如果您忘记了密码，请联系客服重置。
              </div>
            )}
            {error.includes('账号或密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 请检查您的输入是否正确。如果您忘记了密码，可以点击下方的"忘记密码"链接。
              </div>
            )}
            {error.includes('用户名或密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 请检查您的用户名和密码是否正确。如果您正在使用已修改的密码，请确保使用最新密码。
              </div>
            )}
            {error.includes('登录失败') && !error.includes('密码错误') && !error.includes('账号或密码错误') && !error.includes('用户名或密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 登录失败可能是由于用户名或密码错误，或者账号状态异常。如需帮助，请联系客服。
              </div>
            )}
            {error.includes('服务器') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 服务器连接异常，请稍后再试或联系客服。
              </div>
            )}
          </Alert>
        )}
        
        {redirectMessage && (
          <Alert variant="info">
            {redirectMessage}
          </Alert>
        )}
        
        
        
        <Form onSubmit={handleSubmit} className="auth-form">
          <Form.Group className="mb-3">
            <Form.Label>用户名</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="输入用户名"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>密码</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="输入密码"
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary" 
            className="w-100" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{' '}
                登录中...
              </>
            ) : '登录'}
          </Button>
          
          <div className="wechat-login-container mt-3">
            <div className="divider">
              <span>或</span>
            </div>
            <WechatLogin onLoginSuccess={handleLoginSuccess} />
          </div>
        </Form>
        
        <div className="auth-links mt-3">
          <p>
            还没有账号？ <Link to="/register" state={location.state}>立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 