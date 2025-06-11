import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ListGroup, Accordion, Modal, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaCalendarAlt, FaMapMarkerAlt, 
         FaUsers, FaHotel, FaClipboard, FaPhoneAlt, FaWeixin, 
         FaStar, FaBed, FaInfoCircle, FaArrowLeft, FaTimes, FaTag,
         FaUtensils, FaMapMarked, FaCar, FaRoute, FaCalendarDay, FaEdit, FaSave } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { getOrderDetail, cancelOrder, updateOrderByAgent } from '../../services/bookingService';
import './OrderDetail.css';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { addAuthHeaders, isOperator } from '../../utils/auth';

const OrderDetail = () => {
  const { orderId, orderNumber } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useSelector(state => state.auth);
  const location = useLocation();
  
  // 获取有效的订单ID - 优先使用location.state中的bookingId
  const [validOrderId, setValidOrderId] = useState(null);
  
  console.log('OrderDetail组件加载 - 路径:', location.pathname);
  console.log('OrderDetail组件加载 - 参数:', { orderId, orderNumber });
  console.log('OrderDetail组件加载 - location state:', location.state);
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 取消订单状态
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // 新增行程信息状态
  const [itineraryData, setItineraryData] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  
  // 编辑订单状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // 检查是否为价格敏感字段
  const isPriceSensitiveField = (fieldName) => {
    const priceSensitiveFields = [
      'adultCount',           // 成人数量
      'childCount',           // 儿童数量  
      'hotelRoomCount',       // 房间数量
      'hotelLevel',           // 酒店等级
      'roomType',             // 房间类型
      'tourStartDate',        // 行程开始日期
      'tourEndDate',          // 行程结束日期
      'pickupLocation',       // 接机地点
      'dropoffLocation'       // 送机地点
    ];
    return priceSensitiveFields.includes(fieldName);
  };

  // 检查字段是否应该被禁用
  const isFieldDisabled = (fieldName) => {
    if (!orderData) return true;
    
    // 基本禁用条件：已支付或已取消
    const basicDisabled = orderData.paymentStatus === 'paid' || orderData.status === 'cancelled';
    
    // 价格敏感字段额外禁用
    const priceSensitiveDisabled = isPriceSensitiveField(fieldName);
    
    return basicDisabled || priceSensitiveDisabled;
  };

  // 检查是否可以修改订单
  const canEditOrder = () => {
    if (!orderData) return false;
    
    // 订单状态为已完成、已取消、已支付的不允许修改
    const restrictedStatuses = ['completed', 'cancelled'];
    const restrictedPaymentStatuses = ['paid'];
    
    return !restrictedStatuses.includes(orderData.status) && 
           !restrictedPaymentStatuses.includes(orderData.paymentStatus);
  };

  // 渲染字段标签（包含禁用提示）
  const renderFieldLabel = (label, fieldName) => {
    const isPriceSensitive = isPriceSensitiveField(fieldName);
    
    return (
      <div className="d-flex align-items-center">
        <span>{label}</span>
        {isPriceSensitive && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                此字段涉及价格变动，已被禁用。如需修改请联系客服。
              </Tooltip>
            }
          >
            <FaInfoCircle className="ms-2 text-warning" style={{ fontSize: '14px' }} />
          </OverlayTrigger>
        )}
      </div>
    );
  };

  // 获取订单详情后初始化编辑表单数据
  useEffect(() => {
    if (orderData) {
      setEditFormData({
        bookingId: orderData.bookingId,
        flightNumber: orderData.flightNumber || '',
        returnFlightNumber: orderData.returnFlightNumber || '',
        tourStartDate: orderData.tourStartDate ? formatDateForInput(orderData.tourStartDate) : '',
        tourEndDate: orderData.tourEndDate ? formatDateForInput(orderData.tourEndDate) : '',
        pickupDate: orderData.pickupDate ? formatDateForInput(orderData.pickupDate) : '',
        dropoffDate: orderData.dropoffDate ? formatDateForInput(orderData.dropoffDate) : '',
        pickupLocation: orderData.pickupLocation || '',
        dropoffLocation: orderData.dropoffLocation || '',
        adultCount: orderData.adultCount || 0,
        childCount: orderData.childCount || 0,
        luggageCount: orderData.luggageCount || 0,
        contactPerson: orderData.contactPerson || '',
        contactPhone: orderData.contactPhone || '',
        hotelLevel: orderData.hotelLevel || '',
        roomType: orderData.roomType || '',
        hotelRoomCount: orderData.hotelRoomCount || 1,
        specialRequests: orderData.specialRequests || ''
      });
    }
  }, [orderData]);

  // 处理编辑表单字段变化
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 开始编辑
  const handleStartEdit = () => {
    setShowEditModal(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    // 重置表单数据
    if (orderData) {
      setEditFormData({
        bookingId: orderData.bookingId,
        flightNumber: orderData.flightNumber || '',
        returnFlightNumber: orderData.returnFlightNumber || '',
        tourStartDate: orderData.tourStartDate ? formatDateForInput(orderData.tourStartDate) : '',
        tourEndDate: orderData.tourEndDate ? formatDateForInput(orderData.tourEndDate) : '',
        pickupDate: orderData.pickupDate ? formatDateForInput(orderData.pickupDate) : '',
        dropoffDate: orderData.dropoffDate ? formatDateForInput(orderData.dropoffDate) : '',
        pickupLocation: orderData.pickupLocation || '',
        dropoffLocation: orderData.dropoffLocation || '',
        adultCount: orderData.adultCount || 0,
        childCount: orderData.childCount || 0,
        luggageCount: orderData.luggageCount || 0,
        contactPerson: orderData.contactPerson || '',
        contactPhone: orderData.contactPhone || '',
        hotelLevel: orderData.hotelLevel || '',
        roomType: orderData.roomType || '',
        hotelRoomCount: orderData.hotelRoomCount || 1,
        specialRequests: orderData.specialRequests || ''
      });
    }
    setShowEditModal(false);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (editLoading) return;
    
    setEditLoading(true);
    
    try {
      // 验证表单数据
      if (!editFormData.bookingId) {
        toast.error('订单ID不能为空');
        return;
      }
      
      // 发送更新请求
      const response = await updateOrderByAgent(editFormData);
      
      if (response && response.code === 1) {
        toast.success('订单修改成功');
        
        // 重新获取订单数据
        const updatedOrderDetail = await getOrderDetail(editFormData.bookingId);
        if (updatedOrderDetail && updatedOrderDetail.code === 1) {
          setOrderData(updatedOrderDetail.data);
        }
        
        // 关闭编辑模态窗
        setShowEditModal(false);
      } else {
        toast.error(response?.msg || '修改订单失败');
      }
    } catch (err) {
      console.error('修改订单错误:', err);
      toast.error(err.message || '修改订单出错，请稍后重试');
    } finally {
      setEditLoading(false);
    }
  };

  // 格式化日期为yyyy-MM-dd格式，用于日期输入框
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // 确定要使用的订单ID
  useEffect(() => {
    let id = null;
    
    // 1. 优先使用location.state中的bookingId
    if (location.state?.bookingId) {
      id = location.state.bookingId;
      console.log('使用location state中的bookingId:', id);
    }
    // 2. 其次使用路径参数中的orderId
    else if (orderId) {
      id = orderId;
      console.log('使用URL参数中的orderId:', id);
    }
    // 3. 如果有orderNumber但没有bookingId，需要通过API查询
    else if (orderNumber && !id) {
      // 通过orderNumber查询订单详情
      console.log('需要通过orderNumber查询订单详情:', orderNumber);
      
      // 这里假设直接使用orderNumber作为查询参数也可以工作
      // 真实情况下可能需要另一个API端点来支持这种查询
      id = orderNumber;
    }
    
    setValidOrderId(id);
  }, [orderId, orderNumber, location.state]);

  // 获取订单详情
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    if (!validOrderId) {
      console.log('没有有效的订单ID，无法获取订单详情');
      setLoading(false);
      setError('无效的订单ID');
      return;
    }
    
    const fetchOrderDetail = async () => {
      setLoading(true);
      setError(null);
      
      console.log('获取订单详情，订单ID:', validOrderId);
      
      try {
        // 总是从后端获取最新数据，确保数据一致性
        const response = await getOrderDetail(validOrderId);
        console.log('订单详情API响应:', response);
        if (response && (response.code === 1 || response.code === 200 || response.status === 200)) {
          // 处理和格式化订单数据
          const orderDetail = response.data || response;
          
          // 添加价格详情到订单数据
          if (orderDetail.priceDetails) {
            console.log('订单包含价格详情:', orderDetail.priceDetails);
          } else if (response.data && response.data.data) {
            // 有些API返回嵌套的data字段
            orderDetail.priceDetails = response.data.data;
            console.log('从嵌套数据中获取价格详情:', orderDetail.priceDetails);
          }
          
          console.log('处理后的订单数据:', orderDetail);
          setOrderData(orderDetail);
        } else {
          setError(response?.msg || response?.message || '获取订单详情失败');
        }
      } catch (err) {
        console.error('获取订单详情错误:', err);
        setError(err.message || '获取订单详情出错，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [validOrderId, isAuthenticated, navigate]);
  
  // 获取行程信息
  useEffect(() => {
    if (orderData && orderData.tourId) {
      fetchTourItinerary(orderData.tourId, orderData.tourType || 'day_tour');
    }
  }, [orderData]);

  // 获取旅游产品的行程信息
  const fetchTourItinerary = async (tourId, tourType) => {
    if (!tourId) return;
    
    setItineraryLoading(true);
    setItineraryError(null);
    
    try {
      const headers = addAuthHeaders();
      const url = tourType.toLowerCase().includes('group') 
        ? `/api/user/group-tours/${tourId}`
        : `/api/user/day-tours/${tourId}`;
      
      console.log(`获取行程信息，URL: ${url}`);
      
      // 尝试从API获取数据
      let apiSuccess = false;
      let response;
      
      try {
        response = await axios.get(url, { headers });
        
        if (response.data && (response.data.code === 1 || response.data.code === 200)) {
          console.log('获取行程信息成功:', response.data);
          setItineraryData(response.data.data);
          apiSuccess = true;
        } else {
          console.warn('获取行程信息返回错误状态:', response.data);
        }
      } catch (err) {
        console.error('获取行程信息API请求错误:', err);
      }
      
      // 如果API未返回数据，不再使用模拟数据
      if (!apiSuccess) {
        console.log('无法获取行程信息');
        setItineraryError('无法获取行程信息，请稍后再试');
      }
    } catch (err) {
      console.error('获取行程信息处理错误:', err);
      setItineraryError(err.message || '获取行程信息出错，请稍后重试');
    } finally {
      setItineraryLoading(false);
    }
  };
  
  // 复制订单号到剪贴板
  const copyOrderNumber = () => {
    if (!orderData) return;
    
    const orderNumber = orderData.orderNumber || orderData.id;
    
    navigator.clipboard.writeText(orderNumber)
      .then(() => toast.success('订单号已复制到剪贴板'))
      .catch(err => {
        console.error('复制失败: ', err);
        toast.error('复制失败，请手动复制');
      });
  };
  
  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };
  
  // 获取状态文字
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'confirmed': return '已确认';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };
  
  // 获取支付状态文字
  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'unpaid': return '未支付';
      case 'paid': return '已支付';
      case 'refunded': return '已退款';
      default: return status;
    }
  };
  
  // 获取旅游类型文字
  const getTourTypeText = (type) => {
    switch (type) {
      case 'day_tour': return '一日游';
      case 'group_tour': return '团队游';
      default: return type;
    }
  };
  
  // 获取状态标签
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge bg="warning">待处理</Badge>;
      case 'confirmed': return <Badge bg="primary">已确认</Badge>;
      case 'completed': return <Badge bg="success">已完成</Badge>;
      case 'cancelled': return <Badge bg="danger">已取消</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // 获取支付状态标签
  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'unpaid': return <Badge bg="danger">未支付</Badge>;
      case 'paid': return <Badge bg="success">已支付</Badge>;
      case 'refunded': return <Badge bg="info">已退款</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // 处理取消订单
  const handleCancelOrder = async () => {
    if (cancelLoading) return;
    
    setCancelLoading(true);
    
    try {
      // 使用有效的订单ID（bookingId）进行取消
      const bookingId = orderData.bookingId || validOrderId;
      const response = await cancelOrder(bookingId);
      
      if (response && response.code === 1) {
        toast.success('订单取消成功');
        // 重新获取订单数据
        const updatedOrderDetail = await getOrderDetail(bookingId);
        if (updatedOrderDetail && updatedOrderDetail.code === 1) {
          setOrderData(updatedOrderDetail.data);
        }
        // 隐藏确认框
        setShowCancelConfirm(false);
      } else {
        toast.error(response?.msg || '取消订单失败');
      }
    } catch (err) {
      console.error('取消订单错误:', err);
      toast.error(err.message || '取消订单出错，请稍后重试');
    } finally {
      setCancelLoading(false);
    }
  };
  
  // 返回订单列表
  const handleBackToOrders = () => {
    navigate('/orders');
  };
  
  // 下载文档
  const handleDownloadDocument = async () => {
    try {
      toast.loading('正在生成文档，请稍候...');
      
      // 重新获取最新的订单数据
      let freshOrderData;
      try {
        const freshResponse = await getOrderDetail(validOrderId);
        if (freshResponse && freshResponse.code === 1 && freshResponse.data) {
          freshOrderData = freshResponse.data;
        } else {
          freshOrderData = orderData;
        }
      } catch (err) {
        console.warn('获取最新订单数据失败，使用当前数据:', err);
        freshOrderData = orderData;
      }
      
      // 构建传递给文档生成的数据
      const dataForDocument = {
        id: freshOrderData.bookingId || freshOrderData.id || orderData.bookingId || orderData.id,
        orderNumber: freshOrderData.order_number || freshOrderData.orderNumber || orderData.orderNumber,
        orderDate: freshOrderData.created_at || freshOrderData.createdAt || orderData.createdAt,
        createdAt: freshOrderData.created_at || freshOrderData.createdAt || orderData.createdAt,
        status: freshOrderData.status || orderData.status,
        paymentStatus: freshOrderData.payment_status || freshOrderData.paymentStatus || orderData.paymentStatus,
        
        // 客户信息
        contact: {
          name: freshOrderData.contact_person || freshOrderData.contactPerson || orderData.contactPerson,
          phone: freshOrderData.contact_phone || freshOrderData.contactPhone || orderData.contactPhone
        },
        
        // 产品信息
        tour: {
          name: freshOrderData.tour_name || freshOrderData.tourName || orderData.tourName,
          startDate: freshOrderData.tour_start_date || freshOrderData.tourStartDate || orderData.tourStartDate,
          endDate: freshOrderData.tour_end_date || freshOrderData.tourEndDate || orderData.tourEndDate,
          adults: freshOrderData.adult_count || freshOrderData.adultCount || orderData.adultCount || 0,
          children: freshOrderData.child_count || freshOrderData.childCount || orderData.childCount || 0
        },
        tourName: freshOrderData.tour_name || freshOrderData.tourName || orderData.tourName,
        
        // 行程安排数据
        itineraryData: itineraryData || {},
        
        // 价格信息
        total: freshOrderData.total_price || freshOrderData.totalPrice || orderData.totalPrice || 0,
        
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
      if (orderData.paymentStatus === 'paid' && !isOperator()) {
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
      if (orderData.paymentStatus === 'paid' && !isOperator()) {
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
      toast.success((orderData.paymentStatus === 'paid' && !isOperator()) ? '发票已下载' : '确认单已下载');
    } catch (error) {
      console.error('下载文档出错:', error);
      toast.dismiss();
      toast.error('下载失败: ' + (error.message || '请稍后再试'));
    }
  };
  
  // 显示加载中状态
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
  
  // 显示错误状态
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error}
        </Alert>
        <div className="text-center mt-4">
          <Button variant="outline-primary" onClick={handleBackToOrders}>
            <FaArrowLeft className="me-2" /> 返回订单列表
          </Button>
        </div>
      </Container>
    );
  }
  
  // 如果没有订单数据
  if (!orderData) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          未找到订单信息
        </Alert>
        <div className="text-center mt-4">
          <Button variant="outline-primary" onClick={handleBackToOrders}>
            <FaArrowLeft className="me-2" /> 返回订单列表
          </Button>
        </div>
      </Container>
    );
  }

  
  return (
    <Container className="order-detail-page py-5">
      {/* 订单状态标题 */}
      <div className="order-header mb-4">
        <div className="d-flex align-items-center mb-3">
          <Button 
            variant="link" 
            className="p-0 text-muted me-3" 
            onClick={handleBackToOrders}
          >
            <FaArrowLeft /> <span className="ms-1">返回列表</span>
          </Button>
          <h1 className="mb-0">订单详情</h1>
          <div className="ms-auto">
            {getStatusBadge(orderData.status)} {getPaymentStatusBadge(orderData.paymentStatus)}
          </div>
        </div>
        <div className="order-number d-flex align-items-center">
          <span className="text-muted me-2">订单号:</span>
          <strong className="me-2">{orderData.orderNumber}</strong>
          <Button 
            variant="link" 
            className="copy-btn p-0" 
            onClick={copyOrderNumber}
            title="复制订单号"
          >
            <FaClipboard size={16} />
          </Button>
        </div>
      </div>
      
      {/* 订单状态跟踪 */}
      <div className="order-status mb-5">
        <div className="status-steps d-flex justify-content-center">
          <div className={`status-step ${orderData.status !== 'cancelled' ? 'completed' : ''} text-center`}>
            <div className="step-icon">
              <span>1</span>
            </div>
            <div className="step-label">提交订单</div>
          </div>
          <div className="status-line"></div>
          <div className={`status-step ${orderData.paymentStatus === 'paid' ? 'completed' : orderData.status === 'cancelled' ? 'disabled' : 'active'} text-center`}>
            <div className="step-icon">
              <span>2</span>
            </div>
            <div className="step-label">支付订单</div>
          </div>
          <div className="status-line"></div>
          <div className={`status-step ${orderData.status === 'confirmed' && orderData.paymentStatus === 'paid' ? 'active' : orderData.status === 'completed' ? 'completed' : 'disabled'} text-center`}>
            <div className="step-icon">
              <span>3</span>
            </div>
            <div className="step-label">行程确认</div>
          </div>
          <div className="status-line"></div>
          <div className={`status-step ${orderData.status === 'completed' ? 'completed' : 'disabled'} text-center`}>
            <div className="step-icon">
              <span>4</span>
            </div>
            <div className="step-label">完成行程</div>
          </div>
        </div>
      </div>
      
      <Row>
        {/* 左侧订单详情 */}
        <Col lg={8}>
          {/* 产品信息卡片 */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">产品信息</h2>
            </Card.Header>
            <Card.Body>
              <div className="product-info">
                <h3 className="h5 mb-3">{orderData.tourName || '旅游产品'}</h3>
                
                <div className="product-meta d-flex flex-wrap mb-3">
                  <div className="product-meta-item me-4 mb-2">
                    <FaCalendarAlt className="me-2 text-primary" />
                    <span className="text-muted">行程日期:</span> {formatDate(orderData.tourStartDate)}
                    {orderData.tourEndDate && orderData.tourEndDate !== orderData.tourStartDate 
                      ? ` - ${formatDate(orderData.tourEndDate)}` 
                      : ''}
                  </div>
                  
                  <div className="product-meta-item me-4 mb-2">
                    <FaUsers className="me-2 text-primary" />
                    <span className="text-muted">出行人数:</span> 
                    {orderData.adultCount ? `${orderData.adultCount} 成人` : ''}
                    {orderData.childCount > 0 ? `, ${orderData.childCount} 儿童` : ''}
                    {!orderData.adultCount && !orderData.childCount && orderData.groupSize ? `${orderData.groupSize} 人` : ''}
                  </div>
                  
                  <div className="product-meta-item me-4 mb-2">
                    <FaTag className="me-2 text-primary" />
                    <span className="text-muted">旅游类型:</span> {getTourTypeText(orderData.tourType)}
                  </div>
                </div>
                
                {orderData.hotelLevel && (
                  <div className="hotel-info bg-light p-3 rounded mb-3">
                    <h4 className="h6 mb-2">
                      <FaHotel className="me-2 text-primary" />
                      住宿信息
                    </h4>
                    <div className="d-flex flex-wrap">
                      <div className="me-4 mb-2">
                        <span className="text-muted">酒店等级:</span> 
                        <Badge bg="info" className="ms-1">{orderData.hotelLevel}</Badge>
                      </div>
                      <div className="me-4 mb-2">
                        <span className="text-muted">房间数量:</span> {orderData.hotelRoomCount || 1}间
                      </div>
                      {orderData.roomType && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">房间类型:</span> {orderData.roomType}
                        </div>
                      )}
                      {orderData.hotelCheckInDate && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">入住日期:</span> {formatDate(orderData.hotelCheckInDate)}
                        </div>
                      )}
                      {orderData.hotelCheckOutDate && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">退房日期:</span> {formatDate(orderData.hotelCheckOutDate)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 接送信息 */}
                {(orderData.pickupLocation || orderData.dropoffLocation) && (
                  <div className="pickup-info bg-light p-3 rounded mb-3">
                    <h4 className="h6 mb-2">
                      <FaMapMarkerAlt className="me-2 text-primary" />
                      接送信息
                    </h4>
                    <div className="d-flex flex-wrap">
                      {orderData.pickupLocation && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">接送地点:</span> {orderData.pickupLocation}
                        </div>
                      )}
                      {orderData.pickupDate && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">接客日期:</span> {formatDate(orderData.pickupDate)}
                        </div>
                      )}
                      {orderData.dropoffLocation && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">送客地点:</span> {orderData.dropoffLocation}
                        </div>
                      )}
                      {orderData.dropoffDate && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">送客日期:</span> {formatDate(orderData.dropoffDate)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 航班信息 */}
                {(orderData.flightNumber || orderData.returnFlightNumber) && (
                  <div className="flight-info bg-light p-3 rounded mb-3">
                    <h4 className="h6 mb-2">
                      <i className="fas fa-plane me-2 text-primary"></i>
                      航班信息
                    </h4>
                    <div className="d-flex flex-wrap">
                      {orderData.flightNumber && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">去程航班:</span> {orderData.flightNumber}
                        </div>
                      )}
                      {orderData.returnFlightNumber && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">返程航班:</span> {orderData.returnFlightNumber}
                        </div>
                      )}
                      {orderData.luggageCount > 0 && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">行李数量:</span> {orderData.luggageCount}件
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 行程安排 */}
                {itineraryData && (
                  <div className="itinerary-info mt-4">
                    <h4 className="h6 mb-3">
                      <FaRoute className="me-2 text-primary" />
                      行程安排
                    </h4>
                    
                    {/* 一日游显示简单描述 */}
                    {orderData.tourType && orderData.tourType.toLowerCase().includes('day') && !orderData.tourType.toLowerCase().includes('group') ? (
                      <div className="day-tour-description p-3 bg-light rounded">
                        {itineraryData.description ? (
                          <div dangerouslySetInnerHTML={{ __html: itineraryData.description }} />
                        ) : itineraryData.itinerary && itineraryData.itinerary[0] && itineraryData.itinerary[0].description ? (
                          <div dangerouslySetInnerHTML={{ __html: itineraryData.itinerary[0].description }} />
                        ) : (
                          <p>行程将包括所有景点游览和活动，具体行程安排请参考预订确认邮件或联系客服。</p>
                        )}
                        
                        {/* 显示每天的详细行程 */}
                        {itineraryData.itinerary && itineraryData.itinerary.length > 0 && (
                          <div className="day-tour-details mt-3">
                            <h5 className="h6 mb-2">行程详情:</h5>
                            {itineraryData.itinerary.sort((a, b) => a.day_number - b.day_number).map((day, index) => (
                              <div key={index} className="day-detail mb-3 p-3 bg-white rounded border">
                                <h6 className="mb-2">{day.title ? day.title.replace(`第${day.day_number || (index + 1)}天: `, '').replace(`第${day.day_number || (index + 1)}天：`, '') : '行程详情'}</h6>
                                <div dangerouslySetInnerHTML={{ __html: day.description || '暂无详细描述' }} />
                                
                                <div className="d-flex flex-wrap mt-2">
                                  {day.accommodation && (
                                    <div className="me-4 mb-2">
                                      <FaHotel className="me-2 text-primary" />
                                      <span className="text-muted">住宿:</span> {day.accommodation}
                                    </div>
                                  )}
                                  
                                  {day.meals && (
                                    <div className="me-4 mb-2">
                                      <FaUtensils className="me-2 text-primary" />
                                      <span className="text-muted">用餐:</span> {day.meals}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 团队游显示详细行程 */
                      itineraryData.itinerary && itineraryData.itinerary.length > 0 && (
                        <Accordion defaultActiveKey="0" className="mb-3">
                          {itineraryData.itinerary.sort((a, b) => a.day_number - b.day_number).map((day, index) => (
                            <Accordion.Item key={index} eventKey={String(index)}>
                              <Accordion.Header>
                                <span className="fw-medium">
                                  第{day.day_number || (index + 1)}天: {day.title ? day.title.replace(`第${day.day_number || (index + 1)}天: `, '').replace(`第${day.day_number || (index + 1)}天：`, '') : '行程详情'}
                                </span>
                              </Accordion.Header>
                              <Accordion.Body>
                                <div className="itinerary-day-content">
                                  <div className="mb-3">{day.description || '暂无详细描述'}</div>
                                  
                                  <div className="d-flex flex-wrap">
                                    {day.accommodation && (
                                      <div className="me-4 mb-2">
                                        <FaHotel className="me-2 text-primary" />
                                        <span className="text-muted">住宿:</span> {day.accommodation}
                                      </div>
                                    )}
                                    
                                    {day.meals && (
                                      <div className="me-4 mb-2">
                                        <FaUtensils className="me-2 text-primary" />
                                        <span className="text-muted">用餐:</span> {day.meals}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      )
                    )}
                    
                    {itineraryData.note && (
                      <div className="itinerary-note mt-3">
                        <Alert variant="info" className="mb-0">
                          <FaInfoCircle className="me-2" />
                          <span className="fw-medium">行程备注:</span> {itineraryData.note}
                        </Alert>
                      </div>
                    )}
                  </div>
                )}
                
                {itineraryLoading && (
                  <div className="text-center my-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">加载中...</span>
                    </div>
                    <p className="text-muted mb-0 mt-2">正在加载行程信息...</p>
                  </div>
                )}
                
                {itineraryError && !itineraryLoading && (
                  <Alert variant="warning" className="my-3">
                    <small>{itineraryError}</small>
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* 支付信息卡片 */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">支付信息</h2>
            </Card.Header>
            <Card.Body>
              <div className="payment-status mb-4">
                <h4 className="h6 mb-3">支付状态</h4>
                {orderData.paymentStatus === 'unpaid' && orderData.status !== 'cancelled' ? (
                  <Alert variant="warning" className="d-flex align-items-center">
                    <FaInfoCircle className="me-2" size={20} />
                    <div>
                      <span className="fw-bold">待支付</span> - 请在24小时内完成支付，否则订单将自动取消
                    </div>
                  </Alert>
                ) : orderData.paymentStatus === 'paid' ? (
                  <Alert variant="success" className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" size={20} />
                    <div>
                      <span className="fw-bold">已支付</span> - 支付时间: {formatDate(orderData.payTime)}
                    </div>
                  </Alert>
                ) : orderData.status === 'cancelled' ? (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <FaTimes className="me-2" size={20} />
                    <div>
                      <span className="fw-bold">订单已取消</span> - 取消时间: {formatDate(orderData.cancelTime)}
                      {orderData.cancelReason ? ` - 原因: ${orderData.cancelReason}` : ''}
                    </div>
                  </Alert>
                ) : (
                  <Alert variant="info" className="d-flex align-items-center">
                    <FaInfoCircle className="me-2" size={20} />
                    <div>
                      <span className="fw-bold">{getPaymentStatusText(orderData.paymentStatus)}</span>
                    </div>
                  </Alert>
                )}
              </div>
              
              <div className="price-details">
                <h4 className="h6 mb-3">费用明细</h4>
                <ListGroup variant="flush" className="price-list">
                  {/* 简化费用明细，只显示订单总额 */}
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                    <div>
                      {orderData.adultCount > 0 && (
                        <div>成人 × {orderData.adultCount}</div>
                  )}
                      {orderData.childCount > 0 && (
                        <div>儿童 × {orderData.childCount}</div>
                      )}
                          </div>
                    <div className="text-end">
                      <div>${Number(orderData.totalPrice || 0).toFixed(2)}</div>
                    </div>
                        </ListGroup.Item>
                  
                  {/* 酒店信息 */}
                  {orderData.nights > 0 && (
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <div>酒店 {orderData.baseHotelLevel || '标准'} × {orderData.nights || 0}晚</div>
                      <div className="text-end">包含</div>
                    </ListGroup.Item>
                  )}
                  
                  {/* 单房差 */}
                  {orderData.extraRoomFee > 0 && (
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <div>单房差 {orderData.roomCount || 1}间 × {orderData.nights || 0}晚</div>
                      <div className="text-end text-danger">+${Number(orderData.extraRoomFee).toFixed(2)}</div>
                    </ListGroup.Item>
                  )}
                  
                  {/* 非会员价 */}
                  {!isOperator() && orderData.nonAgentPrice > 0 && (
                    <ListGroup.Item className="d-flex justify-content-between px-0 text-muted">
                      <div>非会员价</div>
                      <div className="text-end">
                        <del>${Number(orderData.nonAgentPrice).toFixed(2)}</del>
                      </div>
                    </ListGroup.Item>
                  )}
                  
                  {/* 原价和折扣 */}
                  {!isOperator() && orderData.originalPrice > 0 && orderData.originalPrice !== orderData.totalPrice && (
                    <ListGroup.Item className="d-flex justify-content-between px-0 text-muted">
                      <div>原价</div>
                      <div className="text-end">
                        <del>${Number(orderData.originalPrice).toFixed(2)}</del>
                        {orderData.discountRate && 
                          <small className="ms-2 text-success">({(Number(orderData.discountRate) * 100).toFixed(0)}折)</small>
                        }
                      </div>
                    </ListGroup.Item>
                  )}
                  
                  {/* 订单总价 */}
                  <ListGroup.Item className="d-flex justify-content-between fw-bold px-0 border-top mt-2 pt-2">
                    <span>订单总额</span>
                    {isOperator() ? (
                      <span className="text-muted">价格已隐藏</span>
                    ) : (
                      <span className="text-primary">${Number(orderData.totalPrice || 0).toFixed(2)}</span>
                    )}
                  </ListGroup.Item>
                </ListGroup>
              </div>
            </Card.Body>
            {orderData.paymentStatus === 'unpaid' && orderData.status !== 'cancelled' && (
              <Card.Footer className="bg-white border-top text-center">
                <Button variant="primary" size="lg" className="pay-button" onClick={() => navigate('/payment/' + (orderData.bookingId || orderData.id || orderData.orderNumber))}>
                  立即支付
                </Button>
              </Card.Footer>
            )}
          </Card>
          
          {/* 联系人信息 */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">联系人信息</h2>
            </Card.Header>
            <Card.Body>
              <div className="mt-4 p-3 border rounded">
                <h5 className="h6 mb-3 border-bottom pb-2">联系人信息</h5>
                <Row>
                  <Col md={6} className="mb-2">
                    <div className="text-muted small">联系人</div>
                    <div className="fw-medium">{orderData.contactPerson || '未提供'}</div>
                  </Col>
                  <Col md={6} className="mb-2">
                    <div className="text-muted small">联系电话</div>
                    <div className="fw-medium">{orderData.contactPhone || '未提供'}</div>
                  </Col>
                  {orderData.passengerContact && (
                    <Col md={6} className="mb-2">
                      <div className="text-muted small">乘客联系方式</div>
                      <div className="fw-medium">{orderData.passengerContact}</div>
                    </Col>
                  )}
                </Row>
              </div>
              
              {/* 显示乘客信息（如果有） */}
              {orderData.passengers && orderData.passengers.length > 0 && (
                <div className="mt-4">
                  <h5 className="h6 mb-3">乘客信息</h5>
                  {orderData.passengers.map((passenger, index) => (
                    <div key={index} className="passenger-item mb-3 p-3 border rounded">
                      <h6 className="mb-3 border-bottom pb-2">乘客 {index + 1}</h6>
                      <Row>
                        <Col md={6} className="mb-2">
                          <div className="text-muted small">姓名</div>
                          <div className="fw-medium">{passenger.fullName || '未提供'}</div>
                        </Col>
                        <Col md={6} className="mb-2">
                          <div className="text-muted small">性别</div>
                          <div className="fw-medium">{passenger.gender || '未提供'}</div>
                        </Col>
                        {passenger.isChild && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">儿童年龄</div>
                            <div className="fw-medium">{passenger.childAge || '未提供'}</div>
                          </Col>
                        )}
                        {passenger.phone && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">电话</div>
                            <div className="fw-medium">{passenger.phone}</div>
                          </Col>
                        )}
                        {passenger.wechatId && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">微信号</div>
                            <div className="fw-medium">{passenger.wechatId}</div>
                          </Col>
                        )}
                        {passenger.email && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">邮箱</div>
                            <div className="fw-medium">{passenger.email}</div>
                          </Col>
                        )}
                        {passenger.passportNumber && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">护照号码</div>
                            <div className="fw-medium">{passenger.passportNumber}</div>
                          </Col>
                        )}
                        {passenger.nationality && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">国籍</div>
                            <div className="fw-medium">{passenger.nationality}</div>
                          </Col>
                        )}
                        {passenger.dateOfBirth && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">出生日期</div>
                            <div className="fw-medium">{formatDate(passenger.dateOfBirth)}</div>
                          </Col>
                        )}
                        {passenger.emergencyContactName && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">紧急联系人</div>
                            <div className="fw-medium">{passenger.emergencyContactName}</div>
                          </Col>
                        )}
                        {passenger.emergencyContactPhone && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">紧急联系电话</div>
                            <div className="fw-medium">{passenger.emergencyContactPhone}</div>
                          </Col>
                        )}
                        {passenger.medicalConditions && (
                          <Col md={12} className="mb-2">
                            <div className="text-muted small">健康状况</div>
                            <div className="fw-medium">{passenger.medicalConditions}</div>
                          </Col>
                        )}
                        {passenger.dietaryRequirements && (
                          <Col md={12} className="mb-2">
                            <div className="text-muted small">饮食要求</div>
                            <div className="fw-medium">{passenger.dietaryRequirements}</div>
                          </Col>
                        )}
                        {passenger.specialRequests && (
                          <Col md={12} className="mb-2">
                            <div className="text-muted small">特殊要求</div>
                            <div className="fw-medium">{passenger.specialRequests}</div>
                          </Col>
                        )}
                        {passenger.checkInStatus && passenger.checkInStatus !== 'not_checked' && (
                          <Col md={6} className="mb-2">
                            <div className="text-muted small">签到状态</div>
                            <div className="fw-medium">{passenger.checkInStatus === 'checked_in' ? '已签到' : '签到状态: ' + passenger.checkInStatus}</div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  ))}
                </div>
              )}
              
              {orderData.specialRequests && (
                <div className="mt-3 pt-3 border-top">
                  <div className="text-muted mb-1">特殊要求</div>
                  <div>{orderData.specialRequests}</div>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* 备注信息 (如果有) */}
          {orderData.remark && (
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h2 className="h5 mb-0">备注信息</h2>
              </Card.Header>
              <Card.Body>
                <p className="mb-0">{orderData.remark}</p>
              </Card.Body>
            </Card>
          )}
          
          {/* 行程须知 */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">行程须知</h2>
            </Card.Header>
            <Card.Body>
              <div className="notice-list">
                <div className="notice-item mb-3">
                  <h5 className="h6 mb-2">重要提示</h5>
                  <ul className="mb-0">
                    <li>导游有权根据天气，交通或其他人为不定因素而调整行程安排改变参观景点顺序（不减少旅游景点）</li>
                    <li>游客须听从导游指导，个人行为所引起一切的后果由游客个人负责</li>
                    <li>团友须准时集合，逾时不侯，费用不退</li>
                    <li>塔斯马尼亚气候较冷，请来之前查询天气预告</li>
                    <li>新鲜蔬菜，水果，肉类不允许带进塔斯马尼亚</li>
                    <li>塔斯马尼亚所有住宿房间均为无烟房间，在房间（包括洗手间）吸烟者，将有可能被依法收取罚款</li>
                  </ul>
                </div>
                
                <div className="notice-item mb-3">
                  <h5 className="h6 mb-2">住宿说明</h5>
                  <ul className="mb-0">
                    <li>3人间提供一张双人床和一张单人床（可能为滚轮床）</li>
                    <li>酒店入住时间通常为下午14:00后，退房时间为上午11:00前</li>
                    <li>部分酒店可能需要支付押金，退房时无损坏将退还</li>
                  </ul>
                </div>
                
                <div className="notice-item mb-3">
                  <h5 className="h6 mb-2">出行前准备</h5>
                  <ul className="mb-0">
                    <li>请在出行前确认您的护照/身份证等证件的有效期</li>
                    <li>建议携带适当现金和信用卡，以备不时之需</li>
                    <li>塔斯马尼亚天气多变，请携带防晒、防雨和保暖衣物</li>
                  </ul>
                </div>
                
                <div className="notice-item mb-3">
                  <h5 className="h6 mb-2">集合说明</h5>
                  <ul className="mb-0">
                    <li>请务必按照确认函上指定的时间和地点集合</li>
                    <li>建议提前15分钟到达集合地点</li>
                    <li>如有特殊情况，请提前联系客服</li>
                  </ul>
                </div>
                
                <div className="notice-item mb-3">
                  <h5 className="h6 mb-2">退改规则</h5>
                  <ul className="mb-0">
                    <li>出行前7天以上取消，全额退款</li>
                    <li>出行前3-7天取消，退还50%费用</li>
                    <li>出行前3天内取消，不予退款</li>
                  </ul>
                </div>
                
                <div className="notice-item">
                  <h5 className="h6 mb-2">紧急联系方式</h5>
                  <p className="mb-0">Emergency No: 0459 233 894 (Peter)</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* 右侧操作栏 */}
        <Col lg={4}>
          {/* 订单操作 */}
          <Card className="action-card mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">订单操作</h2>
            </Card.Header>
            <Card.Body>
              <div className="action-buttons">
                {/* 发票下载权限控制：操作员不能下载发票（显示具体金额），只能下载确认单 */}
                {orderData.paymentStatus === 'paid' && !isOperator() ? (
                  <Button variant="outline-primary" className="w-100 mb-3" onClick={handleDownloadDocument}>
                    <FaDownload className="me-2" /> 下载发票
                  </Button>
                ) : (
                  <Button variant="outline-primary" className="w-100 mb-3" onClick={handleDownloadDocument}>
                    <FaDownload className="me-2" /> 下载确认单
                  </Button>
                )}
                
                {/* 未支付且未取消订单才显示支付、修改和取消按钮 */}
                {orderData.paymentStatus === 'unpaid' && orderData.status !== 'cancelled' && (
                  <>
                    <Button 
                      variant="primary" 
                      className="w-100 mb-3"
                      onClick={() => navigate('/payment/' + (orderData.bookingId || orderData.id || orderData.orderNumber))}
                    >
                      立即支付
                    </Button>
                    
                    {/* 修改订单按钮 - 使用更严格的条件判断 */}
                    {canEditOrder() ? (
                      <Button 
                        variant="warning" 
                        className="w-100 mb-3"
                        onClick={handleStartEdit}
                      >
                        <FaEdit className="me-2" /> 修改订单信息
                      </Button>
                    ) : (
                      <Alert variant="warning" className="py-2 px-3 mb-3 small">
                        <FaInfoCircle className="me-2" />
                        {orderData.paymentStatus === 'paid' ? '已支付订单不可修改' : 
                         orderData.status === 'completed' ? '已完成订单不可修改' :
                         orderData.status === 'cancelled' ? '已取消订单不可修改' : 
                         '订单当前状态不可修改'}
                      </Alert>
                    )}
                    
                    {showCancelConfirm ? (
                      <div className="cancel-confirm p-3 mb-3 border rounded">
                        <p className="text-danger mb-3">确定要取消此订单吗？此操作不可恢复。</p>
                        <div className="d-flex">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            className="me-2 flex-grow-1"
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={cancelLoading}
                          >
                            返回
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            className="flex-grow-1"
                            onClick={handleCancelOrder}
                            disabled={cancelLoading}
                          >
                            {cancelLoading ? '处理中...' : '确认取消'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline-danger" 
                        className="w-100 mb-3"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        <FaTimes className="me-2" /> 取消订单
                      </Button>
                    )}
                  </>
                )}
                
                {/* 对于已支付但未完成的订单，仍显示修改按钮 */}
                {orderData.paymentStatus === 'paid' && orderData.status !== 'completed' && orderData.status !== 'cancelled' && (
                  <>
                    {canEditOrder() ? (
                      <Button 
                        variant="warning" 
                        className="w-100 mb-3"
                        onClick={handleStartEdit}
                      >
                        <FaEdit className="me-2" /> 修改订单信息
                      </Button>
                    ) : (
                      <Alert variant="info" className="py-2 px-3 mb-3 small">
                        <FaInfoCircle className="me-2" />
                        已支付订单如需修改请联系客服
                      </Alert>
                    )}
                  </>
                )}
                
                <Link to="/orders" className="d-block">
                  <Button variant="outline-secondary" className="w-100">
                    返回订单列表
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
          
          {/* 客服帮助卡片 */}
          <Card className="help-card border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">需要帮助?</h2>
            </Card.Header>
            <Card.Body>
              <div className="customer-service">
                <div className="service-item mb-3 d-flex align-items-center">
                  <div className="service-icon me-3">
                    <FaPhoneAlt className="text-primary" size={18} />
                  </div>
                  <div className="service-info">
                    <div className="service-title fw-medium">客服电话</div>
                    <div className="service-value">+61 3 1234 5678</div>
                  </div>
                </div>
                <div className="service-item mb-3 d-flex align-items-center">
                  <div className="service-icon me-3">
                    <FaWeixin className="text-success" size={18} />
                  </div>
                  <div className="service-info">
                    <div className="service-title fw-medium">微信客服</div>
                    <div className="service-value">HappyTassie</div>
                  </div>
                </div>
                <div className="service-item d-flex align-items-center">
                  <div className="service-icon me-3">
                    <FaInfoCircle className="text-info" size={18} />
                  </div>
                  <div className="service-info">
                    <div className="service-title fw-medium">服务时间</div>
                    <div className="service-value">周一至周日 9:00-18:00</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* 编辑订单弹窗 */}
      <Modal 
        show={showEditModal} 
        onHide={handleCancelEdit} 
        size="lg" 
        backdrop="static" 
        keyboard={false}
        className="order-edit-modal"
      >
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title><FaEdit className="me-2" /> 修改订单信息</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editFormData && (
            <>
              {/* 价格敏感字段提示 */}
              <Alert variant="warning" className="mb-4">
                <Alert.Heading className="h6">
                  ⚠️ 重要提示
                </Alert.Heading>
                <p className="mb-2">
                  <strong>以下涉及价格变动的字段已被禁用：</strong>
                </p>
                <ul className="mb-2 small">
                  <li>人数变更（成人数量、儿童数量）</li>
                  <li>酒店信息（酒店等级、房间类型、房间数量）</li>
                  <li>行程日期变更</li>
                  <li>接送地点变更</li>
                </ul>
                <hr />
                <p className="mb-0 small">
                  <strong>如需修改以上信息，请联系客服：</strong><br />
                  📞 客服热线：<strong>1800-123-456</strong><br />
                  💬 在线客服：点击右下角聊天按钮<br />
                  📧 邮箱：<strong>support@happytassietravel.com</strong>
                </p>
              </Alert>
              
              <Alert variant="info" className="mb-4">
                <FaInfoCircle className="me-2" /> 
                您可以修改下列非价格相关的订单信息。完成修改后，请点击"保存修改"按钮。
              </Alert>
              
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>航班号</Form.Label>
                      <Form.Control
                        type="text"
                        name="flightNumber"
                        value={editFormData.flightNumber}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('flightNumber')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>返程航班号</Form.Label>
                      <Form.Control
                        type="text"
                        name="returnFlightNumber"
                        value={editFormData.returnFlightNumber}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('returnFlightNumber')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('行程开始日期', 'tourStartDate')}
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="tourStartDate"
                        value={editFormData.tourStartDate}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('tourStartDate')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('行程结束日期', 'tourEndDate')}
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="tourEndDate"
                        value={editFormData.tourEndDate}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('tourEndDate')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>接客日期</Form.Label>
                      <Form.Control
                        type="date"
                        name="pickupDate"
                        value={editFormData.pickupDate}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('pickupDate')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>送客日期</Form.Label>
                      <Form.Control
                        type="date"
                        name="dropoffDate"
                        value={editFormData.dropoffDate}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('dropoffDate')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('接客地点', 'pickupLocation')}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="pickupLocation"
                        value={editFormData.pickupLocation}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('pickupLocation')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('送客地点', 'dropoffLocation')}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="dropoffLocation"
                        value={editFormData.dropoffLocation}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('dropoffLocation')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('成人数量', 'adultCount')}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="adultCount"
                        value={editFormData.adultCount}
                        onChange={handleEditFormChange}
                        min="1"
                        disabled={isFieldDisabled('adultCount')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('儿童数量', 'childCount')}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="childCount"
                        value={editFormData.childCount}
                        onChange={handleEditFormChange}
                        min="0"
                        disabled={isFieldDisabled('childCount')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>行李数量</Form.Label>
                      <Form.Control
                        type="number"
                        name="luggageCount"
                        value={editFormData.luggageCount}
                        onChange={handleEditFormChange}
                        min="0"
                        disabled={isFieldDisabled('luggageCount')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>联系人</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPerson"
                        value={editFormData.contactPerson}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('contactPerson')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>联系电话</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPhone"
                        value={editFormData.contactPhone}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('contactPhone')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('酒店等级', 'hotelLevel')}
                      </Form.Label>
                      <Form.Select
                        name="hotelLevel"
                        value={editFormData.hotelLevel}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('hotelLevel')}
                      >
                        <option value="">不指定</option>
                        <option value="3星">3星级</option>
                        <option value="4星">4星级</option>
                        <option value="5星">5星级</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('房间类型', 'roomType')}
                      </Form.Label>
                      <Form.Select
                        name="roomType"
                        value={editFormData.roomType}
                        onChange={handleEditFormChange}
                        disabled={isFieldDisabled('roomType')}
                      >
                        <option value="">不指定</option>
                        <option value="单人房">单人房</option>
                        <option value="双床房">双床房</option>
                        <option value="大床房">大床房</option>
                        <option value="家庭房">家庭房</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {renderFieldLabel('房间数量', 'hotelRoomCount')}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="hotelRoomCount"
                        value={editFormData.hotelRoomCount}
                        onChange={handleEditFormChange}
                        min="1"
                        disabled={isFieldDisabled('hotelRoomCount')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>特殊要求</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="specialRequests"
                    value={editFormData.specialRequests}
                    onChange={handleEditFormChange}
                    rows={3}
                    disabled={isFieldDisabled('specialRequests')}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCancelEdit}
            disabled={editLoading}
          >
            <FaTimes className="me-2" /> 取消修改
          </Button>
          <Button 
            variant="success" 
            onClick={handleSaveEdit}
            disabled={editLoading}
          >
            {editLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                保存中...
              </>
            ) : (
              <>
                <FaSave className="me-2" /> 保存修改
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderDetail; 