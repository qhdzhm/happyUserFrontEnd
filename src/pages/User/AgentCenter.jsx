import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './User.css';
import { getAgentCredit, updatePassword } from '../../services/agentService';
import { FaKey, FaLock } from 'react-icons/fa';

const AgentCenter = () => {
  const { user, userType } = useSelector(state => state.auth);
  const [profileInfo, setProfileInfo] = useState({
    id: '',
    username: '',
    // 代理商字段
    companyName: '',
    contactPerson: '',
    discountRate: 0,
    // 操作员字段
    name: '',
    agentId: '',
    agentName: '',
    // 共同字段
    phone: '',
    email: '',
    status: 1
  });
  
  // 初始化操作员状态 - 基于localStorage的备用判断
  const [isOperator, setIsOperator] = useState(() => {
    const userType = localStorage.getItem('userType');
    return userType === 'agent_operator' || userType === 'operator';
  });
  const [creditInfo, setCreditInfo] = useState({
    totalCredit: 0,
    availableCredit: 0,
    usedCredit: 0,
    isFrozen: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    orderCount: 0,
    totalSales: 0,
    savedAmount: 0
  });

  // Add password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Fetch profile information from the server
  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 详细的调试信息
        console.log('=== 代理商中心认证调试信息 ===');
        console.log('localStorage token:', localStorage.getItem('token'));
        console.log('localStorage userType:', localStorage.getItem('userType'));
        console.log('初始isOperator状态:', isOperator);
        console.log('localStorage username:', localStorage.getItem('username'));
        console.log('localStorage agentId:', localStorage.getItem('agentId'));
        console.log('localStorage operatorId:', localStorage.getItem('operatorId'));
        console.log('Redux user:', user);
        console.log('Redux user完整结构:', JSON.stringify(user, null, 2));
        console.log('Redux userType:', userType);
        
        // 检查Cookie认证
        const { shouldUseCookieAuth, isAuthenticated, getUserInfoFromCookie, getToken } = require('../../utils/auth');
        const useCookieAuth = shouldUseCookieAuth();
        console.log('AgentCenter - 认证模式:', useCookieAuth ? 'Cookie' : 'Token');
        console.log('认证状态:', isAuthenticated());
        
        // 构建请求配置
        const requestConfig = {
          withCredentials: true // 确保发送Cookie
        };
        
        if (!useCookieAuth) {
          // Token认证模式：添加Authorization头部
          const token = getToken();
          if (!token || token === 'cookie-auth-enabled') {
            setError('未登录或会话已过期，请重新登录');
            setIsLoading(false);
            return;
          }
          requestConfig.headers = { Authorization: `Bearer ${token}` };
          console.log('AgentCenter - 使用Token认证');
        } else {
          console.log('AgentCenter - 使用Cookie认证，依赖HttpOnly Cookie');
        }
        
        console.log('发送请求到 /api/agent/profile');
        
        // Fetch profile data
        const response = await axios.get('/api/agent/profile', requestConfig);
        
        console.log('API响应:', response.data);
        
        if (response.data.code === 1) {
          const profileData = response.data.data;
          
          // 根据后端返回的 userType 判断用户类型
          const isOperatorUser = profileData.userType === 'operator';
          setIsOperator(isOperatorUser);
          
          if (isOperatorUser) {
            // 操作员信息
            setProfileInfo({
              id: profileData.id,
              username: profileData.username || '',
              name: profileData.name || '',
              phone: profileData.phone || '',
              email: profileData.email || '',
              agentId: profileData.agentId || '',
              agentName: profileData.agentName || '未知代理商',
              status: profileData.status || 1,
              // 操作员不需要这些字段
              companyName: '',
              contactPerson: '',
              discountRate: 0
            });
          } else {
            // 代理商信息
            setProfileInfo({
              id: profileData.id,
              username: profileData.username || '',
              companyName: profileData.companyName || '',
              contactPerson: profileData.contactPerson || '',
              phone: profileData.phone || '',
              email: profileData.email || '',
              discountRate: profileData.discountRate || 0,
              status: profileData.status || 1,
              // 代理商不需要这些字段
              name: '',
              agentId: '',
              agentName: ''
            });
          }
          
          // 代理商和操作员都需要获取信用额度信息（操作员看主号的额度）
          try {
            const creditResponse = await getAgentCredit();
            if (creditResponse && creditResponse.code === 1) {
              setCreditInfo(creditResponse.data);
              console.log('获取信用额度信息成功:', creditResponse.data);
            }
          } catch (creditErr) {
            console.error('获取信用额度信息失败:', creditErr);
          }
          
          // 只有代理商才获取统计数据
          if (!isOperatorUser) {
            
            // 获取统计数据
            try {
              const statsConfig = {
                withCredentials: true
              };
              
              if (!useCookieAuth) {
                const token = getToken();
                if (token && token !== 'cookie-auth-enabled') {
                  statsConfig.headers = { Authorization: `Bearer ${token}` };
                }
              }
              
              const statsResponse = await axios.get('/api/agent/statistics', statsConfig);
              
              if (statsResponse.data.code === 1) {
                setStats(statsResponse.data.data);
              }
            } catch (statsErr) {
              console.error('获取统计数据失败:', statsErr);
            }
          }
        } else {
          console.error('API返回错误:', response.data);
          
          // API调用失败时，使用localStorage中的信息作为备用
          const userType = localStorage.getItem('userType');
          const username = localStorage.getItem('username');
          const agentId = localStorage.getItem('agentId');
          
          console.log('API调用失败，使用localStorage备用信息:', { userType, username, agentId });
          
          if (userType === 'agent_operator' || userType === 'operator') {
            setIsOperator(true);
            setProfileInfo({
              id: agentId || '',
              username: username || '',
              name: username || '',
              phone: '',
              email: '',
              agentId: agentId || '',
              agentName: '未知代理商',
              status: 1,
              companyName: '',
              contactPerson: '',
              discountRate: 0
            });
          } else {
            setIsOperator(false);
            setProfileInfo({
              id: agentId || '',
              username: username || '',
              companyName: '',
              contactPerson: '',
              phone: '',
              email: '',
              discountRate: 0,
              status: 1,
              name: '',
              agentId: '',
              agentName: ''
            });
          }
          
          setError(response.data.msg || response.data.message || '获取个人信息失败');
        }
      } catch (err) {
        console.error('Error fetching profile info:', err);
        console.error('错误详情:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        });
        
        // 网络错误时，也使用localStorage中的信息作为备用
        const userType = localStorage.getItem('userType');
        const username = localStorage.getItem('username');
        const agentId = localStorage.getItem('agentId');
        
        console.log('网络错误，使用localStorage备用信息:', { userType, username, agentId });
        
        if (userType === 'agent_operator' || userType === 'operator') {
          setIsOperator(true);
          setProfileInfo({
            id: agentId || '',
            username: username || '',
            name: username || '',
            phone: '',
            email: '',
            agentId: agentId || '',
            agentName: '未知代理商',
            status: 1,
            companyName: '',
            contactPerson: '',
            discountRate: 0
          });
        } else if (userType === 'agent') {
          setIsOperator(false);
          setProfileInfo({
            id: agentId || '',
            username: username || '',
            companyName: '',
            contactPerson: '',
            phone: '',
            email: '',
            discountRate: 0,
            status: 1,
            name: '',
            agentId: '',
            agentName: ''
          });
        }
        
        // 根据错误类型提供更具体的错误信息
        if (err.response?.status === 401) {
          setError('认证失败，请重新登录');
        } else if (err.response?.status === 403) {
          setError('权限不足，请确认您是代理商用户');
        } else if (err.response?.status === 404) {
          setError('API端点不存在，请联系技术支持');
        } else {
          setError('获取个人信息时出错: ' + (err.response?.data?.msg || err.response?.data?.message || err.message));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileInfo();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileInfo({
      ...profileInfo,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // 检查认证状态
      const { shouldUseCookieAuth, isAuthenticated, getCSRFToken } = require('../../utils/auth');
      const useCookieAuth = shouldUseCookieAuth();
      
      // 准备更新数据
      const updateData = {};
      
      if (isOperator) {
        // 操作员只能修改特定字段
        updateData.name = profileInfo.name;
        updateData.phone = profileInfo.phone;
        updateData.email = profileInfo.email;
      } else {
        // 代理商可以修改的字段
        updateData.companyName = profileInfo.companyName;
        updateData.contactPerson = profileInfo.contactPerson;
        updateData.phone = profileInfo.phone;
        updateData.email = profileInfo.email;
      }
      
      console.log('提交更新的个人信息:', updateData);
      
      // 构建请求配置
      const requestConfig = {
        withCredentials: true
      };
      
      if (!useCookieAuth) {
        // Token认证模式：添加Authorization头部
        const { getToken } = require('../../utils/auth');
        const token = getToken();
        
        if (!token || token === 'cookie-auth-enabled') {
          setError('未登录或会话已过期，请重新登录');
          setIsLoading(false);
          return;
        }
        
        requestConfig.headers = { Authorization: `Bearer ${token}` };
      }
      
      // Submit updated profile data
      const response = await axios.put('/api/agent/profile', updateData, requestConfig);
      
      if (response.data.code === 1) {
        toast.success('个人信息更新成功');
        setIsEditing(false);
      } else {
        setError(response.data.msg || response.data.message || '更新个人信息失败');
      }
    } catch (err) {
      console.error('Error updating profile info:', err);
      setError('更新个人信息时出错: ' + (err.response?.data?.msg || err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('新密码和确认密码不匹配');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    
    try {
      // Call API to change password
      const response = await updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response && response.code === 1) {
        setPasswordSuccess('密码修改成功');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('密码修改成功');
      } else {
        setPasswordError(response?.msg || '密码修改失败');
      }
    } catch (err) {
      console.error('修改密码失败:', err);
      setPasswordError(err.response?.data?.msg || err.message || '修改密码失败，请稍后再试');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">{isOperator ? '操作员中心' : '代理商中心'}</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row>
        {/* Profile information */}
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className={isOperator ? "bg-secondary text-white" : "bg-primary text-white"}>
              <h5 className="mb-0">{isOperator ? '操作员账户信息' : '代理商账户信息'}</h5>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">加载中...</span>
                  </div>
                  <p className="mt-2">正在加载数据...</p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>用户名</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={profileInfo.username}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        用户名不可修改
                      </Form.Text>
                    </Form.Group>
                    
                    {isOperator ? (
                      // 操作员特有字段
                      <Form.Group as={Col} md={6} className="mb-3">
                        <Form.Label>姓名</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profileInfo.name || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    ) : (
                      // 代理商特有字段
                      <Form.Group as={Col} md={6} className="mb-3">
                        <Form.Label>公司名称</Form.Label>
                        <Form.Control
                          type="text"
                          name="companyName"
                          value={profileInfo.companyName || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    )}
                  </Row>
                  
                  <Row>
                    {isOperator && (
                      // 操作员显示所属代理商
                      <Form.Group as={Col} md={6} className="mb-3">
                        <Form.Label>所属代理商</Form.Label>
                        <Form.Control
                          type="text"
                          value={profileInfo.agentName || ''}
                          disabled
                        />
                        <Form.Text className="text-muted">
                          您所属的代理商公司
                        </Form.Text>
                      </Form.Group>
                    )}
                  </Row>
                  
                  <Row>
                    {!isOperator && (
                      // 代理商特有字段
                      <Form.Group as={Col} md={6} className="mb-3">
                        <Form.Label>联系人</Form.Label>
                        <Form.Control
                          type="text"
                          name="contactPerson"
                          value={profileInfo.contactPerson || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </Form.Group>
                    )}
                    
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>电话</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={profileInfo.phone || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Row>
                  
                  <Row>
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>邮箱</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profileInfo.email || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <Form.Text className="text-muted">
                        您可以修改邮箱地址
                      </Form.Text>
                    </Form.Group>
                    
                    {!isOperator && (
                      // 只有代理商才显示折扣率
                      <Form.Group as={Col} md={6} className="mb-3">
                        <Form.Label>折扣率</Form.Label>
                        <Form.Control
                          type="text"
                          value={`${(profileInfo.discountRate * 100).toFixed(0)}%`}
                          disabled
                        />
                        <Form.Text className="text-muted">
                          折扣率由系统设置，不可修改
                        </Form.Text>
                      </Form.Group>
                    )}
                  </Row>
                  
                  <div className="d-flex justify-content-end mt-3">
                    {isEditing ? (
                      <>
                        <Button 
                          variant="outline-secondary" 
                          className="me-2"
                          onClick={handleCancel}
                        >
                          取消
                        </Button>
                        <Button 
                          variant={isOperator ? "secondary" : "primary"} 
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? '保存中...' : '保存'}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant={isOperator ? "secondary" : "primary"} 
                        onClick={() => setIsEditing(true)}
                      >
                        编辑
                      </Button>
                    )}
                  </div>
                  

                </Form>
              )}
            </Card.Body>
          </Card>
          
          {/* 修改密码部分 */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-success text-white d-flex align-items-center">
              <FaKey className="me-2" />
              <h5 className="mb-0">修改密码</h5>
            </Card.Header>
            <Card.Body>
              {passwordError && (
                <Alert variant="danger">
                  {passwordError}
                </Alert>
              )}
              
              {passwordSuccess && (
                <Alert variant="success">
                  {passwordSuccess}
                </Alert>
              )}
              
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>当前密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入当前密码"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>新密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入新密码（至少6位）"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>确认新密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="请再次输入新密码"
                    required
                  />
                </Form.Group>
                
                <Button 
                  type="submit" 
                  variant="success"
                  disabled={passwordLoading}
                  className="d-flex align-items-center"
                >
                  {passwordLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      修改中...
                    </>
                  ) : (
                    <>
                      <FaLock className="me-2" />
                      修改密码
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        {/* 统计数据 - 只有代理商才显示 */}
        {!isOperator && (
          <Col lg={4}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">代理商数据统计</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    订单总数 <Badge bg="primary">{stats.orderCount}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    总交易金额 <Badge bg="success">${stats.totalSales}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    折扣优惠总额 <Badge bg="warning">${stats.savedAmount}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    当前折扣率 <Badge bg="info">{(profileInfo.discountRate * 100).toFixed(0)}% OFF</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
            
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">账户状态</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    账户正常 
                    <Badge bg="success" className="rounded-pill">✓</Badge>
                  </ListGroup.Item>
                </ListGroup>
                <small className="text-muted">
                  您的账户状态正常，可以正常使用所有功能。
                </small>
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm">
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">信用额度状态</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    信用额度正常 
                    <Badge bg="success" className="rounded-pill">✓</Badge>
                  </ListGroup.Item>
                </ListGroup>
                <small className="text-muted">
                  您的信用额度状态正常，可以正常使用信用支付功能。
                </small>
                
                <div className="mt-3">
                  <p className="mb-1">总额度: <strong>${creditInfo.totalCredit !== null ? creditInfo.totalCredit : '***'}</strong></p>
                  <p className="mb-1">已用额度: <strong>${creditInfo.usedCredit !== null ? creditInfo.usedCredit : '***'}</strong></p>
                  <p className="mb-1">可用额度: <strong>${creditInfo.availableCredit !== null ? creditInfo.availableCredit : '***'}</strong></p>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">额度使用率</small>
                      <small className="text-muted">{(creditInfo.usagePercentage || 0).toFixed(1)}%</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className={`progress-bar ${
                          (creditInfo.usagePercentage || 0) > 80 ? 'bg-danger' : 
                          (creditInfo.usagePercentage || 0) > 60 ? 'bg-warning' : 'bg-success'
                        }`}
                        role="progressbar" 
                        style={{ width: `${Math.min(creditInfo.usagePercentage || 0, 100)}%` }}
                        aria-valuenow={creditInfo.usagePercentage || 0}
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                </div>
                
                <Link to="/credit-transactions" className="btn btn-outline-primary btn-sm mt-3">
                  查看明细
                </Link>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {/* 操作员信息展示 */}
        {isOperator && (
          <Col lg={4}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <h5 className="mb-0">操作员状态</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    账户正常 
                    <Badge bg="success" className="rounded-pill">✓</Badge>
                  </ListGroup.Item>
                </ListGroup>
                <small className="text-muted">
                  您的操作员账户状态正常，可以正常下单和查看订单。
                </small>
                
                {profileInfo.agentName && (
                  <div className="mt-3">
                    <p className="mb-1">所属代理商: <strong>{profileInfo.agentName}</strong></p>
                    <p className="mb-0 small text-muted">代理商ID: {profileInfo.agentId}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">操作员权限</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>✓ 查看产品价格</ListGroup.Item>
                  <ListGroup.Item>✓ 创建订单</ListGroup.Item>
                  <ListGroup.Item>✓ 查看订单状态</ListGroup.Item>
                  <ListGroup.Item>✓ 修改个人信息</ListGroup.Item>
                  <ListGroup.Item>✓ 查看主号额度使用率</ListGroup.Item>
                  <ListGroup.Item className="text-muted">✗ 查看代理商详细信息</ListGroup.Item>
                  <ListGroup.Item className="text-muted">✗ 查看具体额度金额</ListGroup.Item>
                </ListGroup>
                <small className="text-muted">
                  操作员享受代理商折扣，但无法查看敏感信息。
                </small>
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm mt-3">
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">主号额度状态</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>额度使用率</span>
                  <Badge bg={
                    (creditInfo.usagePercentage || 0) > 80 ? 'danger' : 
                    (creditInfo.usagePercentage || 0) > 60 ? 'warning' : 'success'
                  }>
                    {(creditInfo.usagePercentage || 0).toFixed(1)}%
                  </Badge>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className={`progress-bar ${
                      (creditInfo.usagePercentage || 0) > 80 ? 'bg-danger' : 
                      (creditInfo.usagePercentage || 0) > 60 ? 'bg-warning' : 'bg-success'
                    }`}
                    role="progressbar" 
                    style={{ width: `${Math.min(creditInfo.usagePercentage || 0, 100)}%` }}
                    aria-valuenow={creditInfo.usagePercentage || 0}
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <small className="text-muted mt-2 d-block">
                  {(creditInfo.usagePercentage || 0) > 80 ? 
                    '⚠️ 主号额度使用率较高，请注意控制消费' : 
                    (creditInfo.usagePercentage || 0) > 60 ? 
                    '⚠️ 主号额度使用率中等，建议关注使用情况' : 
                    '✅ 主号额度使用率正常'
                  }
                </small>

              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default AgentCenter; 