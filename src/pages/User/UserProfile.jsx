import React, { useState, useEffect } from 'react';
import './User.css';
import { STORAGE_KEYS } from '../../utils/constants';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile, updateProfile, logout } from '../../store/slices/authSlice';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Nav, Tab, Badge, InputGroup, FormControl, Dropdown, ProgressBar } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaMoneyBillWave, FaClipboardList, 
         FaTags, FaInfoCircle, FaDownload, FaFilter, FaSearch, FaCalendarAlt, FaLock, FaShare, FaCopy, FaGift } from 'react-icons/fa';
import { getCreditTransactionHistory } from '../../services/agentService';
import { updatePassword, getUserCreditInfo } from '../../services/userService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { toast } from 'react-hot-toast';

// 默认头像URL
const DEFAULT_AVATAR = 'https://via.placeholder.com/150';

// 交易类型映射
const transactionTypes = {
  topup: '充值',
  payment: '支付',
  refund: '退款',
  adjustment: '调整'
};

// 交易类型对应的颜色
const transactionTypeColors = {
  topup: 'success',
  payment: 'primary',
  refund: 'warning',
  adjustment: 'info'
};

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const isAgent = user?.role === 'agent' || localStorage.getItem('userType') === 'agent';
  
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    avatar: DEFAULT_AVATAR,
    discountRate: 0,
    balance: 0,
    ordersCount: 0,
    inviteCode: '',
    totalEarnedCredits: 0
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    company: ''
  });
  
  // 添加交易记录状态
  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState({
    type: '',
    startDate: null,
    endDate: null
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('profile');
  
  // 添加一个ref来跟踪是否已经发送过请求
  const hasLoadedData = React.useRef(false);
  
  // 添加一个ref来跟踪交易记录是否已经加载
  const hasLoadedTransactions = React.useRef(false);
  
  // 添加密码修改状态
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  
  // 新增邀请码复制状态
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  
  // 获取用户信息
  useEffect(() => {
    if (isAuthenticated && !hasLoadedData.current) {
      fetchUserData();
      hasLoadedData.current = true;
    }
  }, [isAuthenticated]);
  
  // 当组件卸载时重置状态
  useEffect(() => {
    return () => {
      hasLoadedData.current = false;
      hasLoadedTransactions.current = false;
    };
  }, []);
  
  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        company: user.companyName || '',
        avatar: DEFAULT_AVATAR, // 使用默认头像
        discountRate: user.discountRate || localStorage.getItem('discountRate') || 0,
        balance: user.balance || 0,
        ordersCount: user.ordersCount || 0,
        inviteCode: user.inviteCode || '',
        totalEarnedCredits: user.totalEarnedCredits || 0
      });
      
      setFormData({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        company: user.companyName || ''
      });
    }
  }, [user]);
  
  const fetchUserData = async () => {
    if (fetchLoading) return; // 避免重复请求
    
    setFetchLoading(true);
    try {
      // 尝试从API获取最新用户信息
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) throw new Error('未找到认证令牌');
      
      const apiUrl = isAgent 
        ? `/api/agent/profile` 
        : `/api/user/profile`;
      
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let creditInfo = { balance: 0, totalEarned: 0 };
      
      // 如果是普通用户，获取积分信息
      if (!isAgent) {
        try {
          const creditResponse = await getUserCreditInfo();
          if (creditResponse && creditResponse.code === 1 && creditResponse.data) {
            creditInfo = creditResponse.data;
            console.info("已获取用户积分信息", creditInfo);
          }
        } catch (creditError) {
          console.error('获取用户积分信息失败', creditError);
        }
      }
      
      if (response.data && response.data.code === 1) {
        const profileData = response.data.data;
        
        // 如果是首次加载才更新Redux状态，避免循环
        if (!hasLoadedData.current) {
          dispatch(fetchUserProfile());
        }
        
        // 更新本地状态
        setUserData({
          firstName: profileData.first_name || profileData.firstName || '',
          lastName: profileData.last_name || profileData.lastName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          company: isAgent ? profileData.companyName || '' : '',
          avatar: DEFAULT_AVATAR, // 使用默认头像
          discountRate: isAgent ? profileData.discountRate || 0 : 0,
          balance: isAgent ? profileData.balance || 0 : creditInfo.balance || 0,
          ordersCount: profileData.ordersCount || 0,
          inviteCode: profileData.inviteCode || '',
          totalEarnedCredits: creditInfo.totalEarned || 0,
          referredBy: creditInfo.referredBy || null,
          referrerUsername: creditInfo.referrerUsername || '',
          referralsCount: creditInfo.referralsCount || 0
        });
        
        setFormData({
          firstName: profileData.first_name || profileData.firstName || '',
          lastName: profileData.last_name || profileData.lastName || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          company: isAgent ? profileData.companyName || '' : ''
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果API请求失败，尝试使用本地存储的数据
      const storedUser = JSON.parse(localStorage.getItem('user')) || {};
      
      setUserData({
        firstName: storedUser.first_name || storedUser.firstName || '',
        lastName: storedUser.last_name || storedUser.lastName || '',
        email: storedUser.email || '',
        phone: storedUser.phone || '',
        address: storedUser.address || '',
        company: isAgent ? storedUser.companyName || '' : '',
        avatar: DEFAULT_AVATAR, // 使用默认头像
        discountRate: isAgent ? localStorage.getItem('discountRate') || 0 : 0,
        balance: storedUser.balance || 0,
        ordersCount: storedUser.ordersCount || 0,
        inviteCode: storedUser.inviteCode || '',
        totalEarnedCredits: storedUser.totalEarnedCredits || 0,
        referredBy: storedUser.referredBy || null,
        referrerUsername: storedUser.referrerUsername || '',
        referralsCount: storedUser.referralsCount || 0
      });
      
      setFormData({
        firstName: storedUser.first_name || storedUser.firstName || '',
        lastName: storedUser.last_name || storedUser.lastName || '',
        phone: storedUser.phone || '',
        address: storedUser.address || '',
        company: isAgent ? storedUser.companyName || '' : ''
      });
    } finally {
      setFetchLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      // 准备更新数据
      const updateData = { 
        ...formData,
        // 确保API请求使用正确的字段名称
        first_name: formData.firstName,
        last_name: formData.lastName 
      };
      
      // 调用API更新用户信息
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) throw new Error('未找到认证令牌');
      
      const apiUrl = isAgent 
        ? `/api/agent/profile` 
        : `/api/users/profile`;
      
      const response = await axios.put(apiUrl, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.code === 1) {
        // 更新Redux状态
        dispatch(updateProfile(response.data.data));
        
        // 更新本地状态
        setUserData(prev => ({
          ...prev,
          ...formData
        }));
        
        setMessage({ text: '个人资料更新成功', type: 'success' });
        setIsEditing(false);
      } else {
        throw new Error(response.data?.msg || '更新失败');
      }
    } catch (err) {
      console.error('更新个人资料失败:', err);
      setMessage({ text: err.message || '更新失败，请稍后再试', type: 'danger' });
    }
  };
  
  const handleLogout = () => {
    // 先清除认证信息
    dispatch(logout());
    
    // 清除redux存储的用户状态
    dispatch({ type: 'auth/logout' });
    
    // 显示退出成功消息
    toast.success('您已成功退出登录');
    
    // 延迟一点重定向到首页，确保清除操作完成
    setTimeout(() => {
      // 使用replace而不是href，避免回退到登录状态
      window.location.replace('/');
    }, 300);
  };
  
  // 渲染用户信息卡片
  const renderUserInfoCard = () => (
    <Card className="mb-4">
      <Card.Header className={`${isAgent ? 'bg-info' : 'bg-primary'} text-white d-flex justify-content-between align-items-center`}>
        <h5 className="mb-0">{isAgent ? '代理商账户信息' : '个人资料'}</h5>
        {!isEditing && (
          <Button 
            variant="light" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            编辑资料
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {message.text && (
          <Alert variant={message.type} className="mb-3">
            {message.text}
          </Alert>
        )}
        
        {isEditing ? (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>名</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>姓</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>电话</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>邮箱</Form.Label>
                  <Form.Control
                    type="email"
                    value={userData.email}
                    disabled
                  />
                  <Form.Text className="text-muted">
                    邮箱地址不可修改
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>地址</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              {isAgent && (
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>公司名称</Form.Label>
                    <Form.Control
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              )}
              
              <Col md={12}>
                <div className="d-flex justify-content-end">
                  <Button 
                    variant="secondary" 
                    className="me-2" 
                    onClick={() => setIsEditing(false)}
                  >
                    取消
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? '保存中...' : '保存'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row>
            <Col md={12} className="text-center mb-4">
              <img 
                src={DEFAULT_AVATAR} 
                alt={isAgent ? "代理商头像" : "用户头像"}
                className="user-avatar rounded-circle" 
                style={{ width: '100px', height: '100px' }}
              />
              <h4 className="mt-2">{userData.firstName} {userData.lastName}</h4>
              <p className="text-muted">
                {isAgent ? '代理商账户' : '个人账户'} 
                {isAgent && userData.discountRate && (
                  <span className="ms-2 badge bg-success">
                    折扣: {(userData.discountRate * 100).toFixed(0)}%
                  </span>
                )}
              </p>
            </Col>
            
            <Col md={12}>
              <ul className="list-group">
                <li className="list-group-item d-flex align-items-center">
                  <FaEnvelope className={`${isAgent ? 'text-info' : 'text-primary'} me-2`} />
                  <div>
                    <small className="text-muted">邮箱</small>
                    <p className="mb-0">{userData.email}</p>
                  </div>
                </li>
                
                <li className="list-group-item d-flex align-items-center">
                  <FaPhone className={`${isAgent ? 'text-info' : 'text-primary'} me-2`} />
                  <div>
                    <small className="text-muted">电话</small>
                    <p className="mb-0">{userData.phone || '未设置'}</p>
                  </div>
                </li>
                
                <li className="list-group-item d-flex align-items-center">
                  <FaMapMarkerAlt className={`${isAgent ? 'text-info' : 'text-primary'} me-2`} />
                  <div>
                    <small className="text-muted">地址</small>
                    <p className="mb-0">{userData.address || '未设置'}</p>
                  </div>
                </li>
                
                {isAgent && userData.company && (
                  <li className="list-group-item d-flex align-items-center">
                    <FaBuilding className="text-info me-2" />
                    <div>
                      <small className="text-muted">公司</small>
                      <p className="mb-0">{userData.company}</p>
                    </div>
                  </li>
                )}
                
                {isAgent && (
                  <li className="list-group-item d-flex align-items-center">
                    <FaTags className="text-info me-2" />
                    <div>
                      <small className="text-muted">折扣率</small>
                      <p className="mb-0">{(userData.discountRate * 100).toFixed(0)}%</p>
                    </div>
                  </li>
                )}
              </ul>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
  
  // 渲染代理商特定信息
  const renderAgentStats = () => {
    if (!isAgent) return null;
    
    return (
      <Card className="mb-4">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">代理商数据</h5>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4} className="text-center mb-3">
              <div className="d-flex flex-column align-items-center">
                <div className="stat-circle mb-2 bg-primary d-flex align-items-center justify-content-center">
                  <FaMoneyBillWave size={24} className="text-white" />
                </div>
                <h3>${userData.balance?.toFixed(2) || '0.00'}</h3>
                <p className="text-muted">信用额度</p>
              </div>
            </Col>
            
            <Col md={4} className="text-center mb-3">
              <div className="d-flex flex-column align-items-center">
                <div className="stat-circle mb-2 bg-success d-flex align-items-center justify-content-center">
                  <FaClipboardList size={24} className="text-white" />
                </div>
                <h3>{userData.ordersCount || '0'}</h3>
                <p className="text-muted">订单总数</p>
              </div>
            </Col>
            
            <Col md={4} className="text-center mb-3">
              <div className="d-flex flex-column align-items-center">
                <div className="stat-circle mb-2 bg-warning d-flex align-items-center justify-content-center">
                  <FaTags size={24} className="text-white" />
                </div>
                <h3>{(userData.discountRate * 100).toFixed(0)}%</h3>
                <p className="text-muted">折扣比例</p>
              </div>
            </Col>
          </Row>
          
          <div className="mt-4">
            <h5 className="mb-3">代理商权益</h5>
            <Alert variant="info">
              <div className="d-flex align-items-start">
                <FaInfoCircle className="mt-1 me-2" />
                <div>
                  <p className="mb-2">作为塔斯马尼亚旅游的注册代理商，您享有以下权益：</p>
                  <ul className="mb-0">
                    <li>所有产品享受{(userData.discountRate * 100).toFixed(0)}%折扣</li>
                    <li>可使用账户信用额度支付订单</li>
                    <li>专属客户经理一对一服务</li>
                    <li>免费行程定制</li>
                    <li>优先预订热门行程的权限</li>
                  </ul>
                </div>
              </div>
            </Alert>
          </div>
          
          <div className="mt-4">
            <h5 className="mb-3">月度订单数据</h5>
            <div className="bg-light p-3 rounded text-center">
              <p className="text-muted">暂无月度数据，继续加油！</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  // 添加获取交易记录的函数
  const fetchTransactions = async () => {
    if (!isAgent || transactionLoading) return;
    
    setTransactionLoading(true);
    try {
      // 构建查询参数
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize
      };
      
      // 添加过滤条件
      if (transactionFilter.type) {
        params.transactionType = transactionFilter.type;
      }
      
      if (transactionFilter.startDate) {
        params.startDate = moment(transactionFilter.startDate).format('YYYY-MM-DD');
      }
      
      if (transactionFilter.endDate) {
        params.endDate = moment(transactionFilter.endDate).format('YYYY-MM-DD');
      }
      
      // 调用API获取交易记录
      const response = await getCreditTransactionHistory(null, params);
      
      if (response && response.code === 1) {
        setTransactions(response.data.records || []);
        setPagination({
          ...pagination,
          total: response.data.total || 0
        });
        // 标记已加载
        hasLoadedTransactions.current = true;
      } else {
        console.error('获取交易记录失败:', response);
      }
    } catch (error) {
      console.error('获取交易记录异常:', error);
    } finally {
      setTransactionLoading(false);
    }
  };
  
  // 处理过滤器变化
  const handleFilterChange = (field, value) => {
    setTransactionFilter({
      ...transactionFilter,
      [field]: value
    });
    
    // 重置到第一页
    setPagination({
      ...pagination,
      page: 1
    });
  };
  
  // 处理页码变化
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };
  
  // 在初始加载和过滤条件变化时获取交易记录
  useEffect(() => {
    if (isAgent && activeTab === 'creditManagement') {
      // 当页码变化或过滤条件变化时，重新获取数据
      // 但如果是初次加载，且已经加载过数据，则不再重复请求
      if (hasLoadedTransactions.current && 
          pagination.page === 1 && 
          !transactionFilter.type && 
          !transactionFilter.startDate && 
          !transactionFilter.endDate) {
        return;
      }
      fetchTransactions();
    }
  }, [isAgent, activeTab, pagination.page, transactionFilter]);
  
  // 将Tab切换处理器添加到Tab.Container
  const handleTabChange = (key) => {
    setActiveTab(key);
    
    // 如果切换到交易记录选项卡并且之前没有加载过交易记录
    if (key === 'transactions' && !hasLoadedTransactions.current) {
      fetchTransactions();
      hasLoadedTransactions.current = true;
    }
    
    // 如果切换到密码修改选项卡，重置表单和消息
    if (key === 'password') {
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordMessage({ text: '', type: '' });
    }
  };
  
  // 处理密码修改输入变化
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // 处理密码修改提交
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ text: '请填写所有密码字段', type: 'danger' });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ text: '新密码和确认密码不匹配', type: 'danger' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ text: '新密码长度不能少于6位', type: 'danger' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage({ text: '', type: '' });
    
    try {
      // 调用API修改密码
      const response = await updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.code === 1) {
        setPasswordMessage({ text: '密码修改成功，即将跳转到登录页面...', type: 'success' });
        
        // 清空表单
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 显示成功提示
        toast.success('密码修改成功，请重新登录');
        
        // 延迟跳转到登录页面
        setTimeout(() => {
          // 使用replace而不是href，避免回退到已登录状态
          window.location.replace('/login');
        }, 2000);
      } else {
        setPasswordMessage({ text: response.msg || '密码修改失败', type: 'danger' });
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      setPasswordMessage({ 
        text: error.response?.data?.msg || error.message || '密码修改失败，请稍后再试', 
        type: 'danger' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  // 渲染密码修改表单
  const renderPasswordForm = () => (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white">
        <h5 className="mb-0">
          <FaLock className="me-2" />
          修改密码
        </h5>
      </Card.Header>
      <Card.Body>
        {passwordMessage.text && (
          <Alert variant={passwordMessage.type}>
            {passwordMessage.text}
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
              placeholder="请输入新密码 (至少6位)"
              required
              minLength={6}
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
              minLength={6}
            />
          </Form.Group>
          
          <div className="text-end">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  处理中...
                </>
              ) : '修改密码'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
  
  // 更新信用管理面板渲染
  const renderCreditManagement = () => (
    <Card className="mb-4">
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">信用额度管理</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-4 p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">当前可用信用额度</h4>
              <p className="text-muted mb-0">您可以用于预订的信用额度</p>
            </div>
            <h3 className="text-success mb-0">${userData.balance?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>
        
        <div className="d-flex justify-content-between align-items-center my-4">
          <h6 className="mb-0">交易记录</h6>
        </div>
        
        {/* 过滤器 */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>交易类型</Form.Label>
              <Form.Select 
                value={transactionFilter.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">全部类型</option>
                <option value="topup">充值</option>
                <option value="payment">支付</option>
                <option value="refund">退款</option>
                <option value="adjustment">调整</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>开始日期</Form.Label>
              <DatePicker
                selected={transactionFilter.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="选择开始日期"
                maxDate={transactionFilter.endDate || new Date()}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>结束日期</Form.Label>
              <DatePicker
                selected={transactionFilter.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="选择结束日期"
                minDate={transactionFilter.startDate}
                maxDate={new Date()}
              />
            </Form.Group>
          </Col>
        </Row>
        
        {/* 交易记录表格 */}
        <div className="table-responsive">
          {transactionLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" size="sm" />
              <p className="mt-2 mb-0">加载交易记录中...</p>
            </div>
          ) : (
            <>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>交易编号</th>
                    <th>交易类型</th>
                    <th>金额</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{moment(transaction.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                        <td>{transaction.transactionNo}</td>
                        <td>
                          <Badge bg={transactionTypeColors[transaction.transactionType] || 'secondary'}>
                            {transactionTypes[transaction.transactionType] || transaction.transactionType}
                          </Badge>
                        </td>
                        <td className={transaction.transactionType === 'payment' ? 'text-danger' : 'text-success'}>
                          {transaction.transactionType === 'payment' ? '-' : '+'}{transaction.amount?.toFixed(2)}
                        </td>
                        <td>{transaction.note || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">暂无交易记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* 分页控件 */}
              {pagination.total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    共 {pagination.total} 条记录
                  </div>
                  <div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      上一页
                    </Button>
                    <span className="mx-2">
                      第 {pagination.page} 页
                    </span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
  
  // 添加复制邀请码到剪贴板的函数
  const copyInviteCode = () => {
    if (!userData.inviteCode) return;
    
    navigator.clipboard.writeText(userData.inviteCode)
      .then(() => {
        setInviteCodeCopied(true);
        toast.success('邀请码已复制到剪贴板');
        setTimeout(() => setInviteCodeCopied(false), 3000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        toast.error('复制失败，请手动复制');
      });
  };
  
  // 创建邀请链接
  const getInviteLink = () => {
    if (!userData.inviteCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?inviteCode=${userData.inviteCode}`;
  };
  
  // 复制邀请链接到剪贴板
  const copyInviteLink = () => {
    const inviteLink = getInviteLink();
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        toast.success('邀请链接已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        toast.error('复制失败，请手动复制');
      });
  };
  
  // 添加邀请码和返利组件
  const renderInviteAndReferralSection = () => {
    if (isAgent) return null; // 代理商不显示此部分
    
    return (
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <FaGift className="me-2" /> 我的邀请与返利
          </h5>
        </Card.Header>
        <Card.Body>
          {userData.inviteCode ? (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>我的邀请码</h6>
                  <InputGroup>
                    <FormControl
                      value={userData.inviteCode}
                      readOnly
                      className="bg-light"
                    />
                    <Button 
                      variant={inviteCodeCopied ? "success" : "outline-primary"}
                      onClick={copyInviteCode}
                    >
                      {inviteCodeCopied ? "已复制" : "复制"} <FaCopy className="ms-1" />
                    </Button>
                  </InputGroup>
                </Col>
                <Col md={6}>
                  <h6>累计获得积分</h6>
                  <h3 className="text-primary">{userData.totalEarnedCredits || 0}</h3>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={6}>
                  <h6>我的积分余额</h6>
                  <h3 className="text-success">{userData.balance?.toFixed(2) || "0.00"}</h3>
                  <small className="text-muted">可用于抵扣订单金额</small>
                </Col>
                <Col md={6}>
                  <h6>我的推荐人</h6>
                  {userData.referredBy ? (
                    <p>{userData.referrerUsername || "用户#" + userData.referredBy}</p>
                  ) : (
                    <p className="text-muted">无推荐人</p>
                  )}
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6>我推荐的用户</h6>
                    <Badge bg="primary" pill>
                      {userData.referralsCount || 0}
                    </Badge>
                  </div>
                  <ProgressBar 
                    variant="success" 
                    now={Math.min((userData.referralsCount || 0) * 10, 100)}
                    label={`${userData.referralsCount || 0}人`}
                    className="mb-2"
                  />
                  <small className="text-muted">邀请更多好友，获得更多奖励！</small>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6>分享邀请链接</h6>
                <InputGroup>
                  <FormControl
                    value={getInviteLink()}
                    readOnly
                    className="bg-light"
                  />
                  <Button 
                    variant="outline-primary"
                    onClick={copyInviteLink}
                  >
                    复制链接 <FaShare className="ms-1" />
                  </Button>
                </InputGroup>
              </div>
              
              <Alert variant="info" className="mt-4">
                <FaInfoCircle className="me-2" />
                <div>
                  <p className="mb-2"><strong>多级推荐返利规则</strong></p>
                  <ul className="mb-0">
                    <li>您邀请的好友注册并完成订单后，您将获得订单金额<strong>5%</strong>的积分奖励</li>
                    <li>您邀请的好友再邀请其他用户注册并完成订单，您将获得订单金额<strong>2%</strong>的积分奖励</li>
                    <li>积分可用于抵扣未来订单金额</li>
                    <li>邀请越多好友，获得的奖励越多！</li>
                  </ul>
                </div>
              </Alert>
            </div>
          ) : (
            <Alert variant="warning">
              <FaInfoCircle className="me-2" />
              未找到您的邀请码信息，请联系客服。
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  if (fetchLoading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">正在加载用户信息...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isAgent ? '代理商中心' : '用户中心'}</h2>
        <Button variant="outline-danger" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
      
      <Tab.Container id="profile-tabs" defaultActiveKey={isAgent ? "agentInfo" : "profile"} onSelect={handleTabChange}>
        <Row>
          <Col md={3}>
            <Nav variant="pills" className="flex-column mb-4">
              <Nav.Item>
                <Nav.Link eventKey="profile">
                  <FaUser className="me-2" />
                  {isAgent ? '账户信息' : '个人资料'}
                </Nav.Link>
              </Nav.Item>
              {isAgent && (
                <>
                  <Nav.Item>
                    <Nav.Link eventKey="agentInfo">
                      <FaBuilding className="me-2" />
                      代理商数据
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="creditManagement">
                      <FaMoneyBillWave className="me-2" />
                      信用额度管理
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="orderHistory">
                      <FaClipboardList className="me-2" />
                      订单管理
                    </Nav.Link>
                  </Nav.Item>
                </>
              )}
              <Nav.Item>
                <Nav.Link eventKey="password">
                  <FaLock className="me-2" />
                  修改密码
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          
          <Col md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="profile">
                {message.text && <Alert variant={message.type}>{message.text}</Alert>}
                {renderUserInfoCard()}
                {renderInviteAndReferralSection()}
                {isAgent && renderAgentStats()}
              </Tab.Pane>
              
              {isAgent && (
                <>
                  <Tab.Pane eventKey="agentInfo">
                    {renderAgentStats()}
                  </Tab.Pane>
                  <Tab.Pane eventKey="creditManagement">
                    {renderCreditManagement()}
                  </Tab.Pane>
                  <Tab.Pane eventKey="orderHistory">
                    <Card className="mb-4">
                      <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">订单管理</h5>
                      </Card.Header>
                      <Card.Body>
                        <div className="text-center py-5">
                          <h5 className="text-muted">订单数据将在这里显示</h5>
                          <p>目前您可以在"我的订单"页面查看订单详情</p>
                          <Button as={Link} to="/orders" variant="outline-primary">
                            查看我的订单
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </>
              )}
              
              <Tab.Pane eventKey="password">
                {renderPasswordForm()}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default UserProfile; 