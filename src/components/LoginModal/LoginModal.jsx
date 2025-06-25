import React, { useState } from 'react';
import { Modal, Button, Tab, Nav, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './LoginModal.css';

const LoginModal = ({ 
  show, 
  onHide, 
  onLoginSuccess, 
  redirectUrl = null,
  message = "请登录后继续操作",
  allowGuestCheckout = false 
}) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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
    // 清除错误信息
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
        // 登录成功
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // 如果有重定向URL，跳转到指定页面
        if (redirectUrl) {
          navigate(redirectUrl);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    // 注册逻辑实现
    setError('注册功能正在开发中');
  };

  const handleGuestCheckout = () => {
    if (onLoginSuccess) {
      onLoginSuccess('guest');
    }
    onHide();
  };

  const handleGoToFullLogin = () => {
    onHide();
    navigate('/login', { 
      state: { 
        from: redirectUrl,
        message: message 
      } 
    });
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="md"
      className="login-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaUser className="me-2" />
          {activeTab === 'login' ? '登录账户' : '注册账户'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {message && (
          <Alert variant="info" className="mb-3">
            <FaLock className="me-2" />
            {message}
          </Alert>
        )}

        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="pills" className="justify-content-center mb-3">
            <Nav.Item>
              <Nav.Link eventKey="login">登录</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="register">注册</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="login">
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>用户名/邮箱</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="请输入用户名或邮箱"
                      required
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>密码</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="请输入密码"
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        className="me-2"
                      />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </Button>
              </Form>
            </Tab.Pane>

            <Tab.Pane eventKey="register">
              <Form onSubmit={handleRegister}>
                <Form.Group className="mb-3">
                  <Form.Label>用户名</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="请输入用户名"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>邮箱</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱地址"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>确认密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="请再次输入密码"
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  注册
                </Button>
              </Form>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>

      <Modal.Footer className="flex-column">
        {allowGuestCheckout && (
          <Button
            variant="outline-secondary"
            size="lg"
            className="w-100 mb-2"
            onClick={handleGuestCheckout}
          >
            继续游客下单
          </Button>
        )}
        
        <Button
          variant="link"
          onClick={handleGoToFullLogin}
          className="text-decoration-none"
        >
          前往完整登录页面
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LoginModal; 