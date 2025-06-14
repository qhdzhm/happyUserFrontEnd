import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge, InputGroup } from 'react-bootstrap';
import { FaSearch, FaCalendarAlt, FaFilter, FaCreditCard, FaArrowUp, FaArrowDown, FaInfoCircle } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { STORAGE_KEYS } from '../../utils/constants';
import { getUserCreditInfo } from '../../services/userService';
import './User.css';

// 交易类型映射
const transactionTypes = {
  referral_reward: '推荐奖励',
  order_reward: '订单奖励',
  used: '积分使用',
  payment: '订单支付',
  topup: '充值还款',
  repayment: '还款',
  credit_payment: '信用支付',
  credit_topup: '信用充值'
};

// 交易类型对应的颜色
const transactionTypeColors = {
  referral_reward: 'success',
  order_reward: 'info',
  used: 'primary',
  payment: 'warning',
  topup: 'success',
  repayment: 'success',
  credit_payment: 'warning',
  credit_topup: 'success'
};

const CreditTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creditInfo, setCreditInfo] = useState({
    balance: 0,
    totalEarned: 0,
    totalUsed: 0
  });
  const [error, setError] = useState(null);
  
  // 过滤器状态
  const [filter, setFilter] = useState({
    type: '',
    startDate: null,
    endDate: null,
    searchText: ''
  });
  
  useEffect(() => {
    fetchCreditInfo();
    fetchTransactions();
  }, []);
  
  const fetchCreditInfo = async () => {
    try {
      // 检查是否为代理商用户，使用不同的API
      const userType = localStorage.getItem('userType');
      let response;
      
      if (userType === 'agent' || userType === 'agent_operator') {
        // 代理商使用专用API - 从cookie获取token
        const getCookieValue = (name) => {
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(row => row.startsWith(name + '='));
          return cookie ? cookie.split('=')[1] : null;
        };
        
        const { shouldUseCookieAuth, getToken } = require('../../utils/auth');
        const useCookieAuth = shouldUseCookieAuth();
        
        console.log('正在请求代理商信用API:', '/api/agent/credit/info');
        console.log('认证模式:', useCookieAuth ? 'Cookie' : 'Token');
        
        const headers = { 'Content-Type': 'application/json' };
        
        // 只在Token认证模式下添加Authorization头部
        if (!useCookieAuth) {
          const token = getToken();
          if (token && token !== 'cookie-auth-enabled') {
            headers.Authorization = `Bearer ${token}`;
            console.log('Token认证模式: 已添加Authorization头部');
          } else {
            console.warn('Token认证模式: 没有可用的token');
          }
        } else {
          console.log('Cookie认证模式: 依赖HttpOnly Cookie');
        }
        
        response = await axios.get('/api/agent/credit/info', {
          headers,
          withCredentials: true  // 确保发送cookie
        });
        if (response.data && response.data.code === 1 && response.data.data) {
          // 转换为前端需要的格式
          const data = response.data.data;
          setCreditInfo({
            balance: data.availableCredit || 0,
            totalEarned: data.totalCredit || 0,
            totalUsed: data.usedCredit || 0
          });
          
          // 如果有最近交易记录，直接使用
          if (data.recentTransactions && data.recentTransactions.length > 0) {
            console.log('使用API返回的最近交易记录:', data.recentTransactions);
            const convertedRecords = data.recentTransactions.map(record => {
              // 根据余额变化计算实际的变动方向
              const balanceChange = (record.balanceAfter || 0) - (record.balanceBefore || 0);
              return {
                id: record.id,
                createdAt: record.createdAt,
                type: record.transactionType,
                referenceId: record.bookingId,
                amount: balanceChange, // 使用余额变化作为显示金额
                description: record.description,
                transactionNo: record.transactionNo,
                originalAmount: record.amount // 保留原始金额
              };
            });
            console.log('转换后的交易记录:', convertedRecords);
            setTransactions(convertedRecords);
            setLoading(false);
            return; // 直接返回，不需要再次请求交易记录
          }
        }
      } else {
        // 普通用户使用原API
        response = await getUserCreditInfo();
        if (response && response.code === 1 && response.data) {
          setCreditInfo(response.data);
        }
      }
    } catch (error) {
      console.error('获取用户积分信息失败', error);
      setError('获取用户积分信息失败，请稍后重试');
    }
  };
  
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 检查用户是否已登录
      const userType = localStorage.getItem('userType');
      const isAuthenticated = localStorage.getItem('username'); // 检查基本登录状态
      
      if (!isAuthenticated) {
        setError('用户未登录，请重新登录');
        return;
      }
      
      // 检查是否为代理商用户
      let response;
      
      if (userType === 'agent' || userType === 'agent_operator') {
        // 代理商使用专用API
        const params = {
          page: 1,
          pageSize: 100
        };
        if (filter.type) {
          params.type = filter.type;
        }
        if (filter.startDate) {
          params.startDate = moment(filter.startDate).format('YYYY-MM-DD');
        }
        if (filter.endDate) {
          params.endDate = moment(filter.endDate).format('YYYY-MM-DD');
        }
        
        response = await axios.get('/api/agent/credit/transactions', {
          params,
          headers: { 
            'Content-Type': 'application/json'
          },
          withCredentials: true  // 确保发送cookie
        });
        
        if (response.data && response.data.code === 1) {
          // 转换代理商交易记录格式为前端格式
          const records = response.data.data?.records || [];
          const convertedRecords = records.map(record => {
            // 根据余额变化计算实际的变动方向
            const balanceChange = (record.balanceAfter || 0) - (record.balanceBefore || 0);
            return {
              id: record.id,
              createdAt: record.createdAt,
              type: record.transactionType || record.type,
              referenceId: record.bookingId || record.referenceId,
              amount: balanceChange, // 使用余额变化作为显示金额
              description: record.description,
              transactionNo: record.transactionNo,
              originalAmount: record.amount // 保留原始金额
            };
          });
          setTransactions(convertedRecords);
        } else {
          setError(response.data?.msg || '获取交易记录失败');
        }
      } else {
        // 普通用户使用原API
        const params = {};
        if (filter.type) {
          params.type = filter.type;
        }
        if (filter.startDate) {
          params.startDate = moment(filter.startDate).format('YYYY-MM-DD');
        }
        if (filter.endDate) {
          params.endDate = moment(filter.endDate).format('YYYY-MM-DD');
        }
        if (filter.searchText) {
          params.keyword = filter.searchText;
        }
        
        const { shouldUseCookieAuth, getToken } = require('../../utils/auth');
        const useCookieAuth = shouldUseCookieAuth();
        
        const headers = {};
        
        // 只在Token认证模式下添加Authorization头部
        if (!useCookieAuth) {
          const token = getToken();
          if (token && token !== 'cookie-auth-enabled') {
            headers.Authorization = `Bearer ${token}`;
          }
        }
        
        response = await axios.get('/api/user/credit/transactions', {
          params,
          headers,
          withCredentials: true  // 确保发送cookie
        });
        
        if (response.data && response.data.code === 1) {
          setTransactions(response.data.data || []);
        } else {
          setError(response.data?.msg || '获取交易记录失败');
        }
      }
    } catch (error) {
      console.error('获取交易记录异常', error);
      setError('获取交易记录异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFilter({
      ...filter,
      [field]: value
    });
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions();
  };
  
  const resetFilter = () => {
    setFilter({
      type: '',
      startDate: null,
      endDate: null,
      searchText: ''
    });
  };
  
  const userType = localStorage.getItem('userType');
  const isAgent = userType === 'agent' || userType === 'agent_operator';
  
  return (
    <Container className="py-5">
      <h2 className="mb-4">
        {isAgent ? '信用记录' : '积分交易记录'}
      </h2>
      
             
      
      {/* 积分/信用概览卡片 */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4} className="text-center border-end py-3">
              <h6 className="text-muted mb-2">
                {isAgent ? '可用信用额度' : '当前积分余额'}
              </h6>
              <h3 className="text-success">${creditInfo.balance?.toFixed(2) || '0.00'}</h3>
            </Col>
            <Col md={4} className="text-center border-end py-3">
              <h6 className="text-muted mb-2">
                {isAgent ? '总信用额度' : '累计获得积分'}
              </h6>
              <h3 className="text-primary">${creditInfo.totalEarned?.toFixed(2) || '0.00'}</h3>
            </Col>
            <Col md={4} className="text-center py-3">
              <h6 className="text-muted mb-2">
                {isAgent ? '已使用信用' : '累计使用积分'}
              </h6>
              <h3>${creditInfo.totalUsed?.toFixed(2) || '0.00'}</h3>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* 过滤器 */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>交易类型</Form.Label>
                  <Form.Select 
                    value={filter.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="">全部类型</option>
                    {localStorage.getItem('userType') === 'agent' || localStorage.getItem('userType') === 'agent_operator' ? (
                      <>
                        <option value="payment">订单支付</option>
                        <option value="topup">充值还款</option>
                        <option value="repayment">还款</option>
                      </>
                    ) : (
                      <>
                        <option value="referral_reward">推荐奖励</option>
                        <option value="order_reward">订单奖励</option>
                        <option value="used">积分使用</option>
                      </>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label>开始日期</Form.Label>
                  <DatePicker
                    selected={filter.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    placeholderText="开始日期"
                    maxDate={filter.endDate || new Date()}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label>结束日期</Form.Label>
                  <DatePicker
                    selected={filter.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    placeholderText="结束日期"
                    minDate={filter.startDate}
                    maxDate={new Date()}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Label>搜索</Form.Label>
                  <InputGroup>
                    <Form.Control
                      placeholder="搜索订单号或描述"
                      value={filter.searchText}
                      onChange={(e) => handleFilterChange('searchText', e.target.value)}
                    />
                    <Button variant="primary" type="submit">
                      <FaSearch />
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="mt-3 text-end">
              <Button 
                variant="outline-secondary" 
                className="me-2" 
                onClick={resetFilter}
              >
                重置
              </Button>
              <Button variant="primary" type="submit">
                <FaFilter className="me-1" />
                筛选
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* 交易记录表格 */}
      <Card className="shadow-sm">
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              <FaInfoCircle className="me-2" />
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">加载交易记录中...</p>
            </div>
          ) : (
            <>
              {transactions.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>交易类型</th>
                      <th>相关订单</th>
                      <th>{isAgent ? '业务类型' : '推荐级别'}</th>
                      <th>{isAgent ? '信用额度变动' : '积分变动'}</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{moment(transaction.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                        <td>
                          <Badge bg={transactionTypeColors[transaction.type] || 'secondary'}>
                            {transactionTypes[transaction.type] || transaction.type || (isAgent ? '信用支付' : '未知类型')}
                          </Badge>
                        </td>
                        <td>
                          {transaction.referenceId ? (
                            <Link to={`/orders/${transaction.referenceId}`} className="text-primary">
                              #{transaction.referenceId}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {isAgent ? (
                            transaction.businessType || '订单结算'
                          ) : (
                            transaction.level ? (
                              transaction.level === 1 ? '直接推荐' : '间接推荐'
                            ) : '-'
                          )}
                        </td>
                        <td className={transaction.amount > 0 ? 'text-success' : 'text-danger'}>
                          {transaction.amount > 0 ? (
                            <><FaArrowUp className="me-1" /> +${Math.abs(transaction.amount).toFixed(2)}</>
                          ) : (
                            <><FaArrowDown className="me-1" /> -${Math.abs(transaction.amount).toFixed(2)}</>
                          )}
                        </td>
                        <td>{transaction.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <FaCreditCard size={48} className="text-muted mb-3" />
                  <h5>暂无交易记录</h5>
                  <p className="text-muted">
                    {isAgent ? '还没有信用额度交易记录。使用信用支付订单后将在这里显示记录。' : '邀请好友注册并完成订单可获得积分奖励！'}
                  </p>
                  {!isAgent && (
                    <Link to="/user/profile">
                      <Button variant="primary">去邀请好友</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreditTransactions;