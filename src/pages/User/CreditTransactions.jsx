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
  used: '积分使用'
};

// 交易类型对应的颜色
const transactionTypeColors = {
  referral_reward: 'success',
  order_reward: 'info',
  used: 'primary'
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
      const response = await getUserCreditInfo();
      if (response && response.code === 1 && response.data) {
        setCreditInfo(response.data);
      }
    } catch (error) {
      console.error('获取用户积分信息失败', error);
      setError('获取用户积分信息失败，请稍后重试');
    }
  };
  
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        setError('未找到认证令牌，请重新登录');
        return;
      }
      
      // 构建请求参数
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
      
      // 调用API获取交易记录
      const response = await axios.get('/api/user/credit/transactions', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.code === 1) {
        setTransactions(response.data.data || []);
      } else {
        setError(response.data?.msg || '获取交易记录失败');
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
  
  return (
    <Container className="py-5">
      <h2 className="mb-4">积分交易记录</h2>
      
      {/* 积分概览卡片 */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4} className="text-center border-end py-3">
              <h6 className="text-muted mb-2">当前积分余额</h6>
              <h3 className="text-success">{creditInfo.balance?.toFixed(2) || '0.00'}</h3>
            </Col>
            <Col md={4} className="text-center border-end py-3">
              <h6 className="text-muted mb-2">累计获得积分</h6>
              <h3 className="text-primary">{creditInfo.totalEarned?.toFixed(2) || '0.00'}</h3>
            </Col>
            <Col md={4} className="text-center py-3">
              <h6 className="text-muted mb-2">累计使用积分</h6>
              <h3>{creditInfo.totalUsed?.toFixed(2) || '0.00'}</h3>
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
                    <option value="referral_reward">推荐奖励</option>
                    <option value="order_reward">订单奖励</option>
                    <option value="used">积分使用</option>
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
                      <th>推荐级别</th>
                      <th>积分变动</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{moment(transaction.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                        <td>
                          <Badge bg={transactionTypeColors[transaction.type] || 'secondary'}>
                            {transactionTypes[transaction.type] || transaction.type}
                          </Badge>
                        </td>
                        <td>
                          {transaction.referenceId ? (
                            <Link to={`/orders/${transaction.referenceId}`}>
                              #{transaction.referenceId}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {transaction.level ? (
                            transaction.level === 1 ? '直接推荐' : '间接推荐'
                          ) : '-'}
                        </td>
                        <td className={transaction.amount > 0 ? 'text-success' : 'text-danger'}>
                          {transaction.amount > 0 ? (
                            <><FaArrowUp className="me-1" /> +{transaction.amount.toFixed(2)}</>
                          ) : (
                            <><FaArrowDown className="me-1" /> {transaction.amount.toFixed(2)}</>
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
                    邀请好友注册并完成订单可获得积分奖励！
                  </p>
                  <Link to="/user/profile">
                    <Button variant="primary">去邀请好友</Button>
                  </Link>
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