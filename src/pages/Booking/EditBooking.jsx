import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaSave, FaCalendarAlt, FaUser, FaPhone, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { addAuthHeaders, isOperator } from '../../utils/auth';

const EditBooking = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [formData, setFormData] = useState({
    // 航班信息
    flightNumber: '',
    returnFlightNumber: '',
    arrivalLandingTime: '',
    departureDepartureTime: '',
    // 接送信息
    pickupDate: '',
    dropoffDate: '',
    pickupLocation: '',
    dropoffLocation: '',
    // 联系人信息
    contactPerson: '',
    contactPhone: '',
    // 其他信息
    specialRequests: '',
    // 价格敏感字段（仅用于显示）
    tourStartDate: '',
    tourEndDate: '',
    hotelLevel: '',
    roomType: '',
    hotelRoomCount: 1,
    adultCount: 1,
    childCount: 0
  });

  // 添加安全的日期格式化函数
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    
    try {
      let date;
      
      // 如果是字符串，尝试解析
      if (typeof dateValue === 'string') {
        // 如果包含空格，取日期部分
        if (dateValue.includes(' ')) {
          date = new Date(dateValue.split(' ')[0]);
        } else {
          date = new Date(dateValue);
        }
      } 
      // 如果是Date对象
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // 如果是数字（时间戳）
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // 其他情况，尝试直接转换
      else {
        date = new Date(dateValue);
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('无效的日期值:', dateValue);
        return '';
      }
      
      // 返回 YYYY-MM-DD 格式
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('日期格式化错误:', error, '原始值:', dateValue);
      return '';
    }
  };

  // 获取订单详情
  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = addAuthHeaders();
      const response = await axios.get(`/api/orders/${bookingId}`, { headers });
      
      if (response.data && response.data.code === 1) {
        const order = response.data.data;
        setOrderData(order);
        
        console.log('获取到的订单数据:', order);
        
        // 填充表单数据
        setFormData({
          // 航班信息 - 允许修改
          flightNumber: order.flightNumber || '',
          returnFlightNumber: order.returnFlightNumber || '',
          arrivalLandingTime: order.arrivalLandingTime || '',
          departureDepartureTime: order.departureDepartureTime || '',
          // 接送信息 - 允许修改
          pickupDate: formatDateForInput(order.pickupDate),
          dropoffDate: formatDateForInput(order.dropoffDate),
          pickupLocation: order.pickupLocation || '',
          dropoffLocation: order.dropoffLocation || '',
          // 联系人信息 - 允许修改
          contactPerson: order.contactPerson || '',
          contactPhone: order.contactPhone || '',
          // 其他信息 - 允许修改
          specialRequests: order.specialRequests || '',
          // 价格敏感字段 - 仅用于显示，不会提交
          tourStartDate: formatDateForInput(order.tourStartDate),
          tourEndDate: formatDateForInput(order.tourEndDate),
          hotelLevel: order.hotelLevel || '',
          roomType: order.roomType || '',
          hotelRoomCount: order.hotelRoomCount || 1,
          adultCount: order.adultCount || 1,
          childCount: order.childCount || 0
        });
      } else {
        setError(response.data?.message || '获取订单信息失败');
      }
    } catch (err) {
      console.error('获取订单详情失败:', err);
      setError(err.response?.data?.message || '获取订单信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && bookingId) {
      fetchOrderData();
    }
  }, [isAuthenticated, bookingId]);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 检查是否为价格敏感字段
  const isPriceSensitiveField = (fieldName) => {
    const priceSensitiveFields = [
      'adultCount',           // 成人数量
      'childCount',           // 儿童数量  
      'hotelRoomCount',       // 房间数量
      'hotelLevel',           // 酒店等级
      'roomType',             // 房间类型
      'tourStartDate',        // 行程开始日期
      'tourEndDate'           // 行程结束日期
      // 注意：接送地点和日期、航班信息现在允许修改
    ];
    return priceSensitiveFields.includes(fieldName);
  };

  // 检查字段是否应该被禁用
  const isFieldDisabled = (fieldName) => {
    // 基本禁用条件：已完成或已取消
    const basicDisabled = orderData.status === 'completed' || orderData.status === 'cancelled';
    
    // 价格敏感字段额外禁用（无论支付状态）
    const priceSensitiveDisabled = isPriceSensitiveField(fieldName);
    
    return basicDisabled || priceSensitiveDisabled;
  };

  // 渲染字段标签（包含禁用提示）
  const renderFieldLabel = (label, fieldName, icon = null) => {
    const isDisabled = isFieldDisabled(fieldName);
    const isPriceSensitive = isPriceSensitiveField(fieldName);
    
    return (
      <div className="d-flex align-items-center">
        {icon && <span className="me-2">{icon}</span>}
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

  // 提交修改
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderData) return;
    
    // 检查订单状态
    if (orderData.status === 'completed') {
      toast.error('已完成的订单无法修改');
      return;
    }
    
    if (orderData.status === 'cancelled') {
      toast.error('已取消的订单无法修改');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const headers = addAuthHeaders();
      // 准备更新数据 - 只发送允许修改的字段，过滤掉价格敏感字段和空值
      const rawFields = {
        bookingId: parseInt(bookingId),
        // 航班信息 - 允许修改
        flightNumber: formData.flightNumber,
        returnFlightNumber: formData.returnFlightNumber,
        arrivalLandingTime: formData.arrivalLandingTime,
        departureDepartureTime: formData.departureDepartureTime,
        // 接送信息 - 允许修改
        pickupDate: formData.pickupDate || null,
        dropoffDate: formData.dropoffDate || null,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        // 联系人信息 - 允许修改
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        // 其他非价格相关信息 - 允许修改
        specialRequests: formData.specialRequests
        // 注意：移除了价格敏感字段，包括：
        // tourStartDate, tourEndDate, adultCount, childCount,
        // hotelLevel, roomType, hotelRoomCount
      };
      
      // 过滤掉空字符串和null值，只发送有实际值的字段
      const allowedFields = Object.fromEntries(
        Object.entries(rawFields).filter(([key, value]) => {
          // bookingId必须保留
          if (key === 'bookingId') return true;
          // 过滤掉空字符串、null、undefined
          return value !== '' && value !== null && value !== undefined;
        })
      );
      
      const updateData = allowedFields;
      
      console.log('发送的更新数据:', updateData);
      
      const response = await axios.put(`/api/orders/${bookingId}`, updateData, { headers });
      
      if (response.data && response.data.code === 1) {
        toast.success('订单修改成功');
        
        // 返回到订单列表或详情页
        const fromPage = location.state?.fromPage;
        if (fromPage === 'orders') {
          navigate('/orders', { 
            state: { pageParams: location.state?.pageParams }
          });
        } else {
          navigate(`/orders/${bookingId}`);
        }
      } else {
        toast.error(response.data?.message || '修改订单失败');
      }
    } catch (err) {
      console.error('修改订单失败:', err);
      toast.error(err.response?.data?.message || '修改订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 返回按钮处理
  const handleBack = () => {
    const fromPage = location.state?.fromPage;
    if (fromPage === 'orders') {
      navigate('/orders', { 
        state: { pageParams: location.state?.pageParams }
      });
    } else {
      navigate(`/orders/${bookingId}`);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    } catch (e) {
      return dateString;
    }
  };

  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先登录后再修改订单
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">加载中...</span>
        </Spinner>
        <p className="mt-2">正在加载订单信息...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="outline-primary" onClick={handleBack}>
          <FaArrowLeft className="me-2" />
          返回
        </Button>
      </Container>
    );
  }

  if (!orderData) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          未找到订单信息
        </Alert>
        <Button variant="outline-primary" onClick={handleBack}>
          <FaArrowLeft className="me-2" />
          返回
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-primary" onClick={handleBack} className="me-3">
          <FaArrowLeft className="me-2" />
          返回
        </Button>
        <div>
          <h2 className="mb-0">修改订单</h2>
          <small className="text-muted">订单号: {orderData.orderNumber}</small>
        </div>
      </div>

      {/* 订单状态检查 */}
      {orderData.paymentStatus === 'paid' && (
        <Alert variant="info" className="mb-4">
          此订单已支付，您可以修改非价格相关的信息。如需修改价格相关信息，请联系客服。
        </Alert>
      )}

      {orderData.status === 'completed' && (
        <Alert variant="warning" className="mb-4">
          此订单已完成，无法修改。如需变更，请联系客服。
        </Alert>
      )}

      {orderData.status === 'cancelled' && (
        <Alert variant="danger" className="mb-4">
          此订单已取消，无法修改。
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
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
            📞 客服热线：<strong>+61 3 1234 5678</strong><br />
            💬 微信客服：<strong>HappyTassie</strong><br />
            📧 邮箱：<strong>support@happytassietravel.com</strong>
          </p>
        </Alert>

        <Row>
          <Col lg={8}>
            {/* 基本信息 */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">基本信息</h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="warning" className="mb-3">
                  <FaInfoCircle className="me-2" />
                  <strong>注意：</strong>行程日期、人数、酒店信息等影响价格的字段不能修改。如需更改这些信息，请联系客服。
                </Alert>

                {/* 航班信息 */}
                <h6 className="mb-3 text-primary">航班信息</h6>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>到达航班号</Form.Label>
                      <Form.Control
                        type="text"
                        name="flightNumber"
                        value={formData.flightNumber}
                        onChange={handleInputChange}
                        placeholder="如：CA123"
                        disabled={isFieldDisabled('flightNumber')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>离开航班号</Form.Label>
                      <Form.Control
                        type="text"
                        name="returnFlightNumber"
                        value={formData.returnFlightNumber}
                        onChange={handleInputChange}
                        placeholder="如：CA456"
                        disabled={isFieldDisabled('returnFlightNumber')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>到达时间</Form.Label>
                      <Form.Control
                        type="text"
                        name="arrivalLandingTime"
                        value={formData.arrivalLandingTime}
                        onChange={handleInputChange}
                        placeholder="如：1430（14:30）"
                        disabled={isFieldDisabled('arrivalLandingTime')}
                      />
                      <Form.Text className="text-muted">
                        请输入4位数字，如：1430表示14:30
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>离开时间</Form.Label>
                      <Form.Control
                        type="text"
                        name="departureDepartureTime"
                        value={formData.departureDepartureTime}
                        onChange={handleInputChange}
                        placeholder="如：1645（16:45）"
                        disabled={isFieldDisabled('departureDepartureTime')}
                      />
                      <Form.Text className="text-muted">
                        请输入4位数字，如：1645表示16:45
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* 联系人信息 */}
                <h6 className="mb-3 text-primary mt-4">联系人信息</h6>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {renderFieldLabel('联系人姓名', 'contactPerson', <FaUser />)}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        placeholder="请输入联系人姓名"
                        disabled={isFieldDisabled('contactPerson')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {renderFieldLabel('联系电话', 'contactPhone', <FaPhone />)}
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="请输入联系电话"
                        disabled={isFieldDisabled('contactPhone')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 接送信息 */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">接送信息</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {renderFieldLabel('接机日期', 'pickupDate', <FaCalendarAlt />)}
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        disabled={isFieldDisabled('pickupDate')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {renderFieldLabel('送机日期', 'dropoffDate', <FaCalendarAlt />)}
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="dropoffDate"
                        value={formData.dropoffDate}
                        onChange={handleInputChange}
                        disabled={isFieldDisabled('dropoffDate')}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {renderFieldLabel('接机地点', 'pickupLocation', <FaMapMarkerAlt />)}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleInputChange}
                        placeholder="请输入接机地点"
                        disabled={isFieldDisabled('pickupLocation')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        {renderFieldLabel('送机地点', 'dropoffLocation', <FaMapMarkerAlt />)}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="dropoffLocation"
                        value={formData.dropoffLocation}
                        onChange={handleInputChange}
                        placeholder="请输入送机地点"
                        disabled={isFieldDisabled('dropoffLocation')}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 酒店信息已移除，不允许在订单修改中编辑 */}
            {/* 移除字段：酒店等级、房间类型等 */}

            {/* 特殊要求 */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">特殊要求</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  {renderFieldLabel('特殊要求', 'specialRequests')}
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    placeholder="请输入特殊要求（可选）"
                    disabled={isFieldDisabled('specialRequests')}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* 订单摘要 */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">订单摘要</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>产品名称:</strong>
                  <div className="text-muted">{orderData.tourName || '未知产品'}</div>
                </div>
                
                <div className="mb-3">
                  <strong>订单状态:</strong>
                  <div>
                    <span className={`badge bg-${orderData.status === 'pending' ? 'warning' : orderData.status === 'confirmed' ? 'success' : 'danger'}`}>
                      {orderData.status === 'pending' ? '待确认' : 
                       orderData.status === 'confirmed' ? '已确认' : 
                       orderData.status === 'cancelled' ? '已取消' : orderData.status}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <strong>支付状态:</strong>
                  <div>
                    <span className={`badge bg-${orderData.paymentStatus === 'paid' ? 'success' : orderData.paymentStatus === 'unpaid' ? 'warning' : 'danger'}`}>
                      {orderData.paymentStatus === 'paid' ? '已支付' : 
                       orderData.paymentStatus === 'unpaid' ? '未支付' : orderData.paymentStatus}
                    </span>
                  </div>
                </div>

                {!isOperator() && (
                  <div className="mb-3">
                    <strong>订单金额:</strong>
                    <div className="text-primary fs-5">
                      $${orderData.totalPrice?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <strong>创建时间:</strong>
                  <div className="text-muted">{formatDate(orderData.createdAt)}</div>
                </div>
              </Card.Body>
            </Card>

            {/* 操作按钮 */}
            <div className="d-grid gap-2">
              {orderData.status !== 'cancelled' && orderData.status !== 'completed' && (
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={submitting}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      保存修改
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline-secondary" onClick={handleBack} size="lg">
                取消修改
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default EditBooking; 