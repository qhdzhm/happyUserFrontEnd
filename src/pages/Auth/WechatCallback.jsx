import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { Spinner, Alert } from 'react-bootstrap';

const WechatCallback = () => {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('正在处理微信登录...');
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const processLogin = async () => {
      try {
        // 从URL获取微信授权码和状态码
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        // 验证是否有code和state
        if (!code) {
          setStatus('error');
          setMessage('未获取到微信授权码，请重试');
          return;
        }
        
        // 使用Redux执行登录
        const result = await dispatch(loginUser({ code, userType: 'regular' }));
        
        // 检查登录结果
        if (result.meta.requestStatus === 'fulfilled') {
          setStatus('success');
          setMessage('登录成功，正在跳转...');
          
          // 登录成功后跳转到首页或之前访问的页面
          const redirectTo = state && state.startsWith('redirect:') 
            ? state.replace('redirect:', '') 
            : '/';
          
          // 延迟1秒后跳转，以展示成功消息
          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          setMessage(result.payload || '微信登录失败，请重试');
        }
      } catch (error) {
        setStatus('error');
        setMessage('登录处理过程中发生错误: ' + (error.message || '未知错误'));
      }
    };
    
    processLogin();
  }, [dispatch, location, navigate]);

  return (
    <div className="wechat-callback-container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="text-center">
        {status === 'processing' && (
          <>
            <Spinner animation="border" variant="success" />
            <h3 className="mt-3">处理微信登录中</h3>
            <p className="text-muted">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <Alert variant="success">
            <h3>登录成功</h3>
            <p>{message}</p>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="danger">
            <h3>登录失败</h3>
            <p>{message}</p>
            <button 
              className="btn btn-outline-primary mt-3"
              onClick={() => navigate('/login', { replace: true })}
            >
              返回登录页
            </button>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default WechatCallback; 