import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
// import DatePicker from 'react-datepicker'; // 改用HTML5 date input
import { toast } from 'react-hot-toast';
import {
  FaCalendarAlt, FaUsers, FaHotel, FaBed, FaPlane, FaSuitcase,
  FaMapMarkerAlt, FaPhone, FaUser, FaPassport, FaComments,
  FaCalendarDay, FaStar, FaCheck, FaTicketAlt, FaClock,
  FaRoute, FaPlus, FaMinus, FaInfoCircle, FaChevronUp, FaChevronDown, FaTimes,
  FaPercent, FaLanguage
} from 'react-icons/fa';

// 导入服务
import { createTourBooking, calculateTourPrice, getHotelPrices } from '../../services/bookingService';
import { getTourById } from '../../utils/api';

// 导入样式
// import 'react-datepicker/dist/react-datepicker.css'; // 改用HTML5 date input
import './booking.css';

const Booking = () => {
  // 基本状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [validated, setValidated] = useState(false);

  // 路由和用户信息
  const { tourId: urlTourId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, userType } = useSelector(state => state.auth);
  
  // 检查是否为游客模式（从URL路径判断）
  const isGuestMode = location.pathname.startsWith('/guest-booking');
  
  // 从URL查询参数获取tourId
  const searchParams = new URLSearchParams(location.search);
  const queryTourId = searchParams.get('tourId');
  const queryType = searchParams.get('type');

  // 从详情页传递的基本信息
  const [tourId, setTourId] = useState(urlTourId || queryTourId || null);
  const [tourType, setTourType] = useState(queryType || '');
  const [tourName, setTourName] = useState('');
  const [tourDetails, setTourDetails] = useState(null);

  // 价格计算相关状态
  const [finalPrice, setFinalPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [hotelPrices, setHotelPrices] = useState([]);
  const [hotelPriceDifference, setHotelPriceDifference] = useState(0);
  
  // 选择状态 - 这些会影响价格
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [roomCount, setRoomCount] = useState(1);
  const [selectedHotelLevel, setSelectedHotelLevel] = useState('4星');
  const [selectedRoomTypes, setSelectedRoomTypes] = useState(['大床房']);
  const [childrenAges, setChildrenAges] = useState([]);
  const [selectedOptionalTours, setSelectedOptionalTours] = useState({});
  const [dayTourRelations, setDayTourRelations] = useState([]);
  const [isOptionalToursExpanded, setIsOptionalToursExpanded] = useState(true);
  
  // 右侧价格盒子折叠状态 - 在booking页面默认折叠
  const [isPackageExpanded, setIsPackageExpanded] = useState(false);
  const [isTravelerExpanded, setIsTravelerExpanded] = useState(false);
  const [isRoomExpanded, setIsRoomExpanded] = useState(false);
  const [isDateExpanded, setIsDateExpanded] = useState(false);
  
  // API 调用控制
  const isCallingApiRef = useRef(false);
  const initialLoadRef = useRef(false);
  const hotelPriceApiCallCountRef = useRef(0);
  
  const [selectedFromDetails, setSelectedFromDetails] = useState(null);

  // 表单数据 - 只包含不影响价格的字段
  const [formData, setFormData] = useState({
    // 接送信息
    pickup_location: '',
    dropoff_location: '',
    pickup_date: null,
    dropoff_date: null,
    pickup_time: '',
    dropoff_time: '',
    
    // 航班信息
    arrival_flight: '',
    departure_flight: '',
    arrival_date: null,
    arrival_time: '',
    departure_date: null,
    departure_time: '',
    
    // 其他信息
    luggage_count: 0,
    special_requests: '',
    
    // 乘客信息
    passengers: [
      {
        full_name: '',
        is_child: false,
        phone: '',
        wechat_id: '',
        is_primary: true
      }
    ]
  });

  // 初始化：处理从详情页传递的数据
  useEffect(() => {
    console.log('🔍 初始化检查:', {
      'location.state': location.state,
      'urlTourId': urlTourId,
      'queryTourId': queryTourId,
      'queryType': queryType,
      'URL参数': window.location.search,
      '当前URL': window.location.href
    });
    
    if (location.state) {
      console.log('📥 从详情页接收到的数据:', location.state);
      
      const {
        tourId: stateTourId,
        tourName: stateTourName,
        tourType: stateTourType,
        tourDate,
        startDate,
        endDate,
        adultCount,
        childCount,
        roomCount,
        selectedHotelLevel,
        selectedRoomTypes,
        childrenAges,
        selectedOptionalTours,
        calculatedPrice,
        totalPrice,
        dayTourRelations
      } = location.state;

      // 设置基本信息
      const finalTourId = stateTourId || urlTourId || queryTourId;
      setTourId(finalTourId);
      setTourType(stateTourType || queryType || 'group');
      setTourName(stateTourName || '');
      
      console.log('📋 设置基本信息:', {
        tourId: finalTourId,
        tourType: stateTourType || 'group',
        tourName: stateTourName || '',
        从详情页传递的数据: location.state
      });
      
      // 设置价格计算相关的状态
      setAdultCount(adultCount || 1);
      setChildCount(childCount || 0);
      setRoomCount(roomCount || 1);
      setSelectedHotelLevel(selectedHotelLevel || '4星');
      setSelectedRoomTypes(selectedRoomTypes || ['大床房']);
      setChildrenAges(childrenAges || []);
      setSelectedOptionalTours(selectedOptionalTours || {});
      setDayTourRelations(dayTourRelations || []);
      
      // 设置日期
      if (startDate) {
        const start = new Date(startDate);
        setStartDate(start);
        console.log('📅 设置开始日期:', start);
      }
      if (endDate) {
        const end = new Date(endDate);
        setEndDate(end);
        console.log('📅 设置结束日期:', end);
      }
      if (tourDate && !startDate) {
        const date = new Date(tourDate);
        setStartDate(date);
        console.log('📅 设置旅游日期:', date);
      }

      // 设置从详情页传递的数据
      setSelectedFromDetails({
        tourId: stateTourId,
        tourName: stateTourName,
        tourType: stateTourType,
        calculatedPrice: totalPrice || calculatedPrice || '0.00'
      });

      // 设置初始价格
      const priceToUse = totalPrice || calculatedPrice;
      if (priceToUse && priceToUse !== '0.00' && priceToUse !== 0) {
        const numericPrice = typeof priceToUse === 'string' ? parseFloat(priceToUse) : priceToUse;
        setFinalPrice(numericPrice || 0);
        setTotalPrice(numericPrice || 0);
      }

      // 初始化乘客信息
      const totalPassengers = (adultCount || 1) + (childCount || 0);
      const passengerList = [];
      
      // 添加成人乘客
      for (let i = 0; i < (adultCount || 1); i++) {
        passengerList.push({
          full_name: '',
          is_child: false,
          phone: i === 0 ? '' : '',
          wechat_id: '',
          is_primary: i === 0
        });
      }
      
      // 添加儿童乘客
      for (let i = 0; i < (childCount || 0); i++) {
        passengerList.push({
          full_name: '',
          is_child: true,
          phone: '',
          wechat_id: '',
          is_primary: false,
          age: childrenAges && childrenAges[i] ? childrenAges[i] : 8
        });
      }

      setFormData(prev => ({
        ...prev,
        passengers: passengerList
      }));
    } else {
      // 如果没有从详情页传递数据，使用URL参数
      console.log('⚠️ 没有从详情页传递数据，尝试使用URL参数');
      const fallbackTourId = urlTourId || queryTourId;
      const fallbackTourType = queryType || 'group';
      
      if (fallbackTourId) {
        setTourId(fallbackTourId);
        setTourType(fallbackTourType);
        console.log('📋 从URL设置信息:', { 
          tourId: fallbackTourId, 
          tourType: fallbackTourType 
        });
      } else {
        console.error('❌ 没有找到tourId，无法获取产品信息');
      }
    }
  }, [location.state, urlTourId, queryTourId, queryType]);

  // 获取旅游详情
  const fetchTourDetails = async () => {
    if (!tourId) return;

    try {
      setLoading(true);
      
      // 确定正确的API类型
      const apiType = tourType === 'group_tour' || tourType === 'group' ? 'group' : 'day';
      console.log('🔍 获取旅游详情:', { tourId, tourType, apiType });
      
      const response = await getTourById(tourId, apiType);
      if (response.data) {
        setTourDetails(response.data);
        // 优先保持从详情页传递的名称，只有在没有时才使用API返回的名称
        if (tourName) {
          console.log('🔒 保持从详情页传递的名称:', tourName);
        } else if (response.data.name) {
          setTourName(response.data.name);
          console.log('🔄 从API更新旅游名称:', response.data.name);
        }
        console.log('✅ 获取旅游详情成功:', response.data);
      }
    } catch (error) {
      console.error('获取旅游详情失败:', error);
      setError('获取旅游详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tourId && !tourDetails) {
      fetchTourDetails();
    }
  }, [tourId]);

  // 价格计算函数 - 从产品详情页复制
  const sendParamsToBackend = (adults, children, rooms, hotelLevel, ages = childrenAges) => {
    sendParamsToBackendWithOptionalTours(adults, children, rooms, hotelLevel, ages, selectedOptionalTours);
  };
  
  const sendParamsToBackendWithOptionalTours = (adults, children, rooms, hotelLevel, ages = childrenAges, optionalTours = selectedOptionalTours, roomTypes = selectedRoomTypes) => {
    if (isCallingApiRef.current) {
      console.log('API调用中，跳过重复请求');
      return;
    }

    isCallingApiRef.current = true;
    setIsPriceLoading(true);
    
    console.log('开始价格计算请求:', { adults, children, rooms, hotelLevel });

    const apiTourType = tourType === 'group_tour' || tourType === 'group' ? 'group_tour' : 'day_tour';
    const validAges = Array.isArray(ages) ? ages.filter(age => age !== null && age !== undefined && age !== '') : [];
    const hasOptionalTours = dayTourRelations && dayTourRelations.length > 0;
    
    const priceData = calculateTourPrice(
      tourId,
      apiTourType,
      adults,
      children,
      hotelLevel,
      null, 
      rooms,
      null, 
      validAges,
      roomTypes && roomTypes.length > 0 ? roomTypes : ['大床房'],
      hasOptionalTours ? optionalTours : null
    );
    
    priceData.then(response => {
      if (response && response.code === 1 && response.data) {
        const priceInfo = response.data;
        const actualPriceData = priceInfo.data || priceInfo;
        
        let actualTotalPrice = actualPriceData.totalPrice || actualPriceData.total_price || actualPriceData.price || actualPriceData.finalPrice || actualPriceData.calculatedPrice;
        
        if (actualTotalPrice !== undefined && actualTotalPrice !== null) {
          setTotalPrice(actualTotalPrice);
          setFinalPrice(actualTotalPrice);
        }
        
        if (priceInfo.hotelPriceDifference !== undefined) {
          setHotelPriceDifference(priceInfo.hotelPriceDifference);
        }
        
        if (priceInfo.hotelPrices && Array.isArray(priceInfo.hotelPrices)) {
          setHotelPrices(priceInfo.hotelPrices);
        }
      } else {
        setTotalPrice(null);
      }
    }).catch(error => {
      console.error('价格计算失败:', error);
      setTotalPrice(null);
    }).finally(() => {
      isCallingApiRef.current = false;
      setIsPriceLoading(false);
      console.log('价格计算请求完成，状态重置');
    });
    
    setTimeout(() => {
      if (isCallingApiRef.current) {
        console.warn('强制重置API调用状态（3秒超时）');
        isCallingApiRef.current = false;
        setIsPriceLoading(false);
      }
    }, 3000);
  };

  // 可选行程选择处理
  const handleOptionalTourSelect = (dayNumber, tourId) => {
    if (selectedOptionalTours[dayNumber] === tourId) {
      console.log('行程已选择，跳过重复操作');
      return;
    }
    
    const newSelection = {
      ...selectedOptionalTours,
      [dayNumber]: tourId
    };
    setSelectedOptionalTours(newSelection);
    
    console.log(`第${dayNumber}天行程选择变更:`, tourId);
    
    setTimeout(() => {
      sendParamsToBackendWithOptionalTours(adultCount, childCount, roomCount, selectedHotelLevel, childrenAges, newSelection);
    }, 100);
  };

  // 获取酒店价格列表
  useEffect(() => {
    const fetchHotelPrices = async () => {
      if (initialLoadRef.current || hotelPriceApiCallCountRef.current >= 1) {
        return;
      }
      
      hotelPriceApiCallCountRef.current++;
      initialLoadRef.current = true;
      
      if (tourType === 'group_tour' || tourType === 'group') {
        try {
          const result = await getHotelPrices();
          if (result && result.code === 1 && Array.isArray(result.data)) {
            const validData = result.data.map(hotel => ({
              ...hotel,
              hotelLevel: hotel.hotelLevel ? String(hotel.hotelLevel) : '4星',
              priceDifference: typeof hotel.priceDifference === 'number' ? hotel.priceDifference : 0,
              id: hotel.id || Math.floor(Math.random() * 10000),
              description: hotel.description || `${hotel.hotelLevel || '4星'}酒店`
            }));
            setHotelPrices(validData);
          } else {
            setHotelPrices([]);
          }
        } catch (error) {
          console.error('获取酒店价格列表失败:', error);
          setHotelPrices([]);
        }
      }
      
      // 初始价格计算
      setTimeout(() => {
        sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
      }, 200);
    };
    
    if (tourDetails && tourId) {
      fetchHotelPrices();
    }
  }, [tourId, tourDetails, tourType]);

  // 确保房间类型数组与房间数量保持同步
  useEffect(() => {
    const currentRoomTypes = selectedRoomTypes || [];
    if (currentRoomTypes.length !== roomCount) {
      if (roomCount > currentRoomTypes.length) {
        // 增加房间：为新房间添加默认房型
        const additionalRooms = roomCount - currentRoomTypes.length;
        const newRoomTypes = [...currentRoomTypes, ...Array(additionalRooms).fill('大床房')];
        setSelectedRoomTypes(newRoomTypes);
      } else if (roomCount < currentRoomTypes.length) {
        // 减少房间：保留前N个房型
        const newRoomTypes = currentRoomTypes.slice(0, roomCount);
        setSelectedRoomTypes(newRoomTypes);
      }
    }
  }, [roomCount]);

  // 组件卸载时重置状态
  useEffect(() => {
    return () => {
      initialLoadRef.current = false;
      isCallingApiRef.current = false;
    };
  }, []);

  // 处理表单输入变化
  const handleInputChange = (field, value) => {
    console.log('📅 日期选择器变化:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理时间输入格式化
  const handleTimeInputChange = (field, value) => {
    // 移除所有非数字字符
    let numericValue = value.replace(/\D/g, '');
    
    // 限制最多4位数字
    if (numericValue.length > 4) {
      numericValue = numericValue.slice(0, 4);
    }
    
    // 格式化为 HH:MM
    let formattedValue = '';
    if (numericValue.length >= 1) {
      // 小时部分
      let hours = numericValue.slice(0, 2);
      if (numericValue.length === 1) {
        formattedValue = hours;
      } else {
        // 限制小时为00-23
        if (parseInt(hours) > 23) {
          hours = '23';
        }
        formattedValue = hours;
        
        // 分钟部分
        if (numericValue.length > 2) {
          let minutes = numericValue.slice(2, 4);
          // 限制分钟为00-59
          if (parseInt(minutes) > 59) {
            minutes = '59';
          }
          formattedValue = hours + ':' + minutes;
        } else if (numericValue.length === 2) {
          formattedValue = hours + ':';
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  // 根据人数生成乘客信息表单
  const generatePassengerForms = () => {
    const totalPassengers = adultCount + childCount;
    const forms = [];
    
    // 生成成人表单
    for (let i = 0; i < adultCount; i++) {
      forms.push({
        type: 'adult',
        index: i,
        title: `成人${i + 1}`,
        required: i === 0, // 第一个成人为必填
        is_primary: i === 0
      });
    }
    
    // 生成儿童表单
    for (let i = 0; i < childCount; i++) {
      forms.push({
        type: 'child',
        index: adultCount + i, // 儿童的索引从成人数量开始
        title: `儿童${i + 1}`,
        age: childrenAges[i] || 5,
        required: false,
        is_primary: false
      });
    }
    
    return forms;
  };

  // 确保passengers数组与人数保持同步
  useEffect(() => {
    const totalPassengers = adultCount + childCount;
    const currentPassengers = formData.passengers || [];
    
    if (currentPassengers.length !== totalPassengers) {
      const newPassengers = [];
      
      // 添加成人
      for (let i = 0; i < adultCount; i++) {
        newPassengers.push(currentPassengers[i] || {
          full_name: '',
          phone: '',
          wechat_id: '',
          is_primary: i === 0,
          type: 'adult'
        });
      }
      
      // 添加儿童
      for (let i = 0; i < childCount; i++) {
        const passengerIndex = adultCount + i;
        newPassengers.push(currentPassengers[passengerIndex] || {
          full_name: '',
          phone: '',
          wechat_id: '',
          is_primary: false,
          type: 'child',
          age: childrenAges[i] || 5
        });
      }
      
      setFormData(prev => ({
        ...prev,
        passengers: newPassengers
      }));
    }
  }, [adultCount, childCount, childrenAges]);

  // 同步右侧价格盒子的日期到表单中
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      arrival_date: startDate.toISOString().split('T')[0],
      departure_date: endDate.toISOString().split('T')[0],
      pickup_date: startDate.toISOString().split('T')[0],
      dropoff_date: endDate.toISOString().split('T')[0]
    }));
  }, [startDate, endDate]);

  // 处理乘客信息变化
  const handlePassengerChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers.map((passenger, i) => 
        i === index ? { ...passenger, [field]: value } : passenger
      )
    }));
  };

  // 表单验证
  const validateForm = () => {
    const errors = {};
    
    // 验证乘客信息
    formData.passengers.forEach((passenger, index) => {
      if (!passenger.full_name.trim()) {
        errors[`passenger_${index}_name`] = '请填写乘客姓名';
      }
      if (passenger.is_primary && !passenger.phone.trim()) {
        errors[`passenger_${index}_phone`] = '主要联系人请填写电话号码';
      }
    });

    // 验证接送信息
    if (formData.pickup_location && !formData.pickup_date) {
      errors.pickup_date = '请选择接送日期';
    }
    if (formData.pickup_date && !formData.pickup_location) {
      errors.pickup_location = '请填写接送地点';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交订单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setValidated(true);
      return;
    }

    // 游客模式下允许下单，登录用户也允许下单
    if (!isAuthenticated && !isGuestMode) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);

      // 准备提交数据
      const bookingData = {
        // 基本信息 - 确保这些字段不为空
        tourId: parseInt(tourId),
        tourType: tourType,
        
        // 价格计算相关的选择 - 使用LocalDate格式（YYYY-MM-DD）
        tourStartDate: startDate ? startDate.toISOString().split('T')[0] : null,
        tourEndDate: endDate ? endDate.toISOString().split('T')[0] : null,
        adultCount: parseInt(adultCount) || 1,
        childCount: parseInt(childCount) || 0,
        hotelLevel: selectedHotelLevel,
        hotelRoomCount: parseInt(roomCount) || 1,
        roomType: selectedRoomTypes?.join(',') || '大床房',
        selectedOptionalTours: selectedOptionalTours ? JSON.stringify(selectedOptionalTours) : null,
        childrenAges: childrenAges?.join(',') || '',
        
        // 接送信息
        pickupLocation: formData.pickup_location,
        dropoffLocation: formData.dropoff_location,
        pickupDate: formData.pickup_date ? (typeof formData.pickup_date === 'string' ? formData.pickup_date : formData.pickup_date.toISOString().split('T')[0]) : null,
        dropoffDate: formData.dropoff_date ? (typeof formData.dropoff_date === 'string' ? formData.dropoff_date : formData.dropoff_date.toISOString().split('T')[0]) : null,
        pickupTime: formData.pickup_time,
        dropoffTime: formData.dropoff_time,
        
        // 航班信息
        flightNumber: formData.arrival_flight || null,
        returnFlightNumber: formData.departure_flight || null,
        // 使用标准ISO格式的日期时间，如果没有时间则使用默认时间
        arrivalDepartureTime: formData.arrival_time && formData.arrival_date ? 
          `${typeof formData.arrival_date === 'string' ? formData.arrival_date : formData.arrival_date.toISOString().split('T')[0]}T${formData.arrival_time}` : null,
        arrivalLandingTime: formData.arrival_date ? 
          `${typeof formData.arrival_date === 'string' ? formData.arrival_date : formData.arrival_date.toISOString().split('T')[0]}T12:00` : null,
        departureDepartureTime: formData.departure_time && formData.departure_date ? 
          `${typeof formData.departure_date === 'string' ? formData.departure_date : formData.departure_date.toISOString().split('T')[0]}T${formData.departure_time}` : null,
        departureLandingTime: formData.departure_date ? 
          `${typeof formData.departure_date === 'string' ? formData.departure_date : formData.departure_date.toISOString().split('T')[0]}T12:00` : null,
        
        // 其他信息
        luggageCount: parseInt(formData.luggage_count) || 0,
        specialRequests: formData.special_requests,
        
        // 价格信息
        totalPrice: parseFloat(totalPrice) || parseFloat(finalPrice) || 0,
        
        // 乘客信息
        passengers: formData.passengers
      };

      console.log('📤 准备提交的订单数据:', bookingData);

      const response = await createTourBooking(bookingData);
      
      // 后端返回的是 {code: 1, msg: null, data: {...}} 格式
      if (response.code === 1) {
        toast.success('预订成功！');
        const bookingId = response.data?.bookingId || response.data?.id;
        navigate(`/booking-confirmation/${bookingId}`);
      } else {
        throw new Error(response.msg || response.message || '预订失败');
      }
    } catch (error) {
      console.error('提交订单失败:', error);
      setSubmitError(error.message || '提交订单失败，请重试');
      toast.error(error.message || '提交订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染价格计算盒子 - 完整的交互式版本
  const renderPriceCalculationBox = () => {
    const isAgent = userType === 'agent';

    return (
      <Card className="booking-card mb-4">
        <Card.Header className="booking-card-header">
          <h5 className="mb-0">价格信息</h5>
        </Card.Header>
        <Card.Body>
          {/* 价格显示 */}
          <div className="price-section mb-4">
            <div className="price-display-large">
              <span className="currency">$</span>
              <span className="price-amount">
                {(() => {
                  if (isPriceLoading) {
                    return '计算中...';
                  }
                  
                  if (totalPrice !== null && totalPrice !== undefined && totalPrice > 0) {
                    return Math.round(totalPrice);
                  }
                  else if (isAgent && discountedPrice && discountedPrice > 0) {
                    return Math.round(discountedPrice);
                  }
                  else {
                    return Math.round(tourDetails?.price || finalPrice || 0);
                  }
                })()}
              </span>
              <span className="price-unit">起</span>
            </div>

            {isAgent && discountedPrice && (
              <div className="original-price-small">
                原价: ${tourDetails?.price || 0}
              </div>
            )}
            <div className="price-note">
              <small className="text-muted">最终价格以预订页面为准</small>
            </div>
          </div>
          
          {/* 优惠信息 */}
          {isAgent && (
            <div className="discount-badges mb-3">
              <Badge bg="danger" className="me-2">
                <FaPercent className="me-1" />
                代理商优惠
              </Badge>
              <Badge bg="info">
                专享价格
              </Badge>
            </div>
          )}

          {/* 用户选择概括 */}
          <div className="booking-summary mb-4">
            <h6 className="summary-title">您的选择</h6>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">行程：</span>
                <span className="summary-value">
                  <FaRoute className="me-1 text-primary" />
                  {(() => {
                    const displayName = tourDetails?.name || tourName || 
                      (tourId ? `产品ID: ${tourId}` : '精选旅游');
                    console.log('🔍 显示行程名称:', { 
                      tourDetailsName: tourDetails?.name, 
                      tourName: tourName,
                      tourId: tourId,
                      finalDisplayName: displayName
                    });
                    return displayName;
                  })()}
                </span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">目的地：</span>
                <span className="summary-value">
                  <FaMapMarkerAlt className="me-1 text-danger" />
                  {tourDetails?.location || tourDetails?.destination || '塔斯马尼亚'}
                </span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">天数：</span>
                <span className="summary-value">
                  <FaClock className="me-1 text-info" />
                  {(() => {
                    console.log('🔍 计算天数:', { 
                      tourType: tourType,
                      startDate: startDate,
                      endDate: endDate,
                      tourDetailsDuration: tourDetails?.duration 
                    });
                    
                    if (tourType === 'day_tour' || tourType === 'day') return '1天';
                    
                    // 优先使用tourDetails中的duration
                    if (tourDetails?.duration) {
                      if (typeof tourDetails.duration === 'string') {
                        const match = tourDetails.duration.match(/(\d+)天/);
                        if (match) return `${match[1]}天`;
                        return tourDetails.duration;
                      }
                      return `${tourDetails.duration}天`;
                    }
                    
                    // 根据开始和结束日期计算天数
                    const diffTime = Math.abs(endDate - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    
                    // 对于跟团游，如果计算出的天数小于等于1，默认显示4天
                    if ((tourType === 'group_tour' || tourType === 'group') && diffDays <= 1) {
                      return '4天';
                    }
                    
                    return `${diffDays}天`;
                  })()}
                </span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">日期：</span>
                <span className="summary-value">
                  <FaCalendarDay className="me-1 text-success" />
                  {startDate.toLocaleDateString('zh-CN')} - {endDate.toLocaleDateString('zh-CN')}
                </span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">人数：</span>
                <span className="summary-value">
                  <FaUsers className="me-1 text-warning" />
                  {adultCount}位成人{childCount > 0 ? `, ${childCount}位儿童` : ''}
                </span>
              </div>
              
              <div className="summary-item">
                <span className="summary-label">酒店：</span>
                <span className="summary-value">
                  <FaHotel className="me-1 text-info" />
                  {selectedHotelLevel}级酒店
                </span>
              </div>
              
              {roomCount > 0 && (
                <div className="summary-item">
                  <span className="summary-label">房间：</span>
                  <span className="summary-value">
                    <FaBed className="me-1 text-secondary" />
                    {roomCount}间房 ({selectedRoomTypes.join(', ')})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 服务承诺 */}
          <div className="service-promises-section mb-4">
            <h6 className="summary-title">服务承诺</h6>
            <div className="service-promises">
              <Badge bg="success" className="me-1 mb-1">
                <FaCheck className="me-1" />
                无购物
              </Badge>
              <Badge bg="success" className="me-1 mb-1">
                <FaLanguage className="me-1" />
                中文服务
              </Badge>
              <Badge bg="success" className="me-1 mb-1">
                <FaCheck className="me-1" />
                该商品在支付成功后，平均2小时内确认
              </Badge>
            </div>
          </div>

          {/* 套餐选择（酒店等级） */}
          <div className="package-selection mb-3">
            <h6 className="selection-title" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setIsPackageExpanded(!isPackageExpanded)}>
              套餐类型
              <FaChevronDown 
                style={{ 
                  transform: isPackageExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.3s ease'
                }} 
              />
            </h6>
            {isPackageExpanded && (
              <div className="package-options-horizontal">
                {(hotelPrices && hotelPrices.length > 0 ? hotelPrices : [
                  { hotelLevel: '3星', description: '标准三星级酒店' },
                  { hotelLevel: '4星', description: '舒适四星级酒店（基准价）' },
                  { hotelLevel: '4.5星', description: '高级四星半级酒店' }
                ]).filter(hotel => hotel.hotelLevel !== '5星').map((hotel, index) => (
                  <div 
                    key={hotel.id || index}
                    className={`package-option-small ${selectedHotelLevel === hotel.hotelLevel ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedHotelLevel !== hotel.hotelLevel) {
                        setSelectedHotelLevel(hotel.hotelLevel);
                        sendParamsToBackend(adultCount, childCount, roomCount, hotel.hotelLevel);
                      }
                    }}
                  >
                    <div className="package-radio-small">
                      <Form.Check
                        type="radio"
                        name="hotelLevel"
                        checked={selectedHotelLevel === hotel.hotelLevel}
                        onChange={() => {
                          if (selectedHotelLevel !== hotel.hotelLevel) {
                            setSelectedHotelLevel(hotel.hotelLevel);
                            sendParamsToBackend(adultCount, childCount, roomCount, hotel.hotelLevel);
                          }
                        }}
                      />
                    </div>
                    <div className="package-info-small">
                      <div className="package-name-small">{hotel.hotelLevel}酒店</div>
                      <div className="package-desc-small">{hotel.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 可选行程选择 */}
          {(tourType === 'group_tour' || tourType === 'group') && dayTourRelations.length > 0 && (
            <div className="optional-tours-selection mb-3">
              <h6 className="selection-title" 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => setIsOptionalToursExpanded(!isOptionalToursExpanded)}>
                行程选择
                <FaChevronDown 
                  style={{ 
                    transform: isOptionalToursExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.3s ease'
                  }} 
                />
              </h6>
              {isOptionalToursExpanded && (
                <div className="optional-tours-summary">
                  {(() => {
                    const optionalDays = {};
                    dayTourRelations.forEach(relation => {
                      const day = relation.day_number;
                      if (!optionalDays[day]) {
                        optionalDays[day] = [];
                      }
                      optionalDays[day].push(relation);
                    });

                    const allDaysList = Object.keys(optionalDays).sort((a, b) => parseInt(a) - parseInt(b));
                    
                    if (allDaysList.length === 0) {
                      return <small className="text-muted">暂无行程安排</small>;
                    }

                    const optionalDaysList = allDaysList.filter(day => optionalDays[day].length > 1);
                    const fixedDaysList = allDaysList.filter(day => optionalDays[day].length === 1);

                    return (
                      <div className="optional-summary-small">
                        {/* 固定行程下拉菜单 */}
                        {fixedDaysList.length > 0 && (
                          <div className="fixed-tours-dropdown mb-3">
                            <details className="fixed-tours-details">
                              <summary className="fixed-tours-summary">
                                <span>固定行程 ({fixedDaysList.length}天)</span>
                                <FaChevronDown className="dropdown-icon" />
                              </summary>
                              <div className="fixed-tours-content">
                                {fixedDaysList.map(day => {
                                  const dayOptions = optionalDays[day];
                                  const option = dayOptions[0];
                                  
                                  return (
                                    <div key={day} className="fixed-day-item">
                                      <div className="day-label-small">第{day}天：</div>
                                      <div className="fixed-tour-name">{option.day_tour_name}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        )}

                        {/* 可选行程 */}
                        {optionalDaysList.map(day => {
                          const dayOptions = optionalDays[day];
                          const selectedTourId = selectedOptionalTours[day];
                          
                          return (
                            <div key={day} className="optional-day-small mb-2">
                              <div className="day-label-small">
                                第{day}天：
                                <Badge bg="info" size="sm" className="ms-1">可选</Badge>
                              </div>
                              <div className="tour-options-small">
                                {dayOptions.map((option, index) => {
                                  const isSelected = selectedTourId === option.day_tour_id;
                                  const priceDiff = option.price_difference || 0;
                                  
                                  return (
                                    <div 
                                      key={option.day_tour_id}
                                      className={`tour-option-small ${isSelected ? 'selected' : ''}`}
                                      onClick={() => {
                                        if (selectedTourId !== option.day_tour_id) {
                                          handleOptionalTourSelect(day, option.day_tour_id);
                                        }
                                      }}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <Form.Check
                                        type="radio"
                                        name={`sidebar-day-${day}-tour`}
                                        checked={isSelected}
                                        onChange={() => {
                                          if (selectedTourId !== option.day_tour_id) {
                                            handleOptionalTourSelect(day, option.day_tour_id);
                                          }
                                        }}
                                        className="me-1"
                                        size="sm"
                                      />
                                      <span className="tour-name-small">
                                        {option.day_tour_name}
                                        {option.is_default && (
                                          <Badge bg="success" size="sm" className="ms-1">推荐</Badge>
                                        )}
                                        {priceDiff > 0 && (
                                          <Badge bg="warning" size="sm" className="ms-1">+${priceDiff}</Badge>
                                        )}
                                        {priceDiff < 0 && (
                                          <Badge bg="success" size="sm" className="ms-1">-${Math.abs(priceDiff)}</Badge>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 出游人群 */}
          <div className="traveler-selection mb-3">
            <h6 className="selection-title" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setIsTravelerExpanded(!isTravelerExpanded)}>
              出游人群
              <FaChevronDown 
                style={{ 
                  transform: isTravelerExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.3s ease'
                }} 
              />
            </h6>
            {isTravelerExpanded && (
              <div className="traveler-options-horizontal">
                <div className="traveler-item-small">
                  <div className="traveler-icon-small">👥</div>
                  <span className="traveler-label-small">成人</span>
                  <div className="quantity-controls-small">
                    <button 
                      type="button" 
                      className="quantity-btn-small"
                      onClick={() => {
                        if (adultCount > 1) {
                          const newCount = adultCount - 1;
                          setAdultCount(newCount);
                          sendParamsToBackend(newCount, childCount, roomCount, selectedHotelLevel);
                        }
                      }}
                    >
                      -
                    </button>
                    <span className="quantity-display-small">{adultCount}</span>
                    <button 
                      type="button" 
                      className="quantity-btn-small"
                      onClick={() => {
                        const newCount = adultCount + 1;
                        setAdultCount(newCount);
                        sendParamsToBackend(newCount, childCount, roomCount, selectedHotelLevel);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="traveler-item-small">
                  <div className="traveler-icon-small">🧒</div>
                  <span className="traveler-label-small">儿童</span>
                  <div className="quantity-controls-small">
                    <button 
                      type="button" 
                      className="quantity-btn-small"
                      onClick={() => {
                        if (childCount > 0) {
                          const newCount = childCount - 1;
                          setChildCount(newCount);
                          const newAges = childrenAges.slice(0, -1);
                          setChildrenAges(newAges);
                          sendParamsToBackend(adultCount, newCount, roomCount, selectedHotelLevel, newAges);
                        }
                      }}
                    >
                      -
                    </button>
                    <span className="quantity-display-small">{childCount}</span>
                    <button 
                      type="button" 
                      className="quantity-btn-small"
                      onClick={() => {
                        const newCount = childCount + 1;
                        setChildCount(newCount);
                        const newAges = [...childrenAges, 5];
                        setChildrenAges(newAges);
                        sendParamsToBackend(adultCount, newCount, roomCount, selectedHotelLevel, newAges);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 儿童年龄选择 */}
            {isTravelerExpanded && childCount > 0 && (
              <div className="child-ages-horizontal mt-2">
                <span className="age-label-small">儿童年龄：</span>
                <div className="age-inputs-horizontal">
                  {Array.from({ length: childCount }, (_, index) => (
                    <select
                      key={index}
                      className="age-select-small"
                      value={childrenAges[index] || 5}
                      onChange={(e) => {
                        const newAges = [...childrenAges];
                        newAges[index] = parseInt(e.target.value);
                        setChildrenAges(newAges);
                        sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel, newAges);
                      }}
                    >
                      {Array.from({ length: 18 }, (_, i) => (
                        <option key={i} value={i}>{i}岁</option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 房间选择 */}
          {(tourType === 'group_tour' || tourType === 'group') && (
            <div className="room-selection mb-3">
              <h6 className="selection-title" 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => setIsRoomExpanded(!isRoomExpanded)}>
                房间选择
                <FaChevronDown 
                  style={{ 
                    transform: isRoomExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.3s ease'
                  }} 
                />
              </h6>
              {isRoomExpanded && (
                <div className="room-options-horizontal">
                  <div className="room-item-small">
                    <div className="room-icon-small">🏨</div>
                    <span className="room-label-small">房间数量</span>
                    <div className="quantity-controls-small">
                      <button 
                        type="button" 
                        className="quantity-btn-small"
                        onClick={() => {
                          if (roomCount > 1) {
                            const newCount = roomCount - 1;
                            setRoomCount(newCount);
                            sendParamsToBackend(adultCount, childCount, newCount, selectedHotelLevel);
                          }
                        }}
                      >
                        -
                      </button>
                      <span className="quantity-display-small">{roomCount}</span>
                      <button 
                        type="button" 
                        className="quantity-btn-small"
                        onClick={() => {
                          const newCount = roomCount + 1;
                          setRoomCount(newCount);
                          sendParamsToBackend(adultCount, childCount, newCount, selectedHotelLevel);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {roomCount > 0 && selectedRoomTypes.map((roomType, index) => (
                    <div key={index} className="room-type-item-small">
                      <div className="room-icon-small">🛏️</div>
                      <span className="room-label-small">房间{index + 1}</span>
                      <select 
                        className="room-type-select-small"
                        value={roomType}
                        onChange={(e) => {
                          const newRoomType = e.target.value;
                          const newRoomTypes = [...selectedRoomTypes];
                          newRoomTypes[index] = newRoomType;
                          setSelectedRoomTypes(newRoomTypes);
                          sendParamsToBackendWithOptionalTours(adultCount, childCount, roomCount, selectedHotelLevel, childrenAges, selectedOptionalTours, newRoomTypes);
                        }}
                      >
                        <option value="大床房">大床房</option>
                        <option value="双人间">双人间</option>
                        <option value="三人间">三人间</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 出行日期 */}
          <div className="date-selection mb-3">
            <h6 className="selection-title" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setIsDateExpanded(!isDateExpanded)}>
              出行日期
              <FaChevronDown 
                style={{ 
                  transform: isDateExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.3s ease'
                }} 
              />
            </h6>
            {isDateExpanded && (
              <div className="date-options-horizontal">
                <div className="date-item-small">
                  <label className="date-label-small">出发日期：</label>
                  <input
                    type="date"
                    value={startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setStartDate(date);
                      // 自动计算结束日期
                      if (tourDetails && (tourType === 'group_tour' || tourType === 'group')) {
                        let duration = 4;
                        if (typeof tourDetails.duration === 'string' && tourDetails.duration.includes('天')) {
                          const match = tourDetails.duration.match(/(\d+)天/);
                          if (match && match[1]) {
                            duration = parseInt(match[1]);
                          }
                        }
                        const newEndDate = new Date(date);
                        newEndDate.setDate(newEndDate.getDate() + duration - 1);
                        setEndDate(newEndDate);
                      }
                      sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
                    }}
                    className="form-control date-picker-small"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="date-item-small">
                  <label className="date-label-small">返回日期：</label>
                  <input
                    type="date"
                    value={endDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setEndDate(date);
                      sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
                    }}
                    className="form-control date-picker-small"
                    min={startDate.toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 确认预订按钮 */}
          <div className="booking-action-section mt-4">
            <Button
              onClick={handleSubmit}
              variant="danger"
              size="lg"
              disabled={loading}
              className="booking-submit-btn w-100"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  提交中...
                </>
              ) : (
                <>
                  <FaCheck className="me-2" />
                  {isGuestMode ? '游客下单' : '确认预订'}
                </>
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading && !selectedFromDetails) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">加载中...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <h4>加载失败</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="booking-page">
      <Container className="my-4">
        <Row>
          <Col lg={8}>
            <h2 className="booking-title mb-4">
              <FaCalendarAlt className="me-2" />
              填写预订信息
            </h2>

            {/* 游客模式提示 */}
            {isGuestMode && (
              <Alert variant="info" className="mb-4">
                <div className="d-flex align-items-center">
                  <FaInfoCircle className="me-2" />
                  <div>
                    <strong>游客下单</strong>
                    <p className="mb-0">您正在以游客身份下单。如需享受会员优惠，请先 
                      <Button 
                        variant="link" 
                        className="p-0 ms-1 me-1" 
                        onClick={() => navigate('/login')}
                      >
                        登录
                      </Button> 
                      或 
                      <Button 
                        variant="link" 
                        className="p-0 ms-1" 
                        onClick={() => navigate('/register')}
                      >
                        注册
                      </Button>
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              {/* 乘客信息 */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FaUser className="me-2" />
                    乘客信息 ({adultCount}位成人{childCount > 0 ? `, ${childCount}位儿童` : ''})
                  </h5>
                </Card.Header>
                <Card.Body>
                  {generatePassengerForms().map((passengerForm) => {
                    const passenger = formData.passengers[passengerForm.index] || {};
                    return (
                      <div key={passengerForm.index} className="passenger-form-section">
                        <div className="passenger-header">
                          <h6>
                            <FaTicketAlt className="me-2 text-primary" />
                            {passengerForm.title}
                            {passengerForm.is_primary && (
                              <Badge bg="primary" className="ms-2">主要联系人</Badge>
                            )}
                            {passengerForm.type === 'child' && (
                              <Badge bg="info" className="ms-2">{passengerForm.age}岁</Badge>
                            )}
                          </h6>
                        </div>
                        
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                姓名 {passengerForm.required && <span className="text-danger">*</span>}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="请输入完整姓名"
                                value={passenger.full_name || ''}
                                onChange={(e) => handlePassengerChange(passengerForm.index, 'full_name', e.target.value)}
                                isInvalid={validationErrors[`passenger_${passengerForm.index}_name`]}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors[`passenger_${passengerForm.index}_name`]}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          
                          {passengerForm.is_primary && (
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>联系电话 <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="tel"
                                  placeholder="请输入联系电话"
                                  value={passenger.phone || ''}
                                  onChange={(e) => handlePassengerChange(passengerForm.index, 'phone', e.target.value)}
                                  isInvalid={validationErrors[`passenger_${passengerForm.index}_phone`]}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors[`passenger_${passengerForm.index}_phone`]}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          )}
                          
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>微信号</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="请输入微信号（可选）"
                                value={passenger.wechat_id || ''}
                                onChange={(e) => handlePassengerChange(passengerForm.index, 'wechat_id', e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        {passengerForm.index < generatePassengerForms().length - 1 && <hr />}
                      </div>
                    );
                  })}
                </Card.Body>
              </Card>

              {/* 航班信息 */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FaPlane className="me-2" />
                    航班信息
                    <small className="text-muted ms-2">（可选）</small>
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>到达航班号</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="如：CA123"
                          value={formData.arrival_flight}
                          onChange={(e) => handleInputChange('arrival_flight', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>离开航班号</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="如：CA456"
                          value={formData.departure_flight}
                          onChange={(e) => handleInputChange('departure_flight', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>到达日期时间</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="date"
                            value={formData.arrival_date ? 
                              (formData.arrival_date instanceof Date ? 
                                formData.arrival_date.toISOString().split('T')[0] : 
                                formData.arrival_date) : 
                              startDate.toISOString().split('T')[0]}
                            onChange={(e) => handleInputChange('arrival_date', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <Form.Control
                            type="text"
                            value={formData.arrival_time || ''}
                            onChange={(e) => handleTimeInputChange('arrival_time', e.target.value)}
                            placeholder="如: 1430"
                            maxLength={5}
                            className="time-input"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>离开日期时间</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="date"
                            value={formData.departure_date ? 
                              (formData.departure_date instanceof Date ? 
                                formData.departure_date.toISOString().split('T')[0] : 
                                formData.departure_date) : 
                              endDate.toISOString().split('T')[0]}
                            onChange={(e) => handleInputChange('departure_date', e.target.value)}
                            min={formData.arrival_date || new Date().toISOString().split('T')[0]}
                          />
                          <Form.Control
                            type="text"
                            value={formData.departure_time || ''}
                            onChange={(e) => handleTimeInputChange('departure_time', e.target.value)}
                            placeholder="如: 1645"
                            maxLength={5}
                            className="time-input"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 接送信息 */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FaMapMarkerAlt className="me-2" />
                    接送信息
                    <small className="text-muted ms-2">（可选）</small>
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>接送地点</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="如：霍巴特机场、酒店名称等"
                          value={formData.pickup_location}
                          onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                          isInvalid={validationErrors.pickup_location}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.pickup_location}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>送达地点</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="如：霍巴特机场、酒店名称等"
                          value={formData.dropoff_location}
                          onChange={(e) => handleInputChange('dropoff_location', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>接送日期</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.pickup_date ? 
                            (formData.pickup_date instanceof Date ? 
                              formData.pickup_date.toISOString().split('T')[0] : 
                              formData.pickup_date) : 
                            startDate.toISOString().split('T')[0]}
                          onChange={(e) => handleInputChange('pickup_date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {validationErrors.pickup_date && (
                          <div className="invalid-feedback d-block">
                            {validationErrors.pickup_date}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>送达日期</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.dropoff_date ? 
                            (formData.dropoff_date instanceof Date ? 
                              formData.dropoff_date.toISOString().split('T')[0] : 
                              formData.dropoff_date) : 
                            endDate.toISOString().split('T')[0]}
                          onChange={(e) => handleInputChange('dropoff_date', e.target.value)}
                          min={formData.pickup_date || new Date().toISOString().split('T')[0]}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 其他信息 */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FaComments className="me-2" />
                    其他信息
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>行李件数</Form.Label>
                        <div className="quantity-controls">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => formData.luggage_count > 0 && handleInputChange('luggage_count', formData.luggage_count - 1)}
                            disabled={formData.luggage_count <= 0}
                          >
                            <FaMinus />
                          </Button>
                          <span className="quantity-display mx-3">{formData.luggage_count}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleInputChange('luggage_count', formData.luggage_count + 1)}
                          >
                            <FaPlus />
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>特殊要求</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="请输入特殊要求或备注信息..."
                      value={formData.special_requests}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* 错误信息显示 */}
              {submitError && (
                <Alert variant="danger" className="mb-4">
                  {submitError}
                </Alert>
              )}

              {/* 返回按钮 */}
              <div className="d-flex justify-content-start">
                <Button
                  variant="outline-secondary"
                  size="lg"
                  onClick={() => window.history.back()}
                >
                  返回上一页
                </Button>
              </div>
            </Form>
          </Col>

          {/* 右侧价格信息区域 */}
          <Col lg={4}>
            <div className="booking-sidebar sticky-top">
              {renderPriceCalculationBox()}
              
              {/* 帮助信息 */}
              <Card className="help-card">
                <Card.Header className="help-card-header">
                  <h5 className="mb-0">需要帮助?</h5>
                </Card.Header>
                <Card.Body>
                  <div className="contact-info">
                    <div className="phone-contact mb-3">
                      <FaPhone className="contact-icon" />
                      <div>
                        <div className="phone-number">400-123-4567</div>
                        <small>周一至周日 9:00-18:00</small>
                      </div>
                    </div>
                  </div>
                  <div className="help-actions">
                    <Button variant="outline-primary" size="sm" className="me-2">在线咨询</Button>
                    <Button variant="outline-primary" size="sm">邮件咨询</Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Booking; 