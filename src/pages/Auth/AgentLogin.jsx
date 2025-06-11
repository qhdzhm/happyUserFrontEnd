import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Alert, Spinner, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './Auth.css';

const AgentLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'agent' // 固定为代理商类型
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
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
      toast.error('请输入账号');
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
        userType: 'agent' // 始终使用agent类型登录接口
      };
      
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
    }
  };
  
  // 自动填充测试账号
  const fillTestAccount = (type) => {
    if (type === 'agent') {
      setFormData({
        username: 'agent1',
        password: '123456',
        userType: 'agent'
      });
    } else if (type === 'operator') {
      setFormData({
        username: 'operator1',
        password: '123456',
        userType: 'agent'  // 操作员使用agent登录接口
      });
    }
  };
  
  return (
    <div className="auth-container agent-login-page">
      <div className="auth-form-container">
        <h2>代理商登录</h2>
        
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
                <strong>提示：</strong> 请检查您的输入是否正确。如果您忘记了密码，可以联系客服重置。
              </div>
            )}
          </Alert>
        )}
        
        {redirectMessage && (
          <Alert variant="info">
            {redirectMessage}
          </Alert>
        )}
        
        {/* 测试账号信息 */}
        <div className="auth-message mb-3">
          <div className="mb-2">
            <strong>代理商主账号：</strong> agent1 / 123456
            <Button 
              variant="outline-success"
              size="sm"
              className="ms-2" 
              onClick={() => fillTestAccount('agent')}
            >
              填充
            </Button>
          </div>
          <div>
            <strong>操作员账号：</strong> operator1 / 123456
            <Button 
              variant="outline-secondary"
              size="sm"
              className="ms-2" 
              onClick={() => fillTestAccount('operator')}
            >
              填充
            </Button>
          </div>
          <small className="text-muted mt-2 d-block">
            代理商和操作员都通过此入口登录，系统会自动识别账号类型
          </small>
        </div>
        
        <Form onSubmit={handleSubmit} className="auth-form">
          <Form.Group className="mb-3">
            <Form.Label>账号</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="输入代理商账号或操作员账号"
              className="agent-input"
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
            variant="success" 
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
        </Form>
        
        <div className="auth-links mt-3">
          <p>
            需要成为代理商？ <Link to="/contact-us" state={{ subject: '代理商合作申请' }}>联系我们</Link>
          </p>
          <p>
            <Link to="/forgot-password">忘记密码？</Link>
          </p>
          <p>
            普通用户？ <Link to="/login">点击这里登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin; 