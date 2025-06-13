import React, { useState, useEffect, useRef } from 'react';
import { Button, Spinner, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { getWechatQrCodeUrl } from '../../services/wechatService';
import { QRCodeCanvas } from 'qrcode.react';
import './WechatLogin.css';
import { wechatLogin } from '../../services/wechatService';

const WechatLogin = ({ onLoginSuccess }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [scanStatus, setScanStatus] = useState('waiting'); // waiting, scanning, success, expired
  const checkIntervalRef = useRef(null);
  const stateRef = useRef(null);
  const dispatch = useDispatch();

  // 生成唯一的状态码
  const generateState = () => {
    return `wx_state_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  // 获取微信二维码
  const fetchQrCodeUrl = async () => {
    setLoading(true);
    setScanStatus('waiting');
    setError(null);
    
    try {
      // 生成并保存状态码
      stateRef.current = generateState();
      
      // 获取微信登录二维码URL
      const response = await getWechatQrCodeUrl();
      if (response && response.code === 1 && response.data) {
        // 在URL中替换state参数
        let url = response.data;
        if (url.includes('state=STATE')) {
          url = url.replace('state=STATE', `state=${stateRef.current}`);
        } else {
          url += `&state=${stateRef.current}`;
        }
        setQrCodeUrl(url);
        
        // 开始轮询检查登录状态
        startPollingLoginStatus();
      } else {
        setError('获取微信二维码失败，请稍后再试');
      }
    } catch (err) {
      setError('网络错误，无法获取微信二维码');
      console.error('获取微信二维码出错:', err);
    } finally {
      setLoading(false);
    }
  };

  // 开始轮询检查登录状态
  const startPollingLoginStatus = () => {
    // 清除之前的轮询
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    // 设置轮询间隔 (3秒)
    checkIntervalRef.current = setInterval(() => {
      // 这里应该调用后端API检查登录状态
      // 由于我们没有实际的后端检查，我们模拟这个过程
      // 实际项目中，你应该实现后端API来检查登录状态
      console.log('轮询检查微信登录状态...');
      
      // 在实际项目中，你应该使用类似代码：
      // checkWechatLoginStatus(stateRef.current).then(res => {
      //   if (res.code === 1) {
      //     if (res.data.status === 'scanning') {
      //       setScanStatus('scanning');
      //     } else if (res.data.status === 'authorized') {
      //       setScanStatus('success');
      //       handleLoginSuccess(res.data.code);
      //       clearInterval(checkIntervalRef.current);
      //     }
      //   }
      // });
    }, 3000);
    
    // 设置超时，2分钟后自动过期
    setTimeout(() => {
      if (scanStatus !== 'success') {
        setScanStatus('expired');
        clearInterval(checkIntervalRef.current);
      }
    }, 120000);
  };

  // 处理登录成功
  const handleLoginSuccess = async (code) => {
    try {
      // 直接调用微信登录API
      const response = await wechatLogin(code);
      
      if (response && response.code === 1) {
        // 登录成功，更新Redux状态
        const result = await dispatch(loginUser({
          code: code,
          userType: 'regular'
        }));
        
        if (result.meta.requestStatus === 'fulfilled') {
          // 关闭模态框
          setShowModal(false);
          
          // 调用onLoginSuccess回调
          if (onLoginSuccess) {
            onLoginSuccess();
          }
          
          // 显示成功提示
          console.log('微信登录成功');
        } else {
          setError('微信登录失败，请稍后再试');
          setScanStatus('waiting');
        }
      } else {
        setError('微信登录失败：' + (response.msg || '未知错误'));
        setScanStatus('waiting');
      }
    } catch (error) {
      console.error('微信登录出错:', error);
      setError('微信登录出错：' + error.message);
      setScanStatus('waiting');
    }
  };

  // 打开模态框并获取二维码
  const handleOpenModal = () => {
    setShowModal(true);
    fetchQrCodeUrl();
  };

  // 关闭模态框并清除状态
  const handleCloseModal = () => {
    setShowModal(false);
    setQrCodeUrl('');
    setScanStatus('waiting');
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
  };

  // 组件卸载时清除轮询
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // 处理URL中的微信授权码
  useEffect(() => {
    // 检查URL中是否有微信授权码
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state && state.startsWith('wx_state_')) {
      // 这是微信登录回调，处理登录
      handleLoginSuccess(code);
      
      // 清除URL中的参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  

  return (
    <>
      <Button 
        variant="success" 
        className="wechat-login-btn" 
        onClick={handleOpenModal}
      >
        <i className="fab fa-weixin"></i> 微信登录
      </Button>
      
      
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>微信扫码登录</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="success" />
              <p className="mt-2">正在获取二维码...</p>
            </div>
          ) : error ? (
            <div className="text-danger my-4">
              <p>{error}</p>
              <Button variant="outline-success" onClick={fetchQrCodeUrl}>
                重试
              </Button>
            </div>
          ) : (
            <div className="qrcode-container">
              {qrCodeUrl ? (
                <>
                  <div className="qrcode-wrapper">
                    <QRCodeCanvas 
                      value={qrCodeUrl} 
                      size={200} 
                      level="H" 
                      className={`qrcode ${scanStatus === 'expired' ? 'expired' : ''}`} 
                    />
                    {scanStatus === 'scanning' && (
                      <div className="scan-overlay">
                        <p>扫描成功</p>
                        <p>请在微信中确认登录</p>
                      </div>
                    )}
                    {scanStatus === 'success' && (
                      <div className="scan-overlay success">
                        <p>登录成功</p>
                        <Spinner animation="border" size="sm" />
                      </div>
                    )}
                    {scanStatus === 'expired' && (
                      <div className="scan-overlay expired">
                        <p>二维码已过期</p>
                        <Button variant="outline-success" size="sm" onClick={fetchQrCodeUrl}>
                          刷新
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-3">请使用微信扫一扫</p>
                  <p className="text-muted small">扫码登录更便捷，无需注册</p>
                </>
              ) : (
                <Button variant="success" onClick={fetchQrCodeUrl}>
                  获取微信二维码
                </Button>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            取消
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default WechatLogin; 