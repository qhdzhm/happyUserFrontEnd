import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Form,
  Button,
  Alert,
  Spinner,
  Modal
} from 'react-bootstrap';
import { FaArrowLeft, FaCreditCard, FaWeixin, FaAlipay, FaMoneyBillWave, FaCheckCircle, FaCoins, FaInfoCircle, FaRegMoneyBillAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

// 导入服务和工具
import { getOrderDetail } from '../../services/bookingService';
import { processPayment, processCreditPayment } from '../../services/paymentService';
import { getAgentCredit, applyCreditIncrease } from '../../services/agentService';
import { PAYMENT_METHODS } from '../../utils/constants';
import { canSeeCredit, isOperator } from '../../utils/auth';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';

import './Payment.css';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  // 判断是否为代理商或操作员（都可以使用credit支付）
  const isAgent = user?.userType === 'agent' || localStorage.getItem('userType') === 'agent';
  const isAgentOperator = user?.userType === 'agent_operator' || localStorage.getItem('userType') === 'agent_operator';
  const canUseCredit = isAgent || isAgentOperator;
  
  // 判断是否可以看到credit详细信息
  const canSeeCreditInfo = canSeeCredit();

  // 状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(canUseCredit ? 'agent_credit' : PAYMENT_METHODS.WECHAT);
  const [agreement, setAgreement] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [agentCredit, setAgentCredit] = useState(0);
  const [creditLoading, setCreditLoading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditRequest, setCreditRequest] = useState({
    amount: '',
    reason: ''
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 添加防重复请求的标志
  const hasFetchedRef = useRef(false);

  // 支付方式选项 - 操作员只能使用credit支付
  const paymentOptions = isOperator() ? [
    { 
      id: 'agent_credit', 
      name: '代理商信用额度支付', 
      icon: <FaCoins className="payment-icon-lg text-warning" /> 
    }
  ] : [
    ...(canUseCredit ? [
      { 
        id: 'agent_credit', 
        name: '代理商信用额度', 
        icon: <FaCoins className="payment-icon-lg text-warning" /> 
      }
    ] : []),
    { id: PAYMENT_METHODS.WECHAT, name: '微信支付', icon: <FaWeixin className="payment-icon-lg text-success" /> },
    { id: PAYMENT_METHODS.ALIPAY, name: '支付宝', icon: <FaAlipay className="payment-icon-lg text-primary" /> },
    { id: PAYMENT_METHODS.CREDIT_CARD, name: '信用卡', icon: <FaCreditCard className="payment-icon-lg text-info" /> },
    { id: PAYMENT_METHODS.BANK_TRANSFER, name: '银行转账', icon: <FaMoneyBillWave className="payment-icon-lg text-warning" /> }
  ];

  // 获取订单数据和代理商信用额度
  useEffect(() => {
    if (!orderId) {
      setError('订单ID无效');
      setLoading(false);
      return;
    }
    
    // 如果已经获取过数据，在严格模式下防止重复请求
    if (hasFetchedRef.current) {
      console.log('已经发起过请求，跳过重复请求');
      return;
    }

    const fetchData = async () => {
      try {
        // 标记已经发起请求
        hasFetchedRef.current = true;
        
        setLoading(true);
        // 获取订单数据
        const orderResponse = await getOrderDetail(orderId);
        
        if (orderResponse && orderResponse.code === 1) {
          setOrderData(orderResponse.data);
          
          // 如果是代理商或操作员，获取信用额度
          if (canUseCredit) {
            try {
              setCreditLoading(true);
              // 获取代理商ID - 优先从agentId字段获取，其次从user.id（如果是代理商主账号）
              let agentId = user?.agentId || localStorage.getItem('agentId');
              if (!agentId && isAgent) {
                agentId = user?.id || localStorage.getItem('userId');
              }
              
              if (!agentId) {
                console.warn('无法获取代理商ID，跳过获取信用额度');
                setCreditLoading(false);
                return;
              }
              
              // 调用获取代理商信用额度的API
              console.log('发起信用额度请求，代理商ID:', agentId, '用户类型:', user?.userType);
              const creditResponse = await getAgentCredit(agentId);
              
              if (creditResponse && creditResponse.code === 1) {
                setAgentCredit(creditResponse.data.availableCredit);
                
                // 如果有交易历史记录，也一并设置（只有代理商主账号能看到）
                if (creditResponse.data.recentTransactions && canSeeCreditInfo) {
                  setTransactionHistory(creditResponse.data.recentTransactions);
                }
              } else {
                toast.warning('获取信用额度信息失败，请刷新页面重试');
              }
            } catch (err) {
              console.error('获取代理商信用额度失败:', err);
              toast.warning('获取信用额度信息失败，您可能无法使用信用额度支付');
            } finally {
              setCreditLoading(false);
            }
          }
        } else {
          setError(orderResponse?.message || '获取订单信息失败');
        }
      } catch (err) {
        console.error('获取数据错误:', err);
        setError('获取信息失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // 组件卸载或依赖项变化时重置标志，允许重新获取
    return () => {
      hasFetchedRef.current = false;
    };
  }, [orderId, canUseCredit, isAgent, canSeeCreditInfo, user]);

  // 处理支付方式选择
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // 格式化价格显示
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  // 格式化交易记录中的日期和时间
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  // 获取交易类型的中文说明
  const getTransactionTypeText = (type) => {
    const types = {
      'payment': '支付',
      'refund': '退款',
      'adjustment': '调整',
      'topup': '增加额度'
    };
    return types[type] || type;
  };

  // 显示申请增加信用额度的模态框
  const handleShowCreditModal = () => {
    setShowCreditModal(true);
  };

  // 关闭申请增加信用额度的模态框
  const handleCloseCreditModal = () => {
    setShowCreditModal(false);
    setCreditRequest({
      amount: '',
      reason: ''
    });
  };

  // 处理信用额度申请表单变化
  const handleCreditRequestChange = (e) => {
    const { name, value } = e.target;
    setCreditRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交信用额度增加申请
  const handleSubmitCreditRequest = async () => {
    // 表单验证
    if (!creditRequest.amount || isNaN(creditRequest.amount) || parseFloat(creditRequest.amount) <= 0) {
      toast.error('请输入有效的金额');
      return;
    }

    if (!creditRequest.reason.trim()) {
      toast.error('请输入申请理由');
      return;
    }

    try {
      setRequestSubmitting(true);
      
      const response = await applyCreditIncrease({
        agentId: user.id,
        requestAmount: parseFloat(creditRequest.amount),
        reason: creditRequest.reason
      });

      if (response && response.code === 1) {
        toast.success('申请已提交，请等待审核');
        handleCloseCreditModal();
      } else {
        toast.error(response?.message || '申请提交失败，请稍后再试');
      }
    } catch (err) {
      console.error('申请提交错误:', err);
      toast.error(err.message || '申请提交失败，请稍后再试');
    } finally {
      setRequestSubmitting(false);
    }
  };

  // 提交支付
  const handleSubmitPayment = async () => {
    if (!agreement) {
      toast.warning('请先同意支付协议');
      return;
    }

    if (!orderData) {
      toast.error('订单数据无效');
      return;
    }

    try {
      setSubmitting(true);
      console.log('开始提交支付请求...');

    // 🔒 安全改进：前端不再进行金额检查，由后端验证
    // 前端仍显示信用额度不足的提示，但最终验证在后端
    const orderTotal = orderData.totalPrice || orderData.total || 0;
    if (paymentMethod === 'agent_credit' && orderTotal > agentCredit) {
      if (isOperator()) {
        toast.error('代理商信用额度不足，请联系您的中介管理人员申请增加额度');
      } else {
        toast.error('信用额度不足，请选择其他支付方式或申请增加额度');
      }
      return;
    }

      // 获取订单ID - 优先使用bookingId，因为它通常是数字ID
      // 注意：orderNumber通常是以"HT"开头的格式
      const bookingId = orderData.bookingId || orderData.id || orderId;
      
      // 记录支付使用的ID，以便调试
      console.log(`使用ID进行支付请求: ${bookingId}，类型: ${typeof bookingId}，订单数据:`, orderData);
      
      let response;
      
      // 如果是信用额度支付
      if (paymentMethod === 'agent_credit') {
        // 🔒 安全改进：不传递金额，由后端计算和验证
        const creditPaymentData = {
          bookingId: bookingId,
          note: `订单${bookingId}的信用额度支付`
          // 移除 amount 字段，由后端重新计算
        };
        
        console.log('提交信用额度支付数据:', creditPaymentData);
        
        // 调用信用额度支付API
        response = await processCreditPayment(creditPaymentData);
      } else {
        // 🔒 安全改进：不传递金额，由后端计算和验证
      const paymentData = {
          bookingId: bookingId,
          // 移除 amount 字段，由后端重新计算和验证
        paymentMethod: paymentMethod,
          userId: user?.id || localStorage.getItem('userId') || null,
          userType: user?.userType || localStorage.getItem('userType') || 'user'
      };

        console.log('提交标准支付数据:', paymentData);
      
        // 调用标准支付API
        response = await processPayment(bookingId, paymentData);
      }
      
      console.log('支付请求响应:', response);
      
      // 处理响应
      if (response && response.code === 1) {
        toast.success('支付成功！');
        setPaymentSuccess(true);
        
        // 如果使用信用额度，更新本地显示的额度
        if (paymentMethod === 'agent_credit') {
          setAgentCredit(prev => prev - orderTotal);
          
          // 如果API返回了新的交易记录，更新交易历史
          if (response.data && response.data.transaction) {
            setTransactionHistory(prev => [response.data.transaction, ...prev]);
          }
        }
        
        // 3秒后跳转到订单详情页
        setTimeout(() => {
          navigate(`/orders/${bookingId}`, { 
            state: { paymentSuccess: true } 
          });
        }, 3000);
      } else {
        // 支付失败
        toast.error(response?.msg || response?.message || '支付处理失败，请稍后再试');
      }
    } catch (err) {
      console.error('支付处理错误:', err);
      toast.error(err.message || '支付处理失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  // 切换显示交易历史记录
  const toggleTransactionHistory = () => {
    setShowHistory(!showHistory);
  };

  // 返回订单详情
  const handleBack = () => {
    navigate(`/orders/${orderId}`);
  };

  // 如果正在加载，显示加载中
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3">正在加载订单信息...</p>
      </Container>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>获取订单信息失败</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/orders')}>
              返回订单列表
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // 订单数据无效
  if (!orderData) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>订单信息不存在</Alert.Heading>
          <p>未找到相关订单信息，请确认订单ID是否正确。</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-primary" onClick={() => navigate('/orders')}>
              返回订单列表
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // 已支付订单
  if (orderData.paymentStatus === 'paid') {
    return (
      <Container className="py-5">
        <Alert variant="success">
          <Alert.Heading>订单已支付</Alert.Heading>
          <p>该订单已成功支付，无需重复支付。</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-success" onClick={() => navigate(`/orders/${orderId}`)}>
              查看订单详情
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // 已取消订单
  if (orderData.status === 'cancelled') {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>订单已取消</Alert.Heading>
          <p>该订单已被取消，无法进行支付。</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-primary" onClick={() => navigate('/orders')}>
              返回订单列表
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // 计算订单总价
  const orderTotal = orderData.totalPrice || orderData.total || 0;
  
  // 判断信用额度是否足够
  const isCreditSufficient = agentCredit >= orderTotal;

  return (
    <div className="payment-page py-5">
      <Container>
        <Breadcrumbs
          title="支付订单"
          pagename="我的订单"
          childpagename="支付订单"
        />

        <div className="mb-4 d-flex align-items-center">
          <Button variant="outline-secondary" className="me-3" onClick={handleBack}>
            <FaArrowLeft /> 返回
          </Button>
          <h1 className="h4 mb-0">支付订单</h1>
        </div>

        {/* 支付成功状态 */}
        {paymentSuccess && (
          <Container className="py-5">
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Card className="payment-success text-center">
                  <Card.Body className="py-5">
                    <FaCheckCircle className="success-icon text-success mb-4" style={{ fontSize: '4rem' }} />
                    <h2 className="mb-3">支付成功</h2>
                    <p className="lead mb-4">您的订单已支付完成，我们将为您安排行程。</p>
                    
                    <Alert variant="info" className="mb-4">
                      <Col md={6} className="text-start">
                        <p className="mb-0">支付成功，{isOperator() ? '订单已处理' : '使用代理商优惠价格'}</p>
                      </Col>
                      <Col md={6} className="text-end">
                        {!isOperator() && (
                          <>
                            <p className="mb-1">支付金额: ${formatPrice(orderData.totalPrice || orderData.total || 0)}</p>
                            <p className="mb-0">剩余信用额度: ${formatPrice(agentCredit)}</p>
                          </>
                        )}
                      </Col>
                    </Alert>
                    
                    <Button 
                      variant="outline-primary" 
                      onClick={() => navigate(`/orders/${orderData.id || orderData.bookingId}`)}
                    >
                      查看订单
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        )}

          <Row>
            <Col lg={8}>
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">选择支付方式</h5>
                </Card.Header>
                <Card.Body>
                  {canUseCredit && (
                    <div className="agent-credit-section mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">
                          {isOperator() ? '代理商信用额度支付' : '代理商信用额度管理'}
                        </h6>
                        {canSeeCreditInfo && transactionHistory.length > 0 && (
                          <Button 
                            variant="link" 
                            className="p-0 text-decoration-none"
                            onClick={toggleTransactionHistory}
                          >
                            {showHistory ? '隐藏交易记录' : '查看交易记录'}
                          </Button>
                        )}
                      </div>
                      
                      <Card className="credit-card border-0 bg-light">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-3">
                            <div>
                              <div className="text-muted small">
                                {isOperator() ? '可使用代理商信用额度' : '可用信用额度'}
                              </div>
                              <div className="fs-4 fw-bold text-primary">
                                {creditLoading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : isOperator() ? (
                                  '可用于支付'
                                ) : (
                                  `$${formatPrice(agentCredit)}`
                                )}
                              </div>
                            </div>
                            {canSeeCreditInfo && (
                              <div className="d-flex align-items-center">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={handleShowCreditModal}
                                >
                                  申请增加额度
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {!isCreditSufficient && isAgentOperator && (
                            <Alert variant="warning" className="mb-0 py-2">
                              <div className="d-flex align-items-center">
                                <FaInfoCircle className="me-2" />
                                <small>代理商信用额度不足，请联系您的中介管理人员申请增加额度</small>
                              </div>
                            </Alert>
                          )}
                          
                          {!isCreditSufficient && !isAgentOperator && (
                            <Alert variant="warning" className="mb-0 py-2">
                              <div className="d-flex align-items-center">
                                <FaInfoCircle className="me-2" />
                                <small>当前信用额度不足，可以申请增加额度或选择其他支付方式</small>
                              </div>
                            </Alert>
                          )}
                          
                          {isAgentOperator && isCreditSufficient && (
                            <Alert variant="info" className="mb-0 py-2">
                              <div className="d-flex align-items-center">
                                <FaInfoCircle className="me-2" />
                                <small>您将使用代理商的信用额度进行支付</small>
                              </div>
                            </Alert>
                          )}
                          
                          {canSeeCreditInfo && showHistory && transactionHistory.length > 0 && (
                            <div className="transaction-history mt-3">
                              <h6 className="mb-2">最近交易记录</h6>
                              <div className="history-list small">
                                {transactionHistory.slice(0, 5).map((tx, index) => (
                                  <div key={index} className="history-item d-flex justify-content-between border-bottom py-2">
                                    <div>
                                      <div>{getTransactionTypeText(tx.transactionType)}: {tx.description}</div>
                                      <div className="text-muted">{formatDateTime(tx.transactionTime)}</div>
                                    </div>
                                    <div className={`text-${tx.amount > 0 ? 'success' : 'danger'} fw-bold`}>
                                      {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  )}
                  
                  <Form>
                    <div className="payment-methods mb-4">
                      {paymentOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`payment-method-item ${paymentMethod === option.id ? 'active' : ''} ${
                            option.id === 'agent_credit' && !isCreditSufficient && !isAgentOperator ? 'disabled' : ''
                          }`}
                          onClick={() => {
                            // 如果是信用额度支付且余额不足（但操作员可以使用），则不允许选择
                            if (!(option.id === 'agent_credit' && !isCreditSufficient && !isAgentOperator)) {
                              handlePaymentMethodChange(option.id);
                            }
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <div className="payment-icon me-3">
                              {option.icon}
                            </div>
                            <div>
                              <h6 className="mb-0">{option.name}</h6>
                              {option.id === 'agent_credit' && (
                                <small className={`${isCreditSufficient || isAgentOperator ? 'text-muted' : 'text-danger'}`}>
                                  {isAgentOperator ? (
                                    '使用代理商信用额度'
                                  ) : (
                                    <>
                                      可用额度: ${formatPrice(agentCredit)}
                                      {!isCreditSufficient && ' (额度不足)'}
                                    </>
                                  )}
                                </small>
                              )}
                            </div>
                          </div>
                          <Form.Check
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === option.id}
                            onChange={() => handlePaymentMethodChange(option.id)}
                            className="ms-auto"
                            disabled={option.id === 'agent_credit' && !isCreditSufficient && !isAgentOperator}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="payment-agreement mb-4">
                      <Form.Check
                        type="checkbox"
                        id="agreement"
                        label="我已阅读并同意《支付服务协议》"
                        checked={agreement}
                        onChange={(e) => setAgreement(e.target.checked)}
                        className="mb-0"
                      />
                    </div>

                    <div className="d-grid">
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-100"
                        onClick={handleSubmitPayment}
                        disabled={!agreement || submitting || loading || (isOperator() && !isCreditSufficient)}
                      >
                        {submitting ? '处理中...' : (
                          isOperator() ? (
                            !isCreditSufficient ? '信用额度不足' : '确认支付'
                          ) : `确认支付 $${formatPrice(orderTotal)}`
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">订单信息</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between align-items-center px-3 py-3">
                      <span className="text-muted">订单号</span>
                      <span className="fw-medium">{orderData.orderNumber || orderData.id}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center px-3 py-3">
                      <span className="text-muted">产品名称</span>
                      <span className="fw-medium">{orderData.tourName || (orderData.tour && orderData.tour.name)}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center px-3 py-3">
                      <span className="text-muted">行程日期</span>
                      <span className="fw-medium">
                        {formatDate(orderData.tourStartDate || (orderData.tour && orderData.tour.startDate))}
                      </span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between align-items-center px-3 py-3">
                      <span className="text-muted">出行人数</span>
                      <span className="fw-medium">
                        {orderData.adultCount ? `${orderData.adultCount}成人` : ''}
                        {orderData.childCount > 0 ? `, ${orderData.childCount}儿童` : ''}
                      </span>
                    </ListGroup.Item>
                    {orderData.hotelLevel && (
                      <ListGroup.Item className="d-flex justify-content-between align-items-center px-3 py-3">
                        <span className="text-muted">酒店等级</span>
                        <span className="fw-medium">{orderData.hotelLevel}</span>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">总价</span>
                    <div className="text-end">
                      {canUseCredit && !isAgentOperator ? (
                        <>
                          <h5 className="mb-0 text-success">使用代理商优惠价格</h5>
                        </>
                      ) : isAgentOperator ? (
                        <h5 className="mb-0 text-muted">价格已隐藏</h5>
                      ) : (
                        <h5 className="mb-0 text-success">${formatPrice(orderData.totalPrice || orderData.total || 0)}</h5>
                      )}
                    </div>
                  </div>
                </Card.Footer>
              </Card>

              <div className="payment-tips mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">支付说明</h6>
                <ul className="mb-0 ps-3">
                  <li>支付完成后，订单状态将自动更新</li>
                  <li>如有任何问题，请联系客服</li>
                  <li>支付成功后，您将收到确认邮件</li>
                  {canUseCredit && (
                    <li>
                      <small className="text-muted">
                        {canUseCredit
                          ? (isAgentOperator ? '使用代理商信用额度支付' : '使用代理商信用额度支付，享受代理商优惠价格')
                          : '支付成功后，您将收到确认邮件'
                        }
                      </small>
                    </li>
                  )}
                </ul>
              </div>
            </Col>
          </Row>
        
        {/* 申请增加信用额度的模态框 */}
        <Modal show={showCreditModal} onHide={handleCloseCreditModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>申请增加信用额度</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>申请金额 (元)</Form.Label>
                <Form.Control
                  type="number"
                  name="amount"
                  value={creditRequest.amount}
                  onChange={handleCreditRequestChange}
                  placeholder="请输入申请金额"
                  min="1"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>申请理由</Form.Label>
                <Form.Control
                  as="textarea"
                  name="reason"
                  value={creditRequest.reason}
                  onChange={handleCreditRequestChange}
                  placeholder="请简要说明申请理由"
                  rows={3}
                />
              </Form.Group>
            </Form>
            <Alert variant="info" className="mb-0">
              <FaInfoCircle className="me-2" />
              申请提交后，管理员会在1-2个工作日内审核，审核结果将通过邮件通知您。
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseCreditModal}>
              取消
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmitCreditRequest}
              disabled={requestSubmitting}
            >
              {requestSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  提交中...
                </>
              ) : '提交申请'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Payment; 