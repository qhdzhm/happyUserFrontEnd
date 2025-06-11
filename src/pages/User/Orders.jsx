import React, { useState, useEffect } from 'react';
import { Container, Alert, Button, Form, Row, Col, Table, Pagination, Card, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getOrderList, cancelOrder } from '../../services/bookingService';
import { FaSearch, FaEye, FaTimes, FaFilter, FaCalendarAlt, FaUser, FaPhone, FaTag, FaRegMoneyBillAlt, FaEdit, FaMapMarkerAlt, FaUsers, FaUserTie } from 'react-icons/fa';
import './User.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { addAuthHeaders, isOperator } from '../../utils/auth';

/**
 * 我的订单页面
 */
const Orders = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  // 查询参数状态
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    orderNumber: '',
    status: '',
    paymentStatus: '',
    tourType: '',
    startDate: '',
    endDate: '',
    contactPerson: '',
    contactPhone: ''
  });
  
  // 结果状态
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  
  // 取消订单相关状态
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  
  // 状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'confirmed', label: '已确认' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ];
  
  const paymentStatusOptions = [
    { value: '', label: '全部付款状态' },
    { value: 'unpaid', label: '未支付' },
    { value: 'paid', label: '已支付' },
    { value: 'refunded', label: '已退款' }
  ];
  
  const tourTypeOptions = [
    { value: '', label: '全部类型' },
    { value: 'day_tour', label: '一日游' },
    { value: 'group_tour', label: '团队游' }
  ];
  
  // 处理日期格式化
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // 格式化日期为yyyy-MM-dd格式，标准ISO格式用于后端
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    
    try {
      // 对于HTML日期选择器，格式通常已经是yyyy-MM-dd
      // 如果已经是这种格式，直接返回
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // 格式化为yyyy-MM-dd，确保月份和日期是两位数
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '';
    }
  };
  
  // 获取订单列表
  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 准备查询参数，过滤掉空值，确保page和pageSize正确传递
      const queryParams = Object.entries(params).reduce((acc, [key, value]) => {
        // 只包含有值的参数
        if (value !== '' && value !== null && value !== undefined) {
          // 确保page和pageSize是有效的正整数
          if (key === 'page' || key === 'pageSize') {
            const numValue = parseInt(value, 10);
            acc[key] = Math.max(1, Number.isNaN(numValue) ? 1 : numValue);
          } 
          // 处理日期类型
          else if (key === 'startDate' || key === 'endDate') {
            const formattedDate = formatDateForAPI(value);
            if (formattedDate) {
              acc[key] = formattedDate;
            }
          }
          else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});
      
      // 确保页码参数有效
      queryParams.page = Math.max(1, queryParams.page || 1);
      queryParams.pageSize = Math.max(1, queryParams.pageSize || 10);
      
      console.log('获取订单列表，参数:', queryParams);
      
      const response = await getOrderList(queryParams);
      if (response && response.code === 1) {
        setOrders(response.data.records || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.message || '获取订单列表失败');
        setOrders([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('获取订单列表出错:', err);
      setError(err.message || '获取订单列表出错，请稍后重试');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };
  
  // 页面初始加载和参数变化时获取订单
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, params.page, params.pageSize]);
  
  // 表单提交处理
  const handleSubmit = (e) => {
    e.preventDefault();
    // 重置到第一页并查询
    setParams(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };
  
  // 表单输入处理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 日期字段特殊处理
    if (name === 'startDate' || name === 'endDate') {
      // 对于日期输入，确保是标准的yyyy-MM-dd格式
      if (value) {
        setParams(prev => ({ ...prev, [name]: value }));
      } else {
        // 如果清空日期，则从params中移除该字段
        const newParams = { ...params };
        delete newParams[name];
        setParams(newParams);
      }
    } else {
      setParams(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // 清空筛选
  const handleReset = () => {
    setParams({
      page: 1,
      pageSize: 10,
      orderNumber: '',
      status: '',
      paymentStatus: '',
      tourType: '',
      startDate: '',
      endDate: '',
      contactPerson: '',
      contactPhone: ''
    });
  };
  
  // 分页处理
  const handlePageChange = (pageNumber) => {
    setParams(prev => ({ ...prev, page: pageNumber }));
  };
  
  // 查看订单详情
  const handleViewOrder = (order) => {
    // 将订单ID和页面来源添加到URL，以便在详情页面返回时能够回到订单页面
    navigate(`/user/orders/${order.bookingId || order.id}`, { 
      state: { 
        fromPage: 'orders',
        pageParams: params
      } 
    });
  };
  
  // 修改订单
  const handleEditOrder = (order) => {
    // 跳转到订单修改页面
    navigate(`/booking/edit/${order.bookingId || order.id}`, {
      state: {
        fromPage: 'orders',
        pageParams: params
      }
    });
  };
  
  // 处理下载订单文档
  const handleDownloadDocument = async (order) => {
    if (!order) return;
    
    try {
      toast.loading('正在获取订单信息...');
      
      // 获取当前订单ID
      const orderIdToUse = order.bookingId || order.id;
      if (!orderIdToUse) {
        toast.error('无法获取订单ID，请刷新页面重试');
        return;
      }
      
      // 1. 从API重新获取最新的订单数据
      const headers = addAuthHeaders();
      const orderResponse = await axios.get(`/api/user/bookings/${orderIdToUse}`, { headers });
      
      if (!orderResponse.data || !orderResponse.data.data) {
        toast.error('获取订单数据失败，请刷新页面重试');
        return;
      }
      
      // 获取到最新的订单数据
      const freshOrderData = orderResponse.data.data;
      console.log('从API获取的最新订单数据:', freshOrderData);
      
      // 2. 获取行程信息
      const tourId = freshOrderData.tour_id || freshOrderData.tourId;
      const tourType = freshOrderData.tour_type || freshOrderData.tourType || 'day';
      
      if (!tourId) {
        toast.error('订单缺少行程信息，无法生成文档');
        return;
      }
      
      // 构建获取行程信息的URL
      const tourApiUrl = tourType.toLowerCase().includes('group') 
        ? `/api/user/group-tours/${tourId}`
        : `/api/user/day-tours/${tourId}`;
      
      toast.loading('正在获取行程信息...');
      const tourResponse = await axios.get(tourApiUrl, { headers });
      
      let tourData = null;
      if (tourResponse.data && (tourResponse.data.code === 1 || tourResponse.data.code === 200)) {
        tourData = tourResponse.data.data;
        console.log('从API获取的行程数据:', tourData);
      }
      
      // 3. 准备数据
      toast.loading(order.paymentStatus === 'paid' ? '正在生成发票...' : '正在生成确认单...');
      
      // 从API获取的数据优先级高于页面已有数据
      const dataForDocument = {
        // 基本订单信息
        id: freshOrderData.order_number || freshOrderData.orderNumber || order.id,
        orderNumber: freshOrderData.order_number || freshOrderData.orderNumber || order.id,
        bookingId: freshOrderData.id || orderIdToUse,
        createdAt: freshOrderData.created_at || freshOrderData.createdAt || new Date().toISOString(),
        
        // 用户信息
        contactPerson: freshOrderData.contact_person || freshOrderData.contactPerson || 
                     freshOrderData.passenger_name || freshOrderData.passengerName,
        contactPhone: freshOrderData.contact_phone || freshOrderData.contactPhone || 
                     freshOrderData.passenger_phone || freshOrderData.passengerPhone,
        contact: {
          name: freshOrderData.contact_person || freshOrderData.contactPerson || 
                freshOrderData.passenger_name || freshOrderData.passengerName,
          phone: freshOrderData.contact_phone || freshOrderData.contactPhone || 
                freshOrderData.passenger_phone || freshOrderData.passengerPhone
        },
        
        // 行程信息 
        tour: {
          id: tourId,
          name: freshOrderData.tour_name || freshOrderData.tourName,
          startDate: freshOrderData.tour_start_date || freshOrderData.tourStartDate,
          endDate: freshOrderData.tour_end_date || freshOrderData.tourEndDate,
          duration: freshOrderData.duration || tourData?.duration || 1,
          adults: freshOrderData.adult_count || freshOrderData.adultCount || 0,
          children: freshOrderData.child_count || freshOrderData.childCount || 0,
          hotelLevel: freshOrderData.hotel_level || freshOrderData.hotelLevel || '',
          pickupLocation: freshOrderData.pickup_location || freshOrderData.pickupLocation || ''
        },
        
        // 行程安排数据
        itineraryData: tourData || {},
        
        // 价格信息
        total: freshOrderData.total_price || freshOrderData.totalPrice || order.totalPrice || 0,
        
        // 结合API中可能的日期字段
        departureDate: freshOrderData.tour_start_date || freshOrderData.tourStartDate || 
                      freshOrderData.departure_date || freshOrderData.departureDate,
        returnDate: freshOrderData.tour_end_date || freshOrderData.tourEndDate || 
                   freshOrderData.return_date || freshOrderData.returnDate,
        pickupLocation: freshOrderData.pickup_location || freshOrderData.pickupLocation || '',
      };
      
      console.log('传递给文档生成的数据:', dataForDocument);
      
      // 根据支付状态和用户权限选择生成确认单或发票
      const { generateOrderConfirmation, generateOrderInvoice } = await import('../../utils/helpers');
      let pdfBlob;
      
      // 操作员不能下载发票（因为显示具体金额），只能下载确认单
      if (order.paymentStatus === 'paid' && !isOperator()) {
        // 生成发票
        pdfBlob = await generateOrderInvoice(dataForDocument);
      } else {
        // 生成确认单
        pdfBlob = await generateOrderConfirmation(dataForDocument);
      }
      
      // 创建下载链接
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // 根据文档类型设置文件名
      if (order.paymentStatus === 'paid' && !isOperator()) {
        link.download = `发票_${dataForDocument.id}.pdf`;
      } else {
        link.download = `订单确认单_${dataForDocument.id}.pdf`;
      }
      
      // 模拟点击下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success((order.paymentStatus === 'paid' && !isOperator()) ? '发票已下载' : '确认单已下载');
    } catch (error) {
      console.error('下载文档出错:', error);
      toast.dismiss();
      toast.error('下载失败: ' + (error.message || '请稍后再试'));
    }
  };
  
  // 显示取消订单确认框
  const handleShowCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
    setCancelError(null);
  };
  
  // 关闭取消订单确认框
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setCancelOrderId(null);
    setCancelError(null);
  };
  
  // 执行取消订单操作
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    
    setCancelLoading(true);
    setCancelError(null);
    
    try {
      const response = await cancelOrder(cancelOrderId);
      if (response && response.code === 1) {
        // 取消成功，关闭对话框并刷新订单列表
        handleCloseCancelModal();
        fetchOrders();
      } else {
        // 设置错误信息
        setCancelError(response?.msg || '取消订单失败');
      }
    } catch (err) {
      console.error('取消订单错误:', err);
      setCancelError(err.message || '取消订单出错，请稍后重试');
    } finally {
      setCancelLoading(false);
    }
  };
  
  // 生成分页组件
  const renderPagination = () => {
    const totalPages = Math.ceil(total / params.pageSize);
    if (totalPages <= 1) return null;
    
    let items = [];
    // 添加上一页按钮
    items.push(
      <Pagination.Prev 
        key="prev" 
        disabled={params.page === 1}
        onClick={() => handlePageChange(params.page - 1)}
      />
    );
    
    // 计算要显示的页码范围
    let startPage = Math.max(1, params.page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // 如果页码范围不足5，调整起始页
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // 显示第一页
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>1</Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === params.page}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // 显示最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // 添加下一页按钮
    items.push(
      <Pagination.Next 
        key="next" 
        disabled={params.page === totalPages}
        onClick={() => handlePageChange(params.page + 1)}
      />
    );
    
    return (
      <Pagination className="mt-3 justify-content-center">{items}</Pagination>
    );
  };
  
  // 获取状态标签颜色
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge bg="warning">待处理</Badge>;
      case 'confirmed': return <Badge bg="primary">已确认</Badge>;
      case 'completed': return <Badge bg="success">已完成</Badge>;
      case 'cancelled': return <Badge bg="danger">已取消</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // 获取支付状态标签颜色
  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'unpaid': return <Badge bg="danger">未支付</Badge>;
      case 'paid': return <Badge bg="success">已支付</Badge>;
      case 'refunded': return <Badge bg="info">已退款</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // 获取旅游类型中文名
  const getTourTypeName = (type) => {
    switch (type) {
      case 'day_tour': return '一日游';
      case 'group_tour': return '团队游';
      default: return type;
    }
  };
  
  // 订单状态背景色
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFF9C4'; // 浅黄色背景
      case 'confirmed': return '#E3F2FD'; // 浅蓝色背景
      case 'completed': return '#E8F5E9'; // 浅绿色背景
      case 'cancelled': return '#FFEBEE'; // 浅红色背景
      default: return '#F5F5F5'; // 默认浅灰色
    }
  };
  
  // 自定义卡片式订单项
  const OrderCard = ({ order }) => {
    const statusColor = getStatusColor(order.status);
    
    return (
      <Card className="mb-3 shadow-sm border-0" style={{ overflow: 'hidden' }}>
        <div style={{ 
          height: '8px', 
          backgroundColor: statusColor, 
          borderTopLeftRadius: '4px', 
          borderTopRightRadius: '4px'
        }} />
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <div className="d-flex align-items-center mb-2">
                <h5 className="mb-0 me-2">{order.orderNumber}</h5>
                <div>
                  {getStatusBadge(order.status)} {getPaymentStatusBadge(order.paymentStatus)}
                </div>
              </div>
              <div className="text-muted small mb-2">
                <FaCalendarAlt className="me-1" /> 
                创建时间: {formatDate(order.createTime || order.createdAt || order.created_at)}
              </div>
              <div className="mb-2">
                <strong>旅游类型:</strong> {getTourTypeName(order.tourType)}
              </div>
            </Col>
            
            <Col md={3}>
              <div className="mb-2">
                <FaUser className="me-1" /> {order.contactPerson}
              </div>
              <div className="mb-2">
                <FaPhone className="me-1" /> {order.contactPhone}
              </div>
              {/* 代理商主账号显示操作员信息 */}
              {localStorage.getItem('userType') === 'agent' && order.operatorName && (
                <div className="mb-2 text-muted">
                  <FaUserTie className="me-1" /> 操作员: {order.operatorName}
                </div>
              )}
              {order.tourStartDate && (
                <div className="small">
                  出行日期: {formatDate(order.tourStartDate)}
                </div>
              )}
            </Col>
            
            <Col md={3}>
              <div className="d-flex align-items-center">
                <FaRegMoneyBillAlt className="me-2 text-success" size={20} />
                {isOperator() ? (
                  <h5 className="mb-0 text-muted">价格已隐藏</h5>
                ) : (
                  <h5 className="mb-0 text-success">${order.totalPrice?.toFixed(2) || '0.00'}</h5>
                )}
              </div>
            </Col>
            
            <Col md={2} className="text-end">
              <div className="d-flex flex-column align-items-end">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                  className="mb-2 btn-horizontal-text"
                >
                  <FaEye className="me-1" /> 查看
                </Button>
                
                {order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={() => handleEditOrder(order)}
                    className="mb-2 btn-horizontal-text"
                  >
                    <FaEdit className="me-1" /> 修改
                  </Button>
                )}
                
                {/* 发票下载权限控制：操作员不能下载发票（显示具体金额），只能下载确认单 */}
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => handleDownloadDocument(order)}
                  className="mb-2 btn-horizontal-text"
                >
                  {order.paymentStatus === 'paid' && !isOperator() ? '下载发票' : '下载确认单'}
                </Button>
                
                {order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleShowCancelModal(order.bookingId)}
                    className="btn-horizontal-text"
                  >
                    <FaTimes className="me-1" /> 取消
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };
  
  // 如果未登录，提示登录
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先<Link to="/auth/login" className="alert-link">登录</Link>查看订单
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">我的订单</h2>
      
      {/* 搜索表单 */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="mb-3 d-flex align-items-center">
              <FaFilter className="me-2 text-primary" />
              <h5 className="mb-0">筛选条件</h5>
              <Button 
                variant="link" 
                className="ms-auto p-0 text-decoration-none" 
                onClick={handleReset}
              >
                重置筛选
              </Button>
            </div>
            
            <Row>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>订单号</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaTag /></span>
                    <Form.Control 
                      type="text" 
                      name="orderNumber" 
                      value={params.orderNumber} 
                      onChange={handleInputChange}
                      placeholder="输入订单号"
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>订单状态</Form.Label>
                  <Form.Select 
                    name="status" 
                    value={params.status} 
                    onChange={handleInputChange}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>支付状态</Form.Label>
                  <Form.Select 
                    name="paymentStatus" 
                    value={params.paymentStatus} 
                    onChange={handleInputChange}
                  >
                    {paymentStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>旅游类型</Form.Label>
                  <Form.Select 
                    name="tourType" 
                    value={params.tourType} 
                    onChange={handleInputChange}
                  >
                    {tourTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>开始日期</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="startDate" 
                    value={params.startDate || ''} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>结束日期</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="endDate" 
                    value={params.endDate || ''} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>联系人</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaUser /></span>
                    <Form.Control 
                      type="text" 
                      name="contactPerson" 
                      value={params.contactPerson} 
                      onChange={handleInputChange}
                      placeholder="输入联系人姓名"
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3} className="mb-3">
                <Form.Group>
                  <Form.Label>联系电话</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaPhone /></span>
                    <Form.Control 
                      type="text" 
                      name="contactPhone" 
                      value={params.contactPhone} 
                      onChange={handleInputChange}
                      placeholder="输入联系电话"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit">
                <FaSearch className="me-1" /> 查询
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* 错误提示 */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* 订单列表 */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-3">正在加载订单数据...</p>
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className="order-list">
            {orders.map(order => (
              <OrderCard key={order.bookingId || order.id} order={order} />
            ))}
          </div>
          
          {/* 分页 */}
          {renderPagination()}
        </>
      ) : (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body>
            <img 
              src="/images/empty-orders.svg" 
              alt="暂无订单" 
              style={{ width: '200px', height: 'auto', marginBottom: '20px', opacity: 0.7 }} 
            />
            <p className="mb-4">暂无订单记录</p>
            <Link to="/">
              <Button variant="primary">浏览旅游产品</Button>
            </Link>
          </Card.Body>
        </Card>
      )}
      
      {/* 取消订单确认对话框 */}
      <Modal show={showCancelModal} onHide={handleCloseCancelModal}>
        <Modal.Header closeButton>
          <Modal.Title>取消订单确认</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>您确定要取消此订单吗？此操作不可撤销。</p>
          {cancelError && (
            <Alert variant="danger">
              {cancelError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCancelModal} disabled={cancelLoading}>
            返回
          </Button>
          <Button 
            variant="danger" 
            onClick={handleCancelOrder} 
            disabled={cancelLoading}
          >
            {cancelLoading ? '处理中...' : '确认取消订单'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Orders; 