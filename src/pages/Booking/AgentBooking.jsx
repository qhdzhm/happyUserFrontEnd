import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaUsers, FaPhone, FaWeixin, FaUser, FaArrowLeft, FaTicketAlt, FaCar, FaHotel, FaBed, FaPlane, FaPlaneDeparture, FaPlaneArrival, FaClock, FaDollarSign } from 'react-icons/fa';
import { getTourById, getAllDayTours, getAllGroupTours, getGroupTourItinerary } from '../../utils/api';
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
  
  // 检查useParams获取的数据
  console.log('useParams结果:', { id, typeof_id: typeof id });
  
  // 从URL路径中解析type参数
  const pathname = window.location.pathname;
  const type = pathname.includes('/day-tours/') ? 'day-tours' : 
               pathname.includes('/group-tours/') ? 'group-tours' : null;
  
  // 添加调试日志
  console.log('URL路径解析:', {
    pathname: pathname,
    extractedId: id,
    extractedType: type,
    isValidId: id && !isNaN(parseInt(id)),
    isValidType: type && ['day-tours', 'group-tours'].includes(type)
  });
  
  // 检查是否为中介用户 - 更全面的检测
  const localUserType = localStorage.getItem('userType');
  const isAgent = userType === 'agent' || 
                  userType === 'operator' || 
                  userType === 'agent_operator' ||
                  localUserType === 'agent' || 
                  localUserType === 'operator' ||
                  localUserType === 'agent_operator';
  
  // 检查是否为中介主号（只有主号才能看到价格）
  const isAgentMain = userType === 'agent' || localUserType === 'agent';
  
  // 如果不是中介用户或参数无效，重定向到普通页面
  useEffect(() => {
    // 检查参数有效性 - 更详细的验证
    if (!type || !id || type === 'undefined' || id === 'undefined' || 
        !['day-tours', 'group-tours'].includes(type) || 
        isNaN(parseInt(id))) {
      console.error('⚠️ AgentBooking参数无效:', { 
        type, 
        id, 
        typeValid: type && type !== 'undefined' && ['day-tours', 'group-tours'].includes(type),
        idValid: id && id !== 'undefined' && !isNaN(parseInt(id))
      });
      navigate('/booking-form'); // 重定向到搜索页面而不是booking页面
      return;
    }
    
    if (!isAgent) {
      console.log('👤 非中介用户，重定向到普通页面');
      navigate(`/${type}/${id}?${searchParams.toString()}`);
      return;
    }
    
    console.log('✅ 中介用户访问正常');
  }, [isAgent, navigate, type, id, searchParams]);

  // 状态管理
  const [tourData, setTourData] = useState(null);
  const [itineraryData, setItineraryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
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
  
  console.log('🤖 AgentBooking AI参数:', {
    isAIProcessed,
    aiServiceType,
    aiStartDate,
    aiEndDate,
    aiGroupSize,
    aiHotelLevel,
    aiRoomType,
    aiCustomerName2,
    aiCustomerPhone2,
    aiCustomerName3,
    aiCustomerPhone3
  });
  
  // 酒店星级标准化函数 - 修复：保持4.5星不被降级
  const normalizeHotelLevel = (levelStr) => {
    if (!levelStr) return '4星';
    
    // 提取数字部分，支持小数
    const numMatch = levelStr.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      
      // 支持的星级：3星、4星、4.5星（3.5星算3星）
      if (num >= 4.5) {
        const result = '4.5星';  // 4.5星及以上都是4.5星
        console.log(`🏨 酒店星级标准化: "${levelStr}" → "${result}"`);
        return result;
      } else if (num >= 4) {
        const result = '4星';  // 4-4.4星都是4星
        console.log(`🏨 酒店星级标准化: "${levelStr}" → "${result}"`);
        return result;
      } else {
        const result = '3星';  // 3.5星及以下都算3星
        console.log(`🏨 酒店星级标准化: "${levelStr}" → "${result}" (包括3.5星)`);
        return result;
      }
    }
    
    console.log(`🏨 酒店星级无法解析，使用默认: "${levelStr}" → "4星"`);
    return '4星';
  };
  
  // 房型标准化函数
  const normalizeRoomType = (roomTypeStr) => {
    if (!roomTypeStr) return '双人间';
    
    const decodedRoomType = decodeURIComponent(roomTypeStr).toLowerCase().trim();
    console.log(`🛏️ 开始房型标准化: "${roomTypeStr}"`);
    
    // 房型识别和转换
    if (decodedRoomType.includes('单') || decodedRoomType.includes('single')) {
      console.log(`✅ 房型标准化: "${roomTypeStr}" → 单人间`);
      return '单人间';
    } else if (decodedRoomType.includes('三') || decodedRoomType.includes('triple')) {
      console.log(`✅ 房型标准化: "${roomTypeStr}" → 三人间`);
      return '三人间';
    } else if (decodedRoomType.includes('标间') || decodedRoomType.includes('标准') || decodedRoomType.includes('standard')) {
      console.log(`✅ 房型标准化: "${roomTypeStr}" → 双人间（标间/标准）`);
      return '双人间';
    } else if (decodedRoomType.includes('大床房') || decodedRoomType.includes('king')) {
      console.log(`✅ 房型标准化: "${roomTypeStr}" → 大床房`);
      return '大床房';
    } else if (decodedRoomType.includes('双') || decodedRoomType.includes('double') || decodedRoomType.includes('twin')) {
      console.log(`✅ 房型标准化: "${roomTypeStr}" → 双人间`);
      return '双人间';
    } else {
      // 默认返回双人间
      console.log(`⚠️ 未识别房型，使用默认: "${roomTypeStr}" → 双人间`);
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
          console.log(`AI中文日期解析: "${dateStr}" → ${date.toISOString().split('T')[0]} (年份: ${year})`);
          return date;
        }
      }
      
      // 处理ISO格式
      if (dateStr.includes('-') && dateStr.length === 10) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        if (!isNaN(date.getTime())) {
          console.log(`AI ISO日期解析: "${dateStr}" → ${date.toISOString().split('T')[0]}`);
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
          console.log(`日期解析: "${dateStr}" → ${date.toISOString().split('T')[0]}`);
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
  
  // 调试日期传递
  console.log('📅 AgentBooking日期调试:', {
    isAIProcessed,
    AI_startDate: aiStartDate,
    AI_endDate: aiEndDate,
    原始startDate: searchParams.get('startDate'),
    原始endDate: searchParams.get('endDate'),
    解析后startDate: initialStartDate?.toISOString?.()?.split('T')[0],
    解析后endDate: initialEndDate?.toISOString?.()?.split('T')[0],
    startDate对象: initialStartDate,
    endDate对象: initialEndDate
  });
  
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
  
  console.log('🔗 URL参数解析:', {
    adultCount: initialAdults,
    childCount: initialChildren,
    roomCount: urlRoomCount,
    hotelLevel: urlHotelLevel,
    startDate: finalStartDate?.toISOString?.()?.split('T')[0],
    endDate: finalEndDate?.toISOString?.()?.split('T')[0],
    原始URL参数: Object.fromEntries(searchParams.entries())
  });

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
    arrival_departure_time: null,
    arrival_landing_time: (isAIProcessed && aiArrivalTime) ? parseTimeToDate(aiArrivalTime, finalStartDate) : null,
    departure_departure_time: null,
    departure_landing_time: null,
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
    
    console.log('👶 儿童年龄参数:', {
      urlChildrenAges,
      解析后: childrenAgesFromUrl,
      儿童数量: formData.child_count
    });
    
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
      console.log('🔄 价格计算触发条件满足，开始计算价格:', {
        tourData: !!tourData,
        adultCount: formData.adult_count,
        childCount: formData.child_count,
        hotelLevel: formData.hotel_level,
        roomCount: formData.hotel_room_count,
        childrenAges: childrenAgesString,
        roomTypes: roomTypesString,
        startDate: formData.tour_start_date || '未选择'
      });
      calculatePrice();
    } else {
      console.log('⏸️ 价格计算条件不满足:', {
        tourData: !!tourData,
        adultCount: formData.adult_count,
        adultCountValid: formData.adult_count > 0
      });
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
        if (shouldUpdatePickupDate || shouldUpdateDropoffDate || shouldUpdateCheckinDate || shouldUpdateCheckoutDate) {
          console.log('🔄 自动同步日期:', {
            shouldUpdatePickupDate,
            shouldUpdateDropoffDate, 
            shouldUpdateCheckinDate,
            shouldUpdateCheckoutDate,
            新出发日期: formData.tour_start_date?.toLocaleDateString(),
            新返回日期: formData.tour_end_date?.toLocaleDateString()
          });
        }

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
      console.log('🆕 检测到新的AI订单信息，时间戳:', aiProcessedTime);
      
      // 询问用户是否要更新表单
      const shouldUpdate = window.confirm(
        '🤖 AI助手为您解析了新的订单信息！\n\n' +
        '是否要用新的信息更新当前表单？\n\n' +
        '点击"确定"将覆盖当前表单内容\n' +
        '点击"取消"保持当前表单不变'
      );
      
      if (shouldUpdate) {
        console.log('✅ 用户确认更新表单，开始应用AI参数');
        
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
            (isAIProcessed && aiRoomType) ? normalizeRoomType(aiRoomType) : ''
          ),
          pickup_location: (isAIProcessed && aiDeparture) ? decodeURIComponent(aiDeparture) : prev.pickup_location,
          dropoff_location: (isAIProcessed && aiDeparture) ? decodeURIComponent(aiDeparture) : prev.dropoff_location,
          pickup_date: newStartDate,
          dropoff_date: newEndDate,
          arrival_flight: (isAIProcessed && aiArrivalFlight && aiArrivalFlight !== '待定') ? aiArrivalFlight : prev.arrival_flight,
          departure_flight: (isAIProcessed && aiDepartureFlight && aiDepartureFlight !== '待定') ? aiDepartureFlight : prev.departure_flight,
          arrival_landing_time: (isAIProcessed && aiArrivalTime) ? parseTimeToDate(aiArrivalTime, newStartDate) : prev.arrival_landing_time,
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
      let itineraryResponse;
      
      if (type === 'day-tours') {
        // 获取一日游行程
        itineraryResponse = await tourService.getDayTourItineraries(tourId);
      } else if (type === 'group-tours') {
        // 获取跟团游行程
        itineraryResponse = await getGroupTourItinerary(tourId);
      }
      
      if (itineraryResponse?.code === 1 && itineraryResponse.data) {
        setItineraryData(Array.isArray(itineraryResponse.data) ? itineraryResponse.data : []);
      }
    } catch (error) {
      console.error('获取行程信息失败:', error);
      // 不显示错误提示，只记录日志
    }
  };

  const fetchTourData = async () => {
    setLoading(true);
    try {
      let response;
      
      if (type === 'day-tours') {
        const allDayTours = await getAllDayTours();
        if (allDayTours.code === 1) {
          const tours = Array.isArray(allDayTours.data) ? allDayTours.data : allDayTours.data.records || [];
          response = { data: tours.find(tour => tour.id.toString() === id) };
        }
      } else if (type === 'group-tours') {
        const allGroupTours = await getAllGroupTours();
        if (allGroupTours.code === 1) {
          const tours = Array.isArray(allGroupTours.data) ? allGroupTours.data : allGroupTours.data.records || [];
          response = { data: tours.find(tour => tour.id.toString() === id) };
        }
      }

      if (response?.data) {
        setTourData(response.data);
        
        // 获取行程信息
        await fetchItineraryData(response.data.id);
        
        // 如果是多日游且有开始日期，自动计算结束日期（但不覆盖AI已设置的结束日期）
        if (type === 'group-tours' && formData.tour_start_date && !formData.tour_end_date) {
          console.log('🗓️ 自动计算结束日期，因为AI没有提供结束日期');
          const duration = extractDurationFromTourName(response.data.title || response.data.name);
          const endDate = new Date(formData.tour_start_date);
          endDate.setDate(endDate.getDate() + duration - 1);
          setFormData(prev => ({ ...prev, tour_end_date: endDate }));
        } else if (type === 'group-tours' && formData.tour_end_date) {
          console.log('🤖 使用AI提供的结束日期:', formData.tour_end_date?.toISOString()?.split('T')[0]);
        }
      }
    } catch (error) {
      console.error('获取产品数据失败:', error);
      toast.error('获取产品信息失败');
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

  const calculatePrice = async () => {
    // 验证必要参数 - 修复：不需要日期就可以计算价格
    if (!id || !type || !formData.adult_count || formData.adult_count < 1) {
      console.log('价格计算参数不足，跳过计算:', {
        id: !!id,
        type: !!type,
        adultCount: formData.adult_count,
        adultCountValid: formData.adult_count >= 1,
        startDate: formData.tour_start_date || '未选择（不影响价格计算）'
      });
      return;
    }

    try {
      // 收集儿童年龄数组
      const childrenAges = formData.passengers
        .filter(p => p.is_child && p.child_age)
        .map(p => parseInt(p.child_age));

      console.log('💰 开始计算价格 - 用户信息:', {
        userId: user?.id,
        agentId: user?.agentId,
        userRole: user?.role,
        userType: userType,
        主号登录: user?.role === 'agent'
      });

      console.log('💰 价格计算参数:', {
        tourId: parseInt(id),
        tourType: type === 'day-tours' ? 'day_tour' : 'group_tour',
        adultCount: formData.adult_count,
        childCount: formData.child_count,
        hotelLevel: formData.hotel_level,
        childrenAges: childrenAges,
        代理商ID: user?.agentId || user?.id
      });

      // 根据bookingService.js中的函数签名正确传递参数
      const response = await calculateTourPrice(
        parseInt(id), // tourId
        type === 'day-tours' ? 'day_tour' : 'group_tour', // tourType
        formData.adult_count, // adultCount
        formData.child_count, // childCount
        formData.hotel_level, // hotelLevel
        user?.agentId || user?.id, // agentId
        formData.hotel_room_count, // roomCount
        user?.id, // userId
        childrenAges, // childrenAges
        formData.roomTypes?.[0] || '双人间' // roomType
      );
      
      // 修复：处理完整的响应对象结构 {code: 1, data: {...}}
      console.log('💰 收到价格计算响应:', response);
      
      if (response && response.code === 1 && response.data) {
        const priceData = response.data;
        console.log('💰 价格计算成功:', {
          totalPrice: priceData.totalPrice,
          discountedPrice: priceData.discountedPrice,
          originalPrice: priceData.originalPrice,
          nonAgentPrice: priceData.nonAgentPrice,
          完整数据: priceData
        });
        setTotalPrice(priceData.totalPrice);
        console.log('💰 价格状态已更新:', priceData.totalPrice);
      } else if (response && (response.totalPrice !== undefined && response.totalPrice !== null)) {
        // 备用处理：如果响应直接包含价格数据（兼容旧格式）
        console.log('💰 价格计算成功（直接格式）:', {
          totalPrice: response.totalPrice,
          完整响应: response
        });
        setTotalPrice(response.totalPrice);
        console.log('💰 价格状态已更新:', response.totalPrice);
      } else {
        console.error('💰 价格计算失败 - 响应错误:', response);
        console.error('💰 响应结构分析:', {
          hasResponse: !!response,
          hasCode: response && 'code' in response,
          codeValue: response?.code,
          hasData: response && 'data' in response,
          hasTotalPrice: response && 'totalPrice' in response,
          totalPriceValue: response?.totalPrice,
          dataStructure: response ? Object.keys(response) : null
        });
        // 设置价格为0，避免一直显示"正在计算价格..."
        setTotalPrice(0);
      }
    } catch (error) {
      console.error('💰 价格计算异常:', error);
      toast.error('价格计算失败，请稍后重试');
    }
  };

  const handleInputChange = (field, value) => {
    console.log('📝 输入变化:', { 字段: field, 值: value, 值类型: typeof value });
    
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
          updated.dropoff_date = endDate; // 送客日期默认为结束日期
          updated.hotel_checkout_date = endDate; // 退房日期默认为结束日期
        }
        
        // 接客日期和入住日期默认为开始日期
        updated.pickup_date = value;
        updated.hotel_checkin_date = value;
        
        console.log('🗓️ 自动更新相关日期:', {
          开始日期: value,
          接客日期: value,
          入住日期: value
        });
      }
      
      // 如果是更新结束日期，自动更新送客和退房日期
      if (field === 'tour_end_date' && value) {
        updated.dropoff_date = value;
        updated.hotel_checkout_date = value;
      }
      
      // 如果是更新房间数量，同时更新房型数组
      if (field === 'hotel_room_count') {
        updated.roomTypes = Array(value).fill('');
      }
      
      return updated;
    });
    
    // 检查是否是影响价格的字段，如果是则触发价格重新计算
    const priceAffectingFields = [
      'adult_count', 
      'child_count', 
      'tour_start_date', 
      'hotel_level', 
      'hotel_room_count'
    ];
    
    if (priceAffectingFields.includes(field)) {
      console.log('💰 影响价格的字段变化，准备重新计算价格:', { field, value });
      // 使用setTimeout确保状态更新后再计算价格
      setTimeout(() => {
        if (tourData && (field === 'adult_count' ? value > 0 : formData.adult_count > 0)) {
          calculatePrice();
        }
      }, 100);
    }
  };
  
  // 处理房型变化
  const handleRoomTypeChange = (index, roomType) => {
    const newRoomTypes = [...formData.roomTypes];
    newRoomTypes[index] = roomType;
    setFormData(prev => ({ ...prev, roomTypes: newRoomTypes }));
    
    // 清除房型验证错误
    if (validationErrors.roomTypes) {
      setValidationErrors(prev => ({ ...prev, roomTypes: null }));
    }
    
    // 房型变化后重新计算价格
    console.log('🛏️ 房型变化，准备重新计算价格:', { index, roomType, newRoomTypes });
    setTimeout(() => {
      if (tourData && formData.adult_count > 0) {
        calculatePrice();
      }
    }, 100);
  };

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...formData.passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setFormData(prev => ({ ...prev, passengers: newPassengers }));
    
    // 如果是儿童年龄变化，触发价格重新计算
    if (field === 'child_age') {
      console.log('👶 儿童年龄变化，准备重新计算价格:', { index, value });
      setTimeout(() => {
        if (tourData && formData.adult_count > 0) {
          calculatePrice();
        }
      }, 100);
    }
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

      // 格式化航班时间 - 匹配后端Jackson配置格式
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
        arrivalLandingTime: formatFlightTime(formData.arrival_landing_time),
        departureDepartureTime: formatFlightTime(formData.departure_departure_time),
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
            <Card className="tour-info-card mb-4">
              <Card.Body>
                <div className="tour-image mb-3">
                  <img 
                    src={tourData.coverImage || tourData.image || '/images/placeholder.jpg'} 
                    alt={tourData.title || tourData.name}
                    className="img-fluid rounded"
                  />
                </div>
                <div className="tour-type-badge">
                  <span className="badge bg-primary">{tourType || (type === 'day-tours' ? '一日游' : '跟团游')}</span>
                </div>
                
                {/* 地点名称列表 */}
                {itineraryData && itineraryData.length > 0 && (
                  <div className="tour-locations mt-3">
                    <h6>包含地点</h6>
                    <div className="location-list">
                      {itineraryData.map((item, index) => {
                        // 提取地点名称
                        const locationName = type === 'day-tours' 
                          ? (item.location || item.title || item.activity || '').replace(/^\d+[:：]\d*\s*-?\s*/, '')
                          : (item.location || item.title || '').replace(/^第\d+天[:：]\s*/, '');
                        
                        return locationName ? (
                          <span key={index} className="location-tag badge bg-light text-dark me-2 mb-2">
                            {locationName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                                  )}
                
                {/* 代理商价格显示 - 只有中介主号才能看到价格 */}
                {isAgentMain && (
                  <div className="agent-price-display mt-4 p-3 border rounded bg-primary bg-opacity-10">
                    <h6 className="mb-3 text-primary">
                      <FaDollarSign className="me-2" />
                      代理商价格
                    </h6>
                    {totalPrice !== null && totalPrice !== undefined ? (
                      <>
                        <div className="price-amount">
                          <span className="currency">$</span>
                          <span className="amount">{parseFloat(totalPrice).toFixed(2)}</span>
                        </div>
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            主号专享价格
                          </small>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted">
                        <small>正在计算价格...</small>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 操作员提示信息 */}
                {isAgent && !isAgentMain && (
                  <div className="operator-notice mt-4 p-3 border rounded bg-warning bg-opacity-10">
                    <h6 className="mb-2 text-warning">
                      <i className="fas fa-info-circle me-2"></i>
                      操作员提示
                    </h6>
                    <small className="text-muted">
                      您当前以操作员身份登录，价格信息仅对中介主号可见。
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
                            <DatePicker
                              selected={formData.arrival_landing_time}
                              onChange={(date) => handleInputChange('arrival_landing_time', date)}
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={15}
                              timeCaption="时间"
                              dateFormat="yyyy-MM-dd HH:mm"
                              className="form-control"
                              placeholderText="选择降落时间（选填）"
                            />
                            <Form.Text className="text-muted">
                              填写抵达航班降落时间
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              <FaPlaneDeparture className="me-2" />
                              返程航班起飞时间
                            </Form.Label>
                            <DatePicker
                              selected={formData.departure_departure_time}
                              onChange={(date) => handleInputChange('departure_departure_time', date)}
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={15}
                              timeCaption="时间"
                              dateFormat="yyyy-MM-dd HH:mm"
                              className="form-control"
                              placeholderText="选择起飞时间（选填）"
                            />
                            <Form.Text className="text-muted">
                              填写返程航班起飞时间
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
