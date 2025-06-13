import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Tab, Nav, Accordion, Button, Badge, Card, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ImageGallery from 'react-image-gallery';
import { Helmet } from 'react-helmet-async';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaLanguage, FaCheck, FaTimes, FaStar, FaStarHalfAlt, FaRegStar, FaPhoneAlt, FaClock, FaInfoCircle, FaQuestionCircle, FaLightbulb, FaUtensils, FaBed, FaHiking, FaChevronDown, FaChevronUp, FaQuoteLeft, FaQuoteRight, FaHotel, FaChild, FaTicketAlt, FaPercent, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getTourById, getGroupTourById, getDayTourById, getAgentDiscountRate, calculateTourDiscount } from '../../utils/api';
import { addToCart } from '../../store/slices/bookingSlice';
import { formatDate, calculateDiscountPrice } from '../../utils/helpers';
import PriceDisplay from '../../components/PriceDisplay';
import CustomerReviews from '../../components/CustomerReviews/CustomerReviews';
import BaiduSEO from '../../components/BaiduSEO/BaiduSEO';
import './tourDetails.css';
import 'react-image-gallery/styles/css/image-gallery.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getHotelPrices, calculateTourPrice } from '../../services/bookingService';

// 导入默认图片
import defaultImage from '../../assets/images/new/1.jpg';

// 日期选择器自定义样式
const datePickerStyles = {
  zIndex: 9999,
  position: 'relative'
};

// 主题色
const themeColor = "#ff6b6b";

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
  const [hotelPrices, setHotelPrices] = useState([]);
  const [hotelPriceDifference, setHotelPriceDifference] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(null);
  const [priceDebounceTimer, setPriceDebounceTimer] = useState(null); // 添加防抖定时器状态
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [childrenAges, setChildrenAges] = useState([]);
  const [showChildAgeInputs, setShowChildAgeInputs] = useState(false);
  
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, userType } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  // 处理阿里云OSS图片URL，解决CORS问题
  const proxyImageUrl = (url) => {
    if (!url) return '';
    
    console.log('处理图片URL:', url);
    
    // 首先尝试直接使用原URL
    return url;
    
    // 如果CORS有问题，可以启用下面的代理服务
    // return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  };
  
  // 处理搜索参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // 调试：打印所有URL参数
    console.log('🔍 当前URL参数:', Object.fromEntries(searchParams));
    console.log('🔍 当前成人数量状态:', { adultCount, selectedAdultCount });
    
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
  
  // 判断是否为代理商
  const isAgent = userType === 'agent' || localStorage.getItem('userType') === 'agent';
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
        console.log('请求已在进行中，跳过重复请求');
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
        const apiTourType = type === 'day' ? 'day' : 'group';
        
        console.log(`获取旅游信息: ID=${tourId}, 类型=${apiTourType}`);
        
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
          console.log(`尝试获取${alternativeType}类型旅游数据...`);
          
          try {
            response = await getTourById(tourId, alternativeType);
            
            if (response && response.data) {
              console.log(`成功使用${alternativeType}类型获取数据`);
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
        console.log('开始处理图片数据:', tourData);
        console.log('图片相关字段检查:', {
          hasImages: tourData?.images,
          imagesLength: tourData?.images?.length,
          hasCoverImage: !!tourData?.coverImage,
          coverImage: tourData?.coverImage
        });
        
        if (tourData && tourData.images && Array.isArray(tourData.images) && tourData.images.length > 0) {
          // 存在多张图片，直接使用后端提供的图片数组
          console.log('处理后端提供的多张图片：', tourData.images.length, '张');
          console.log('图片数组详情:', tourData.images);
          
          const galleryImages = tourData.images.map((img, index) => {
            // 对阿里云OSS图片URL进行处理以解决CORS问题
            const imageUrl = img.image_url ? proxyImageUrl(img.image_url) : '';
            console.log(`处理第${index + 1}张图片:`, img.image_url, '->', imageUrl);
            
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
          console.log(`使用API返回的tourData.tour_type: ${tourData.tour_type}`);
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
          
          console.log(`使用页面状态的类型: ${urlTourType}`);
          
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
        
        console.log('折扣价格计算结果:', discountResult);
        
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
    
    // 构建URL参数
    const params = new URLSearchParams();
    params.append('tourId', id);
    params.append('tourName', tourData.title || tourData.name || '');
    params.append('type', type);
    params.append('adultCount', adultCount);
    params.append('childCount', childCount);
    params.append('roomCount', roomCount); // 确保添加roomCount参数
    
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
                // 使用产品价格（根据用户角色确定）
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

    console.log('导航到预订页面，参数:', params.toString());
    console.log('传递的state数据:', {
      tourId: id,
      tourType: type,
      adultCount: adultCount,
      childCount: childCount,
      roomCount: roomCount, // 确保在state中传递roomCount
      hotelLevel: selectedHotelLevel,
      childrenAges: childrenAges,
      tourDate: selectedDate ? selectedDate.toISOString().split('T')[0] : 
              (startDate ? startDate.toISOString().split('T')[0] : null)
    });
    
    // 根据用户类型决定跳转到哪个页面
    const bookingPath = isAgent ? 
      `/agent-booking/${type === 'group' ? 'group-tours' : 'day-tours'}/${id}?${params.toString()}` :
      `/booking?${params.toString()}`;
    
    console.log('跳转路径:', bookingPath, '用户类型:', { isAgent, userType });
    
    // 导航到预订页面，通过state传递更多详细数据
    navigate(bookingPath, {
      state: {
        tourId: id,
        tourType: type,
        adultCount: adultCount,
        childCount: childCount,
        roomCount: roomCount, // 确保在state中传递roomCount
        childrenAges: childrenAges, // 添加儿童年龄数组
        tourDate: selectedDate ? selectedDate.toISOString().split('T')[0] : 
                (startDate ? startDate.toISOString().split('T')[0] : null),
        bookingOptions: {
          hotelLevel: selectedHotelLevel,
          // 添加其他可能的选项
                totalPrice: (user?.role === 'agent' && tourData?.discountedPrice) ? tourData.discountedPrice : tourData?.price || 0,
      hotelPriceDifference: 0, // 不再动态计算酒店差价
      dailySingleRoomSupplement: 0 // 不再动态计算单房差
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
                    {isAgent && discountedPrice ? (
                      <>
                        <span className="original-price">¥{tourData?.price || 0}</span>
                        <span className="discount-price">¥{discountedPrice}</span>
                      </>
                    ) : (
                      <span className="current-price">¥{tourData?.price || 0}</span>
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
                              {itinerary.map((day, index) => (
                                <Accordion.Item eventKey={index.toString()} key={index}>
                                  <Accordion.Header>
                                    {day.title ? (
                                      <span dangerouslySetInnerHTML={{ __html: day.title }} />
                                    ) : (
                                      <span>第{day.day_number || (index + 1)}天</span>
                                    )}
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <div className="day-details">
                                      {day.des && <p className="day-description">{day.des}</p>}
                                      {day.description && <p className="day-description">{day.description}</p>}
                                      
                                      {day.image && (
                                        <div className="day-image mb-3">
                                          <img src={day.image} alt={`第${day.day_number || (index + 1)}天景点`} className="img-fluid rounded" />
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
                              ))}
                            </Accordion>
                          )}
                        </>
                      ) : (
                        <Alert variant="info">暂无详细行程信息，请联系客服了解详情。</Alert>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="fees">
                      <div className="fees-section">
                        <div className="included-fees mb-4">
                          <h3 className="section-title">费用包含</h3>
                          {inclusions && inclusions.length > 0 ? (
                            <ul className="included-list">
                              {inclusions.map((item, index) => (
                                <li key={index} className="d-flex">
                                  <FaCheck style={{ color: themeColor }} className="mt-1 me-2" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Alert variant="info">暂无费用包含信息，请联系客服了解详情。</Alert>
                          )}
                        </div>
                        
                        <div className="excluded-fees mb-4">
                          <h3 className="section-title">费用不包含</h3>
                          {exclusions && exclusions.length > 0 ? (
                            <ul className="excluded-list">
                              {exclusions.map((item, index) => (
                                <li key={index} className="d-flex">
                                  <FaTimes className="text-danger mt-1 me-2" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Alert variant="info">暂无费用不包含信息，请联系客服了解详情。</Alert>
                          )}
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="location">
                      <h3 className="section-title">地图位置</h3>
                      <div className="map-container">
                        {tourData?.mapLocation ? (
                          <iframe
                            src={tourData.mapLocation}
                            width="100%"
                            height="450"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="地图位置"
                          ></iframe>
                        ) : (
                          <Alert variant="info">暂无地图信息</Alert>
                        )}
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="faq">
                      <h3 className="section-title">常见问题</h3>
                      {faqs && faqs.length > 0 ? (
                        <Accordion className="faq-accordion">
                          {faqs.map((faq, index) => (
                            <Accordion.Item eventKey={index.toString()} key={index}>
                              <Accordion.Header>
                                <div className="d-flex align-items-center">
                                  <FaQuestionCircle className="text-primary me-2" />
                                  <span>{faq.question}</span>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <p>{faq.answer}</p>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      ) : (
                        <Alert variant="info">暂无常见问题信息，请联系客服了解详情。</Alert>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="reviews">
                      <h3 className="section-title">客户评价</h3>
                      <CustomerReviews 
                        tourId={id}
                        tourType={tourType}
                        reviews={reviews}
                        loading={loading}
                      />
                    </Tab.Pane>
                  </Tab.Content>
                </div>
              </Tab.Container>
            </Col>
            
            <Col lg={4}>
              <div className="tour-sidebar">
                {/* 简化的预订卡片 */}
                <div className="modern-booking-card">
                  <div className="booking-card-header">
                    <h3 className="booking-title">价格信息</h3>
                  </div>
                  
                  <div className="booking-card-body">
                    {/* 价格显示 */}
                    <div className="price-section">
                      {loadingDiscount || isPriceLoading ? (
                        <div className="price-loading">
                          <Spinner animation="border" size="sm" />
                          <span>计算价格中...</span>
                        </div>
                      ) : (
                        <div className="price-display">
                          {(() => {
                            // 根据用户角色决定显示的价格
                            let displayPrice = tourData?.price || 0;
                            let originalPrice = tourData?.price || 0;
                            let showDiscount = false;
                            
                            // 中介主号：显示折扣价
                            if (user?.role === 'agent' && tourData?.discountedPrice) {
                              displayPrice = tourData.discountedPrice;
                              showDiscount = true;
                            }
                            // 中介操作号：显示普通用户价格
                            else if (user?.role === 'agent_operator') {
                              displayPrice = tourData?.price || 0;
                              showDiscount = false;
                            }
                            
                            return (
                          <PriceDisplay
                                originalPrice={showDiscount ? originalPrice : null}
                                discountedPrice={displayPrice}
                                showBadge={showDiscount}
                            size="large"
                            isAgent={isAgent}
                          />
                            );
                          })()}
                          
                          {/* 价格说明 */}
                          <div className="price-note">
                            <small className="text-muted">
                              {user?.role === 'agent' && '代理商专享价格，'}
                              {user?.role === 'agent_operator' && '普通用户价格，'}
                              单人起价，最终价格以预订页面为准
                            </small>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 预订按钮 */}
                    <div className="booking-actions">
                      {isAuthenticated ? (
                        <Button 
                          className="book-now-btn"
                          size="lg" 
                          onClick={() => {
                            // 简化的预订跳转，使用默认参数
                            const params = new URLSearchParams();
                            params.append('tourId', id);
                            params.append('tourName', tourData.title || tourData.name || '');
                            params.append('type', type);
                            params.append('adultCount', 1); // 默认1人
                            params.append('childCount', 0); // 默认0儿童
                            params.append('roomCount', 1); // 默认1间房
                            
                            if (tourData.price) {
                              params.append('price', tourData.price);
                            }
                            
                            navigate(`/booking?${params.toString()}`);
                          }}
                        >
                          立即预订
                        </Button>
                      ) : (
                        <Button 
                          className="book-now-btn"
                          size="lg" 
                          onClick={() => {
                            // 未登录用户跳转到登录页
                            const loginState = {
                              from: `/tours/${type}/${id}`,
                              message: "请先登录后再进行预订"
                            };
                            navigate('/login', { state: loginState });
                          }}
                        >
                          立即预订
                        </Button>
                      )}
                      
                      
                    </div>
                  </div>
                </div>

                {/* 帮助卡片 */}
                <div className="help-card">
                  <div className="help-card-header">
                    <h5>需要帮助?</h5>
                  </div>
                  <div className="help-card-body">
                    <div className="contact-info">
                      <div className="phone-contact">
                        <FaPhoneAlt className="contact-icon" />
                        <div>
                          <div className="phone-number">400-123-4567</div>
                          <small>周一至周日 9:00-18:00</small>
                        </div>
                      </div>
                    </div>
                    <div className="help-actions">
                      <Button variant="outline-primary" size="sm">在线咨询</Button>
                      <Button variant="outline-primary" size="sm">邮件咨询</Button>
                    </div>
                  </div>
                </div>
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
  
  // 向后端发送参数的简化函数
  const sendParamsToBackend = (adults, children, rooms, hotelLevel, ages = childrenAges) => {
    // 如果已经在调用API，避免重复调用
    if (isCallingApiRef.current) {
      console.log('API调用进行中，跳过重复请求');
      return;
    }
    
    // 设置API调用状态
    isCallingApiRef.current = true;
    
    // 设置价格加载状态
    setIsPriceLoading(true);
    
    // 生成唯一请求ID
    const requestId = Math.random().toString(36).substring(7);
    
    const requestTourId = id;
    const requestTourType = type === 'group' ? 'group_tour' : 'day_tour';
    const requestAdultCount = parseInt(adults, 10) || 1;
    const requestChildCount = parseInt(children, 10) || 0;
    const requestRoomCount = parseInt(rooms, 10) || 1;
    const requestHotelLevel = hotelLevel || selectedHotelLevel || '4星';
    
    // 确保儿童年龄数组长度与儿童数量匹配
    let validAges = ages || [];
    if (requestChildCount > 0) {
      // 如果儿童数量大于年龄数组长度，用默认年龄填充
      while (validAges.length < requestChildCount) {
        validAges.push(8); // 默认8岁
      }
      // 如果年龄数组长度大于儿童数量，截取
      if (validAges.length > requestChildCount) {
        validAges = validAges.slice(0, requestChildCount);
      }
    } else {
      // 如果没有儿童，清空年龄数组
      validAges = [];
    }
    
    console.log(`🔢 [${requestId}] 发送参数给后端:`, {
      产品ID: requestTourId,
      产品类型: requestTourType,
      成人数量: requestAdultCount,
      儿童数量: requestChildCount,
      酒店等级: requestHotelLevel,
      房间数量: requestRoomCount,
      儿童年龄: validAges.join(','),
      原始成人参数: adults,
      总人数: requestAdultCount + requestChildCount
    });
    
    // 直接使用计算接口
    const fetchPrice = async () => {
      try {
        const priceData = await calculateTourPrice(
          requestTourId,
          requestTourType,
          requestAdultCount,
          requestChildCount,
          requestHotelLevel,
          null, // agentId - 从用户状态获取
          requestRoomCount,
          null, // userId - 从用户状态获取
          validAges // 经过验证的儿童年龄数组
        );
        
        console.log(`[${requestId}] 价格计算结果:`, priceData);
        
        // 价格计算已移除，直接使用产品基础价格
        console.log(`[${requestId}] 使用产品基础价格，无需动态计算`);
      } catch (error) {
        console.error(`[${requestId}] 价格计算出错:`, error);
          // 使用产品基础价格，无需设置状态
      } finally {
        // 清除加载状态
        setIsPriceLoading(false);
        // 重置API调用状态
        isCallingApiRef.current = false;
      }
    };
    
    // 执行API调用
    fetchPrice();
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
    // 记录组件挂载和卸载
    console.log("TourDetails组件已挂载");
    // 重置API调用计数器
    hotelPriceApiCallCountRef.current = 0;
    
    return () => {
      console.log("TourDetails组件已卸载");
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
            
            // 酒店价格列表已获取，不需要额外价格计算
            console.log('[初始化] 酒店价格列表获取完成，使用产品基础价格');
          } else {
            setHotelPrices([]);
            
            // 使用产品基础价格，不需要额外计算
            console.log('[初始化] 使用产品基础价格');
          }
        } catch (error) {
          console.error('获取酒店价格列表失败:', error);
          setHotelPrices([]);
          
          // 使用产品基础价格，不需要额外计算
          console.log('[初始化] 获取酒店价格失败，使用产品基础价格');
        }
      } else if (tourData) {
        // 对于一日游，直接使用产品基础价格
        console.log('[初始化] 一日游使用产品基础价格');
      }
    };
    
    // 当旅游数据加载完成时，获取酒店价格和初始价格
    if (tourData && id) {
      fetchHotelPrices();
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
    // 如果用户未登录，先跳转到登录页面
    if (!isAuthenticated) {
      const redirectPath = `/tours/${id}`;
      navigate('/auth/login', { state: { from: redirectPath } });
      return;
    }
    
    const bookingData = {
      tourId: id,
      tourName: tourData?.title,
      tourDate: selectedDate,
      adultCount: adultCount,
      childCount: childCount,
      roomCount: roomCount,
      childrenAges: childrenAges, // 添加儿童年龄数组
      bookingOptions: {
        hotelLevel: selectedHotelLevel,
        pickupLocation: '',
      }
    };
    
    // 跳转到预订页面
    navigate(`/booking?tourId=${id}&type=${type || tourType}`, { state: bookingData });
  };

  return (
    <div className="tour-details-page">
      {renderContent()}
      <div id="date-picker-portal" />
    </div>
  );
  };
  
  export default TourDetails;