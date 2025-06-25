import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Tab, Nav, Accordion, Button, Badge, Card, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ImageGallery from 'react-image-gallery';
import { Helmet } from 'react-helmet-async';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaLanguage, FaCheck, FaTimes, FaStar, FaStarHalfAlt, FaRegStar, FaPhoneAlt, FaClock, FaInfoCircle, FaQuestionCircle, FaLightbulb, FaUtensils, FaBed, FaHiking, FaChevronDown, FaChevronUp, FaQuoteLeft, FaQuoteRight, FaHotel, FaChild, FaTicketAlt, FaPercent, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getTourById, getGroupTourById, getDayTourById, getAgentDiscountRate, calculateTourDiscount, getGroupTourDayTours } from '../../utils/api';
import { addToCart } from '../../store/slices/bookingSlice';
import { formatDate, calculateDiscountPrice } from '../../utils/helpers';
import PriceDisplay from '../../components/PriceDisplay';
import CustomerReviews from '../../components/CustomerReviews/CustomerReviews';
import BaiduSEO from '../../components/BaiduSEO/BaiduSEO';
import LoginModal from '../../components/LoginModal/LoginModal';
import MembershipModal from '../../components/LoginModal/MembershipModal';
import './tourDetails.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getHotelPrices, calculateTourPrice } from '../../services/bookingService';




const TourDetails = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 默认结束日期为7天后
    return isNaN(date.getTime()) ? new Date() : date;
  });
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [roomCount, setRoomCount] = useState(1);
  const [selectedAdultCount, setSelectedAdultCount] = useState(1); // 用户选择的成人数量
  const [selectedChildCount, setSelectedChildCount] = useState(0); // 用户选择的儿童数量
  const [selectedRoomCount, setSelectedRoomCount] = useState(1); // 用户选择的房间数量
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  }); // 用户选择的日期 - 确保初始化为有效Date对象
  const [requiresDateSelection, setRequiresDateSelection] = useState(false); // 是否需要选择日期
  // 移除 calculatedPrice 状态，直接使用产品基础价格
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tourData, setTourData] = useState(null);
  const [tourType, setTourType] = useState('');
  const [itinerary, setItinerary] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [tips, setTips] = useState([]);
  const [images, setImages] = useState([]);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedHotelLevel, setSelectedHotelLevel] = useState('4星');
  const [selectedRoomTypes, setSelectedRoomTypes] = useState(['大床房']); // 房间类型数组，支持多房间
  const [hotelPrices, setHotelPrices] = useState([]);
  const [hotelPriceDifference, setHotelPriceDifference] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(null);
  const [priceDebounceTimer, setPriceDebounceTimer] = useState(null); // 添加防抖定时器状态
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [childrenAges, setChildrenAges] = useState([]);
  const [showChildAgeInputs, setShowChildAgeInputs] = useState(false);
  
  // 登录弹窗相关状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  
  // 可选项目相关状态
  const [dayTourRelations, setDayTourRelations] = useState([]); // 跟团游的一日游关联数据
  const [selectedOptionalTours, setSelectedOptionalTours] = useState({}); // 用户选择的可选项目 {day: tourId}
  const [isOptionalToursExpanded, setIsOptionalToursExpanded] = useState(true); // 可选行程区域展开状态
  
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, userType } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  // 处理阿里云OSS图片URL，解决CORS问题
  const proxyImageUrl = (url) => {
    if (!url) return '';
    
    // 首先尝试直接使用原URL
    return url;
    
    // 如果CORS有问题，可以启用下面的代理服务
    // return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  };
  
  // 处理搜索参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    
    
    // 从搜索参数中获取并设置相关值
    const fromSearch = searchParams.get('fromSearch');
    if (fromSearch === 'true') {
      console.log('从搜索页面跳转，处理搜索参数...');
      
      // 处理日期参数
      const startDateParam = searchParams.get('startDate');
      if (startDateParam) {
        const parsedStartDate = new Date(startDateParam);
        if (!isNaN(parsedStartDate.getTime()) && parsedStartDate.getTime() > 0) {
          setStartDate(parsedStartDate);
          setSelectedDate(parsedStartDate);
          console.log('设置开始日期:', parsedStartDate);
        } else {
          console.warn('无效的开始日期参数:', startDateParam);
        }
      }
      
      const endDateParam = searchParams.get('endDate');
      if (endDateParam) {
        const parsedEndDate = new Date(endDateParam);
        if (!isNaN(parsedEndDate.getTime()) && parsedEndDate.getTime() > 0) {
          setEndDate(parsedEndDate);
          console.log('设置结束日期:', parsedEndDate);
        } else {
          console.warn('无效的结束日期参数:', endDateParam);
        }
      }
      
      // 处理人数参数
      const adultsParam = searchParams.get('adults');
      if (adultsParam && !isNaN(parseInt(adultsParam))) {
        const adults = parseInt(adultsParam);
        setAdultCount(adults);
        setSelectedAdultCount(adults);
        console.log('从URL参数设置成人数量:', adults);
      } else {
        // 如果没有URL参数，确保使用默认的1人
        console.log('没有URL参数，使用默认成人数量: 1');
        setAdultCount(1);
        setSelectedAdultCount(1);
      }
      
      const childrenParam = searchParams.get('children');
      if (childrenParam && !isNaN(parseInt(childrenParam))) {
        const children = parseInt(childrenParam);
        setChildCount(children);
        setSelectedChildCount(children);
        console.log('设置儿童数量:', children);
        
        // 如果有儿童，需要设置年龄输入
        if (children > 0) {
          setShowChildAgeInputs(true);
          setChildrenAges(new Array(children).fill(8)); // 默认年龄为8岁
        }
      }
    }
  }, [location.search]);
  
  // 从URL路径和查询参数中确定类型
  const determineType = () => {
    // 1. 首先从路径中判断，这是最优先的
    if (location.pathname.includes('/day-tours/')) {
      return 'day';
    } else if (location.pathname.includes('/group-tours/')) {
      return 'group';
    }
    
    // 2. 从查询参数中获取
    const searchParams = new URLSearchParams(location.search);
    const typeParam = searchParams.get('type');
    if (typeParam) {
      return typeParam;
    }
    
    // 3. 默认值
    return 'day';
  };
  
  // 获取类型参数
  const type = determineType();
  
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
  }, [roomCount]); // 只依赖roomCount，避免无限循环

  // 判断是否为代理商
  // 统一的中介身份验证逻辑（包括agent主账号和操作员）
  const localUserType = localStorage.getItem('userType');
  const isAgent = userType === 'agent' || 
                  userType === 'agent_operator' ||
                  localUserType === 'agent' || 
                  localUserType === 'agent_operator';
  const agentId = user?.agentId || localStorage.getItem('agentId');
  const discountRate = user?.discountRate || localStorage.getItem('discountRate');

  // 生成结构化数据
  const generateStructuredData = () => {
    if (!tourData) return {};

    const basePrice = tourData.price || tourData.adultPrice || 0;
    const finalPrice = discountedPrice || basePrice;

    return {
      "@context": "https://schema.org/",
      "@type": "TouristTrip",
      "name": tourData.title || tourData.name,
      "description": tourData.description || tourData.intro || tourData.des,
      "image": images.length > 0 ? images.map(img => img.original) : [tourData.coverImage],
      "url": `https://www.htas.com.au/tours/${id}?type=${type}`,
      "provider": {
        "@type": "TravelAgency",
        "name": "HTAS - 塔斯马尼亚华人旅游",
        "url": "https://www.htas.com.au",
        "telephone": "+61-3-6234-5678",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Hobart",
          "addressRegion": "Tasmania",
          "addressCountry": "AU"
        }
      },
      "offers": {
        "@type": "Offer",
        "price": finalPrice,
        "priceCurrency": "AUD",
        "availability": "https://schema.org/InStock",
        "validFrom": new Date().toISOString(),
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      "aggregateRating": tourData.averageRating ? {
        "@type": "AggregateRating",
        "ratingValue": tourData.averageRating,
        "reviewCount": tourData.reviewCount || reviews.length,
        "bestRating": "5",
        "worstRating": "1"
      } : undefined,
      "duration": tourType === 'day' ? "P1D" : `P${tourData.duration || 1}D`,
      "touristType": ["Family", "Individual", "Group"],
      "includesAttraction": highlights.map(highlight => ({
        "@type": "TouristAttraction",
        "name": highlight
      }))
    };
  };

  // 生成FAQ结构化数据
  const generateFAQStructuredData = () => {
    if (!faqs || faqs.length === 0) return {};

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  };

  // 获取今天的日期作为最小日期
  const today = new Date().toISOString().split('T')[0];

  const fetchingRef = useRef(false); // 用于追踪请求状态
  const fetchTimeoutRef = useRef(null); // 用于存储防抖定时器
  const retryCountRef = useRef(0); // 用于追踪重试次数
  const MAX_RETRIES = 2; // 最大重试次数

  // 用于防止重复加载酒店价格的标志
  const initialLoadRef = useRef(false);

  // 用于跟踪API调用状态的标志
  const isCallingApiRef = useRef(false);

  // 用于防止酒店价格API重复调用的计数器
  const hotelPriceApiCallCountRef = useRef(0);

  // 使用ref记录最后一次请求的ID
  const lastRequestIdRef = useRef(0);

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchTourDetails = async () => {
      // 如果已经在请求中，直接返回
      if (fetchingRef.current) {
        
        return;
      }

      try {
        // 标记为正在请求
        fetchingRef.current = true;
        setLoading(true);
        setError(null);
        
        // 确定获取的旅游类型和ID
        const tourId = id;
        // 从URL路径和类型参数确定API类型
        const apiTourType = type === 'group' ? 'group_tour' : 'day_tour';
        
        
        
        // 设置页面状态
        setTourType(apiTourType === 'day' ? 'day_tour' : 'group_tour');
        
        // 获取旅游详情
        let response;
        try {
          response = await getTourById(tourId, apiTourType);
        } catch (error) {
          console.error(`获取${apiTourType}类型旅游数据失败:`, error);
          response = null;
        }
        
        // 如果没有获取到数据，尝试另一种类型
        if (!response || !response.data) {
          const alternativeType = apiTourType === 'day' ? 'group' : 'day';

          
          try {
            response = await getTourById(tourId, alternativeType);
            
            if (response && response.data) {

              // 更新类型
              setTourType(alternativeType === 'day' ? 'day_tour' : 'group_tour');
            }
          } catch (altError) {
            console.error(`获取${alternativeType}类型旅游数据也失败:`, altError);
          }
        }
        
        // 处理获取到的旅游数据
        if (response && response.code === 1 && response.data) {
          const tourData = response.data;
          console.log('获取到的旅游数据:', tourData);
          setTourData(tourData);
          
          // 处理类型特定的数据
          processTourData(tourData, apiTourType);
          
          // 如果是跟团游，获取一日游关联数据
          if (apiTourType === 'group_tour' || type === 'group') {
            try {
              const dayToursResponse = await getGroupTourDayTours(tourId);
              if (dayToursResponse && dayToursResponse.code === 1 && dayToursResponse.data) {
                setDayTourRelations(dayToursResponse.data);
                
                // 初始化默认选择（每天选择第一个或默认的一日游）
                const defaultSelections = {};
                dayToursResponse.data.forEach(relation => {
                  const day = relation.day_number;
                  if (!defaultSelections[day]) {
                    // 优先选择默认项目，否则选择第一个
                    const dayTours = dayToursResponse.data.filter(r => r.day_number === day);
                    const defaultTour = dayTours.find(r => r.is_default) || dayTours[0];
                    if (defaultTour) {
                      defaultSelections[day] = defaultTour.day_tour_id;
                    }
                  }
                });
                setSelectedOptionalTours(defaultSelections);
              }
            } catch (dayToursError) {
              console.error('获取一日游关联数据失败:', dayToursError);
            }
          } else {

          }
        } else {
          console.error('无法获取有效的旅游数据:', response);
          setError('无法获取旅游数据，请稍后重试');
          setImages([]);
        }
        
        // 请求完成，重置状态
        fetchingRef.current = false;
        retryCountRef.current = 0;
        setLoading(false);
      } catch (err) {
        console.error('获取旅游详情失败:', err);
        setError('获取旅游详情失败，请稍后重试');
        fetchingRef.current = false;
        setLoading(false);
        setImages([]);
      }
    };
    
    const processTourData = (tourData, tourType) => {
      try {
        // 处理基本数据
        if (tourData.highlights) setHighlights(Array.isArray(tourData.highlights) ? tourData.highlights : [tourData.highlights]);
        if (tourData.inclusions) setInclusions(Array.isArray(tourData.inclusions) ? tourData.inclusions : [tourData.inclusions]);
        if (tourData.exclusions) setExclusions(Array.isArray(tourData.exclusions) ? tourData.exclusions : [tourData.exclusions]);
        if (tourData.faqs) setFaqs(Array.isArray(tourData.faqs) ? tourData.faqs : [tourData.faqs]);
        if (tourData.tips) setTips(Array.isArray(tourData.tips) ? tourData.tips : [tourData.tips]);
        
        // 处理行程
        if (tourData.itinerary) {
          if (tourType === 'day') {
            setItinerary(Array.isArray(tourData.itinerary) ? tourData.itinerary.map(item => ({
              ...item,
              day_number: 1,
              type: 'time_slot'
            })) : [{
              day_number: 1,
              type: 'time_slot',
              description: tourData.itinerary
            }]);
          } else {
            setItinerary(Array.isArray(tourData.itinerary) ? tourData.itinerary : [tourData.itinerary]);
          }
        }
        
        // 处理图片
        processImages(tourData);
      } catch (processError) {
        console.error('处理旅游数据时出错:', processError);
      }
    };
    
    const processImages = (tourData) => {
      try {
        
        if (tourData && tourData.images && Array.isArray(tourData.images) && tourData.images.length > 0) {
          // 存在多张图片，直接使用后端提供的图片数组
         
          
          const galleryImages = tourData.images.map((img, index) => {
            // 对阿里云OSS图片URL进行处理以解决CORS问题
            const imageUrl = img.image_url ? proxyImageUrl(img.image_url) : '';

            
            return {
              original: imageUrl,
              thumbnail: imageUrl,
              description: img.description || `${tourData?.title || tourData?.name} 图片 ${index + 1}`,
              originalAlt: img.description || `${tourData?.title || tourData?.name} 图片`,
              thumbnailAlt: img.description || `${tourData?.title || tourData?.name} 缩略图`,
              location: tourData?.location || '塔斯马尼亚'
            };
          });
          console.log('轮播图数据处理完成:', galleryImages);
          setImages(galleryImages);
        } else if (tourData && tourData.coverImage) {
          // 只有封面图
          console.log('使用封面图:', tourData.coverImage);
          const coverImageUrl = proxyImageUrl(tourData.coverImage);
          
          setImages([
            {
              original: coverImageUrl,
              thumbnail: coverImageUrl,
              description: tourData?.description?.slice(0, 100) || `${tourData?.title || tourData?.name} 封面图`,
              originalAlt: tourData?.title || tourData?.name,
              thumbnailAlt: `${tourData?.title || tourData?.name} 缩略图`,
              location: tourData?.location || '塔斯马尼亚'
            }
          ]);
        } else {
          // 没有图片，返回空数组
          console.log('没有找到图片数据，设置空数组');
          setImages([]);
        }
      } catch (error) {
        console.error('处理图片时出错:', error);
        setImages([]);
      }
    };
    
    // 获取数据
    fetchTourDetails();
    
    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [id, location.pathname, location.search]);

  // 获取折扣价格
  const fetchDiscountPrice = async () => {
    if (tourData && isAgent && agentId && !loadingDiscount) {
      try {
        setLoadingDiscount(true);
        console.log('开始计算折扣价格:', { tourData, isAgent, agentId });
        
        // 确保价格为数值
        const originalPrice = Number(tourData.price) || 0;
        const tourId = Number(id) || 0;
        
        if (originalPrice <= 0 || tourId <= 0) {
          console.warn('价格或ID无效，无法计算折扣', { originalPrice, tourId });
          setDiscountedPrice(originalPrice);
          setLoadingDiscount(false);
          return;
        }
        
        // 确定旅游类型
        let effectiveTourType;
        
        // 按照常规逻辑判断类型
        if (tourData.tour_type) {
          
          if (tourData.tour_type.includes('day')) {
            effectiveTourType = 'day';
          } else if (tourData.tour_type.includes('group')) {
            effectiveTourType = 'group';
          } else {
            effectiveTourType = 'day'; // 默认值
          }
        }
        // 其次使用页面上的状态和URL中的类型
        else {
          const urlTourType = type || tourType;
          
          
          
          // 从不同来源获取tourType，确保最终得到正确的值
          if (typeof urlTourType === 'string') {
            if (urlTourType.includes('day') || urlTourType === 'day') {
              effectiveTourType = 'day';
            } else if (urlTourType.includes('group') || urlTourType === 'group') {
              effectiveTourType = 'group';
            } else if (window.location.pathname.includes('day-tours')) {
              effectiveTourType = 'day';
            } else if (window.location.pathname.includes('group-tours')) {
              effectiveTourType = 'group';
            } else {
              effectiveTourType = 'day'; // 默认值
            }
          } else {
            effectiveTourType = 'day'; // 默认值
          }
        }
        
        console.log(`执行折扣计算: 产品ID=${tourId}, 类型=${effectiveTourType}, 原价=${originalPrice}`);
        
        // 多次尝试调用API以确保请求成功
        let attempts = 0;
        let success = false;
        let discountResult = null;
        
        while (attempts < 3 && !success) {
          try {
            discountResult = await calculateTourDiscount({
              tourId: tourId,
              tourType: effectiveTourType,
              originalPrice: originalPrice,
              agentId: agentId
            });
            
            if (discountResult && !discountResult.error) {
              success = true;
            } else {
              console.warn(`第${attempts + 1}次计算折扣失败:`, discountResult);
              await new Promise(resolve => setTimeout(resolve, 500)); // 延迟500ms再试
            }
          } catch (retryError) {
            console.error(`第${attempts + 1}次计算折扣出错:`, retryError);
          }
          attempts++;
        }
        
       
        
        if (success && discountResult.discountedPrice !== undefined) {
          setDiscountedPrice(discountResult.discountedPrice);
          console.log(`后端计算折扣: 原价=${originalPrice}, 折扣价=${discountResult.discountedPrice}, 折扣率=${discountResult.discountRate}`);
        } else {
          console.warn('无法获取有效的折扣价格，使用原价');
          setDiscountedPrice(originalPrice);
        }
        
        setLoadingDiscount(false);
      } catch (error) {
        console.error('计算折扣价格失败:', error);
        setDiscountedPrice(tourData.price);
        setLoadingDiscount(false);
      }
    } else {
      console.log('不需要计算折扣价格:', { 
        tourDataExists: !!tourData, 
        isAgent, 
        agentIdExists: !!agentId, 
        loadingDiscount 
      });
    }
  };

  // 当旅游详情加载完成且用户是代理商时，获取折扣价格
  useEffect(() => {
    fetchDiscountPrice();
  }, [tourData, isAgent, agentId]);

  // 渲染星级评分
  const renderRating = (rating) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="d-flex align-items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-warning me-1" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-warning me-1" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-warning me-1" />
        ))}
        <span className="ms-1 text-muted">{tourData?.reviews}</span>
      </div>
    );
  };

  

  // 处理"立即预订"按钮点击
  const handleBookNow = () => {
    if (!tourData || !id) {
      setError('无效的旅游产品');
      return;
    }
    
    // 计算总人数
    const adultCount = selectedAdultCount || 1;
    const childCount = selectedChildCount || 0;
    const totalPeople = adultCount + childCount;
    const roomCount = selectedRoomCount || 1;
    
    console.log('预订信息:', {
      成人数: adultCount,
      儿童数: childCount,
      房间数: roomCount,
      选择的酒店: selectedHotelLevel
    });
    
    // 检查是否选择了日期（对于需要日期的产品）
    if (requiresDateSelection && !selectedDate) {
      setError('请选择旅游日期');
      return;
    }
    
    // 构建预订数据
    const bookingData = {
      tourId: id,
      tourName: tourData.title || tourData.name || '',
      type: type,
      adultCount: adultCount,
      childCount: childCount,
      roomCount: roomCount,
      selectedDate: selectedDate,
      startDate: startDate,
      endDate: endDate,
      selectedHotelLevel: selectedHotelLevel,
      childrenAges: childrenAges,
      tourData: tourData
    };
    
    // 检查用户是否已登录
    if (!isAuthenticated) {
      // 未登录，保存预订数据并显示登录弹窗
      setPendingBookingData(bookingData);
      setShowLoginModal(true);
      return;
    }
    
    // 已登录，直接执行预订
    executeBooking(bookingData);
  };
  
  // 执行预订的具体逻辑
  const executeBooking = (bookingData) => {
    const {
      tourId,
      tourName,
      type,
      adultCount,
      childCount,
      roomCount,
      selectedDate,
      startDate,
      endDate,
      selectedHotelLevel,
      childrenAges,
      tourData
    } = bookingData;
    
    // 构建URL参数
    const params = new URLSearchParams();
    params.append('tourId', tourId);
    params.append('tourName', tourName);
    params.append('type', type);
    params.append('adultCount', adultCount);
    params.append('childCount', childCount);
    params.append('roomCount', roomCount);
    
    // 根据旅游类型添加不同的日期参数
    if (tourType === 'group_tour' || type === 'group') {
      // 跟团游：添加arrivalDate和departureDate
      if (startDate) {
        params.append('arrivalDate', startDate.toISOString().split('T')[0]);
      }
      
      if (endDate) {
        params.append('departureDate', endDate.toISOString().split('T')[0]);
      }
    } else {
      // 日游：只添加日期参数
      if (selectedDate) {
        params.append('date', selectedDate.toISOString().split('T')[0]);
      }
    }
    
    if (selectedHotelLevel) {
      params.append('hotelLevel', selectedHotelLevel);
    }
    
    // 如果有计算的价格，添加到URL
    let priceToUse = tourData?.price || 0;
    if (user?.role === 'agent' && tourData?.discountedPrice) {
      priceToUse = tourData.discountedPrice;
    }
    if (priceToUse) {
      params.append('price', priceToUse);
    }
    
    // 添加儿童年龄参数
    if (childCount > 0 && childrenAges.length > 0) {
      params.append('childrenAges', childrenAges.join(','));
    }
    
    // 根据用户类型决定跳转到哪个页面
    const localUserType = localStorage.getItem('userType');
    const isAgent = localUserType === 'agent' || localUserType === 'agent_operator';
    
    const bookingPath = isAgent ? 
      `/agent-booking/${type === 'group' ? 'group-tours' : 'day-tours'}/${tourId}?${params.toString()}` :
      `/booking?${params.toString()}`;
    
    // 导航到预订页面，通过state传递更多详细数据
    navigate(bookingPath, {
      state: {
        tourId: tourId,
        tourType: type,
        adultCount: adultCount,
        childCount: childCount,
        roomCount: roomCount,
        childrenAges: childrenAges,
        tourDate: selectedDate ? selectedDate.toISOString().split('T')[0] : 
                (startDate ? startDate.toISOString().split('T')[0] : null),
        bookingOptions: {
          hotelLevel: selectedHotelLevel,
          totalPrice: (user?.role === 'agent' && tourData?.discountedPrice) ? tourData.discountedPrice : tourData?.price || 0,
          hotelPriceDifference: 0,
          dailySingleRoomSupplement: 0
        },
        tourData: {
          title: tourData.title || tourData.name,
          imageUrl: tourData.imageUrl || tourData.coverImage,
          duration: tourData.duration,
          hotelNights: tourData.hotelNights || (tourData.duration ? tourData.duration - 1 : 0),
          highlights: tourData.highlights ? tourData.highlights.slice(0, 3) : []
        }
      }
    });
  };
  
  // 处理登录成功后的回调
  const handleLoginSuccess = (userType = 'user') => {
    if (userType === 'guest') {
      // 游客模式 - 跳转到游客预订页面（如果支持）
      console.log('游客模式下单暂未实现');
      setShowLoginModal(false);
      setPendingBookingData(null);
      return;
    }
    
    // 登录成功，执行之前暂停的预订
    if (pendingBookingData) {
      executeBooking(pendingBookingData);
      setPendingBookingData(null);
    }
    setShowLoginModal(false);
    
    // 登录成功后直接执行预订
    setTimeout(() => {
      handleDirectBooking();
    }, 100);
  };

  // 处理游客继续下单
  const handleGuestContinue = () => {
    console.log('游客选择继续下单');
    handleDirectBooking();
  };

  // 直接执行预订逻辑（无论登录还是游客）
  const handleDirectBooking = () => {
    // 检查跟团游是否有未选择的可选项目
    if (tourType === 'group_tour' && dayTourRelations.length > 0) {
      const optionalDays = {};
      dayTourRelations.forEach(relation => {
        const day = relation.day_number;
        if (!optionalDays[day]) {
          optionalDays[day] = [];
        }
        optionalDays[day].push(relation);
      });
      
      // 检查是否有可选项目未选择
      for (const day in optionalDays) {
        if (optionalDays[day].length > 1 && !selectedOptionalTours[day]) {
          alert(`请选择第${day}天的行程选项`);
          return;
        }
      }
    }
    
    // 构建完整的预订数据
    const bookingData = {
      tourId: id,
      tourName: tourData?.title || tourData?.name,
      tourType: tourType,
      type: type,
      tourDate: selectedDate,
      startDate: startDate,
      endDate: endDate,
      adultCount: adultCount,
      childCount: childCount,
      roomCount: roomCount,
      selectedHotelLevel: selectedHotelLevel,
      selectedRoomTypes: selectedRoomTypes,
      childrenAges: childrenAges,
      selectedOptionalTours: selectedOptionalTours,
      dayTourRelations: dayTourRelations,
      calculatedPrice: totalPrice,
      bookingOptions: {
        hotelLevel: selectedHotelLevel,
        pickupLocation: '',
      }
    };
    
    console.log('🚀 传递到订单页面的数据:', bookingData);
    
    // 根据用户登录状态决定跳转到哪个预订页面
    const bookingPath = isAuthenticated 
      ? `/booking?tourId=${id}&type=${type || tourType}`
      : `/guest-booking?tourId=${id}&type=${type || tourType}`;
    
    navigate(bookingPath, { state: bookingData });
  };

  // 在产品详情页面添加日期选择器
  const renderDateSelectors = () => {
    // 验证日期有效性的辅助函数
    const isValidDate = (date) => {
      return date && date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0;
    };

    // 为DatePicker提供安全的日期值
    const safeStartDate = isValidDate(startDate) ? startDate : null;
    const safeEndDate = isValidDate(endDate) ? endDate : null;
    const safeSelectedDate = isValidDate(selectedDate) ? selectedDate : null;

    return (
      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">选择行程日期</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            {tourType === 'group_tour' || type === 'group' ? (
              // 团体游显示起始和结束日期
              <>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label><FaCalendarAlt className="me-2" />到达日期</Form.Label>
                    <DatePicker
                      selected={safeStartDate}
                      onChange={date => setStartDate(date)}
                      selectsStart
                      startDate={safeStartDate}
                      endDate={safeEndDate}
                      minDate={new Date()}
                      className="form-control"
                      dateFormat="yyyy年MM月dd日"
                      calendarClassName="date-picker-calendar"
                      wrapperClassName="date-picker-wrapper"
                      showPopperArrow={false}
                      portalId="date-picker-portal"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label><FaCalendarAlt className="me-2" />离开日期</Form.Label>
                    <DatePicker
                      selected={safeEndDate}
                      onChange={date => setEndDate(date)}
                      selectsEnd
                      startDate={safeStartDate}
                      endDate={safeEndDate}
                      minDate={safeStartDate || new Date()}
                      className="form-control"
                      dateFormat="yyyy年MM月dd日"
                      calendarClassName="date-picker-calendar"
                      wrapperClassName="date-picker-wrapper"
                      showPopperArrow={false}
                      portalId="date-picker-portal"
                    />
                  </Form.Group>
                </Col>
              </>
            ) : (
              // 一日游只显示单个日期
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label><FaCalendarAlt className="me-2" />旅游日期</Form.Label>
                  <DatePicker
                    selected={safeSelectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    className="form-control"
                    dateFormat="yyyy年MM月dd日"
                    calendarClassName="date-picker-calendar"
                    wrapperClassName="date-picker-wrapper"
                    showPopperArrow={false}
                    portalId="date-picker-portal"
                  />
                  <Form.Text className="text-muted">
                    请选择您计划的旅游日期
                  </Form.Text>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  // 渲染主要内容
  const renderContent = () => {
    if (loading) {
      return (
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">正在加载旅游详情...</p>
        </Container>
      );
    }

    if (error) {
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>加载失败</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-between">
              <Button onClick={() => navigate(-1)} variant="outline-danger">返回上一页</Button>
              <Button onClick={() => window.location.reload()} variant="outline-primary">重新加载</Button>
            </div>
          </Alert>
        </Container>
      );
    }

    if (!tourData) {
      return (
        <Container className="py-5">
          <Alert variant="warning">
            <Alert.Heading>未找到旅游信息</Alert.Heading>
            <p>未能找到相关旅游产品的详细信息。</p>
            <Button onClick={() => navigate('/tours')} variant="outline-primary">返回旅游列表</Button>
          </Alert>
        </Container>
      );
    }

    return (
      <div className="tour-details-page">
        {/* Google SEO优化的动态meta标签 */}
        <Helmet>
          <title>{`${tourData?.title || tourData?.name || '产品详情'} - HTAS 塔斯马尼亚华人旅游`}</title>
          <meta name="description" content={`${tourData?.description || tourData?.intro || '探索塔斯马尼亚的绝美风光'} - HTAS提供专业中文导游服务，让您深度体验塔州之美。在线预订，优质服务保障。`} />
          
          {/* Keywords */}
          <meta name="keywords" content={`塔斯马尼亚旅游,${tourData?.title || tourData?.name},HTAS,塔州一日游,中文导游,${highlights.slice(0, 3).join(',')}`} />
          
          {/* Open Graph */}
          <meta property="og:title" content={`${tourData?.title || tourData?.name} - HTAS塔斯马尼亚华人旅游`} />
          <meta property="og:description" content={tourData?.description || tourData?.intro || '探索塔斯马尼亚的绝美风光'} />
          <meta property="og:image" content={images.length > 0 ? images[0].original : tourData?.coverImage} />
          <meta property="og:url" content={`https://www.htas.com.au/tours/${id}?type=${type}`} />
          <meta property="og:type" content="product" />
          <meta property="og:site_name" content="HTAS - 塔斯马尼亚华人旅游" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${tourData?.title || tourData?.name} - HTAS`} />
          <meta name="twitter:description" content={tourData?.description || tourData?.intro || '探索塔斯马尼亚的绝美风光'} />
          <meta name="twitter:image" content={images.length > 0 ? images[0].original : tourData?.coverImage} />
          
          {/* 产品结构化数据 */}
          <script type="application/ld+json">
            {JSON.stringify(generateStructuredData())}
          </script>
          
          {/* FAQ结构化数据 */}
          {faqs && faqs.length > 0 && (
            <script type="application/ld+json">
              {JSON.stringify(generateFAQStructuredData())}
            </script>
          )}
          
          {/* 面包屑导航结构化数据 */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "首页",
                  "item": "https://www.htas.com.au"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "旅游产品",
                  "item": "https://www.htas.com.au/tours"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": tourData?.title || tourData?.name,
                  "item": `https://www.htas.com.au/tours/${id}?type=${type}`
                }
              ]
            })}
          </script>
          
          {/* 本地商家信息 */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://www.htas.com.au/#organization",
              "name": "HTAS - 塔斯马尼亚华人旅游",
              "image": "https://www.htas.com.au/logo.png",
              "description": "专业的塔斯马尼亚中文旅游服务，提供一日游、跟团游等多种旅游产品",
              "url": "https://www.htas.com.au",
              "telephone": "+61-3-6234-5678",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "",
                "addressLocality": "Hobart",
                "addressRegion": "Tasmania",
                "postalCode": "7000",
                "addressCountry": "AU"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -42.8821,
                "longitude": 147.3272
              },
              "areaServed": {
                "@type": "State",
                "name": "Tasmania"
              },
              "serviceType": "Travel Agency"
            })}
          </script>
        </Helmet>

        {/* 百度SEO优化 */}
        <BaiduSEO 
          tourData={tourData}
          tourType={tourType}
          pageType="product"
        />

        {/* 面包屑导航 */}
        <Container>
          <div className="breadcrumbs mb-3">
            <Link to="/">首页</Link> / 
            {tourType === 'day_tour' ? (
              <Link to="/tours?tourTypes=day_tour">一日游</Link>
            ) : (
              <Link to="/tours?tourTypes=group_tour">跟团游</Link>
            )} / 
            <span>{tourData?.title || tourData?.name}</span>
          </div>
        </Container>



        {/* 新的头部设计 */}
        <Container className="mb-5">
          <div className="modern-tour-header">
            {/* 标题和基本信息 */}
            <div className="tour-header-info mb-4 d-flex justify-content-between">
              <h1 className="modern-tour-title">{tourData?.title || tourData?.name}</h1>
              
              

              {/* 价格和操作按钮行 */}
              <div className="tour-price-action-row">
                <div className="tour-price-section">
                  <span className="price-label">起价</span>
                  <div className="price-display">
                    <span className="current-price">
                      ${(() => {
                        // 如果正在加载价格，显示加载状态
                        if (isPriceLoading) {
                          return '计算中...';
                        }
                        
                        // 优先显示计算后的总价格（确保totalPrice不为null且大于0）
                        if (totalPrice !== null && totalPrice !== undefined && totalPrice > 0) {
                          return Math.round(totalPrice); // 四舍五入显示整数
                        }
                        // 其次显示代理商折扣价
                        else if (isAgent && discountedPrice && discountedPrice > 0) {
                          return Math.round(discountedPrice);
                        }
                        // 最后显示产品基础价格
                        else {
                          return Math.round(tourData?.price || 0);
                        }
                      })()}
                    </span>
                    {isAgent && discountedPrice && (
                      <div className="original-price-header">
                        原价: ${tourData?.price || 0}
                      </div>
                    )}
                  </div>
                </div>
                
                
              </div>
            </div>

            {/* 图片展示区域 */}
            <div className="modern-gallery-grid">
              <div className="main-image-container">
                {images && images.length > 0 && images[0] ? (
                  <img 
                    src={proxyImageUrl(images[0].original)} 
                    alt={images[0].description || `${tourData?.title || tourData?.name} 主图`}
                    className="main-gallery-image"
                    onError={(e) => {
                      console.error('主图加载失败:', images[0].original);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('主图加载成功:', images[0].original);
                    }}
                  />
                ) : (
                  <div className="placeholder-image">
                    <FaMapMarkerAlt size={60} className="text-muted" />
                    <p className="mt-2 text-muted">
                      {loading ? '加载中...' : `暂无图片 (共${images?.length || 0}张)`}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="thumbnail-grid">
                {images && images.length > 1 ? 
                  images.slice(1, 5).map((image, index) => (
                    <div key={index} className="thumbnail-container">
                      <img 
                        src={proxyImageUrl(image.thumbnail)} 
                        alt={image.description || `${tourData?.title || tourData?.name} 图片 ${index + 2}`}
                        className="thumbnail-image"
                        onError={(e) => {
                          console.error(`缩略图${index + 2}加载失败:`, image.thumbnail);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log(`缩略图${index + 2}加载成功:`, image.thumbnail);
                        }}
                      />
                      {index === 3 && images.length > 5 && (
                        <div className="more-images-overlay">
                          <span>查看全部 {images.length} 张图片</span>
                        </div>
                      )}
                    </div>
                  )) : (
                    // 显示占位缩略图
                    [...Array(4)].map((_, index) => (
                      <div key={index} className="thumbnail-container">
                        <div className="placeholder-thumbnail">
                          <FaMapMarkerAlt size={20} className="text-muted" />
                        </div>
                      </div>
                    ))
                  )
                }
              </div>
            </div>
          </div>
        </Container>

        {/* 主要内容区域 */}
        <Container className="main-content mb-5">
          <Row>
            <Col lg={8}>
              <Tab.Container id="tour-tabs" defaultActiveKey="overview">
                <div className="tour-tabs-wrapper">
                  <Nav variant="tabs" className="tour-tabs mb-4">
                    <Nav.Item>
                      <Nav.Link eventKey="overview" onClick={() => setActiveTab('overview')}>行程概况</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="itinerary" onClick={() => setActiveTab('itinerary')}>行程安排</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="fees" onClick={() => setActiveTab('fees')}>费用说明</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="location" onClick={() => setActiveTab('location')}>地图位置</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="faq" onClick={() => setActiveTab('faq')}>常见问题</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="reviews" onClick={() => setActiveTab('reviews')}>客户评价</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="overview">
                                            {/* 产品展示图片 */}
                      {(tourData?.productShowcaseImage || tourData?.product_showcase_image) && (
                        <div className="product-showcase-in-tab mb-4">
                          <div className="product-showcase-image-wrapper">
                            <img 
                              src={proxyImageUrl(tourData.productShowcaseImage || tourData.product_showcase_image)} 
                              alt={`${tourData?.title || tourData?.name} 产品展示`}
                              className="product-showcase-img"
                            />
                            <div className="product-showcase-overlay">
                              <div className="showcase-badge">
                                <FaInfoCircle className="me-1" />
                                精选展示
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="tour-description mb-4">
                        <h3 className="section-title">行程介绍</h3>
                        <p>{tourData?.description || tourData?.intro || tourData?.des}</p>
                      </div>

                      <div className="tour-highlights mb-4">
                        <h3 className="section-title">行程亮点</h3>
                        {highlights && highlights.length > 0 ? (
                          <ul className="highlights-list">
                            {highlights.map((highlight, index) => (
                              <li key={index}>{highlight}</li>
                            ))}
                          </ul>
                        ) : (
                          <Alert variant="info">暂无亮点信息，请联系客服了解详情。</Alert>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="section-title">旅行贴士</h3>
                        <Card>
                          <Card.Body>
                            {tips && tips.length > 0 ? (
                              <ul className="tips-list">
                                {tips.map((tip, index) => (
                                  <li key={index} className="d-flex">
                                    <FaLightbulb className="text-warning mt-1 me-2" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <Alert variant="info">暂无旅行贴士，请联系客服了解详情。</Alert>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="itinerary">
                      <h3 className="section-title">详细行程</h3>
                      {itinerary && itinerary.length > 0 ? (
                        <>
                          {tourType === 'day_tour' ? (
                            // 一日游行程展示（按时间段）
                            <div className="day-tour-itinerary">
                              <h4 className="mb-3">行程安排</h4>
                              <div className="timeline">
                                {itinerary.map((item, index) => (
                                  <div className="timeline-item" key={index}>
                                    <div className="timeline-badge">
                                      <FaClock className="text-white" />
                                    </div>
                                    <div className="timeline-panel">
                                      <div className="timeline-heading">
                                        <h5 className="timeline-title">
                                          <span className="time">{item.time_slot}</span> - {item.activity}
                                        </h5>
                                        {item.location && (
                                          <p className="timeline-location">
                                            <FaMapMarkerAlt className="me-1 text-danger" />
                                            {item.location}
                                          </p>
                                        )}
                                      </div>
                                      {item.description && (
                                        <div className="timeline-body mt-2">
                                          <p>{item.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            // 跟团游行程展示（按天）
                            <Accordion defaultActiveKey="0" className="itinerary-accordion">
                              {itinerary.map((day, index) => {
                                const dayNumber = day.day_number || (index + 1);
                                // 获取当天的一日游选项
                                const dayTourOptions = dayTourRelations.filter(relation => relation.day_number === dayNumber);
                                const hasOptionalTours = dayTourOptions.length > 0; // 修改：只要有可选项目就显示
                                

                                
                                return (
                                <Accordion.Item eventKey={index.toString()} key={index}>
                                  <Accordion.Header>
                                    {day.title ? (
                                      <span dangerouslySetInnerHTML={{ __html: day.title }} />
                                    ) : (
                                        <span>第{dayNumber}天</span>
                                      )}
                                      {hasOptionalTours && (
                                        <Badge bg="info" className="ms-2">可选行程</Badge>
                                    )}
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <div className="day-details">
                                      {day.des && <p className="day-description">{day.des}</p>}
                                      {day.description && <p className="day-description">{day.description}</p>}
                                      
                                      {day.image && (
                                        <div className="day-image mb-3">
                                            <img src={day.image} alt={`第${dayNumber}天景点`} className="img-fluid rounded" />
                                          </div>
                                        )}
                                        
                                                                {/* 可选项目选择 - 紧凑型横向布局 */}
                        {hasOptionalTours && (
                          <div className="optional-tours-section mb-3">
                            <h6 className="mb-2 optional-tours-title">
                              <FaTicketAlt className="me-2 text-primary" />
                              请选择当天行程（{dayTourOptions.length}个选项）
                            </h6>
                            {/* 紧凑型横向排列的选项 */}
                            <div className="optional-tours-horizontal">
                              {dayTourOptions.map((option, optionIndex) => {
                                const isSelected = selectedOptionalTours[dayNumber] === option.day_tour_id;
                                const priceDiff = option.price_difference || 0;
                                return (
                                  <div 
                                    key={option.day_tour_id}
                                    className={`optional-tour-horizontal ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleOptionalTourSelect(dayNumber, option.day_tour_id)}

                                  >
                                    <div className="optional-tour-compact-content">
                                      <Form.Check
                                        type="radio"
                                        name={`day-${dayNumber}-tour`}
                                        checked={isSelected}
                                        onChange={() => handleOptionalTourSelect(dayNumber, option.day_tour_id)}
                                        className="mt-1"

                                      />
                                      <div className="optional-tour-text">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                          <div className="optional-tour-title">
                                            选项{optionIndex + 1}：{option.day_tour_name}
                                          </div>
                                          <div className="optional-tour-badges ms-2">
                                            {option.is_default && (
                                              <Badge bg="success" size="sm">推荐</Badge>
                                            )}
                                            {priceDiff > 0 && (
                                              <Badge bg="warning" size="sm">+${priceDiff}</Badge>
                                            )}
                                            {priceDiff < 0 && (
                                              <Badge bg="success" size="sm">-${Math.abs(priceDiff)}</Badge>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {option.day_tour_description && (
                                          <div className="optional-tour-desc">
                                            {option.day_tour_description}
                                          </div>
                                        )}
                                        
                                        {option.location && (
                                          <div className="optional-tour-location">
                                            <FaMapMarkerAlt className="me-1" />
                                            {option.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="optional-tours-info mt-2">
                              <FaInfoCircle className="me-1" />
                              请选择您希望参加的行程。所选行程将包含在您的预订中。
                            </div>
                        </div>
                      )}
                                      
                                      {day.meals && (
                                        <div className="day-meals mb-2">
                                          <strong className="me-2">餐食:</strong>
                                          <span>{day.meals}</span>
                                        </div>
                                      )}
                                      
                                      {day.accommodation && (
                                        <div className="day-accommodation mb-2">
                                          <strong className="me-2">住宿:</strong>
                                          <span>{day.accommodation}</span>
                                        </div>
                                      )}
                                      
                                      {day.activities && day.activities.length > 0 && (
                                        <div className="day-activities">
                                          <strong className="me-2">活动:</strong>
                                          <div className="d-flex flex-wrap">
                                            {day.activities.map((activity, i) => (
                                              <Badge
                                                key={i}
                                                bg="light"
                                                text="dark"
                                                className="me-2 mb-2 p-2"
                                              >
                                                {activity}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Accordion.Body>
                                </Accordion.Item>
                                );
                              })}
                            </Accordion>
                          )}
                        </>
                      ) : (
                        <Alert variant="info">暂无详细行程信息，请联系客服了解详情。</Alert>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="fees">
                      <h3 className="section-title">费用说明</h3>
                      <Row>
                        <Col md={6}>
                          <Card className="mb-4">
                            <Card.Header className="bg-success text-white">
                              <h5 className="mb-0">
                                <FaCheck className="me-2" />
                                费用包含
                              </h5>
                            </Card.Header>
                            <Card.Body>
                          {inclusions && inclusions.length > 0 ? (
                                <ul className="list-unstyled">
                              {inclusions.map((item, index) => (
                                    <li key={index} className="mb-2">
                                      <FaCheck className="text-success me-2" />
                                      {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                                <p className="text-muted">暂无费用包含信息，请联系客服了解详情。</p>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="mb-4">
                            <Card.Header className="bg-danger text-white">
                              <h5 className="mb-0">
                                <FaTimes className="me-2" />
                                费用不含
                              </h5>
                            </Card.Header>
                            <Card.Body>
                          {exclusions && exclusions.length > 0 ? (
                                <ul className="list-unstyled">
                              {exclusions.map((item, index) => (
                                    <li key={index} className="mb-2">
                                      <FaTimes className="text-danger me-2" />
                                      {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                                <p className="text-muted">暂无费用不含信息，请联系客服了解详情。</p>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Tab.Pane>

                    <Tab.Pane eventKey="location">
                      <h3 className="section-title">地图位置</h3>
                      <div className="map-placeholder">
                        <p className="text-center text-muted py-5">
                          <FaMapMarkerAlt size={48} className="mb-3" />
                          <br />
                          地图功能开发中...
                        </p>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="faq">
                      <h3 className="section-title">常见问题</h3>
                      {faqs && faqs.length > 0 ? (
                        <Accordion>
                          {faqs.map((faq, index) => (
                            <Accordion.Item eventKey={index.toString()} key={index}>
                              <Accordion.Header>
                                <FaQuestionCircle className="me-2 text-primary" />
                                {faq.question}
                              </Accordion.Header>
                              <Accordion.Body>
                                {faq.answer}
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      ) : (
                        <Alert variant="info">暂无常见问题，如有疑问请联系客服。</Alert>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="reviews">
                      <h3 className="section-title">客户评价</h3>
                      <CustomerReviews tourId={id} />
                    </Tab.Pane>
                  </Tab.Content>
                </div>
              </Tab.Container>
            </Col>
            
            {/* 右侧预订面板 - 类似飞猪的设计 */}
            <Col lg={4}>
              <div className="booking-sidebar sticky-top">
                {/* 价格信息卡片 */}
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
                            // 如果正在加载价格，显示加载状态
                            if (isPriceLoading) {
                              return '计算中...';
                            }
                            
                            // 优先显示计算后的总价格（确保totalPrice不为null且大于0）
                            if (totalPrice !== null && totalPrice !== undefined && totalPrice > 0) {
                              return Math.round(totalPrice); // 四舍五入显示整数
                            }
                            // 其次显示代理商折扣价
                            else if (isAgent && discountedPrice && discountedPrice > 0) {
                              return Math.round(discountedPrice);
                            }
                            // 最后显示产品基础价格
                            else {
                              return Math.round(tourData?.price || 0);
                            }
                          })()}
                        </span>
                        <span className="price-unit">起</span>
                      </div>

                      
                      {isAgent && discountedPrice && (
                        <div className="original-price-small">
                          原价: ${tourData?.price || 0}
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

                    {/* 基本信息 */}
                    <div className="tour-basic-info mb-4">
                      <div className="info-row">
                        <span className="info-label">目的地</span>
                        <span className="info-value">
                          <FaMapMarkerAlt className="me-1 text-danger" />
                          {tourData?.location || tourData?.destination || '塔斯马尼亚'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">行程天数</span>
                        <span className="info-value">
                          <FaCalendarAlt className="me-1 text-primary" />
                          {(() => {
                            if (tourType === 'day_tour') return '1天';
                            if (tourData?.duration) {
                              if (typeof tourData.duration === 'string') {
                                const match = tourData.duration.match(/(\d+)天/);
                                return match ? `${match[1]}天` : tourData.duration;
                              }
                              return `${tourData.duration}天`;
                            }
                            return '1天';
                          })()}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">服务承诺</span>
                        <span className="info-value">
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
                        </span>
                      </div>
                    </div>

                    {/* 套餐选择（酒店等级） */}
                    <div className="package-selection mb-3">
                      <h6 className="selection-title">套餐类型</h6>
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
                              // 只有当选择的酒店等级不同时才触发更新
                              if (selectedHotelLevel !== hotel.hotelLevel) {
                                setSelectedHotelLevel(hotel.hotelLevel);
                                // 使用当前状态值和新选择的酒店等级
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
                                  // 只有当选择的酒店等级不同时才触发更新
                                  if (selectedHotelLevel !== hotel.hotelLevel) {
                                    setSelectedHotelLevel(hotel.hotelLevel);
                                    // 使用当前状态值和新选择的酒店等级
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
                    </div>

                    {(tourType === 'group_tour' || type === 'group') && dayTourRelations.length > 0 && (
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

                              // 分离有多个选项的天数和只有一个选项的天数
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
                                            const option = dayOptions[0]; // 只有一个选项
                                            
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

                                  {/* 可选行程 - 只显示有多个选项的天数 */}
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
                                                  // 只有当选择的行程不同时才触发更新
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
                                                    // 只有当选择的行程不同时才触发更新
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
                      <h6 className="selection-title">出游人群</h6>
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

                      {/* 儿童年龄选择 - 横向显示 */}
                      {childCount > 0 && (
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
                    {(tourType === 'group_tour' || type === 'group') && (
                      <div className="room-selection mb-3">
                        <h6 className="selection-title">房间选择</h6>
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

                          <div className="room-type-item-small">
                            <div className="room-icon-small">🛏️</div>
                            <span className="room-label-small">房间类型</span>
                            <div className="room-types-container">
                              {selectedRoomTypes.map((roomType, index) => (
                                <div key={index} className="room-type-row mb-2">
                                  <span className="room-number" style={{fontSize: '12px', color: '#666', marginRight: '8px'}}>房间{index + 1}:</span>
                                  <select 
                                    className="room-type-select-small"
                                    value={roomType}
                                    onChange={(e) => {
                                      const newRoomType = e.target.value;
                                      const newRoomTypes = [...selectedRoomTypes];
                                      newRoomTypes[index] = newRoomType;
                                      setSelectedRoomTypes(newRoomTypes);
                                      // 房间类型变更时触发价格重新计算
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
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 出行日期 */}
                    <div className="date-selection mb-3">
                      <h6 className="selection-title">出行日期</h6>
                      <div className="date-options-horizontal">
                        <div className="date-item-small">
                          <label className="date-label-small">出发日期：</label>
                          <DatePicker
                            selected={startDate}
                            onChange={(date) => {
                              setStartDate(date);
                              setSelectedDate(date);
                              // 自动计算结束日期
                              if (tourData && tourType === 'group_tour') {
                                let duration = 4; // 默认4天
                                if (typeof tourData.duration === 'string' && tourData.duration.includes('天')) {
                                  const match = tourData.duration.match(/(\d+)天/);
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
                            dateFormat="yyyy年MM月dd日"
                            className="date-picker-small"
                            placeholderText="选择出发日期"
                            minDate={new Date()}
                          />
                        </div>

                        <div className="date-item-small">
                          <label className="date-label-small">返回日期：</label>
                          <DatePicker
                            selected={endDate}
                            onChange={(date) => {
                              setEndDate(date);
                              sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
                            }}
                            dateFormat="yyyy年MM月dd日"
                            className="date-picker-small"
                            placeholderText="选择返回日期"
                            minDate={startDate || new Date()}
                          />
                        </div>
                      </div>
                      
                      
                    </div>

                    {/* 可选行程 */}

                    {/* 立即购买按钮 */}
                    <div className="booking-actions">
                        <Button 
                        className="book-now-btn w-100"
                          size="lg" 
                        style={{
                          backgroundColor: '#ff6b35',
                          borderColor: '#ff6b35',
                          fontWeight: 'bold',
                          padding: '12px 0'
                        }}
                        onClick={handleBooking}
                      >
                        立即购买
                        </Button>
                  </div>

                    {/* 说明文字 */}
                    <div className="booking-notes mt-3">
                      <small className="text-muted">
                        <div className="mb-1">
                          <FaInfoCircle className="me-1" />
                          不支持7天无理由退货
                    </div>
                        <div>
                          <FaClock className="me-1" />
                          需二次确认，商家将在18个工作小时内(工作日9:00--18:00)核实是否有位
                  </div>
                      </small>
                </div>
                  </Card.Body>
                </Card>

                {/* 帮助卡片 */}
                <Card className="help-card">
                  <Card.Header className="help-card-header">
                    <h5 className="mb-0">需要帮助?</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="contact-info">
                      <div className="phone-contact mb-3">
                        <FaPhoneAlt className="contact-icon" />
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

  // 渲染轮播图组件
  const renderImageGallery = () => {
    // 如果没有图片数据，则不显示轮播图
    if (!images || images.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted">暂无图片</p>
        </div>
      );
    }

    return (
      <div className="custom-gallery-wrapper">
        <ImageGallery
          items={images}
          showPlayButton={false}
          showFullscreenButton={false}
          showThumbnails={true}
          showNav={true}
          showBullets={false}
          showIndex={false}
          lazyLoad={true}
          thumbnailPosition="bottom"
          slideDuration={300}
          slideInterval={5000}
          startIndex={0}
          additionalClass="tour-image-gallery modern-gallery"
          useBrowserFullscreen={false}
          preventDefaultTouchmoveEvent={true}
          swipingTransitionDuration={400}
          slideOnThumbnailOver={false}
          useWindowKeyDown={true}
          infinite={true}
          onSlide={(currentIndex) => setActiveIndex(currentIndex)}
          renderCustomControls={() => (
            <div className="image-counter">
              <span>{activeIndex + 1}</span>
              <span className="divider">/</span>
              <span className="total">{images.length}</span>
            </div>
          )}
          renderLeftNav={(onClick, disabled) => (
            <button
              type="button"
              className="gallery-nav gallery-nav-left"
              disabled={disabled}
              onClick={onClick}
              aria-label="上一张"
            >
              <div className="nav-icon-container">
                <FaChevronLeft size={18} />
              </div>
            </button>
          )}
          renderRightNav={(onClick, disabled) => (
            <button
              type="button"
              className="gallery-nav gallery-nav-right"
              disabled={disabled}
              onClick={onClick}
              aria-label="下一张"
            >
              <div className="nav-icon-container">
                <FaChevronRight size={18} />
              </div>
            </button>
          )}
          renderThumbInner={(item) => (
            <div className="custom-thumbnail">
              <div className="thumbnail-loading-placeholder"></div>
              <img 
                src={item.thumbnail} 
                alt={item.thumbnailAlt || "缩略图"} 
                title={item.description || ""}
                className="thumbnail-image"
                loading="lazy"
                onLoad={(e) => {
                  e.target.classList.add('loaded');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
                onError={(e) => {
                  console.log('缩略图加载失败');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
              />
            </div>
          )}
          renderItem={(item, index) => (
            <div className="custom-gallery-slide">
              <div className="image-gradient-overlay"></div>
              <div className="slide-location">
                <FaMapMarkerAlt className="location-icon" /> 
                <span>{item.location || tourData?.location || '塔斯马尼亚'}</span>
              </div>
              
              <div className="image-loading-placeholder"></div>
              <img
                src={item.original}
                alt={item.originalAlt || "景点图片"}
                className="main-image"
                loading={index === 0 ? "eager" : "lazy"}
                onLoad={(e) => {
                  e.target.classList.add('loaded');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
                onError={(e) => {
                  console.log('主图加载失败');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
              />
              
              {item.description && (
                <div className="slide-description">
                  <span>{item.description}</span>
                </div>
              )}
            </div>
          )}
        />
        <div className="gallery-info d-none d-md-block">
          <div className="tour-info-tag">
            <span>探索{tourData?.title || tourData?.name}的精彩瞬间</span>
          </div>
          <div className="gallery-count-info">
            共{images.length}张精选照片
          </div>
        </div>
      </div>
    );
  };

  // 处理成人数量变更
  const handleAdultCountChange = (e) => {
    const newAdultCount = parseInt(e.target.value) || 1;
    if (newAdultCount < 1) return;
    
    // 更新成人数量状态
    setAdultCount(newAdultCount);
    setSelectedAdultCount(newAdultCount);
    
    // 调用后端API获取价格 - 不自动调整房间数
    sendParamsToBackend(newAdultCount, childCount, roomCount, selectedHotelLevel);
  };
  
  // 处理儿童数量变更
  const handleChildCountChange = (e) => {
    const newChildCount = parseInt(e.target.value) || 0;
    if (newChildCount < 0) return;
    
    // 更新状态
    setChildCount(newChildCount);
    setSelectedChildCount(newChildCount);
    
    // 更新儿童年龄数组
    const newChildrenAges = [...childrenAges];
    if (newChildCount > childrenAges.length) {
      // 如果增加了儿童，添加新的年龄项，默认为0
      for (let i = childrenAges.length; i < newChildCount; i++) {
        newChildrenAges.push(0);
      }
    } else if (newChildCount < childrenAges.length) {
      // 如果减少了儿童，移除多余的年龄项
      newChildrenAges.splice(newChildCount);
    }
    
    setChildrenAges(newChildrenAges);
    setShowChildAgeInputs(newChildCount > 0);
    
    // 发送参数到后端，包括儿童年龄
    sendParamsToBackend(adultCount, newChildCount, roomCount, selectedHotelLevel, newChildrenAges);
  };
  
  // 处理房间数量变更
  const handleRoomCountChange = (e) => {
    const newRoomCount = parseInt(e.target.value) || 1;
    if (newRoomCount < 1) return;
    
    // 更新状态
    setRoomCount(newRoomCount);
    setSelectedRoomCount(newRoomCount);
    
    // 🔧 更新房间类型数组
    const currentRoomTypes = selectedRoomTypes || [];
    
    if (newRoomCount > currentRoomTypes.length) {
      // 增加房间：保留现有房型，为新房间添加默认房型
      const additionalRooms = newRoomCount - currentRoomTypes.length;
      const newRoomTypes = [...currentRoomTypes, ...Array(additionalRooms).fill('大床房')];
      setSelectedRoomTypes(newRoomTypes);
    } else if (newRoomCount < currentRoomTypes.length) {
      // 减少房间：保留前N个房型
      const newRoomTypes = currentRoomTypes.slice(0, newRoomCount);
      setSelectedRoomTypes(newRoomTypes);
    } else if (currentRoomTypes.length === 0) {
      // 如果当前没有房间类型，初始化为默认值
      const newRoomTypes = Array(newRoomCount).fill('大床房');
      setSelectedRoomTypes(newRoomTypes);
    }
    
    // 调用后端API获取价格
    sendParamsToBackend(adultCount, childCount, newRoomCount, selectedHotelLevel);
  };
  
  // 处理酒店星级变更
  const handleHotelLevelChange = (e) => {
    const newLevel = e.target.value;
    setSelectedHotelLevel(newLevel);
    
    // 调用后端API获取价格
    sendParamsToBackend(adultCount, childCount, roomCount, newLevel);
  };
  
  // 处理日期选择
  const handleDateChange = (date) => {
    console.log('日期选择器变更:', date);
    
    // 如果日期为null，设置为当前日期
    if (date === null) {
      setSelectedDate(new Date());
      return;
    }
    
    // 确保date是有效的Date对象
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      setSelectedDate(date);
      
      // 日期变更后可能需要重新获取价格
      if (tourData) {
        sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
      }
    } else {
      console.error('无效的日期值:', date);
      // 如果传入的日期无效，则使用当前日期
      setSelectedDate(new Date());
    }
  };
  
  // 处理儿童年龄变化
  const handleChildAgeChange = (index, age) => {
    const newChildrenAges = [...childrenAges];
    newChildrenAges[index] = parseInt(age) || 0;
    setChildrenAges(newChildrenAges);
    
    // 使用防抖避免频繁的API调用
    if (priceDebounceTimer) {
      clearTimeout(priceDebounceTimer);
    }
    
    const newTimer = setTimeout(() => {
      // 发送更新后的参数到后端
      sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel, newChildrenAges);
    }, 500); // 500ms防抖
    
    setPriceDebounceTimer(newTimer);
  };

  // 处理可选项目选择
  const handleOptionalTourSelect = (dayNumber, tourId) => {
    // 如果选择的行程已经是当前选择的，则不做任何操作
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
    
    // 选择可选项目后触发价格更新，使用新的选择数据
    setTimeout(() => {
      // 直接传递新的选择数据给价格计算函数
      sendParamsToBackendWithOptionalTours(adultCount, childCount, roomCount, selectedHotelLevel, childrenAges, newSelection);
    }, 100);
    
    // 检查是否所有可选天数都已选择，如果是则自动折叠
    const optionalDays = {};
    dayTourRelations.forEach(relation => {
      const day = relation.day_number;
      if (!optionalDays[day]) {
        optionalDays[day] = [];
      }
      optionalDays[day].push(relation);
    });
    
    const optionalDaysList = Object.keys(optionalDays).filter(day => optionalDays[day].length > 1);
    const allSelected = optionalDaysList.every(day => newSelection[day]);
    
    // 移除自动折叠逻辑，让用户自己控制展开/折叠
    // if (allSelected) {
    //   // 延迟折叠，让用户看到选择结果
    //   setTimeout(() => {
    //     setIsOptionalToursExpanded(false);
    //   }, 1000);
    // }
  };
  
  // 向后端发送参数的简化函数
  const sendParamsToBackend = (adults, children, rooms, hotelLevel, ages = childrenAges) => {
    // 调用带可选项目参数的函数，使用当前的selectedOptionalTours状态
    sendParamsToBackendWithOptionalTours(adults, children, rooms, hotelLevel, ages, selectedOptionalTours);
  };
  
  // 带可选项目参数的价格计算函数
  const sendParamsToBackendWithOptionalTours = (adults, children, rooms, hotelLevel, ages = childrenAges, optionalTours = selectedOptionalTours, roomTypes = selectedRoomTypes) => {
    console.log('🔍 价格计算函数被调用，参数:', {
      adults, children, rooms, hotelLevel,
      ages: ages?.length || 0,
      optionalTours: Object.keys(optionalTours || {}).length,
      roomTypes: roomTypes?.length || 0,
      isCallingApiRef: isCallingApiRef.current,
      tourData: !!tourData,
      id: id
    });

    // 如果已经在调用API，避免重复调用
    if (isCallingApiRef.current) {
      console.log('⏸️ API调用中，跳过重复请求');
      return;
    }

    // 设置API调用状态
    isCallingApiRef.current = true;
    setIsPriceLoading(true);
    
    console.log('💰 开始价格计算请求:', { adults, children, rooms, hotelLevel });

    // 计算API使用的产品类型
    const apiTourType = type === 'group' ? 'group_tour' : 'day_tour';
    


    // 验证儿童年龄数组
    const validAges = Array.isArray(ages) ? ages.filter(age => age !== null && age !== undefined && age !== '') : [];
    
    // 检查是否有可选项目
    const hasOptionalTours = dayTourRelations && dayTourRelations.length > 0;
    
    // 使用统一的价格计算API（自动支持可选项目）
    const priceData = calculateTourPrice(
      id,
      apiTourType,
      adults,
      children,
      hotelLevel,
      null, // agentId - 从用户状态获取
      rooms,
      null, // userId - 从用户状态获取
      validAges, // 经过验证的儿童年龄数组
      roomTypes && roomTypes.length > 0 ? roomTypes : ['大床房'], // roomType - 传递房间类型数组
      hasOptionalTours ? optionalTours : null // 可选项目（如果有的话）
    );
    
    priceData.then(response => {
      console.log('🎉 价格计算API响应成功:', response);
      if (response && response.code === 1 && response.data) {
        const priceInfo = response.data;
        // 🔧 修复：实际的价格数据在 priceInfo.data 中，不是在 priceInfo 中
        const actualPriceData = priceInfo.data || priceInfo;
        
        // 更新价格状态 - 从正确的数据对象中获取价格
        let actualTotalPrice = actualPriceData.totalPrice || actualPriceData.total_price || actualPriceData.price || actualPriceData.finalPrice || actualPriceData.calculatedPrice;
        
        if (actualTotalPrice !== undefined && actualTotalPrice !== null) {
          console.log('💰 设置总价格:', actualTotalPrice);
          setTotalPrice(actualTotalPrice);
        }
        
        // 更新酒店价格差异
        if (priceInfo.hotelPriceDifference !== undefined) {
          setHotelPriceDifference(priceInfo.hotelPriceDifference);
        }
        
        // 更新酒店价格列表
        if (priceInfo.hotelPrices && Array.isArray(priceInfo.hotelPrices)) {
          setHotelPrices(priceInfo.hotelPrices);
        }
      } else {
        console.warn('⚠️ 价格计算响应格式不正确:', response);
        setTotalPrice(null);
      }
    }).catch(error => {
      console.error('❌ 价格计算API调用失败:', error);
      console.error('❌ 错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setTotalPrice(null);
    }).finally(() => {
      // 重置API调用状态
      isCallingApiRef.current = false;
      setIsPriceLoading(false);
      console.log('价格计算请求完成，状态重置');
    });
    
    // 添加安全保障：3秒后强制重置API调用状态（防止异常情况下状态一直被锁定）
    setTimeout(() => {
      if (isCallingApiRef.current) {
        console.warn('强制重置API调用状态（3秒超时）');
        isCallingApiRef.current = false;
        setIsPriceLoading(false);
      }
    }, 3000);
  };

  // 初始化日期选择状态
  useEffect(() => {
    if (tourData) {
      // 检查是否是需要选择日期的产品类型（如一日游）
      const isDayTour = tourType === 'day_tour' || type === 'day';
      setRequiresDateSelection(isDayTour);
      
      // 根据产品类型自动计算和设置日期
      if (isDayTour) {
        // 一日游：默认选择明天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // 验证日期有效性
        if (!isNaN(tomorrow.getTime()) && tomorrow.getTime() > 0) {
          setSelectedDate(tomorrow);
          console.log('一日游自动设置日期为明天:', tomorrow);
        } else {
          console.error('一日游日期计算失败，使用当前日期');
          setSelectedDate(new Date());
        }
      } else {
        // 跟团游：根据产品数据自动计算起始和结束日期
        let duration = 7; // 默认7天
        
        // 尝试从不同字段获取天数
        if (typeof tourData.days === 'number' && tourData.days > 0) {
          // 优先使用数字字段 days
          duration = tourData.days;
          console.log('使用数字字段 days:', duration);
        } else if (typeof tourData.duration === 'string' && tourData.duration.includes('天')) {
          // 如果没有数字字段，尝试从字符串字段解析
          try {
            const match = tourData.duration.match(/(\d+)天/);
            if (match && match[1]) {
              duration = parseInt(match[1]);
              console.log('从字符串字段 duration 解析天数:', duration);
            }
          } catch (e) {
            console.warn('解析 duration 字符串失败:', e.message);
          }
        } else if (typeof tourData.duration === 'number' && tourData.duration > 0) {
          // 如果 duration 本身就是数字
          duration = tourData.duration;
          console.log('使用数字字段 duration:', duration);
        }
        
        // 设置到达日期为7天后（给用户准备时间）
        const arrivalDate = new Date();
        arrivalDate.setDate(arrivalDate.getDate() + 7);
        
        // 设置离开日期为到达日期 + 产品天数 - 1
        const departureDate = new Date(arrivalDate);
        departureDate.setDate(arrivalDate.getDate() + duration - 1);
        
        // 验证日期有效性后再更新
        if (!isNaN(arrivalDate.getTime()) && arrivalDate.getTime() > 0) {
          setStartDate(arrivalDate);
        } else {
          console.error('到达日期计算失败，使用默认日期');
          const fallbackDate = new Date();
          fallbackDate.setDate(fallbackDate.getDate() + 7);
          setStartDate(fallbackDate);
        }
        
        if (!isNaN(departureDate.getTime()) && departureDate.getTime() > 0) {
          setEndDate(departureDate);
        } else {
          console.error('离开日期计算失败，使用默认日期');
          const fallbackDate = new Date();
          fallbackDate.setDate(fallbackDate.getDate() + 7 + duration);
          setEndDate(fallbackDate);
        }
        
        console.log(`跟团游自动设置日期 - 产品天数:${duration}, 到达:${arrivalDate.toDateString()}, 离开:${departureDate.toDateString()}`);
        console.log('产品数据详情:', { duration: tourData.duration, days: tourData.days, nights: tourData.nights });
      }
    }
  }, [tourData, tourType, type]);  // 当产品数据加载时重新计算日期

  useEffect(() => {
    // 重置API调用计数器
    hotelPriceApiCallCountRef.current = 0;
    
    return () => {
      // 组件卸载时重置状态
      initialLoadRef.current = false;
      isCallingApiRef.current = false;
      
      // 清除可能存在的防抖定时器
      if (priceDebounceTimer) {
        clearTimeout(priceDebounceTimer);
      }
    };
  }, [priceDebounceTimer]);

  useEffect(() => {
    const fetchHotelPrices = async () => {
      // 如果已经加载过，不再重复加载
      if (initialLoadRef.current) {
        console.log("酒店价格已加载，跳过重复请求");
        return;
      }
      
      // 限制API调用次数，避免无限循环
      if (hotelPriceApiCallCountRef.current >= 1) {
        console.log(`已达到酒店价格API调用上限(${hotelPriceApiCallCountRef.current}次)，跳过请求`);
        return;
      }
      
      // 增加API调用计数
      hotelPriceApiCallCountRef.current++;
      console.log(`[初始化] 获取酒店价格列表 - 第${hotelPriceApiCallCountRef.current}次`);
      
      // 标记为已加载
      initialLoadRef.current = true;
      
      if (type === 'group' || tourType === 'group_tour') {
        console.log(`获取酒店价格列表...(第${hotelPriceApiCallCountRef.current}次)`);
        
        try {
          const result = await getHotelPrices().catch(err => {
            console.error('获取酒店价格列表失败:', err);
            return { code: 0, data: [] };
          });
          
          // 检查响应是否成功
          if (result && result.code === 1 && Array.isArray(result.data)) {
            // 处理酒店价格数据
            const validData = result.data.map(hotel => ({
              ...hotel,
              hotelLevel: hotel.hotelLevel ? String(hotel.hotelLevel) : '4星',
              priceDifference: typeof hotel.priceDifference === 'number' ? hotel.priceDifference : 0,
              id: hotel.id || Math.floor(Math.random() * 10000),
              description: hotel.description || `${hotel.hotelLevel || '4星'}酒店`
            }));
            
            setHotelPrices(validData);
            
            // 酒店价格列表已获取，记录日志但不在这里调用价格计算
            console.log('[初始化] 酒店价格列表获取完成');
          } else {
            setHotelPrices([]);
            
            // 即使没有酒店价格数据，也记录日志但不在这里调用价格计算
            console.log('[初始化] 没有酒店价格数据');
          }
        } catch (error) {
          console.error('获取酒店价格列表失败:', error);
          setHotelPrices([]);
        }
      }
      
      // 统一在这里调用一次价格计算API，无论是跟团游还是一日游
      console.log('[初始化] 开始统一价格计算');
      setTimeout(() => {
        console.log('[初始化] 调用统一价格计算API');
        sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
      }, 200);
    };
    
    // 当旅游数据加载完成时，获取酒店价格和初始价格
    if (tourData && id) {
      console.log('🎯 准备调用fetchHotelPrices，参数状态:', {
        tourData: !!tourData,
        id: id,
        type: type,
        tourType: tourType,
        adultCount: adultCount,
        childCount: childCount,
        roomCount: roomCount,
        selectedHotelLevel: selectedHotelLevel
      });
      fetchHotelPrices();
    } else {
      console.log('⚠️ 跳过fetchHotelPrices调用，缺少必要参数:', {
        tourData: !!tourData,
        id: id
      });
    }
  }, [id, tourData, type, tourType]);
  
  // 日期变化时不需要重新计算价格，直接使用产品基础价格
  useEffect(() => {
    if (selectedDate && tourData && (tourType === 'day_tour' || type === 'day')) {
      console.log('日期已变更，使用产品基础价格（无需重新计算）');
    }
  }, [selectedDate]);

  // 跳转到预订页面
  const handleBooking = () => {
    // 如果用户未登录，显示会员弹窗
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // 已登录用户直接执行预订
    handleDirectBooking();
  };



  return (
    <div className="tour-details-page">
      {renderContent()}
      <div id="date-picker-portal" />
      
      {/* 会员弹窗 */}
      <MembershipModal
        show={showLoginModal}
        onHide={() => {
          setShowLoginModal(false);
          setPendingBookingData(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        onGuestContinue={handleGuestContinue}
        message="登录会员使用您在本店的积分，优惠券，余额等"
      />
    </div>
  );
  };
  
  export default TourDetails;