import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ListGroup, Modal, Accordion, Spinner } from 'react-bootstrap';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaCalendarAlt, FaMapMarkerAlt, 
         FaUsers, FaHotel, FaClipboard, FaPhoneAlt, FaWeixin, 
         FaStar, FaBed, FaInfoCircle, FaChevronRight, FaTimes,
         FaUtensils, FaRoute, FaCalendarDay, FaExclamationTriangle, FaEnvelope, FaClock } from 'react-icons/fa';
import { BsGeoAlt, BsClock } from 'react-icons/bs';
import './OrderSuccess.css';
import { toast } from 'react-hot-toast';
import { cancelOrder } from '../../services/bookingService';
import axios from 'axios';
import { addAuthHeaders, isOperator } from '../../utils/auth';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 从location中获取传递的订单数据
  const receivedBookingData = location.state?.bookingData || null;
  const [orderData, setOrderData] = useState(null);
  
  // 取消订单相关状态
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // 新增行程信息状态
  const [itineraryData, setItineraryData] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  
  // 添加用户选择的可选行程信息
  const [selectedOptionalTours, setSelectedOptionalTours] = useState({});
  const [optionalToursDetails, setOptionalToursDetails] = useState({}); // 存储可选行程的详细信息
  
  // 添加推荐旅游产品数据
  const [recommendedTours, setRecommendedTours] = useState([
    {
      id: 4,
      title: "塔斯马尼亚东部精华3日游",
      location: "霍巴特出发",
      duration: "3天2晚",
      description: "探索塔斯马尼亚东海岸的自然美景和历史文化",
      imageUrl: "/images/east-tasmania-3days.jpg",
      price: 599
    },
    {
      id: 5,
      title: "摇篮山一日游",
      location: "朗塞斯顿出发",
      duration: "全天",
      description: "探索世界文化遗产摇篮山-圣克莱尔湖国家公园",
      imageUrl: "/images/cradle-mountain-day.jpg",
      price: 199
    },
    {
      id: 6,
      title: "布鲁尼岛美食之旅",
      location: "霍巴特出发",
      duration: "全天",
      description: "品尝布鲁尼岛上的新鲜海鲜和当地特色美食",
      imageUrl: "/images/bruny-island-food.jpg",
      price: 249
    }
  ]);
  
  // 在组件加载时处理订单数据
  useEffect(() => {
    if (receivedBookingData) {
      console.log('收到订单数据:', receivedBookingData);
      
      // 获取订单号和订单ID
      const orderNumber = receivedBookingData.orderNumber || 
                           receivedBookingData.order_number || 
                           orderId;
      const orderIdValue = receivedBookingData.bookingId || 
                          receivedBookingData.booking_id || 
                          orderId;
      
      // 获取旅游信息
      const tourInfo = location.state?.tourInfo || {};
      
      // 提取联系人信息，确保有值
      const contactPerson = 
        receivedBookingData.contactPerson || 
        receivedBookingData.contact_person || 
        receivedBookingData.passengerName || 
        receivedBookingData.passenger_name || 
        '游客';
      
      const contactPhone = 
        receivedBookingData.contactPhone || 
        receivedBookingData.contact_phone || 
        receivedBookingData.passengerPhone || 
        receivedBookingData.passenger_phone || 
        '未提供';
      
      // 处理订单数据
      const processedData = {
        id: orderNumber, // 订单号
        orderNumber: orderNumber, // 明确的订单号字段
        bookingId: orderIdValue, // 订单ID，用于API调用
        status: 'confirmed',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
                  total: receivedBookingData.totalPrice || receivedBookingData.total_price || 0,
          
          // 提取用户选择的可选行程信息
          selectedOptionalTours: receivedBookingData.selectedOptionalTours || null,
          
          // 保存所有可能用于确认单的数据
          pickupLocation: receivedBookingData.pickupLocation || receivedBookingData.pickup_location || '',
        pickupDate: receivedBookingData.pickupDate || receivedBookingData.pickup_date || '',
        departureDate: receivedBookingData.departureDate || receivedBookingData.departure_date || 
                      receivedBookingData.tourStartDate || receivedBookingData.tour_start_date || '',
        returnDate: receivedBookingData.returnDate || receivedBookingData.return_date || 
                   receivedBookingData.tourEndDate || receivedBookingData.tour_end_date || '',
        contactPerson: contactPerson,
        contactPhone: contactPhone,
                     
        tour: {
          id: receivedBookingData.tourId || receivedBookingData.tour_id,
          name: tourInfo.title || receivedBookingData.tourName || receivedBookingData.tour_name || '',
          startDate: tourInfo.startDate || receivedBookingData.tourStartDate || receivedBookingData.tour_start_date,
          endDate: tourInfo.endDate || receivedBookingData.tourEndDate || receivedBookingData.tour_end_date,
          duration: tourInfo.duration || receivedBookingData.duration || 0,
          adults: tourInfo.adultCount || receivedBookingData.adultCount || receivedBookingData.adult_count || 0,
          children: tourInfo.childCount || receivedBookingData.childCount || receivedBookingData.child_count || 0,
          hotelLevel: receivedBookingData.hotelLevel || receivedBookingData.hotel_level || '',
          roomCount: receivedBookingData.hotelRoomCount || receivedBookingData.hotel_room_count || 1,
          pickupLocation: receivedBookingData.pickupLocation || receivedBookingData.pickup_location || '',
          tourType: tourInfo.type || receivedBookingData.tourType || receivedBookingData.tour_type || 'day',
          hotelCheckInDate: receivedBookingData.hotelCheckInDate || receivedBookingData.hotel_check_in_date,
          hotelCheckOutDate: receivedBookingData.hotelCheckOutDate || receivedBookingData.hotel_check_out_date
        },
        contact: {
          name: contactPerson,
          phone: contactPhone,
        },
        payment: {
          method: '在线支付',
          status: '待支付',
          price: receivedBookingData.totalPrice || receivedBookingData.total_price || 0
        }
      };
      
      setOrderData(processedData);
    } else if (orderId) {
      // 如果有订单ID但没有数据，通过API获取订单数据
      console.log('通过API获取订单数据:', orderId);
      fetchOrderById(orderId);
    } else {
      // 没有订单数据和ID，返回首页
      navigate('/');
    }
  }, [receivedBookingData, orderId, location.state, navigate]);
  
  // 通过API获取订单详情
  const fetchOrderById = async (id) => {
    try {
      console.log('开始通过API获取订单详情:', id);
      const headers = addAuthHeaders();
      
      // 调用订单详情API
      const response = await axios.get(`/api/user/bookings/${id}`, { headers });
      
      console.log('获取订单详情结果:', response.data);
      
      if (response.data && (response.data.code === 1 || response.data.code === 200)) {
        const apiOrderData = response.data.data;
        
        // 提取联系人信息，确保有值
        const contactPerson = 
          apiOrderData.contactPerson || 
          apiOrderData.contact_person || 
          apiOrderData.passengerName || 
          apiOrderData.passenger_name || 
          '游客';
        
        const contactPhone = 
          apiOrderData.contactPhone || 
          apiOrderData.contact_phone || 
          apiOrderData.passengerPhone || 
          apiOrderData.passenger_phone || 
          '未提供';
        
        // 处理从API获取的订单数据
        const processedData = {
          id: apiOrderData.order_number || apiOrderData.orderNumber || id,
          orderNumber: apiOrderData.order_number || apiOrderData.orderNumber || id, // 明确的订单号字段
          bookingId: apiOrderData.id || id,
          status: apiOrderData.status || 'confirmed',
          paymentStatus: apiOrderData.payment_status || apiOrderData.paymentStatus || 'unpaid',
          createdAt: apiOrderData.created_at || apiOrderData.createdAt || new Date().toISOString(),
          total: apiOrderData.total_price || apiOrderData.totalPrice || 0,
          
          // 提取用户选择的可选行程信息
          selectedOptionalTours: apiOrderData.selectedOptionalTours || apiOrderData.selected_optional_tours || null,
          
          // 保存所有可能用于确认单的数据
          pickupLocation: apiOrderData.pickupLocation || apiOrderData.pickup_location || '',
          pickupDate: apiOrderData.pickupDate || apiOrderData.pickup_date || '',
          departureDate: apiOrderData.departureDate || apiOrderData.departure_date || 
                      apiOrderData.tourStartDate || apiOrderData.tour_start_date || '',
          returnDate: apiOrderData.returnDate || apiOrderData.return_date || 
                   apiOrderData.tourEndDate || apiOrderData.tour_end_date || '',
          contactPerson: contactPerson,
          contactPhone: contactPhone,
          
          tour: {
            id: apiOrderData.tour_id || apiOrderData.tourId,
            name: apiOrderData.tour_name || apiOrderData.tourName || '',
            startDate: apiOrderData.tour_start_date || apiOrderData.tourStartDate,
            endDate: apiOrderData.tour_end_date || apiOrderData.tourEndDate,
            duration: apiOrderData.duration || 1,
            adults: apiOrderData.adult_count || apiOrderData.adultCount || 0,
            children: apiOrderData.child_count || apiOrderData.childCount || 0,
            hotelLevel: apiOrderData.hotel_level || apiOrderData.hotelLevel || '',
            roomCount: apiOrderData.hotel_room_count || apiOrderData.hotelRoomCount || 1,
            pickupLocation: apiOrderData.pickup_location || apiOrderData.pickupLocation || '',
            tourType: apiOrderData.tour_type || apiOrderData.tourType || 'day',
            hotelCheckInDate: apiOrderData.hotel_check_in_date || apiOrderData.hotelCheckInDate,
            hotelCheckOutDate: apiOrderData.hotel_check_out_date || apiOrderData.hotelCheckOutDate,
          },
          contact: {
            name: contactPerson,
            phone: contactPhone,
          },
          payment: {
            method: apiOrderData.payment_method || apiOrderData.paymentMethod || '在线支付',
            status: apiOrderData.payment_status || apiOrderData.paymentStatus || '待支付',
            price: apiOrderData.total_price || apiOrderData.totalPrice || 0
          }
        };
        
        console.log('处理后的订单数据:', processedData);
        setOrderData(processedData);
      } else {
        console.error('API返回错误:', response.data);
        // 设置一个基本的订单数据结构
        setOrderData({
          id: id,
          bookingId: id,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          createdAt: new Date().toISOString(),
          contactPerson: '游客',
          contactPhone: '未提供',
          contact: { name: '游客', phone: '未提供' },
          tour: { id: '', duration: 1 } // 确保有一个空的tour对象
        });
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      // 设置一个基本的订单数据结构
      setOrderData({
        id: id,
        bookingId: id,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
        contactPerson: '游客',
        contactPhone: '未提供',
        contact: { name: '游客', phone: '未提供' },
        tour: { id: '', duration: 1 } // 确保有一个空的tour对象
      });
    }
  };
  
  // 处理用户选择的可选行程
  useEffect(() => {
    if (orderData && orderData.selectedOptionalTours) {
      try {
        let parsedOptionalTours = {};
        
        // 如果是字符串，解析JSON
        if (typeof orderData.selectedOptionalTours === 'string') {
          parsedOptionalTours = JSON.parse(orderData.selectedOptionalTours);
        } else if (typeof orderData.selectedOptionalTours === 'object') {
          parsedOptionalTours = orderData.selectedOptionalTours;
        }
        
        console.log('用户选择的可选行程:', parsedOptionalTours);
        setSelectedOptionalTours(parsedOptionalTours);
        
        // 获取选择的行程详情
        fetchOptionalToursDetails(parsedOptionalTours);
      } catch (error) {
        console.error('解析选择的可选行程失败:', error);
      }
    }
  }, [orderData]);

  // 获取行程信息
  useEffect(() => {
    if (orderData && orderData.tour && orderData.tour.id) {
      console.log('准备获取行程信息:', orderData.tour.id, orderData.tour.tourType);
      fetchTourItinerary(orderData.tour.id, orderData.tour.tourType || 'day');
    } else {
      console.log('无法获取行程信息 - 缺少必要数据:', orderData);
    }
  }, [orderData]);
  
  // 获取用户选择的可选行程详情
  const fetchOptionalToursDetails = async (selectedTours) => {
    if (!selectedTours || Object.keys(selectedTours).length === 0) return;
    
    try {
      const headers = addAuthHeaders();
      const tourDetails = {};
      
      // 为每个选择的行程获取详情
      for (const [day, tourId] of Object.entries(selectedTours)) {
        try {
          const response = await axios.get(`/api/user/day-tours/${tourId}`, { headers });
          if (response.data && (response.data.code === 1 || response.data.code === 200)) {
            tourDetails[day] = response.data.data;
            console.log(`第${day}天选择的行程详情:`, response.data.data);
          }
        } catch (error) {
          console.error(`获取第${day}天行程详情失败:`, error);
        }
      }
      
      setOptionalToursDetails(tourDetails);
    } catch (error) {
      console.error('获取可选行程详情失败:', error);
    }
  };

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
  
  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  // 复制订单号到剪贴板
  const copyOrderNumber = () => {
    if (!orderData) return;
    
    const orderNumberToCopy = orderData.orderNumber || orderData.id;
    navigator.clipboard.writeText(orderNumberToCopy)
      .then(() => toast.success('订单号已复制到剪贴板'))
      .catch(err => {
        console.error('复制失败: ', err);
        toast.error('复制失败，请手动复制');
      });
  };
  
  // 下载订单确认单

  
  // 返回产品详情
  const handleBackToDetail = () => {
    const tourId = orderData?.tour?.id || 
                  location.state?.tourInfo?.id || 
                  receivedBookingData?.tourId;
    
    const tourType = location.state?.tourInfo?.type || 
                    receivedBookingData?.tourType || 
                    orderData?.tour?.tourType || 
                    'day';
    
    if (tourId) {
      const tourPrefix = tourType.toLowerCase().includes('group') ? 'group' : 'day';
      navigate(`/${tourPrefix}-tours/${tourId}`);
    } else {
      navigate('/');
    }
  };
  
  // 不再需要处理取消订单功能，用户需要联系客服取消
  
  // 如果订单数据尚未加载，显示加载中
  if (!orderData) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3">正在加载订单信息...</p>
      </Container>
    );
  }
  
  return (
    <Container className="order-success-page py-5">


      {/* 成功状态标题 */}
      <div className="success-header text-center mb-4">
        <div className="success-icon mb-3">
          <FaCheckCircle size={64} className="text-success" />
        </div>
        <h1 className="mb-2">预订成功</h1>
        <p className="lead text-muted mb-0">感谢您的预订，您的订单已确认</p>
        <div className="order-number mt-3 d-flex align-items-center justify-content-center">
          <span className="text-muted me-2">订单号:</span>
          <strong className="me-2">{orderData.orderNumber || orderData.id || '未知'}</strong>
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
                <h3 className="h5 mb-3">{orderData.tour.name}</h3>
                
                <div className="product-meta d-flex flex-wrap mb-3">
                  <div className="product-meta-item me-4 mb-2">
                    <FaCalendarAlt className="me-2 text-primary" />
                    <span className="text-muted">行程日期:</span> {formatDate(orderData.tour.startDate)}
                    {orderData.tour.endDate && orderData.tour.endDate !== orderData.tour.startDate 
                      ? ` - ${formatDate(orderData.tour.endDate)}` 
                      : ''}
                  </div>
                  
                  <div className="product-meta-item me-4 mb-2">
                    <FaUsers className="me-2 text-primary" />
                    <span className="text-muted">出行人数:</span> {orderData.tour.adults}成人 
                    {orderData.tour.children > 0 ? `, ${orderData.tour.children}儿童` : ''}
                  </div>
                  
                  {orderData.tour.duration > 1 && (
                    <div className="product-meta-item me-4 mb-2">
                      <FaCalendarAlt className="me-2 text-primary" />
                      <span className="text-muted">行程天数:</span> {orderData.tour.duration}天
                      {orderData.tour.duration > 1 ? `${orderData.tour.duration - 1}晚` : ''}
                    </div>
                  )}
                </div>
                
                {(orderData.tour.hotelLevel && orderData.tour.duration > 1) && (
                  <div className="hotel-info bg-light p-3 rounded mb-3">
                    <h4 className="h6 mb-2">
                      <FaHotel className="me-2 text-primary" />
                      住宿信息
                    </h4>
                    <div className="d-flex flex-wrap">
                      <div className="me-4 mb-2">
                        <span className="text-muted">酒店等级:</span> 
                        <Badge bg="info" className="ms-1">{orderData.tour.hotelLevel}</Badge>
                      </div>
                      <div className="me-4 mb-2">
                        <span className="text-muted">房间数量:</span> {orderData.tour.roomCount}间
                      </div>
                      <div className="me-4 mb-2">
                        <span className="text-muted">住宿晚数:</span> {orderData.tour.duration > 1 ? orderData.tour.duration - 1 : 0}晚
                      </div>
                      {/* 添加酒店入住日期 */}
                      {orderData.tour.hotelCheckInDate && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">入住日期:</span> {formatDate(orderData.tour.hotelCheckInDate)}
                        </div>
                      )}
                      {/* 添加酒店退房日期 */}
                      {orderData.tour.hotelCheckOutDate && (
                        <div className="me-4 mb-2">
                          <span className="text-muted">退房日期:</span> {formatDate(orderData.tour.hotelCheckOutDate)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {orderData.tour.pickupLocation && (
                  <div className="pickup-info">
                    <div className="mb-2">
                      <FaMapMarkerAlt className="me-2 text-primary" />
                      <span className="text-muted">接送地点:</span> {orderData.tour.pickupLocation}
                    </div>
                  </div>
                )}
                
                {/* 行程安排 */}
                {itineraryData && (
                  <div className="itinerary-info bg-light p-3 rounded mt-3">
                    <h4 className="h6 mb-3">
                      <FaRoute className="me-2 text-primary" />
                      行程安排
                    </h4>
                    
                    {itineraryLoading ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" role="status" size="sm">
                          <span className="visually-hidden">加载中...</span>
                        </Spinner>
                        <span className="ms-2">加载行程信息...</span>
                      </div>
                    ) : itineraryError ? (
                      <Alert variant="warning">
                        <FaExclamationTriangle className="me-2" />
                        无法加载行程详情，请刷新页面或稍后再试。
                      </Alert>
                    ) : (
                      <>
                        {/* 一日游显示简单描述 */}
                        {orderData.tour.tourType && orderData.tour.tourType.toLowerCase().includes('day') && !orderData.tour.tourType.toLowerCase().includes('group') ? (
                          <div className="day-tour-description">
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
                                <h5 className="h6 mb-2 fw-medium">行程详情:</h5>
                                {itineraryData.itinerary.sort((a, b) => a.day_number - b.day_number).map((day, index) => (
                                  <div key={index} className="day-detail mb-3 p-3 bg-white rounded border">
                                    <h6 className="mb-2">{day.title ? day.title.replace(`第${day.day_number || (index + 1)}天: `, '').replace(`第${day.day_number || (index + 1)}天：`, '') : '行程详情'}</h6>
                                    <div dangerouslySetInnerHTML={{ __html: day.description || '暂无详细描述' }} />
                                    
                                    <div className="d-flex flex-wrap mt-2">
                                      {day.accommodation && (
                                        <div className="me-4 mb-2">
                                          <FaBed className="me-1 text-primary" />
                                          <span className="text-muted">住宿:</span> {day.accommodation}
                                        </div>
                                      )}
                                      
                                      {day.meals && (
                                        <div className="me-4 mb-2">
                                          <FaUtensils className="me-1 text-primary" />
                                          <span className="text-muted">餐食:</span> {day.meals}
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
                            <Accordion defaultActiveKey="0" className="itinerary-accordion">
                              {itineraryData.itinerary.sort((a, b) => a.day_number - b.day_number).map((day, index) => {
                                const dayNumber = day.day_number || (index + 1);
                                const selectedTourForDay = optionalToursDetails[dayNumber];
                                
                                return (
                                  <Accordion.Item eventKey={String(index)} key={index} className="mb-2 border">
                                    <Accordion.Header>
                                      <div className="d-flex align-items-center">
                                        <Badge bg="primary" className="me-2">Day {dayNumber}</Badge>
                                        <span className="fw-medium">
                                          {selectedTourForDay ? (
                                            // 显示用户选择的具体行程
                                            selectedTourForDay.title || selectedTourForDay.name || `第${dayNumber}天行程安排`
                                          ) : (
                                            // 显示默认行程
                                            day.title ? day.title.replace(`第${dayNumber}天: `, '').replace(`第${dayNumber}天：`, '') : `第${dayNumber}天行程安排`
                                          )}
                                        </span>
                                        {selectedTourForDay && (
                                          <Badge bg="success" className="ms-2">已选择</Badge>
                                        )}
                                      </div>
                                    </Accordion.Header>
                                    <Accordion.Body>
                                      <div className="itinerary-content">
                                        {selectedTourForDay ? (
                                          // 显示用户选择的行程详情
                                          <>
                                            <div className="mb-3">
                                              <div dangerouslySetInnerHTML={{ 
                                                __html: selectedTourForDay.description || selectedTourForDay.content || '暂无详细描述' 
                                              }} />
                                            </div>
                                            {selectedTourForDay.duration && (
                                              <div className="mb-2">
                                                <FaClock className="me-1 text-primary" />
                                                <span className="text-muted">时长:</span> {selectedTourForDay.duration}
                                              </div>
                                            )}
                                            {selectedTourForDay.inclusions && (
                                              <div className="mb-2">
                                                <FaCheckCircle className="me-1 text-success" />
                                                <span className="text-muted">包含:</span> {selectedTourForDay.inclusions}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          // 显示默认行程
                                          day.description && (
                                            <div className="mb-3">
                                              <div dangerouslySetInnerHTML={{ __html: day.description }} />
                                            </div>
                                          )
                                        )}
                                        
                                        <div className="d-flex flex-wrap">
                                          {day.accommodation && (
                                            <div className="me-4 mb-2">
                                              <FaBed className="me-1 text-primary" />
                                              <span className="text-muted">住宿:</span> {day.accommodation}
                                            </div>
                                          )}
                                          
                                          {day.meals && (
                                            <div className="me-4 mb-2">
                                              <FaUtensils className="me-1 text-primary" />
                                              <span className="text-muted">餐食:</span> {day.meals}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </Accordion.Body>
                                  </Accordion.Item>
                                );
                              })}
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
                      </>
                    )}
                  </div>
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
                <Alert variant="warning" className="d-flex align-items-center">
                  <FaInfoCircle className="me-2" size={20} />
                  <div>
                    <span className="fw-bold">待支付</span> - 请在24小时内完成支付，否则订单将自动取消
                  </div>
                </Alert>
              </div>
            </Card.Body>
          </Card>
          
          {/* 联系人信息 */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">联系人信息</h2>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3 mb-md-0">
                  <div className="contact-item">
                    <div className="text-muted mb-1">联系人</div>
                    <div className="fw-medium">{orderData.contact.name || '未设置'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="contact-item">
                    <div className="text-muted mb-1">联系电话</div>
                    <div className="fw-medium">{orderData.contact.phone || '未设置'}</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* 行程须知 */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">行程须知</h2>
            </Card.Header>
            <Card.Body>
              <div className="notice-list">
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
                <div className="notice-item">
                  <h5 className="h6 mb-2">退改规则</h5>
                  <ul className="mb-0">
                    <li>出行前7天以上取消，全额退款</li>
                    <li>出行前3-7天取消，退还50%费用</li>
                    <li>出行前3天内取消，不予退款</li>
                  </ul>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {/* 右侧操作栏 */}
        <Col lg={4}>
          {/* 操作卡片 */}
          <Card className="action-card mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h2 className="h5 mb-0">订单操作</h2>
            </Card.Header>
            <Card.Body>
              {/* 价格信息 */}
              <div className="price-details mb-4">
                <h4 className="h6 mb-3">费用明细</h4>
                <ListGroup variant="flush" className="price-list">
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <div>
                      {orderData.tour.adults > 0 && (
                        <div>成人 x {orderData.tour.adults}</div>
                      )}
                      {orderData.tour.children > 0 && (
                        <div>儿童 x {orderData.tour.children}</div>
                      )}
                    </div>
                    <div className="text-end">
                      {!isOperator() ? (
                        <div>${Number(orderData.payment.price).toFixed(2)}</div>
                      ) : (
                        <div className="text-muted">价格已隐藏</div>
                      )}
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between fw-bold px-0 border-top mt-2 pt-2">
                    <span>订单总额</span>
                    {!isOperator() ? (
                      <span className="text-primary">${Number(orderData.payment.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-muted">价格已隐藏</span>
                    )}
                  </ListGroup.Item>
                </ListGroup>
              </div>
              
              <div className="action-buttons">
                {/* 立即支付按钮 */}
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 mb-3 pay-button" 
                  onClick={() => navigate('/payment/' + (orderData.bookingId || orderData.id || orderData.orderNumber))}
                >
                  立即支付
                </Button>
                
                {/* 支付后下载提示 */}
                

                <Link to="/orders" className="w-100 mb-3 d-block">
                  <Button variant="outline-primary" className="w-100">
                    查看我的订单
                  </Button>
                </Link>
                {/* 只有未支付的订单才显示取消按钮 */}
                {orderData.paymentStatus === 'unpaid' && orderData.status !== 'cancelled' && (
                  <Button 
                    variant="outline-danger" 
                    className="w-100 mb-3"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <FaTimes className="me-2" /> 申请取消订单
                  </Button>
                )}
                <Button 
                  variant="outline-success" 
                  className="w-100 mb-3"
                  onClick={() => navigate('/booking-form')}
                >
                  <FaCalendarAlt className="me-2" /> 再来一单
                </Button>
                <Button variant="outline-secondary" className="w-100" onClick={handleBackToDetail}>
                  返回产品详情
                </Button>
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
                    <div className="service-value">0449944988</div>
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
                <div className="service-item mb-3 d-flex align-items-center">
                  <div className="service-icon me-3">
                    <FaInfoCircle className="text-info" size={18} />
                  </div>
                  <div className="service-info">
                    <div className="service-title fw-medium">客服邮箱</div>
                    <div className="service-value">Tom.Zhang@htas.com.au</div>
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
      
      {/* 推荐的旅游产品 */}
      {recommendedTours.length > 0 && (
        <section className="recommended-tours mt-5">
          <h2 className="section-title">您可能还会喜欢</h2>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-3">
            {recommendedTours.map((tour) => (
              <div className="col" key={tour.id}>
                <Card className="order-tour-card h-100 border-0 shadow-sm">
                  <Card.Img 
                    variant="top" 
                    src={tour.imageUrl} 
                    alt={tour.title}
                    style={{ height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => navigate('/booking-form')}
                    title="点击立即预订"
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title 
                      className="fs-5 mb-3" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/booking-form')}
                      title="点击立即预订"
                    >
                      {tour.title}
                    </Card.Title>
                    <div className="d-flex align-items-center mb-2">
                      <BsGeoAlt className="text-primary me-2" />
                      <small className="text-muted">{tour.location}</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <BsClock className="text-primary me-2" />
                      <small className="text-muted">{tour.duration}</small>
                    </div>
                    <p className="small text-muted flex-grow-1 mb-3">{tour.description}</p>
                    <div className="d-flex justify-content-between align-items-center mt-auto">
                      {!isOperator() ? (
                        <div className="fs-5 fw-bold text-primary">${tour.price}</div>
                      ) : (
                        <div className="fs-5 fw-bold text-muted">价格已隐藏</div>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => navigate('/booking-form')}
                      >
                        立即预订
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 取消订单联系客服对话框 */}
      <Modal show={showCancelConfirm} onHide={() => setShowCancelConfirm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>申请取消订单</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <FaInfoCircle className="text-info mb-2" size={48} />
            <h5>需要取消订单？</h5>
            <p className="text-muted">请联系我们的客服团队，我们将为您处理订单取消事宜。</p>
          </div>
          
          <div className="contact-info">
            <h6 className="mb-3 text-center">联系客服：</h6>
            <Row>
              <Col md={4} className="mb-3">
                <div className="text-center">
                  <div className="mb-2">
                    <FaWeixin className="text-success" size={24} />
                  </div>
                  <h6 className="mb-2">微信客服</h6>
                  <div className="qr-code-placeholder mb-2" style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f8f9fa',
                    border: '1px dashed #dee2e6',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#6c757d'
                  }}>
                    微信二维码
                    <br />
                    (占位图)
                  </div>
                  <small className="text-muted">扫码添加客服微信</small>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="text-center">
                  <div className="mb-2">
                    <FaEnvelope className="text-primary" size={24} />
                  </div>
                  <h6 className="mb-2">客服邮箱</h6>
                  <p className="mb-2">Tom.Zhang@htas.com.au</p>
                  <small className="text-muted">我们会尽快回复您的邮件</small>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="text-center">
                  <div className="mb-2">
                    <FaPhoneAlt className="text-primary" size={24} />
                  </div>
                  <h6 className="mb-2">客服电话</h6>
                  <p className="mb-2">0449944988</p>
                  <small className="text-muted">服务时间：周一至周日 9:00-18:00</small>
                </div>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowCancelConfirm(false)}
            className="w-100"
          >
            我知道了
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderSuccess; 