import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Accordion, Badge } from 'react-bootstrap';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaUsers, FaPhone, FaWeixin, FaUser, FaArrowLeft, FaTicketAlt, FaCar, FaHotel, FaBed, FaPlane, FaPlaneDeparture, FaPlaneArrival, FaClock, FaDollarSign, FaMapMarkerAlt, FaInfoCircle, FaCheck, FaRoute, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import { getTourById, getAllDayTours, getAllGroupTours, getGroupTourItinerary, getGroupTourDayTours } from '../../utils/api';
import { createTourBooking, calculateTourPrice } from '../../services/bookingService';
import { tourService } from '../../services/tourService';
import { sendConfirmationEmail, sendInvoiceEmail } from '../../services/emailService';
import { toast } from 'react-hot-toast';
import './AgentBooking.css';

const AgentBooking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userType } = useSelector(state => state.auth);
  
  // 使用useMemo缓存URL参数解析，避免频繁重复计算
  const { type, isValidParams } = useMemo(() => {
    const pathname = window.location.pathname;
    const extractedType = pathname.includes('/day-tours/') ? 'day-tours' : 
                         pathname.includes('/group-tours/') ? 'group-tours' : null;
    
    const isValid = id && !isNaN(parseInt(id)) && extractedType && ['day-tours', 'group-tours'].includes(extractedType);
    
    // 只在首次加载时打印日志
    if (isValid) {
      console.log('URL参数解析:', {
        pathname: pathname,
        extractedId: id,
        extractedType: extractedType,
        isValidId: !isNaN(parseInt(id)),
        isValidType: ['day-tours', 'group-tours'].includes(extractedType)
      });
    }
    
    return { 
      type: extractedType, 
      isValidParams: isValid 
    };
  }, [id]); // 只依赖id变化
  
  // 统一的中介身份验证逻辑（包括agent主账号和操作员）
  const localUserType = localStorage.getItem('userType');
  const isAgent = userType === 'agent' || 
                  userType === 'agent_operator' ||
                  localUserType === 'agent' || 
                  localUserType === 'agent_operator';
  
  // 检查是否为中介主号（只有主号才能看到价格）
  const isAgentMain = userType === 'agent' || localUserType === 'agent';
  
  // 只检查用户身份，不检查参数有效性（允许agent用户访问但无具体行程的页面）
  useEffect(() => {
    if (!isAgent) {
      console.log('👤 非中介用户，重定向到普通页面');
      // 如果有有效的产品参数，重定向到对应的产品页面
      if (type && id && ['day-tours', 'group-tours'].includes(type) && !isNaN(parseInt(id))) {
        navigate(`/${type}/${id}?${searchParams.toString()}`);
      } else {
        // 否则重定向到普通用户搜索页面
        navigate('/booking-form');
      }
      return;
    }
    

  }, [isAgent, navigate, type, id, searchParams]);

  // 状态管理
  const [tourData, setTourData] = useState(null);
  const [itineraryData, setItineraryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  // 可选项目相关状态
  const [dayTourRelations, setDayTourRelations] = useState([]); // 一日游关联数据
  const [selectedOptionalTours, setSelectedOptionalTours] = useState({}); // 用户选择的可选项目 {day: tourId}
  const [isPriceLoading, setIsPriceLoading] = useState(false); // 价格计算加载状态
  
  // API调用状态管理 - 防止重复调用
  const isCallingApiRef = React.useRef(false);
  
  // 组件卸载时清理API调用状态
  useEffect(() => {
    return () => {
      // 组件卸载时重置状态
      isCallingApiRef.current = false;
    };
  }, []);
  
  // 从URL参数获取初始数据
  const fromSearch = searchParams.get('fromSearch') === 'true';
  
  // AI参数处理 - 检查是否为AI处理的订单
  const isAIProcessed = searchParams.get('aiProcessed') === 'true';
  
  // AI参数提取
  const aiServiceType = searchParams.get('serviceType');
  const aiStartDate = searchParams.get('startDate');  
  const aiEndDate = searchParams.get('endDate');
  const aiGroupSize = searchParams.get('groupSize');
  const aiLuggageCount = searchParams.get('luggageCount');
  const aiDeparture = searchParams.get('departure');
  const aiArrivalFlight = searchParams.get('arrivalFlight');
  const aiDepartureFlight = searchParams.get('departureFlight');
  const aiArrivalTime = searchParams.get('arrivalTime');
  const aiSpecialRequests = searchParams.get('specialRequests');
  const aiItinerary = searchParams.get('itinerary');
  
  // AI酒店信息参数
  const aiHotelLevel = searchParams.get('hotelLevel');
  const aiRoomType = searchParams.get('roomType');
  
  // AI客户信息参数
  const aiCustomerName1 = searchParams.get('customerName1');
  const aiCustomerPhone1 = searchParams.get('customerPhone1');
  const aiCustomerPassport1 = searchParams.get('customerPassport1');
  const aiCustomerName2 = searchParams.get('customerName2');
  const aiCustomerPhone2 = searchParams.get('customerPhone2');
  const aiCustomerPassport2 = searchParams.get('customerPassport2');
  const aiCustomerName3 = searchParams.get('customerName3');
  const aiCustomerPhone3 = searchParams.get('customerPhone3');
  const aiCustomerPassport3 = searchParams.get('customerPassport3');
  

  
  // 酒店星级标准化函数 - 修复：保持4.5星不被降级
  const normalizeHotelLevel = (levelStr) => {
    if (!levelStr) return '4星';
    
    // 提取数字部分，支持小数
    const numMatch = levelStr.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      
      // 支持的星级：3星、4星、4.5星（3.5星算3星）
      if (num >= 4.5) {
        return '4.5星';  // 4.5星及以上都是4.5星
      } else if (num >= 4) {
        return '4星';  // 4-4.4星都是4星
      } else {
        return '3星';  // 3.5星及以下都算3星
      }
    }
    
    return '4星';
  };
  
  // 房型标准化函数
  const normalizeRoomType = (roomTypeStr) => {
    if (!roomTypeStr) return '双人间';
    
    const decodedRoomType = decodeURIComponent(roomTypeStr).toLowerCase().trim();
    
    // 房型识别和转换
    if (decodedRoomType.includes('单') || decodedRoomType.includes('single')) {
      return '单人间';
    } else if (decodedRoomType.includes('三') || decodedRoomType.includes('triple')) {
      return '三人间';
    } else if (decodedRoomType.includes('标间') || decodedRoomType.includes('标准') || decodedRoomType.includes('standard')) {
      return '双人间';
    } else if (decodedRoomType.includes('大床房') || decodedRoomType.includes('king')) {
      return '大床房';
    } else if (decodedRoomType.includes('双') || decodedRoomType.includes('double') || decodedRoomType.includes('twin')) {
      return '双人间';
    } else {
      // 默认返回双人间
      return '双人间';
    }
  };
  
  // AI日期解析函数
  const parseDateFromAI = (dateStr) => {
    if (!dateStr || dateStr === '待定') return null;
    try {
      // 处理中文日期格式："6月22日"、"7月13日"
      const chineseDateMatch = dateStr.match(/(\d+)月(\d+)日/);
      if (chineseDateMatch) {
        const month = parseInt(chineseDateMatch[1]);
        const day = parseInt(chineseDateMatch[2]);
        
        // 智能年份选择：如果日期在当前日期之前，则使用下一年
        const now = new Date();
        let year = now.getFullYear();
        let date = new Date(year, month - 1, day, 12, 0, 0);
        
        // 如果日期已经过去了，使用下一年
        if (date < now) {
          year += 1;
          date = new Date(year, month - 1, day, 12, 0, 0);
        }
        
        if (!isNaN(date.getTime())) {

          return date;
        }
      }
      
      // 处理ISO格式
      if (dateStr.includes('-') && dateStr.length === 10) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        if (!isNaN(date.getTime())) {
         
          return date;
        }
      }
      
      return null;
    } catch (error) {
      console.error('AI日期解析错误:', error, dateStr);
      return null;
    }
  };

  // 时间解析函数
  const parseTimeToDate = (timeStr, baseDate) => {
    if (!timeStr || timeStr === '待定' || !baseDate) return null;
    try {
      const time24Match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (time24Match) {
        const hours = parseInt(time24Match[1]);
        const minutes = parseInt(time24Match[2]);
        const date = new Date(baseDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
      return null;
    } catch (error) {
      console.error('时间解析错误:', error, timeStr);
      return null;
    }
  };

  // 解析时间字符串为小时和分钟
  const parseTimeToHourMinute = (timeStr) => {
    if (!timeStr || timeStr === '待定') return { hour: '', minute: '' };
    try {
      const time24Match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (time24Match) {
        const hour = time24Match[1].padStart(2, '0');
        const minute = time24Match[2].padStart(2, '0');
        return { hour, minute };
      }
      return { hour: '', minute: '' };
    } catch (error) {
      console.error('时间解析错误:', error, timeStr);
      return { hour: '', minute: '' };
    }
  };
  
  // 日期处理 - AI参数优先，然后是普通参数
  const parseDateFromParam = (dateStr) => {
    if (!dateStr) return null;
    try {
      // 处理类似 "2025-06-09" 的ISO格式，避免时区问题
      if (dateStr.includes('-') && dateStr.length === 10) {
        // 对于 YYYY-MM-DD 格式，手动解析并设置为本地时间的中午，避免时区问题
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0); // 设置为中午，避免夏令时等问题
        if (!isNaN(date.getTime())) {
         
          return date;
        }
      }
      
      // 备用方法
      const date = new Date(dateStr + 'T12:00:00'); // 强制设置为中午
      if (!isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch (error) {
      console.error('日期解析错误:', error, dateStr);
      return null;
    }
  };
  
  // 使用AI参数优先，fallback到普通参数
  const initialStartDate = (isAIProcessed && aiStartDate) ? 
    parseDateFromAI(aiStartDate) : parseDateFromParam(searchParams.get('startDate'));
  const initialEndDate = (isAIProcessed && aiEndDate) ? 
    parseDateFromAI(aiEndDate) : parseDateFromParam(searchParams.get('endDate'));
  
  
  
  // 如果AI日期解析失败，尝试其他格式
  if (isAIProcessed && (!initialStartDate || !initialEndDate)) {
    console.warn('⚠️  AI日期解析可能有问题，尝试手动解析:', {
      原始AI_startDate: aiStartDate,
      原始AI_endDate: aiEndDate,
      解析结果startDate: initialStartDate,
      解析结果endDate: initialEndDate
    });
  }
  
  // 使用AI参数优先，支持多种参数名格式
  const initialAdults = (isAIProcessed && aiGroupSize) ? 
    parseInt(aiGroupSize) : (
      parseInt(searchParams.get('adultCount')) || 
      parseInt(searchParams.get('adults')) || 2
    );
  const initialChildren = parseInt(searchParams.get('childCount')) || 
    parseInt(searchParams.get('children')) || 0;
  const tourName = searchParams.get('tourName');
  const tourType = searchParams.get('tourType');
  


  // 从URL参数获取更多初始值
  const urlHotelLevel = searchParams.get('hotelLevel');
  const urlRoomCount = parseInt(searchParams.get('roomCount')) || Math.ceil(initialAdults / 2);
  const urlDate = searchParams.get('date');
  const urlArrivalDate = searchParams.get('arrivalDate');
  const urlDepartureDate = searchParams.get('departureDate');
  const urlChildrenAges = searchParams.get('childrenAges');
  
  // 处理日期参数 - 支持多种格式
  const getInitialStartDate = () => {
    if (isAIProcessed && aiStartDate) return parseDateFromAI(aiStartDate);
    if (urlArrivalDate) return parseDateFromParam(urlArrivalDate);
    if (urlDate) return parseDateFromParam(urlDate);
    return initialStartDate;
  };
  
  const getInitialEndDate = () => {
    if (isAIProcessed && aiEndDate) return parseDateFromAI(aiEndDate);
    if (urlDepartureDate) return parseDateFromParam(urlDepartureDate);
    return initialEndDate;
  };
  
  const finalStartDate = getInitialStartDate();
  const finalEndDate = getInitialEndDate();
  
 

  // 表单数据 - 整合AI参数和URL参数
  const [formData, setFormData] = useState({
    adult_count: initialAdults,
    child_count: initialChildren,
    tour_start_date: finalStartDate,
    tour_end_date: finalEndDate,
    hotel_level: (isAIProcessed && aiHotelLevel) ? 
      normalizeHotelLevel(aiHotelLevel) : 
      (urlHotelLevel ? normalizeHotelLevel(urlHotelLevel) : '4星'),
    hotel_room_count: urlRoomCount,
    roomTypes: Array(urlRoomCount).fill(
      (isAIProcessed && aiRoomType) ? normalizeRoomType(aiRoomType) : '双人间'
    ),
    // AI参数优先设置
    pickup_location: (isAIProcessed && aiDeparture) ? decodeURIComponent(aiDeparture) : '',
    dropoff_location: (isAIProcessed && aiDeparture) ? decodeURIComponent(aiDeparture) : '',
    // 接送日期
    pickup_date: finalStartDate,
    dropoff_date: finalEndDate,
    // AI航班信息
    arrival_flight: (isAIProcessed && aiArrivalFlight && aiArrivalFlight !== '待定') ? aiArrivalFlight : '',
    departure_flight: (isAIProcessed && aiDepartureFlight && aiDepartureFlight !== '待定') ? aiDepartureFlight : '',
    // 航班日期
    arrival_landing_date: finalStartDate,
    departure_departure_date: finalEndDate,
    // 航班时间字段 - 从AI时间中解析
    arrival_landing_hour: (isAIProcessed && aiArrivalTime) ? parseTimeToHourMinute(aiArrivalTime).hour : '',
    arrival_landing_minute: (isAIProcessed && aiArrivalTime) ? parseTimeToHourMinute(aiArrivalTime).minute : '',
    departure_departure_hour: '', // 返程时间暂无AI参数，用户手动输入
    departure_departure_minute: '', // 返程时间暂无AI参数，用户手动输入
    // 酒店入住退房日期
    hotel_checkin_date: finalStartDate,
    hotel_checkout_date: finalEndDate,
    // AI特殊要求
    special_requests: (isAIProcessed && aiSpecialRequests) ? decodeURIComponent(aiSpecialRequests) : '',
    passengers: [],
    total_price: '0.00'
  });

  // 初始化乘客信息 - 整合AI客户信息和URL参数
  useEffect(() => {
    const totalPassengers = formData.adult_count + formData.child_count;
    const passengers = [];
    
    // 解析URL传递的儿童年龄
    const childrenAgesFromUrl = urlChildrenAges ? 
      urlChildrenAges.split(',').map(age => age.trim()).filter(age => age) : [];
    
    
    for (let i = 0; i < totalPassengers; i++) {
      const isChild = i >= formData.adult_count;
      const childIndex = i - formData.adult_count;
      
      const passenger = {
        full_name: '',
        phone: i === 0 ? (user?.phone || '') : '',
        wechat_id: i === 0 ? (user?.wechat_id || '') : '',
        passport_number: '',
        is_child: isChild,
        child_age: isChild ? (childrenAgesFromUrl[childIndex] || '') : null,
        is_primary: i === 0
      };
      
      // AI客户信息填充
      if (isAIProcessed) {
        if (i === 0 && aiCustomerName1 && aiCustomerName1 !== '无') {
          passenger.full_name = decodeURIComponent(aiCustomerName1);
          passenger.phone = aiCustomerPhone1 ? decodeURIComponent(aiCustomerPhone1) : passenger.phone;
          passenger.passport_number = aiCustomerPassport1 ? decodeURIComponent(aiCustomerPassport1) : '';
        } else if (i === 1 && aiCustomerName2) {
          passenger.full_name = decodeURIComponent(aiCustomerName2);
          passenger.phone = aiCustomerPhone2 ? decodeURIComponent(aiCustomerPhone2) : '';
          passenger.passport_number = aiCustomerPassport2 ? decodeURIComponent(aiCustomerPassport2) : '';
        } else if (i === 2 && aiCustomerName3) {
          passenger.full_name = decodeURIComponent(aiCustomerName3);
          passenger.phone = aiCustomerPhone3 ? decodeURIComponent(aiCustomerPhone3) : '';
          passenger.passport_number = aiCustomerPassport3 ? decodeURIComponent(aiCustomerPassport3) : '';
        }
      }
      
      passengers.push(passenger);
    }
    
    if (isAIProcessed) {
      console.log('🤖 AI客户信息已填充到乘客列表:', passengers);
    }
    
    setFormData(prev => ({ ...prev, passengers }));
  }, [formData.adult_count, formData.child_count, user, isAIProcessed, aiCustomerName1, aiCustomerName2, aiCustomerName3, urlChildrenAges]);

  // 获取旅游产品数据
  useEffect(() => {
    fetchTourData();
  }, [type, id]);

  // 当可选行程数据加载完成后，触发价格计算
  useEffect(() => {
    if (tourData && formData.adult_count > 0 && dayTourRelations.length > 0 && Object.keys(selectedOptionalTours).length > 0) {
      setTimeout(() => {
        calculatePrice();
      }, 200);
    }
  }, [dayTourRelations, selectedOptionalTours]);

  // 使用 useMemo 来稳定化依赖项
  const childrenAgesString = useMemo(() => {
    return formData.passengers?.filter(p => p.is_child).map(p => p.child_age).join(',') || '';
  }, [formData.passengers]);

  const roomTypesString = useMemo(() => {
    return formData.roomTypes?.join(',') || '';
  }, [formData.roomTypes]);

  // 计算价格 - 修复：不需要日期就可以计算价格
  useEffect(() => {
    if (tourData && formData.adult_count > 0) {
      
      calculatePrice();
    } else {
      
    }
  }, [
    tourData, 
    formData.adult_count, 
    formData.child_count, 
    formData.hotel_level, 
    formData.hotel_room_count,
    childrenAgesString,
    roomTypesString
    // 注意：移除了 formData.tour_start_date 依赖，因为后端价格计算不需要日期
  ]);

  // 自动同步接送日期和酒店入住日期 - 如果用户没有手动设置
  useEffect(() => {
    if (formData.tour_start_date && formData.tour_end_date) {
      setFormData(prev => {
        // 检查是否需要更新接送日期
        const shouldUpdatePickupDate = !prev.pickup_date || 
          (prev.tour_start_date && prev.pickup_date?.getTime() === prev.tour_start_date.getTime());
        const shouldUpdateDropoffDate = !prev.dropoff_date || 
          (prev.tour_end_date && prev.dropoff_date?.getTime() === prev.tour_end_date.getTime());
        
        // 检查是否需要更新酒店日期  
        const shouldUpdateCheckinDate = !prev.hotel_checkin_date || 
          (prev.tour_start_date && prev.hotel_checkin_date?.getTime() === prev.tour_start_date.getTime());
        const shouldUpdateCheckoutDate = !prev.hotel_checkout_date || 
          (prev.tour_end_date && prev.hotel_checkout_date?.getTime() === prev.tour_end_date.getTime());

        // 调试信息
        

        return {
          ...prev,
          pickup_date: shouldUpdatePickupDate ? formData.tour_start_date : prev.pickup_date,
          dropoff_date: shouldUpdateDropoffDate ? formData.tour_end_date : prev.dropoff_date,
          hotel_checkin_date: shouldUpdateCheckinDate ? formData.tour_start_date : prev.hotel_checkin_date,
          hotel_checkout_date: shouldUpdateCheckoutDate ? formData.tour_end_date : prev.hotel_checkout_date
        };
      });
    }
  }, [formData.tour_start_date, formData.tour_end_date]);

  // 监听URL参数变化，检测新的AI订单信息
  useEffect(() => {
        // 检查是否有新的AI参数且处理时间戳
    const aiProcessedTime = searchParams.get('aiProcessedTime');
    const lastProcessedTime = sessionStorage.getItem('lastAIProcessedTime');
    
    // 修复：严格限制只在agent-booking页面显示AI弹窗，禁止在其他所有页面显示
    const currentPath = window.location.pathname;
    const isAgentBookingPage = currentPath.startsWith('/agent-booking/') && 
                              (currentPath.includes('/group-tours/') || currentPath.includes('/day-tours/'));
    
    // 额外检查：确保不是其他booking页面
    const isOtherBookingPage = currentPath.includes('/booking') && !currentPath.includes('/agent-booking/');
    const shouldShowAIDialog = isAgentBookingPage && !isOtherBookingPage;
    
    // 修复：更简单的方法 - 检查是否有showAIDialog参数，这个参数只在首次从AI聊天跳转时存在
    const showAIDialog = searchParams.get('showAIDialog') === 'true';
    
    if (isAIProcessed && shouldShowAIDialog && showAIDialog && aiProcessedTime && aiProcessedTime !== lastProcessedTime) {
      
      // 询问用户是否要更新表单
      const shouldUpdate = window.confirm(
        '🤖 AI助手为您解析了新的订单信息！\n\n' +
        '是否要用新的信息更新当前表单？\n\n' +
        '点击"确定"将覆盖当前表单内容\n' +
        '点击"取消"保持当前表单不变'
      );
      
      if (shouldUpdate) {
        
        
        // 重新解析AI参数并更新表单
        const newStartDate = (isAIProcessed && aiStartDate) ? 
          parseDateFromAI(aiStartDate) : null;
        const newEndDate = (isAIProcessed && aiEndDate) ? 
          parseDateFromAI(aiEndDate) : null;
        const newAdults = (isAIProcessed && aiGroupSize) ? 
          parseInt(aiGroupSize) : formData.adult_count;
        
        // 更新表单数据
        setFormData(prev => ({
          ...prev,
          adult_count: newAdults,
          tour_start_date: newStartDate,
          tour_end_date: newEndDate,
          hotel_level: (isAIProcessed && aiHotelLevel) ? normalizeHotelLevel(aiHotelLevel) : prev.hotel_level,
          hotel_room_count: Math.ceil(newAdults / 2),
          roomTypes: Array(Math.ceil(newAdults / 2)).fill(
            (isAIProcessed && aiRoomType) ? normalizeRoomType(aiRoomType) : '双人间'
          ),
          pickup_location: (isAIProcessed && aiDeparture) ? decodeURIComponent(aiDeparture) : prev.pickup_location,
          dropoff_location: (isAIProcessed && aiDeparture) ? decodeURIComponent(aiDeparture) : prev.dropoff_location,
          pickup_date: newStartDate,
          dropoff_date: newEndDate,
          arrival_flight: (isAIProcessed && aiArrivalFlight && aiArrivalFlight !== '待定') ? aiArrivalFlight : prev.arrival_flight,
          departure_flight: (isAIProcessed && aiDepartureFlight && aiDepartureFlight !== '待定') ? aiDepartureFlight : prev.departure_flight,
          // 航班日期更新
          arrival_landing_date: newStartDate,
          departure_departure_date: newEndDate,
          // 航班时间字段更新
          arrival_landing_hour: (isAIProcessed && aiArrivalTime) ? parseTimeToHourMinute(aiArrivalTime).hour : prev.arrival_landing_hour,
          arrival_landing_minute: (isAIProcessed && aiArrivalTime) ? parseTimeToHourMinute(aiArrivalTime).minute : prev.arrival_landing_minute,
          hotel_checkin_date: newStartDate,
          hotel_checkout_date: newEndDate,
          special_requests: (isAIProcessed && aiSpecialRequests) ? decodeURIComponent(aiSpecialRequests) : prev.special_requests
        }));
        
                 // 更新乘客信息
         const totalPassengers = newAdults + formData.child_count;
         const newPassengers = [];
         
         for (let i = 0; i < totalPassengers; i++) {
           const passenger = {
             full_name: '',
             phone: i === 0 ? (user?.phone || '') : '',
             wechat_id: i === 0 ? (user?.wechat_id || '') : '',
             passport_number: '',
             is_child: i >= newAdults,
             child_age: i >= newAdults ? '' : null,
             is_primary: i === 0
           };
           
           // AI客户信息填充
           if (i === 0 && aiCustomerName1 && aiCustomerName1 !== '无') {
             passenger.full_name = decodeURIComponent(aiCustomerName1);
             passenger.phone = aiCustomerPhone1 ? decodeURIComponent(aiCustomerPhone1) : passenger.phone;
             passenger.passport_number = aiCustomerPassport1 ? decodeURIComponent(aiCustomerPassport1) : '';
           } else if (i === 1 && aiCustomerName2) {
             passenger.full_name = decodeURIComponent(aiCustomerName2);
             passenger.phone = aiCustomerPhone2 ? decodeURIComponent(aiCustomerPhone2) : '';
             passenger.passport_number = aiCustomerPassport2 ? decodeURIComponent(aiCustomerPassport2) : '';
           } else if (i === 2 && aiCustomerName3) {
             passenger.full_name = decodeURIComponent(aiCustomerName3);
             passenger.phone = aiCustomerPhone3 ? decodeURIComponent(aiCustomerPhone3) : '';
             passenger.passport_number = aiCustomerPassport3 ? decodeURIComponent(aiCustomerPassport3) : '';
           }
           
           newPassengers.push(passenger);
         }
         
         // 更新乘客列表
         setFormData(prev => ({ ...prev, passengers: newPassengers }));
         
         console.log('🤖 AI客户信息已更新到乘客列表:', newPassengers);
         
         // 显示成功提示
         alert('✅ 表单已更新为AI解析的订单信息！\n包括：日期、人数、酒店信息、航班信息、客户信息等');
         
         // 记录处理时间戳，避免重复处理
         sessionStorage.setItem('lastAIProcessedTime', aiProcessedTime);
      } else {
        console.log('❌ 用户取消更新表单');
        // 记录处理时间戳，避免重复询问
        sessionStorage.setItem('lastAIProcessedTime', aiProcessedTime);
      }
      
      // 修复：处理完弹窗后，立即从URL中移除showAIDialog参数，防止刷新页面时重复显示
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('showAIDialog');
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [searchParams, isAIProcessed]); // 监听searchParams变化

  // 获取行程信息
  const fetchItineraryData = async (tourId) => {
    try {

      const response = await getGroupTourItinerary(tourId);
      if (response && response.code === 1 && response.data) {
        setItineraryData(response.data);

      } else {
        console.warn('行程数据获取失败或无数据');
        setItineraryData([]);
      }
    } catch (error) {
      console.error('获取行程数据失败:', error);
      setItineraryData([]);
    }
  };

  // 获取一日游关联数据（可选项目）
  const fetchDayTourRelations = async (tourId) => {
    try {
      // 使用现有的API函数
      const response = await getGroupTourDayTours(tourId);
      if (response && response.code === 1 && Array.isArray(response.data)) {
        setDayTourRelations(response.data);

        
        // 自动选择默认的可选项目
        const defaultSelections = {};
        response.data.forEach(relation => {
          const day = relation.day_number;
          if (!defaultSelections[day]) {
            // 优先选择默认项目，否则选择第一个
            const dayTours = response.data.filter(r => r.day_number === day);
            const defaultTour = dayTours.find(r => r.is_default) || dayTours[0];
            if (defaultTour) {
              defaultSelections[day] = defaultTour.day_tour_id;
            }
          }
        });
        setSelectedOptionalTours(defaultSelections);

      } else {
        console.warn('一日游关联数据格式不正确或无数据');
        setDayTourRelations([]);
      }
    } catch (error) {
      console.error('获取一日游关联数据失败:', error);
      setDayTourRelations([]);
    }
  };

  const fetchTourData = async () => {
    if (!type || !id || isNaN(parseInt(id))) {
      console.log('⚠️ 缺少有效的产品参数，跳过数据获取');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 开始获取产品数据:', { type, id });
      
      let response;
      if (type === 'day-tours') {
        response = await getTourById(id, 'day_tour');
      } else if (type === 'group-tours') {
        response = await getTourById(id, 'group_tour');
      }

      if (response && response.code === 1 && response.data) {
        const data = response.data;
        setTourData(data);
        console.log('✅ 产品数据获取成功:', data);
        
        // 获取行程数据
        if (type === 'group-tours') {
          await fetchItineraryData(id);
          // 获取可选项目数据
          await fetchDayTourRelations(id);
        }
        
        // 设置初始价格为基础价格，但会在后续自动计算实际价格
        // 设置初始价格 - 优先使用代理商折扣价格
        const initialPrice = data.discountedPrice || data.price || 0;
        setTotalPrice(initialPrice);
        
        // 自动触发价格计算（延迟执行确保状态更新完成）
        setTimeout(() => {
          if (formData.adult_count > 0) {
            calculatePrice();
          }
        }, 500);
      } else {
        console.error('❌ 产品数据获取失败:', response);
        setTourData(null);
      }
    } catch (error) {
      console.error('💥 获取产品数据时发生错误:', error);
      setTourData(null);
    } finally {
      setLoading(false);
    }
  };

  const extractDurationFromTourName = (name) => {
    if (!name) return 1;
    const patterns = [
      /(\d+)天(\d+)夜/,
      /(\d+)天/,
      /(\d+)日/
    ];
    
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return type === 'day-tours' ? 1 : 3;
  };

  // 增强的价格计算函数 - 支持请求取消，解决快速点击问题
  const calculatePrice = async () => {
    // 基础验证 - 只有在真正缺少基础数据时才跳过，不清空价格
    if (!tourData || !formData.adult_count) {
      console.log('价格计算跳过 - 缺少基础数据:', { 
        hasTourData: !!tourData, 
        hasAdultCount: !!formData.adult_count,
        adultCountValue: formData.adult_count
      });
      return;
    }

    // 如果不是中介主号，也跳过价格计算但不清空价格
    if (!isAgentMain) {
      console.log('非中介主号，跳过价格计算');
      return;
    }

    // 防止重复调用 - 增强版本
    if (isCallingApiRef.current) {
      console.log('⏳ API调用中，等待当前请求完成...');
      return;
    }

    // 创建新的 AbortController
    calculationAbortControllerRef.current = new AbortController();
    
    isCallingApiRef.current = true;
    setIsPriceLoading(true);
    
    console.log('💰 开始中介价格计算 [' + new Date().toLocaleTimeString() + ']:', {
      tourId: tourData.id,
      adultCount: formData.adult_count,
      childCount: formData.child_count,
      hotelLevel: formData.hotel_level,
      roomCount: formData.hotel_room_count,
      selectedOptionalTours,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });

    try {
      // 构建计算参数
      const calculationParams = {
        tourId: tourData.id,
        tourType: type === 'group-tours' ? 'group_tour' : 'day_tour',
        adultCount: parseInt(formData.adult_count) || 1,
        childCount: parseInt(formData.child_count) || 0,
        hotelLevel: formData.hotel_level || '4星',
        agentId: user?.agentId || user?.id,
        roomCount: parseInt(formData.hotel_room_count) || 1,
        userId: user?.id,
        childrenAges: (formData.passengers || [])
          .filter(p => p.is_child && p.child_age != null)
          .map(p => parseInt(p.child_age))
          .filter(age => !isNaN(age) && age >= 0 && age <= 17),
        roomTypes: formData.roomTypes || ['双人间'],
        selectedOptionalTours: Object.keys(selectedOptionalTours).length > 0 ? selectedOptionalTours : null
      };

      console.log('价格计算参数:', calculationParams);

      // 检查是否已取消
      if (calculationAbortControllerRef.current && calculationAbortControllerRef.current.signal.aborted) {
        console.log('🔴 价格计算在API调用前被取消');
        return;
      }

      // 调用价格计算API - 传递完整的房型数组
      const response = await calculateTourPrice(
        calculationParams.tourId,
        calculationParams.tourType,
        calculationParams.adultCount,
        calculationParams.childCount,
        calculationParams.hotelLevel,
        calculationParams.agentId,
        calculationParams.roomCount,
        calculationParams.userId,
        calculationParams.childrenAges,
        calculationParams.roomTypes, // 传递完整房型数组而不是单个房型
        calculationParams.selectedOptionalTours
      );

      // 检查是否在API调用完成前被取消
      if (calculationAbortControllerRef.current && calculationAbortControllerRef.current.signal.aborted) {
        console.log('🔴 价格计算在API响应后被取消');
        return;
      }

      console.log('价格计算响应:', response);

      if (response && response.code === 1 && response.data) {
        const priceData = response.data;
        
        // 多层数据结构处理
        const actualPriceData = priceData.data || priceData;
        
        // 尝试从多个可能的字段获取价格
        const priceFields = [
          'totalPrice', 'total_price', 'finalPrice', 'calculatedPrice', 
          'price', 'agentPrice', 'wholesalePrice'
        ];
        
        let finalPrice = null;
        for (const field of priceFields) {
          if (actualPriceData[field] !== undefined && actualPriceData[field] !== null) {
            finalPrice = parseFloat(actualPriceData[field]);
            console.log(`使用价格字段 ${field}:`, finalPrice);
            break;
          }
        }

        if (finalPrice !== null && finalPrice > 0) {
          setTotalPrice(finalPrice);
          console.log('价格计算成功:', finalPrice);
        } else {
          console.warn('未找到有效价格，使用产品基础价格');
          setTotalPrice(tourData.price || 0);
        }
      } else {
        console.error('价格计算API失败:', response);
        // API失败时不清空现有价格，避免闪动
        console.log('保持现有价格不变');
      }
    } catch (error) {
      // 检查是否是取消的请求
      if (error.name === 'AbortError') {
        console.log('🔴 价格计算请求已取消');
        return;
      }
      
      console.error('价格计算异常:', error);
      // 异常时不清空现有价格，避免闪动
      console.log('保持现有价格不变');
    } finally {
      // 清理请求控制器
      if (calculationAbortControllerRef.current && !calculationAbortControllerRef.current.signal.aborted) {
        calculationAbortControllerRef.current = null;
      }
      
      isCallingApiRef.current = false;
      setIsPriceLoading(false);
      
      // 安全重置：3秒后强制重置状态（防止卡死）
      setTimeout(() => {
        if (isCallingApiRef.current) {
          console.warn('🔧 强制重置API调用状态');
          isCallingApiRef.current = false;
          setIsPriceLoading(false);
          if (calculationAbortControllerRef.current) {
            calculationAbortControllerRef.current.abort();
            calculationAbortControllerRef.current = null;
          }
        }
      }, 3000);
    }
  };

  // 初始化可选行程的默认选择
  useEffect(() => {
    if (dayTourRelations && dayTourRelations.length > 0) {
      console.log('初始化可选行程默认选择:', dayTourRelations);
      
      // 分组处理
      const optionalDays = {};
      dayTourRelations.forEach(relation => {
        const day = relation.day_number;
        if (!optionalDays[day]) {
          optionalDays[day] = [];
        }
        optionalDays[day].push(relation);
      });

      // 为每个有多个选项的天数设置默认选择
      const newDefaults = {};
      Object.keys(optionalDays).forEach(day => {
        const dayOptions = optionalDays[day];
        if (dayOptions.length > 1) {
          // 找默认选项，如果没有就选第一个
          const defaultOption = dayOptions.find(opt => opt.is_default) || dayOptions[0];
          newDefaults[day] = defaultOption.day_tour_id;
          console.log(`第${day}天默认选择:`, defaultOption.day_tour_name);
        }
      });

      // 只有当当前没有选择时才设置默认值
      if (Object.keys(newDefaults).length > 0 && Object.keys(selectedOptionalTours).length === 0) {
        console.log('⚙️ 设置可选行程默认选择:', newDefaults);
        setSelectedOptionalTours(newDefaults);
      }
    }
  }, [dayTourRelations]);

  // 增强的价格计算控制器 - 解决快速点击问题
  const priceCalculationTimerRef = useRef(null);
  const isInitializingRef = useRef(true); // 标记是否在初始化阶段
  const lastCalculationParamsRef = useRef(null); // 存储上次计算的参数
  const calculationAbortControllerRef = useRef(null); // 用于取消请求
  
  // 使用memo来避免不必要的依赖项变化
  const selectedOptionalToursString = useMemo(() => 
    JSON.stringify(selectedOptionalTours), [selectedOptionalTours]
  );

  // 生成计算参数的哈希值，用于避免重复计算
  const generateCalculationHash = useCallback((params) => {
    return JSON.stringify({
      tourId: params.tourId,
      adultCount: params.adultCount,
      childCount: params.childCount,
      hotelLevel: params.hotelLevel,
      roomCount: params.roomCount,
      selectedTours: params.selectedTours
    });
  }, []);

  // 增强的防抖价格计算触发器
  const triggerPriceCalculation = useCallback(() => {
    // 如果正在初始化阶段，跳过
    if (isInitializingRef.current) {
      console.log('🚫 初始化阶段，跳过价格计算');
      return;
    }

    // 基础验证
    if (!tourData || !formData.adult_count || formData.adult_count < 1 || !isAgentMain) {
      console.log('🚫 不满足价格计算基础条件');
      return;
    }

    // 生成当前计算参数
    const currentParams = {
      tourId: tourData.id,
      adultCount: parseInt(formData.adult_count) || 1,
      childCount: parseInt(formData.child_count) || 0,
      hotelLevel: formData.hotel_level || '4星',
      roomCount: parseInt(formData.hotel_room_count) || 1,
      selectedTours: Object.keys(selectedOptionalTours).length > 0 ? selectedOptionalTours : null
    };

    const currentHash = generateCalculationHash(currentParams);
    
    // 如果参数没变，跳过计算
    if (lastCalculationParamsRef.current === currentHash) {
      console.log('🚫 计算参数未变化，跳过重复计算');
      return;
    }

    // 更新参数哈希
    lastCalculationParamsRef.current = currentHash;

    console.log('🔍 价格计算触发:', currentParams);

    // 取消之前的请求
    if (calculationAbortControllerRef.current) {
      calculationAbortControllerRef.current.abort();
      console.log('🔴 取消上一个价格计算请求');
    }

    // 清除之前的定时器
    if (priceCalculationTimerRef.current) {
      clearTimeout(priceCalculationTimerRef.current);
    }

    // 设置更长的防抖时间，避免快速点击问题
    priceCalculationTimerRef.current = setTimeout(() => {
      console.log('🎯 执行防抖后的价格计算');
      calculatePrice();
    }, 800); // 增加到800ms，给用户更多时间完成输入
  }, [tourData, formData.adult_count, formData.child_count, formData.hotel_level, 
      formData.hotel_room_count, selectedOptionalTours, isAgentMain, generateCalculationHash]);

  // 监听影响价格的数据变化
  useEffect(() => {
    triggerPriceCalculation();
  }, [triggerPriceCalculation]);

  // 初始价格计算 - 只在所有数据第一次加载完成后执行一次
  const hasTriggeredInitialCalculation = useRef(false);
  
  useEffect(() => {
    if (tourData && formData.adult_count > 0 && isAgentMain && 
        Object.keys(selectedOptionalTours).length > 0 && 
        !hasTriggeredInitialCalculation.current) {
      
      // 标记已经触发过初始计算
      hasTriggeredInitialCalculation.current = true;
      
      // 延迟执行初始价格计算，确保所有状态都已稳定
      const timer = setTimeout(() => {
        console.log('🚀 执行唯一的初始价格计算');
        isInitializingRef.current = false; // 标记初始化完成
        calculatePrice();
      }, 1500); // 1.5秒延迟

      return () => clearTimeout(timer);
    }
  }, [tourData?.id, Object.keys(selectedOptionalTours).length]); // 简化依赖项

  // 清理定时器和请求控制器
  useEffect(() => {
    return () => {
      // 清理价格计算定时器
      if (priceCalculationTimerRef.current) {
        clearTimeout(priceCalculationTimerRef.current);
        priceCalculationTimerRef.current = null;
      }
      
      // 取消正在进行的价格计算请求
      if (calculationAbortControllerRef.current) {
        calculationAbortControllerRef.current.abort();
        calculationAbortControllerRef.current = null;
      }
      
      // 重置相关状态
      isCallingApiRef.current = false;
      lastCalculationParamsRef.current = null;
      
      console.log('🧹 AgentBooking组件清理完成');
    };
  }, []);

  // 处理可选项目选择 - 优化版本，避免重复计算
  const handleOptionalTourSelect = (dayNumber, tourId) => {
    // 检查是否重复选择
    if (selectedOptionalTours[dayNumber] === tourId) {
      console.log('🔄 可选行程重复选择，跳过');
      return;
    }

    console.log(`🎯 可选行程选择变更: 第${dayNumber}天 -> 行程ID ${tourId}`);

    // 批量更新，减少状态更新次数
    setSelectedOptionalTours(prev => {
      const newSelection = {
        ...prev,
        [dayNumber]: tourId
      };
      
      console.log('🗓️ 更新后的可选行程选择:', newSelection);
      return newSelection;
    });
    
    // 价格重新计算将通过useEffect自动触发，包含防抖机制
  };

  const handleInputChange = (field, value) => {
    console.log(`📝 表单字段更新: ${field} = ${value}`);
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // 如果是更新开始日期，自动更新相关日期
      if (field === 'tour_start_date' && value) {
        // 对于跟团游，自动计算结束日期
        if (type === 'group-tours' && tourData) {
          const duration = extractDurationFromTourName(tourData.title || tourData.name);
          const endDate = new Date(value);
          endDate.setDate(endDate.getDate() + duration - 1);
          updated.tour_end_date = endDate;
          updated.dropoff_date = endDate;
          updated.hotel_checkout_date = endDate;
        }
        
        // 接客日期和入住日期默认为开始日期
        updated.pickup_date = value;
        updated.hotel_checkin_date = value;
      }
      
      // 如果是更新结束日期，自动更新送客和退房日期
      if (field === 'tour_end_date' && value) {
        updated.dropoff_date = value;
        updated.hotel_checkout_date = value;
      }
      
      // 如果是更新房间数量，智能更新房型数组
      if (field === 'hotel_room_count') {
        const newRoomCount = parseInt(value) || 0;
        const currentRoomTypes = formData.roomTypes || [];
        
        if (newRoomCount > currentRoomTypes.length) {
          // 增加房间：保留现有房型，为新房间添加默认房型
          const additionalRooms = newRoomCount - currentRoomTypes.length;
          updated.roomTypes = [...currentRoomTypes, ...Array(additionalRooms).fill('双人间')];
          console.log(`➕ 增加房间到${newRoomCount}间，新房型数组:`, updated.roomTypes);
        } else if (newRoomCount < currentRoomTypes.length) {
          // 减少房间：保留前N个房型
          updated.roomTypes = currentRoomTypes.slice(0, newRoomCount);
          console.log(`➖ 减少房间到${newRoomCount}间，新房型数组:`, updated.roomTypes);
        } else {
          // 房间数量没变，保持原有房型
          updated.roomTypes = currentRoomTypes;
        }
      }
      
      return updated;
    });
    
    // 只在影响价格的字段变化时记录日志
    const priceAffectingFields = ['adult_count', 'child_count', 'hotel_level', 'hotel_room_count'];
    if (priceAffectingFields.includes(field)) {
      console.log(`💰 价格相关字段 ${field} 更新，将触发价格重算`);
    }
    
    // 价格计算将通过useEffect自动触发，包含防抖和重复检查机制
  };

  // 处理时间输入的函数
  const handleTimeInput = (field, value, nextField = null) => {
    // 只允许数字输入
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // 验证输入范围
    let validatedValue = numericValue;
    if (field.includes('hour')) {
      // 小时：00-23
      const hour = parseInt(numericValue) || 0;
      if (hour > 23) validatedValue = '23';
    } else if (field.includes('minute')) {
      // 分钟：00-59
      const minute = parseInt(numericValue) || 0;
      if (minute > 59) validatedValue = '59';
    }
    
    // 更新表单数据
    setFormData(prev => ({
      ...prev,
      [field]: validatedValue
    }));
    
    // 自动跳转到下一个输入框
    if (validatedValue.length === 2 && nextField) {
      // 延迟一点点，确保当前值已更新
      setTimeout(() => {
        // 使用完整的字段名作为类名来精确定位
        const nextInput = document.querySelector(`.${nextField.replace(/_/g, '-')}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select(); // 选中所有文本，方便用户直接覆盖
        }
      }, 10);
    }
  };
  
  // 处理房型变化 - 优化版本
  const handleRoomTypeChange = (index, roomType) => {
    console.log(`🏨 房型变化: 房间${index + 1} -> ${roomType}`);
    
    setFormData(prev => {
      const newRoomTypes = [...prev.roomTypes];
      newRoomTypes[index] = roomType;
      
      console.log('🏠 更新后的房型数组:', newRoomTypes);
      return { ...prev, roomTypes: newRoomTypes };
    });
    
    // 清除房型验证错误
    if (validationErrors.roomTypes) {
      setValidationErrors(prev => ({ ...prev, roomTypes: null }));
    }
    
    console.log('💰 房型变化将触发价格重算');
    // 房型变化后会通过useEffect自动重新计算价格，包含防抖机制
  };

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...formData.passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setFormData(prev => ({ ...prev, passengers: newPassengers }));
    
    // 儿童年龄变化会通过useEffect自动触发价格重新计算
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证影响价格的必填字段
    if (!formData.tour_start_date) {
      toast.error('请选择出发日期');
      return;
    }

    if (!formData.adult_count || formData.adult_count < 1) {
      toast.error('请选择成人数量');
      return;
    }

    // 儿童数量本身不是必填，但如果有儿童则儿童年龄是必填
    if (formData.child_count > 0) {
      const childWithoutAge = formData.passengers.findIndex(p => p.is_child && !p.child_age);
      if (childWithoutAge !== -1) {
        toast.error('请选择儿童年龄');
        
        // 滚动到未选择年龄的儿童输入框
        setTimeout(() => {
          const passengerElement = document.querySelectorAll('.passenger-item')[childWithoutAge];
          if (passengerElement) {
            passengerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const ageSelect = passengerElement.querySelector('select');
            if (ageSelect) {
              ageSelect.focus();
              ageSelect.style.borderColor = '#dc3545';
              ageSelect.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
              setTimeout(() => {
                ageSelect.style.borderColor = '';
                ageSelect.style.boxShadow = '';
              }, 3000);
            }
          }
        }, 100);
        return;
      }
    }

    // 跟团游的酒店信息是必填（影响价格）
    if (type === 'group-tours') {
      if (!formData.hotel_level) {
        toast.error('请选择酒店等级');
        return;
      }
      if (!formData.hotel_room_count || formData.hotel_room_count < 1) {
        toast.error('请选择房间数量');
        return;
      }
          // 验证房型配置
    const errors = {};
    if (!formData.roomTypes || formData.roomTypes.length === 0) {
      errors.roomTypes = '请配置房型';
    } else {
      const emptyRoomType = formData.roomTypes.findIndex(roomType => !roomType);
      if (emptyRoomType !== -1) {
        errors.roomTypes = `请选择房间 ${emptyRoomType + 1} 的房型`;
      }
    }
    
    // 设置验证错误状态
    setValidationErrors(errors);
    
    // 如果有错误，阻止提交
    if (Object.keys(errors).length > 0) {
      toast.error(errors.roomTypes);
      return;
    }
    }

    // 所有乘客信息都是选填，包括护照号

    setSubmitting(true);
    try {
      // 验证关键参数
      const tourId = parseInt(id);
      const tourType = type === 'day-tours' ? 'day_tour' : 'group_tour';
      
      if (!tourId || isNaN(tourId)) {
        throw new Error(`无效的产品ID: ${id}`);
      }
      
      if (!type || !['day-tours', 'group-tours'].includes(type)) {
        throw new Error(`无效的产品类型: ${type}`);
      }
      
      console.log('订单关键参数验证:', {
        原始id: id,
        解析后tourId: tourId,
        原始type: type,
        解析后tourType: tourType,
        成人数量: formData.adult_count,
        儿童数量: formData.child_count
      });

      // 格式化航班时间 - 从分离的小时和分钟字段构造时间
      const formatTimeFromFields = (dateField, hourField, minuteField) => {
        const date = formData[dateField];
        const hour = formData[hourField];
        const minute = formData[minuteField];
        
        if (!date || !hour || !minute) return null;
        
        // 构造完整的日期时间
        const fullDate = new Date(date);
        fullDate.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        
        // 后端JacksonObjectMapper配置的LocalDateTime格式是 "yyyy-MM-dd HH:mm"
        const year = fullDate.getFullYear();
        const month = String(fullDate.getMonth() + 1).padStart(2, '0');
        const day = String(fullDate.getDate()).padStart(2, '0');
        const hours = String(fullDate.getHours()).padStart(2, '0');
        const minutes = String(fullDate.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      // 格式化航班时间 - 兼容原有的date格式
      const formatFlightTime = (date) => {
        if (!date) return null;
        // 后端JacksonObjectMapper配置的LocalDateTime格式是 "yyyy-MM-dd HH:mm"
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      // 处理乘客信息，确保字段映射正确
      const processedPassengers = formData.passengers.map(passenger => ({
        // 使用驼峰命名格式匹配后端DTO
        fullName: passenger.full_name || '',
        phone: passenger.phone || '',
        wechatId: passenger.wechat_id || '',
        isChild: passenger.is_child || false,
        childAge: passenger.child_age || null,
        isPrimary: passenger.is_primary || false,
        // 添加其他可能的字段
        gender: passenger.gender || null,
        dateOfBirth: passenger.date_of_birth || null,
        passportNumber: passenger.passport_number || null,
        passportExpiry: passenger.passport_expiry || null,
        nationality: passenger.nationality || null,
        email: passenger.email || null,
        emergencyContactName: passenger.emergency_contact_name || null,
        emergencyContactPhone: passenger.emergency_contact_phone || null,
        dietaryRequirements: passenger.dietary_requirements || null,
        medicalConditions: passenger.medical_conditions || null,
        luggageCount: passenger.luggage_count || null,
        specialRequests: passenger.special_requests || null,
        ticketNumber: passenger.ticket_number || null,
        seatNumber: passenger.seat_number || null,
        luggageTags: passenger.luggage_tags || null,
        checkInStatus: passenger.check_in_status || null
      }));

      console.log('处理后的乘客信息:', processedPassengers);

      // 找到主联系人信息
      const primaryPassenger = formData.passengers.find(p => p.is_primary);
      console.log('主联系人信息:', primaryPassenger);

      const bookingData = {
        // 使用驼峰命名格式以匹配后端DTO
        tourId: tourId,
        tourType: tourType,
        tourStartDate: formData.tour_start_date.toISOString().split('T')[0],
        tourEndDate: formData.tour_end_date ? formData.tour_end_date.toISOString().split('T')[0] : formData.tour_start_date.toISOString().split('T')[0],
        adultCount: formData.adult_count,
        childCount: formData.child_count,
        groupSize: formData.adult_count + formData.child_count,
        agentId: user?.agentId || user?.id,
        // 主联系人信息 - 从主乘客复制到订单表
        contactPerson: primaryPassenger?.full_name || null,
        contactPhone: primaryPassenger?.phone || null,
        passengerContact: primaryPassenger?.phone || null, // 备用联系方式字段
        // 航班信息
        flightNumber: formData.arrival_flight || null,
        returnFlightNumber: formData.departure_flight || null,
        // 航班时间信息
        arrivalDepartureTime: null, // 抵达起飞时间（暂不使用）
        arrivalLandingTime: formatTimeFromFields('arrival_landing_date', 'arrival_landing_hour', 'arrival_landing_minute'),
        departureDepartureTime: formatTimeFromFields('departure_departure_date', 'departure_departure_hour', 'departure_departure_minute'),
        departureLandingTime: null, // 返程降落时间（暂不使用）
        // 接送信息
        pickupLocation: formData.pickup_location,
        dropoffLocation: formData.dropoff_location,
        pickupDate: formData.pickup_date ? formData.pickup_date.toISOString().split('T')[0] : null,
        dropoffDate: formData.dropoff_date ? formData.dropoff_date.toISOString().split('T')[0] : null,
        // 酒店信息
        hotelLevel: formData.hotel_level,
        hotelRoomCount: formData.hotel_room_count,
        roomType: formData.roomTypes?.[0],
        // 酒店入住退房日期
        hotelCheckInDate: formData.hotel_checkin_date ? formData.hotel_checkin_date.toISOString().split('T')[0] : null,
        hotelCheckOutDate: formData.hotel_checkout_date ? formData.hotel_checkout_date.toISOString().split('T')[0] : null,
        // 特殊要求
        specialRequests: formData.special_requests,
        // 乘客信息 - 使用处理后的数据
        passengers: processedPassengers,
        // 可选项目信息
        selectedOptionalTours: Object.keys(selectedOptionalTours).length > 0 ? JSON.stringify(selectedOptionalTours) : null,
        // 订单标识
        createdByAgent: true
      };
      
      console.log('发送到后端的订单数据:', {
        tourId: bookingData.tourId,
        tourType: bookingData.tourType,
        adultCount: bookingData.adultCount,
        childCount: bookingData.childCount,
        agentId: bookingData.agentId,
        groupSize: bookingData.groupSize
      });

      const response = await createTourBooking(bookingData);
      // 后端返回的Result对象中，code=1表示成功
      if (response.code === 1) {
        const orderId = response.data?.bookingId || response.data?.id;
        toast.success('订单创建成功！邮件正在后台发送...');
        
        // 立即跳转到成功页面，避免阻塞用户
        navigate('/booking-success', {
          state: {
            orderId: orderId,
            bookingData: {
              ...bookingData,
              tourName: tourData.title || tourData.name,
              totalPrice: totalPrice,
              orderType: 'agent_booking',
              bookingId: orderId,
              order_number: orderId
            },
            tourInfo: {
              title: tourData.title || tourData.name,
              type: tourType,
              startDate: formData.tour_start_date,
              endDate: formData.tour_end_date,
              duration: tourData.duration,
              adultCount: formData.adult_count,
              childCount: formData.child_count
            },
            emailSending: true // 标记邮件正在发送
          }
        });
        
        // 🔥 邮件发送已改为后端自动处理，前端不再需要手动发送
        console.log('✅ 订单创建成功，后端将自动发送邮件');
                

      } else {
        toast.error(response.msg || '订单创建失败');
      }
    } catch (error) {
      console.error('订单创建错误:', error);
      toast.error('订单创建失败: ' + (error.message || '网络错误'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAgent) {
    return null; // 重定向中
  }

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">加载产品信息中...</p>
        </div>
      </Container>
    );
  }

  if (!tourData) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <h4>产品未找到</h4>
          <p>抱歉，未找到您要预订的产品。</p>
          <Button variant="outline-danger" onClick={() => navigate('/booking-form')}>
            <FaArrowLeft className="me-2" />
            返回搜索
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="agent-booking-page">
      <Container>
        <div className="mb-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/booking-form')}
            className="mb-3"
          >
            <FaArrowLeft className="me-2" />
            返回搜索
          </Button>
                    
        </div>

        <Row>
          {/* 产品信息 */}
          <Col lg={4}>
            {/* 新的产品信息卡片 */}
            <Card className="agent-product-card mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0 text-dark">
                  <FaInfoCircle className="me-2 text-primary" />
                  产品信息
                </h6>
              </Card.Header>
              <Card.Body>
                {/* 产品基本信息 */}
                <div className="product-basic-info mb-3">
                  <div className="d-flex align-items-start mb-2">
                    <div className="product-image me-3">
                      <img 
                        src={tourData.coverImage || tourData.image || '/images/placeholder.jpg'} 
                        alt={tourData.title || tourData.name}
                        className="img-fluid rounded"
                        style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="product-title mb-1 text-dark">
                        {tourData.title || tourData.name}
                      </h6>
                      <div className="product-type">
                        <span className="badge bg-secondary">
                          {type === 'day-tours' ? '一日游' : '多日游'}
                        </span>
                        {tourData.duration && (
                          <span className="badge bg-info ms-1">
                            {tourData.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 订单信息汇总 */}
                <div className="order-summary mb-3">
                  <h6 className="mb-2 text-dark">
                    <FaUsers className="me-2 text-success" />
                    订单汇总
                  </h6>
                  <div className="summary-item">
                    <small className="text-muted">出行人数：</small>
                    <span className="fw-bold">
                      {formData.adult_count || 0}成人
                      {formData.child_count > 0 && ` + ${formData.child_count}儿童`}
                    </span>
                  </div>
                  {formData.hotel_room_count > 0 && (
                    <div className="summary-item">
                      <small className="text-muted">住宿：</small>
                      <span className="fw-bold">
                        {formData.hotel_level || '4星'} · {formData.hotel_room_count}间房
                      </span>
                    </div>
                  )}
                  {formData.tour_start_date && (
                    <div className="summary-item">
                      <small className="text-muted">出行日期：</small>
                      <span className="fw-bold">
                        {formData.tour_start_date.toLocaleDateString()}
                        {formData.tour_end_date && formData.tour_end_date !== formData.tour_start_date && 
                          ` - ${formData.tour_end_date.toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* 可选行程选择 - 带交互功能 */}
                {dayTourRelations && dayTourRelations.length > 0 && (
                  <div className="optional-tours-selection mb-3">
                    <h6 className="mb-2 text-dark">
                      <FaRoute className="me-2 text-warning" />
                      行程选择
                    </h6>
                    {(() => {
                      const optionalDays = {};
                      dayTourRelations.forEach(relation => {
                        const day = relation.day_number;
                        if (!optionalDays[day]) {
                          optionalDays[day] = [];
                        }
                        optionalDays[day].push(relation);
                      });

                      const optionalDaysList = Object.keys(optionalDays)
                        .filter(day => optionalDays[day].length > 1)
                        .sort((a, b) => parseInt(a) - parseInt(b));

                      if (optionalDaysList.length === 0) {
                        return <small className="text-muted">无可选行程</small>;
                      }

                      return optionalDaysList.map(day => {
                        const dayOptions = optionalDays[day];
                        const selectedTourId = selectedOptionalTours[day];
                        
                        return (
                          <div key={day} className="optional-day-card mb-3">
                            <div className="day-header d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-bold text-primary">第{day}天</span>
                              <Badge bg="info" size="sm">可选</Badge>
                            </div>
                            
                            {/* 可选项目列表 */}
                            <div className="tour-options">
                              {dayOptions.map((option, index) => {
                                const isSelected = selectedTourId === option.day_tour_id;
                                const priceDiff = option.price_difference || 0;
                                
                                return (
                                  <div 
                                    key={option.day_tour_id}
                                    className={`tour-option-compact mb-1 p-2 border rounded cursor-pointer ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light'}`}
                                    onClick={() => {
                                      if (selectedTourId !== option.day_tour_id) {
                                        handleOptionalTourSelect(day, option.day_tour_id);
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <div className="d-flex align-items-start">
                                      <Form.Check
                                        type="radio"
                                        name={`agent-day-${day}-tour`}
                                        checked={isSelected}
                                        onChange={() => {
                                          if (selectedTourId !== option.day_tour_id) {
                                            handleOptionalTourSelect(day, option.day_tour_id);
                                          }
                                        }}
                                        className="me-2"
                                        style={{ fontSize: '12px' }}
                                      />
                                      <div className="flex-grow-1">
                                        <div className="small fw-bold text-dark">
                                          {option.day_tour_name}
                                          {option.is_default && (
                                            <Badge bg="success" size="sm" className="ms-1" style={{fontSize: '8px'}}>推荐</Badge>
                                          )}
                                          {priceDiff > 0 && (
                                            <Badge bg="warning" size="sm" className="ms-1" style={{fontSize: '8px'}}>+${priceDiff}</Badge>
                                          )}
                                          {priceDiff < 0 && (
                                            <Badge bg="success" size="sm" className="ms-1" style={{fontSize: '8px'}}>-${Math.abs(priceDiff)}</Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* 价格显示 - 重新设计 */}
                {isAgentMain && (
                  <div className="agent-price-section">
                    <div className="price-header mb-2">
                      <h6 className="mb-0 text-dark">
                        <FaDollarSign className="me-2 text-success" />
                        代理价格
                      </h6>
                    </div>
                    
                    {isPriceLoading ? (
                      <div className="price-loading text-center p-3">
                        <Spinner animation="border" size="sm" className="me-2 text-primary" />
                        <small className="text-muted">计算价格中...</small>
                      </div>
                    ) : (
                      <div className="price-display p-3 bg-success bg-opacity-10 rounded">
                        {totalPrice !== null && totalPrice !== undefined ? (
                          <>
                            <div className="price-amount d-flex align-items-baseline">
                              <span className="currency h5 text-success">$</span>
                              <span className="amount h4 fw-bold text-success ms-1">
                                {parseFloat(totalPrice).toFixed(2)}
                              </span>
                            </div>
                            <div className="price-note">
                              <small className="text-success">
                                <FaCheck className="me-1" />
                                含税总价 · 代理专享价格
                              </small>
                            </div>
                          </>
                        ) : (
                          <div className="no-price text-center">
                            <small className="text-muted">
                              <FaExclamationTriangle className="me-1" />
                              请完善订单信息以计算价格
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 价格说明 */}
                    <div className="price-notes mt-2">
                      <small className="text-muted d-block">
                        <FaInfoCircle className="me-1" />
                        价格会根据选择的行程和住宿自动更新
                      </small>
                    </div>
                  </div>
                )}

                {/* 如果不是中介主号，显示提示 */}
                {!isAgentMain && (
                  <div className="no-price-access text-center p-3 bg-light rounded">
                    <FaLock className="text-muted mb-2" size="1.5em" />
                    <small className="text-muted d-block">
                      仅中介主账号可查看价格信息
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* 预订表单 */}
          <Col lg={8}>
            <Card className="booking-form-card">
              <Card.Body>
                <h5 className="mb-4">预订信息</h5>
                
                {/* AI处理状态提示 */}
                {isAIProcessed && (
                  <Alert variant="success" className="mb-4">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-robot me-2"></i>
                      <div>
                        <strong>AI智能解析完成</strong>
                        <div className="small text-muted mb-1">
                          AI助手自动识别并解析了您的需求，将信息智能填入订单表单
                        </div>
                        <div className="small">
                          订单信息已自动填充，请核对以下信息并根据需要进行调整
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  {/* 基本信息 */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaCalendarAlt className="me-2" />
                          出发日期 <span className="text-danger">*</span>
                          <small className="text-muted ms-2">
                            (当前: {formData.tour_start_date ? formData.tour_start_date.toLocaleDateString() : '未选择'})
                          </small>
                        </Form.Label>
                        <DatePicker
                          selected={formData.tour_start_date}
                          onChange={(date) => {
                            console.log('📅 日期选择器触发:', date);
                            handleInputChange('tour_start_date', date);
                          }}
                          dateFormat="yyyy-MM-dd"
                          minDate={new Date()}
                          className="form-control"
                          placeholderText="选择出发日期"
                          showPopperArrow={false}
                          autoComplete="off"
                          readOnly={false}
                          isClearable={true}
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                        />
                      </Form.Group>
                    </Col>
                    
                    {type === 'group-tours' && (
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaCalendarAlt className="me-2" />
                            返回日期
                            <small className="text-muted ms-2">
                              (当前: {formData.tour_end_date ? formData.tour_end_date.toLocaleDateString() : '未选择'})
                            </small>
                          </Form.Label>
                          <DatePicker
                            selected={formData.tour_end_date}
                            onChange={(date) => {
                              console.log('📅 结束日期选择器触发:', date);
                              handleInputChange('tour_end_date', date);
                            }}
                            dateFormat="yyyy-MM-dd"
                            minDate={formData.tour_start_date}
                            className="form-control"
                            placeholderText="选择返回日期"
                            showPopperArrow={false}
                            autoComplete="off"
                            readOnly={false}
                            isClearable={true}
                            showYearDropdown
                            showMonthDropdown
                            dropdownMode="select"
                          />
                        </Form.Group>
                      </Col>
                    )}
                  </Row>

                  {/* 人数选择 */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaUsers className="me-2" />
                          成人数量 <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={formData.adult_count}
                          onChange={(e) => handleInputChange('adult_count', parseInt(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8].map(num => (
                            <option key={num} value={num}>{num} 人</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FaUsers className="me-2" />
                          儿童数量 <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={formData.child_count}
                          onChange={(e) => handleInputChange('child_count', parseInt(e.target.value))}
                        >
                          {[0,1,2,3,4].map(num => (
                            <option key={num} value={num}>{num} 人</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* 酒店信息 - 仅跟团游显示 */}
                  {type === 'group-tours' && (
                    <div className="mb-4">
                      <h6 className="mb-3">
                        <FaHotel className="me-2" />
                        酒店信息
                      </h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>酒店等级 <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              value={formData.hotel_level}
                              onChange={(e) => handleInputChange('hotel_level', e.target.value)}
                            >
                              <option value="3星">3星酒店</option>
                              <option value="4星">4星酒店</option>
                              <option value="4.5星">4.5星酒店</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>房间数量 <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              value={formData.hotel_room_count}
                              onChange={(e) => handleInputChange('hotel_room_count', parseInt(e.target.value))}
                            >
                              {[1,2,3,4,5].map(num => (
                                <option key={num} value={num}>{num} 间</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      {/* 房型选择 */}
                      <div className="mb-3">
                        <Form.Label>
                          <FaBed className="me-2" />
                          房型配置 <span className="text-danger">*</span>
                        </Form.Label>
                        {formData.roomTypes?.map((roomType, index) => (
                          <Row key={index} className="mb-2">
                            <Col>
                               <Form.Select
                                 value={roomType || '双人间'}
                                 onChange={(e) => handleRoomTypeChange(index, e.target.value)}
                                 className={validationErrors.roomTypes ? 'is-invalid' : ''}
                                 required
                               >
                                 <option value="双人间">双人间</option>
                                 <option value="大床房">大床房</option>
                                 <option value="三人间">三人间</option>
                               </Form.Select>
                              <Form.Text className="text-muted">
                                房间 {index + 1}
                              </Form.Text>
                            </Col>
                          </Row>
                        ))}
                        
                        {/* 房型验证错误显示 */}
                        {validationErrors.roomTypes && (
                          <Alert variant="danger" className="mt-2 mb-0">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {validationErrors.roomTypes}
                          </Alert>
                        )}
                      </div>
                      
                                             {/* 酒店入住退房日期 */}
                       <Row>
                         <Col md={6}>
                           <Form.Group className="mb-3">
                             <Form.Label>
                               <FaCalendarAlt className="me-2" />
                               入住日期
                             </Form.Label>
                             <DatePicker
                               selected={formData.hotel_checkin_date}
                               onChange={(date) => handleInputChange('hotel_checkin_date', date)}
                               dateFormat="yyyy-MM-dd"
                               className="form-control"
                               placeholderText="选择入住日期（选填）"
                               minDate={new Date()}
                             />
                             <Form.Text className="text-muted">
                               通常为行程开始日期
                             </Form.Text>
                           </Form.Group>
                         </Col>
                         
                         <Col md={6}>
                           <Form.Group className="mb-3">
                             <Form.Label>
                               <FaCalendarAlt className="me-2" />
                               退房日期
                             </Form.Label>
                             <DatePicker
                               selected={formData.hotel_checkout_date}
                               onChange={(date) => handleInputChange('hotel_checkout_date', date)}
                               dateFormat="yyyy-MM-dd"
                               className="form-control"
                               placeholderText="选择退房日期（选填）"
                               minDate={new Date()}
                             />
                             <Form.Text className="text-muted">
                               通常为行程结束日期
                             </Form.Text>
                           </Form.Group>
                         </Col>
                       </Row>
                    </div>
                  )}

                  {/* 接送信息 */}
                  <div className="mb-4">
                    <h6 className="mb-3">
                      <FaCar className="me-2" />
                      接送信息
                    </h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>接客地点</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.pickup_location}
                            onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                            placeholder="请输入接客地点（选填）"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>送客地点</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.dropoff_location}
                            onChange={(e) => handleInputChange('dropoff_location', e.target.value)}
                            placeholder="请输入送客地点（选填）"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    {/* 接送日期 */}
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaCalendarAlt className="me-2" />
                            接客日期
                          </Form.Label>
                          <DatePicker
                            selected={formData.pickup_date}
                            onChange={(date) => handleInputChange('pickup_date', date)}
                            dateFormat="yyyy-MM-dd"
                            className="form-control"
                            placeholderText="选择接客日期（选填）"
                            minDate={new Date()}
                          />
                          <Form.Text className="text-muted">
                            通常为行程开始日期
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <FaCalendarAlt className="me-2" />
                            送客日期
                          </Form.Label>
                          <DatePicker
                            selected={formData.dropoff_date}
                            onChange={(date) => handleInputChange('dropoff_date', date)}
                            dateFormat="yyyy-MM-dd"
                            className="form-control"
                            placeholderText="选择送客日期（选填）"
                            minDate={new Date()}
                          />
                          <Form.Text className="text-muted">
                            通常为行程结束日期
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* 航班信息 - 仅跟团游显示 */}
                  {type === 'group-tours' && (
                    <div className="mb-4">
                      <h6 className="mb-3">
                        <FaTicketAlt className="me-2" />
                        航班信息
                      </h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPlaneArrival className="me-2" />
                              抵达航班号
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.arrival_flight}
                              onChange={(e) => handleInputChange('arrival_flight', e.target.value)}
                              placeholder="例如: JQ123（选填）"
                            />
                            <Form.Text className="text-muted">
                              填写航班号以便安排接机服务
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPlaneDeparture className="me-2" />
                              返程航班号
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.departure_flight}
                              onChange={(e) => handleInputChange('departure_flight', e.target.value)}
                              placeholder="例如: JQ456（选填）"
                            />
                            <Form.Text className="text-muted">
                              填写航班号以便安排送机服务
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      {/* 航班时间 */}
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPlaneArrival className="me-2" />
                              抵达航班降落时间
                            </Form.Label>
                            <Row>
                              <Col md={7}>
                                <DatePicker
                                  selected={formData.arrival_landing_date}
                                  onChange={(date) => handleInputChange('arrival_landing_date', date)}
                                  dateFormat="yyyy-MM-dd"
                                  className="form-control"
                                  placeholderText="选择降落日期（选填）"
                                />
                              </Col>
                              <Col md={5}>
                                <div 
                                  className="time-input-container d-flex align-items-center"
                                  style={{
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: 'white',
                                    maxWidth: '120px'
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={formData.arrival_landing_hour || ''}
                                    onChange={(e) => handleTimeInput('arrival_landing_hour', e.target.value, 'arrival_landing_minute')}
                                    placeholder="HH"
                                    maxLength="2"
                                    className="arrival-landing-hour text-center"
                                    style={{
                                      width: '25px',
                                      border: 'none',
                                      outline: 'none',
                                      padding: '0',
                                      background: 'transparent',
                                      fontSize: '1rem'
                                    }}
                                  />
                                  <span className="mx-1 fw-bold">:</span>
                                  <input
                                    type="text"
                                    value={formData.arrival_landing_minute || ''}
                                    onChange={(e) => handleTimeInput('arrival_landing_minute', e.target.value)}
                                    placeholder="mm"
                                    maxLength="2"
                                    className="arrival-landing-minute text-center"
                                    style={{
                                      width: '25px',
                                      border: 'none',
                                      outline: 'none',
                                      padding: '0',
                                      background: 'transparent',
                                      fontSize: '1rem'
                                    }}
                                  />
                                </div>
                              </Col>
                            </Row>
                            <Form.Text className="text-muted">
                              选择降落日期，并输入具体时间（24小时制，如：14:30）
                            </Form.Text>

                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPlaneDeparture className="me-2" />
                              返程航班起飞时间
                            </Form.Label>
                            <Row>
                              <Col md={7}>
                                <DatePicker
                                  selected={formData.departure_departure_date}
                                  onChange={(date) => handleInputChange('departure_departure_date', date)}
                                  dateFormat="yyyy-MM-dd"
                                  className="form-control"
                                  placeholderText="选择起飞日期（选填）"
                                />
                              </Col>
                              <Col md={5}>
                                <div 
                                  className="time-input-container d-flex align-items-center"
                                  style={{
                                    border: '1px solid #ced4da',
                                    borderRadius: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: 'white',
                                    maxWidth: '120px'
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={formData.departure_departure_hour || ''}
                                    onChange={(e) => handleTimeInput('departure_departure_hour', e.target.value, 'departure_departure_minute')}
                                    placeholder="HH"
                                    maxLength="2"
                                    className="departure-departure-hour text-center"
                                    style={{
                                      width: '25px',
                                      border: 'none',
                                      outline: 'none',
                                      padding: '0',
                                      background: 'transparent',
                                      fontSize: '1rem'
                                    }}
                                  />
                                  <span className="mx-1 fw-bold">:</span>
                                  <input
                                    type="text"
                                    value={formData.departure_departure_minute || ''}
                                    onChange={(e) => handleTimeInput('departure_departure_minute', e.target.value)}
                                    placeholder="mm"
                                    maxLength="2"
                                    className="departure-departure-minute text-center"
                                    style={{
                                      width: '25px',
                                      border: 'none',
                                      outline: 'none',
                                      padding: '0',
                                      background: 'transparent',
                                      fontSize: '1rem'
                                    }}
                                  />
                                </div>
                              </Col>
                            </Row>
                            <Form.Text className="text-muted">
                              选择起飞日期，并输入具体时间（24小时制，如：14:30）
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* 乘客信息 */}
                  <div className="mb-4">
                    <h6 className="mb-3">
                      <FaUsers className="me-2" />
                      乘客信息
                    </h6>
                    {formData.passengers.map((passenger, index) => (
                      <div key={index} className="passenger-item mb-3 p-3 border rounded">
                        <div className="passenger-header mb-2">
                          <small className="text-muted">
                            <FaUser className="me-1" />
                            {passenger.is_child ? '儿童' : '成人'} {index + 1}
                            {passenger.is_primary && <span className="badge bg-info ms-2 small">主要联系人</span>}
                          </small>
                        </div>
                        
                        <Row>
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label className="small">姓名</Form.Label>
                              <Form.Control
                                size="sm"
                                type="text"
                                value={passenger.full_name}
                                onChange={(e) => handlePassengerChange(index, 'full_name', e.target.value)}
                                placeholder="请输入姓名（选填）"
                              />
                            </Form.Group>
                          </Col>
                          
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label className="small">
                                <FaPhone className="me-1" />
                                联系电话
                              </Form.Label>
                              <Form.Control
                                size="sm"
                                type="tel"
                                value={passenger.phone}
                                onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                                placeholder="请输入联系电话（选填）"
                              />
                            </Form.Group>
                          </Col>
                          
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label className="small">
                                <FaWeixin className="me-1" />
                                微信号
                              </Form.Label>
                              <Form.Control
                                size="sm"
                                type="text"
                                value={passenger.wechat_id}
                                onChange={(e) => handlePassengerChange(index, 'wechat_id', e.target.value)}
                                placeholder="请输入微信号（选填）"
                              />
                            </Form.Group>
                          </Col>
                          
                          {passenger.is_child && (
                            <Col md={3}>
                              <Form.Group className="mb-2">
                                <Form.Label className="small">年龄 <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                  size="sm"
                                  value={passenger.child_age}
                                  onChange={(e) => handlePassengerChange(index, 'child_age', e.target.value)}
                                  required
                                >
                                  <option value="">请选择年龄</option>
                                  {[...Array(17)].map((_, age) => (
                                    <option key={age + 1} value={age + 1}>
                                      {age + 1} 岁
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          )}
                        </Row>
                        
                        
                      </div>
                    ))}
                  </div>

                  {/* 特殊要求 */}
                  <Form.Group className="mb-4">
                    <Form.Label>特殊要求</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.special_requests}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                      placeholder="请输入特殊要求或备注信息（选填）"
                    />
                  </Form.Group>

                  {/* 提交按钮 */}
                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          创建订单中...
                        </>
                      ) : (
                        '确认下单'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AgentBooking; 
