import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { FaUser, FaTimes, FaGift, FaPercent, FaStar } from 'react-icons/fa';
import './MembershipModal.css';

const MembershipModal = ({ 
  show, 
  onHide, 
  onLoginSuccess, 
  onGuestContinue,
  message = "登录会员使用您在本店的积分，优惠券，余额等"
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await dispatch(loginUser({
        username: formData.username,
        password: formData.password,
        userType: 'regular'
      }));

      if (result.meta.requestStatus === 'fulfilled') {
        if (onLoginSuccess) {
          onLoginSuccess('user');
        }
        onHide();
      } else {
        setError(result.payload || '登录失败，请重试');
      }
    } catch (err) {
      setError('登录过程中出现错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    if (onGuestContinue) {
      onGuestContinue();
    }
    onHide();
  };

  const resetModal = () => {
    setShowLogin(false);
    setFormData({ username: '', password: '' });
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onHide();
  };

  if (showLogin) {
    return (
      <Modal 
        show={show} 
        onHide={handleClose} 
        centered 
        size="sm"
        className="membership-modal login-form"
      >
        <Modal.Header className="border-0 pb-0">
          <Button 
            variant="link" 
            onClick={handleClose}
            className="ms-auto p-0 text-muted"
          >
            <FaTimes size={20} />
          </Button>
        </Modal.Header>
        
        <Modal.Body className="px-4 pb-4">
          <div className="text-center mb-4">
            <div className="member-icon mb-3">
              <FaUser size={40} className="text-primary" />
            </div>
            <h5 className="mb-2">会员登录</h5>
            <p className="text-muted small">登录享受会员专属优惠</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="用户名/邮箱/手机号"
                className="form-control form-control-lg"
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="密码"
                className="form-control form-control-lg"
                required
              />
            </div>

            {error && (
              <Alert variant="danger" className="mb-3 py-2">
                <small>{error}</small>
              </Alert>
            )}

            <div className="d-flex justify-content-center">
              <Button
                type="submit"
                className="w-100 mb-3 btn-lg login-btn"
                disabled={loading}
                style={{ maxWidth: '300px' }}
              >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setShowLogin(false)}
                className="text-muted text-decoration-none"
              >
                返回
              </Button>
              <span className="mx-2 text-muted">|</span>
              <Button
                variant="link"
                onClick={handleGuestCheckout}
                className="text-muted text-decoration-none"
              >
                游客下单
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="sm"
      className="membership-modal"
    >
      <Modal.Header className="border-0 pb-0">
        <Button 
          variant="link" 
          onClick={handleClose}
          className="ms-auto p-0 text-muted"
        >
          <FaTimes size={20} />
        </Button>
      </Modal.Header>
      
      <Modal.Body className="px-4 pb-4">
        <div className="text-center mb-4">
          <div className="member-icon mb-3">
            <FaUser size={50} className="text-primary" />
          </div>
          <h4 className="mb-3">我是会员</h4>
          <p className="text-muted mb-4">{message}</p>
        </div>

        <div className="member-benefits mb-4">
          <div className="benefit-item d-flex align-items-center mb-2">
            <FaGift className="text-success me-2" />
            <small>积分兑换礼品</small>
          </div>
          <div className="benefit-item d-flex align-items-center mb-2">
            <FaPercent className="text-warning me-2" />
            <small>专享会员折扣</small>
          </div>
          <div className="benefit-item d-flex align-items-center">
            <FaStar className="text-info me-2" />
            <small>VIP客服服务</small>
          </div>
        </div>

        <div className="d-flex justify-content-center mb-3">
          <Button
            onClick={() => setShowLogin(true)}
            className="btn-lg login-btn"
            style={{ minWidth: '200px' }}
          >
            登录
          </Button>
        </div>

        <div className="d-flex justify-content-center">
          <Button
            variant="outline-secondary"
            onClick={handleGuestCheckout}
            className="btn-lg skip-btn"
            style={{ minWidth: '200px' }}
          >
            跳过
          </Button>
        </div>

        <div className="text-center mt-3">
          <Button
            variant="link"
            onClick={() => navigate('/register')}
            className="text-decoration-none small"
          >
            还没有账号？立即注册
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default MembershipModal; 