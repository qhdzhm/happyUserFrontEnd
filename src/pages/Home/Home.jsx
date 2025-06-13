import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import LandingBanner from "../../components/Banner/LandingBanner";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import "./home.css";
import "./home-tours-redesign.css";
import "./scroll-animations.css";

import Gallery from "../../components/Gallery/Gallery";
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaArrowRight, FaChevronLeft, FaChevronRight, FaSearch, FaQuoteRight, FaShoppingCart, FaEye, FaTimes, FaArrowUp } from 'react-icons/fa';
import { MdLocationOn, MdDateRange, MdPeople } from 'react-icons/md';
import * as api from '../../utils/api';
import PriceDisplay from '../../components/PriceDisplay';
import { useSelector } from 'react-redux';
import RedesignedCard from "../../components/Cards/RedesignedCard";

// 导入图片
import themeNature from "../../assets/images/new/1.jpg";
import themeBeach from "../../assets/images/new/2.jpg";
import themeCulture from "../../assets/images/new/3.jpg";
import themeFood from "../../assets/images/new/4.jpg";
import logoImage from "../../assets/login/logo.png";

const Home = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // 各类型旅游产品的状态
  const [dayTours, setDayTours] = useState([]);
  const [groupTours, setGroupTours] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]);
  const [hotTours, setHotTours] = useState([]);
  
  // 加载状态
  const [loading, setLoading] = useState({
    dayTours: true,
    groupTours: true,
    hotTours: false,
    recommendedTours: false
  });
  
  // 全局初始化加载状态 - 新增
  const [initialLoading, setInitialLoading] = useState(true);
  
  // 错误状态
  const [error, setError] = useState({
    dayTours: null,
    groupTours: null,
    hotTours: null,
    recommendedTours: null
  });
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchClicked, setSearchClicked] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  
  // 添加安全检查，确保 state.user 存在
  const userState = useSelector((state) => state.user) || {};
  const { preferences = { theme: 'light' } } = userState;
  const { isAuthenticated } = useSelector(state => state.auth);
  const currentTheme = preferences?.theme || 'light';

  const [discountPrices, setDiscountPrices] = useState({});
  
  // 新增：当前显示的目的地索引
  const [activeDayTourIndex, setActiveDayTourIndex] = useState(0);
  const [activeGroupTourIndex, setActiveGroupTourIndex] = useState(0);
  
  // 添加滚动监听相关状态 - 默认设置为true以确保内容显示
  const [sectionAnimations, setSectionAnimations] = useState({
    banner: false,
    dayTours: false,
    groupTours: false,
    callUs: false,
    testimonials: false,
    gallery: false
  });
  
  const dayToursRef = useRef(null);
  const groupToursRef = useRef(null);
  
  // 添加滚动位置状态
  const [scrollPosition, setScrollPosition] = useState(0);
  // 添加当前位置部分状态
  const [currentSection, setCurrentSection] = useState('顶部');
  // 添加滚动百分比状态
  const [scrollPercentage, setScrollPercentage] = useState(0);
  // 添加显示/隐藏滚动监视器状态
  const [showScrollMonitor, setShowScrollMonitor] = useState(false);
  // 添加显示/隐藏回到顶部按钮状态
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // 添加各部分的refs
  const bannerRef = useRef(null);
  const callUsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const galleryRef = useRef(null);
  
  // 添加新的状态来跟踪哪些卡片应该可见
  const [visibleCards, setVisibleCards] = useState({
    dayTours: [],
    groupTours: []
  });
  
  // 跳转到预订页面
  const handleBookNow = (tour, type) => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: `/tours/${tour.id}`, 
          message: "请先登录再进行预订"
        }
      });
      return;
    }
    
    // 准备预订参数
    const params = new URLSearchParams();
    params.append('tourId', tour.id);
    params.append('tourName', tour.name || tour.title || '');
    params.append('type', type);
    params.append('price', tour.price);
    
    navigate(`/booking?${params.toString()}`);
  };
  
  // 跳转到详情页面
  const handleViewDetails = (tour, type) => {
    if (type === 'day') {
      navigate(`/day-tours/${tour.id}`);
    } else {
      navigate(`/group-tours/${tour.id}`);
    }
  };
  
  // 修改useEffect
  useEffect(() => {
    // 获取一日游数据
    const fetchDayTours = async () => {
      console.log('开始获取一日游数据...');
      setLoading(prev => ({ ...prev, dayTours: true }));
      setError(prev => ({ ...prev, dayTours: null }));
      
      try {
        const response = await api.getAllDayTours({ _source: 'home' });
        console.log('一日游API响应:', response);
        console.log('一日游API响应类型:', typeof response);
        console.log('一日游API响应code:', response?.code);
        console.log('一日游API响应data:', response?.data);
        console.log('一日游API响应data类型:', typeof response?.data);
        
        // 处理响应数据
        if (response && response.code === 1 && response.data) {
          // 从 response.data 中获取 records
          const records = response.data.records || response.data;
          console.log('一日游records:', records);
          console.log('一日游records类型:', typeof records);
          console.log('一日游records是否为数组:', Array.isArray(records));
          console.log('一日游records长度:', records?.length);
          
          if (Array.isArray(records) && records.length > 0) {
            setDayTours(records);
            console.log('成功设置一日游数据:', records.length, '条');
            
            // 如果是代理商，获取折扣价格
            const userType = localStorage.getItem('userType');
            const agentId = localStorage.getItem('agentId');
            if (userType === 'agent' && agentId) {
              try {
                // 为第一个产品获取折扣价格，确保API调用
                if (records[0] && records[0].price) {
                  console.log('执行单一折扣计算，确保API调用');
                  const discountResult = await api.calculateTourDiscount({
                    tourId: records[0].id,
                    tourType: 'day-tour',
                    originalPrice: records[0].price,
                    agentId: agentId
                  });
                  console.log('折扣计算结果:', discountResult);
                  
                  // 更新折扣价格状态
                  setDiscountPrices(prev => ({
                    ...prev,
                    [records[0].id]: discountResult.discountedPrice
                  }));
                }
              } catch (discountError) {
                console.error('获取折扣价格失败:', discountError);
              }
            }
          } else {
            console.warn("API返回的一日游数据为空或不是数组");
            console.warn("实际数据:", records);
            setDayTours([]);
          }
        } else {
          console.warn("一日游API返回错误", response);
          console.warn("检查条件: response存在?", !!response, "code===1?", response?.code === 1, "data存在?", !!response?.data);
          setDayTours([]);
        }
      } catch (err) {
        console.error("获取一日游失败:", err);
        setDayTours([]);
        setError(prev => ({ ...prev, dayTours: "获取一日游数据失败" }));
      } finally {
        setLoading(prev => ({ ...prev, dayTours: false }));
      }
    };

    // 获取跟团游数据
    const fetchGroupTours = async () => {
      console.log('开始获取跟团游数据...');
      setLoading(prev => ({ ...prev, groupTours: true }));
      setError(prev => ({ ...prev, groupTours: null }));
      
      try {
        const response = await api.getAllGroupTours({ _source: 'home' });
        console.log('跟团游API响应:', response);
        console.log('跟团游API响应类型:', typeof response);
        console.log('跟团游API响应code:', response?.code);
        console.log('跟团游API响应data:', response?.data);
        console.log('跟团游API响应data类型:', typeof response?.data);
        
        // 处理响应数据
        if (response && response.code === 1 && response.data) {
          // 从 response.data 中获取 records
          const records = response.data.records || response.data;
          console.log('跟团游records:', records);
          console.log('跟团游records类型:', typeof records);
          console.log('跟团游records是否为数组:', Array.isArray(records));
          console.log('跟团游records长度:', records?.length);
          
          if (Array.isArray(records) && records.length > 0) {
            setGroupTours(records);
            console.log('成功设置跟团游数据:', records.length, '条');
          } else {
            console.warn("API返回的跟团游数据为空或不是数组");
            console.warn("实际数据:", records);
            setGroupTours([]);
          }
        } else {
          console.warn("跟团游API返回错误", response);
          console.warn("检查条件: response存在?", !!response, "code===1?", response?.code === 1, "data存在?", !!response?.data);
          setGroupTours([]);
        }
      } catch (err) {
        console.error("获取跟团游失败:", err);
        setGroupTours([]);
        setError(prev => ({ ...prev, groupTours: "获取跟团游数据失败" }));
      } finally {
        setLoading(prev => ({ ...prev, groupTours: false }));
      }
    };

    // 获取热门旅游数据
    const fetchHotTours = async () => {
      console.log('开始获取热门旅游数据...');
      setLoading(prev => ({ ...prev, hotTours: true }));
      setError(prev => ({ ...prev, hotTours: null }));
      
      try {
        const response = await api.getHotTours(6);
        console.log('热门旅游API响应:', response);
        
        // Spring Boot返回的数据结构是 { code, msg, data }
        if (response && response.code === 1) {
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            setHotTours(data);
            console.log('成功设置热门旅游数据:', data.length, '条');
          } else {
            console.warn("API返回的热门旅游数据为空");
            setHotTours([]);
          }
        } else {
          console.warn("热门旅游API返回错误", response);
          setHotTours([]);
        }
      } catch (err) {
        console.error("获取热门旅游失败:", err);
        setHotTours([]);
        setError(prev => ({ ...prev, hotTours: "获取热门旅游数据失败" }));
      } finally {
        setLoading(prev => ({ ...prev, hotTours: false }));
      }
    };

    // 获取推荐旅游数据
    const fetchRecommendedTours = async () => {
      console.log('开始获取推荐旅游数据...');
      setLoading(prev => ({ ...prev, recommendedTours: true }));
      setError(prev => ({ ...prev, recommendedTours: null }));
      
      try {
        const response = await api.getRecommendedTours(6);
        console.log('推荐旅游API响应:', response);
        
        // Spring Boot返回的数据结构是 { code, msg, data }
        if (response && response.code === 1) {
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            setRecommendedTours(data);
            console.log('成功设置推荐旅游数据:', data.length, '条');
          } else {
            console.warn("API返回的推荐旅游数据为空");
            setRecommendedTours([]);
          }
        } else {
          console.warn("推荐旅游API返回错误", response);
          setRecommendedTours([]);
        }
      } catch (err) {
        console.error("获取推荐旅游失败:", err);
        setRecommendedTours([]);
        setError(prev => ({ ...prev, recommendedTours: "获取推荐旅游数据失败" }));
      } finally {
        setLoading(prev => ({ ...prev, recommendedTours: false }));
      }
    };

    // 立即开始所有数据获取
    fetchDayTours();
    fetchGroupTours();
    fetchHotTours();
    fetchRecommendedTours();
  }, []);

  // 滚动监听函数，用于触发动画和检测当前部分
  useEffect(() => {
    // 确保组件始终能显示，不依赖于滚动
    console.log("首页内容区域已加载");
    
    // 添加滚动监听
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      
      // 更新滚动位置
      setScrollPosition(scrollTop);
      
      // 计算滚动百分比
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setScrollPercentage(Math.min(scrollPercent, 100));
      
      // 设置是否显示回到顶部按钮
      setShowBackToTop(scrollTop > 400);
      
      // 检查各部分是否进入视图，并设置对应的动画状态
      const checkElementInView = (element, offset = 150) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= windowHeight - offset;
      };
      
      // 更新各部分的显示状态
      setSectionAnimations({
        banner: checkElementInView(bannerRef.current, 0),
        dayTours: checkElementInView(dayToursRef.current),
        groupTours: checkElementInView(groupToursRef.current),
        callUs: checkElementInView(callUsRef.current),
        testimonials: checkElementInView(testimonialsRef.current),
        gallery: checkElementInView(galleryRef.current)
      });
      
      // 检测每个卡片是否应该可见
      if (dayToursRef.current) {
        const cards = dayToursRef.current.querySelectorAll('.destination-card');
        const newVisibleDayTours = [];
        
        cards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          if (rect.top <= windowHeight - 100) {
            newVisibleDayTours.push(index);
          }
        });
        
        setVisibleCards(prev => ({
          ...prev,
          dayTours: newVisibleDayTours
        }));
      }
      
      if (groupToursRef.current) {
        const cards = groupToursRef.current.querySelectorAll('.destination-card');
        const newVisibleGroupTours = [];
        
        cards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          if (rect.top <= windowHeight - 100) {
            newVisibleGroupTours.push(index);
          }
        });
        
        setVisibleCards(prev => ({
          ...prev,
          groupTours: newVisibleGroupTours
        }));
      }
      
      // 更新当前部分
      if (checkElementInView(bannerRef.current, 0) && scrollTop < 200) {
        setCurrentSection('顶部');
      } else if (checkElementInView(dayToursRef.current) && !checkElementInView(groupToursRef.current)) {
        setCurrentSection('一日游');
      } else if (checkElementInView(groupToursRef.current) && !checkElementInView(callUsRef.current)) {
        setCurrentSection('多日游');
      } else if (checkElementInView(callUsRef.current) && !checkElementInView(testimonialsRef.current)) {
        setCurrentSection('联系我们');
      } else if (checkElementInView(testimonialsRef.current) && !checkElementInView(galleryRef.current)) {
        setCurrentSection('用户评价');
      } else if (checkElementInView(galleryRef.current)) {
        setCurrentSection('画廊');
      }
    };
    
    // 处理窗口大小变化
    const handleResize = () => {
      // 窗口大小变化时重新计算滚动位置
      handleScroll();
    };
    
    // 使用多种方法添加滚动事件监听器以确保兼容性
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // 初始调用一次来设置初始值
    handleScroll();
    
    // 添加一个短暂延迟后再次检查，以确保在所有元素加载完毕后获取正确的位置
    const initialCheckTimeout = setTimeout(() => {
      handleScroll();
      console.log("初始化延迟检查滚动位置");
    }, 1000);
    
    // 添加定时器定期检查滚动位置，以防事件监听器失效
    const scrollCheckInterval = setInterval(handleScroll, 500);
    
    return () => {
      // 清理代码...
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialCheckTimeout);
      clearInterval(scrollCheckInterval);
    };
  }, []);

  // 滚动到顶部函数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // 强制更新滚动位置函数
  const forceUpdateScrollPosition = () => {
    const position = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    setScrollPosition(position);
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = documentHeight - windowHeight;
    const percentage = maxScroll > 0 ? Math.round((position / maxScroll) * 100) : 0;
    setScrollPercentage(percentage);
    
    console.log("手动检测 - 当前滚动位置:", position, "滚动百分比:", percentage + "%");
  };

  // 加载指示器
  const LoadingSpinner = () => (
    <div className="text-center my-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2">正在加载数据...</p>
    </div>
  );

  // 错误显示
  const ErrorMessage = ({ message }) => (
    <div className="text-center my-5 text-danger">
      <p>{message || "加载数据时发生错误，显示本地数据。"}</p>
    </div>
  );

  // 根据滚动百分比计算颜色
  const getProgressColor = () => {
    // 从绿色过渡到红色
    const green = Math.round(255 * (100 - scrollPercentage) / 100);
    const red = Math.round(255 * scrollPercentage / 100);
    return `rgb(${red}, ${green}, 0)`;
  };

  // 定义动画样式
  const getAnimationStyle = (sectionKey) => {
    // 如果该部分动画已激活，返回激活的样式
    if (sectionAnimations[sectionKey]) {
      return {
        opacity: 1,
        transform: 'translateY(0)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '0.8s',
        transitionTimingFunction: 'ease-out'
      };
    }
    // 否则返回初始样式（隐藏并向下偏移）
    return {
      opacity: 0,
      transform: 'translateY(50px)',
      transitionProperty: 'opacity, transform',
      transitionDuration: '0.8s',
      transitionTimingFunction: 'ease-out'
    };
  };
  
  // 定义不同的动画样式
  const getSpecialAnimationStyle = (sectionKey, index = 0, type = 'fade') => {
    // 如果该部分动画未激活，返回初始隐藏状态
    if (!sectionAnimations[sectionKey]) {
      // 根据类型返回不同的初始样式
      switch (type) {
        case 'fade': 
          return { 
            opacity: 0,
            transform: 'translateY(50px)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.8s',
            transitionTimingFunction: 'ease-out'
          };
        case 'slide-left':
          return {
            opacity: 0,
            transform: 'translateX(-100px)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.8s',
            transitionTimingFunction: 'ease-out'
          };
        case 'slide-right':
          return {
            opacity: 0,
            transform: 'translateX(100px)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.8s',
            transitionTimingFunction: 'ease-out'
          };
        case 'scale':
          return {
            opacity: 0,
            transform: 'scale(0.8)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.8s',
            transitionTimingFunction: 'ease-out'
          };
        case 'rotate':
          return {
            opacity: 0,
            transform: 'rotate(-10deg) scale(0.9)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.8s',
            transitionTimingFunction: 'ease-out'
          };
        default:
          return {
            opacity: 0,
            transform: 'translateY(50px)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '0.8s',
            transitionTimingFunction: 'ease-out'
          };
      }
    }
    
    // 激活状态的样式（所有类型的最终状态都是一样的，只是初始状态不同）
    return {
      opacity: 1,
      transform: 'translateY(0) translateX(0) rotate(0) scale(1)',
      transitionProperty: 'opacity, transform',
      transitionDuration: '0.8s',
      transitionTimingFunction: 'ease-out',
      transitionDelay: `${index * 0.1}s`
    };
  };

  // 修改卡片渲染时添加visible类
  const renderDestinationCard = (tour, index, type) => {
    // 检查该卡片是否应该可见
    const isVisible = type === 'day' 
      ? visibleCards.dayTours.includes(index)
      : visibleCards.groupTours.includes(index);
    
    // 根据category确定对应的CSS类名
    const getCategoryClass = (category) => {
      if(!category) return 'cultural';
      
      const categoryMap = {
        '自然风光': 'nature',
        '文化体验': 'cultural',
        '历史遗迹': 'history',
        '美食体验': 'food',
        '城市观光': 'city',
        '探险活动': 'adventure'
      };
      
      return categoryMap[category] || 'cultural';
    };
    
    // 移除额外标签功能
    // const getExtraTags = (tour) => {
    //   const tags = [];
    //   
    //   // 根据价格或其他属性添加额外标签
    //   if (tour.price > 1000) {
    //     tags.push('RELAX');
    //   }
    //   
    //   return tags;
    // };
    
    // const extraTags = getExtraTags(tour);
    
    return (
      <Col xs={12} md={6} lg={4} key={tour.id || index} className="mb-4">
        <div className={`destination-card ${isVisible ? 'visible' : ''}`}>
          <div className="destination-image">
            <img src={tour.coverImage || themeNature} alt={tour.name || tour.title || "目的地"} />
          </div>
          <div className="destination-content">
            <h3 className="destination-title">{tour.name || tour.title || "旅游目的地"}</h3>
            <div className="destination-location">
              <MdLocationOn /> {tour.location || tour.destination || "塔斯马尼亚"}
            </div>
            <div className="destination-divider"></div>
            {/* 移除标签显示部分 */}
            {/* <div className="destination-tags">
              <span className="tag">
                {tour.category ? tour.category.toUpperCase() : "CULTURAL"}
              </span>
            </div> */}
            <div className="destination-price">
              <div className="price-value">
                ${tour.price || 1100}
              </div>
            </div>
            <p className="destination-description">
              {tour.description || tour.overview || "探索塔斯马尼亚西海岸的自然奇观和历史遗迹。这里有壮丽的山脉、清澈的湖泊和丰富的野生动物，适合热爱自然和文化的旅行者。"}
            </p>
            <button 
              className="details-btn" 
              onClick={() => handleViewDetails(tour, type)}
            >
              详情
            </button>
          </div>
        </div>
      </Col>
    );
  };

  // 检查关键数据是否加载完成
  useEffect(() => {
    // 只有当一日游和跟团游数据都加载完成（无论成功还是失败）时，才认为初始化完成
    if (!loading.dayTours && !loading.groupTours) {
      console.log('首页关键数据加载完成，切换到主页内容');
      setInitialLoading(false);
    }
  }, [loading.dayTours, loading.groupTours]);

  // 全局加载组件
  const GlobalLoader = () => (
    <div className="global-loader">
      <div className="loader-container">
        <div className="loader-logo-container">
          <img 
            src={logoImage} 
            alt="Happy Tassie Travel" 
            className="loader-logo"
          />
          <div className="loader-spinner-ring"></div>
        </div>
        <h3 className="loader-title">Happy Tassie Travel</h3>
        <p className="loader-text">正在加载精彩内容...</p>
        <div className="loader-progress">
          <div className="loader-progress-bar"></div>
        </div>
      </div>
    </div>
  );

  // 如果还在初始化加载，使用Portal将加载器渲染到body
  if (initialLoading) {
    return createPortal(<GlobalLoader />, document.body);
  }

  return (
    <>
      {/* Banner部分 */}
      <div className="banner-section" ref={bannerRef}>
        <LandingBanner 
          dayTours={dayTours}
          groupTours={groupTours}
          loading={loading.dayTours || loading.groupTours}
        />
        {/* 回到顶部按钮 */}
        {showBackToTop && (
          <button 
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              fontSize: '20px'
            }}
          >
            <FaArrowUp />
          </button>
        )}
      </div>
      
      <div className="home-content">
        

        {/* 热门跟团游部分 */}
        <section className="group-tours-section section-padding bg-light" ref={groupToursRef}>
          <Container>
            <Row>
              <Col>
                <div 
                  className="section-header mb-4" 
                  style={getSpecialAnimationStyle('groupTours', 0, 'slide-left')}
                >
                  <h2 className="section-title">塔斯马尼亚精选多日游</h2>
                  <div className="section-subtitle">深度体验塔斯马尼亚多日游行程</div>
                </div>
              </Col>
            </Row>
            <Row>
              {error.groupTours ? (
                <Col><ErrorMessage message={error.groupTours} /></Col>
              ) : loading.groupTours ? (
                <Col><LoadingSpinner /></Col>
              ) : groupTours.length === 0 ? (
                <Col><div className="no-data-message">暂无跟团游数据</div></Col>
              ) : (
                groupTours.map((tour, index) => renderDestinationCard(tour, index, 'group'))
              )}
            </Row>
          </Container>
        </section>
        {/* 精彩一日游部分 */}
        <section className="day-tours-section section-padding" ref={dayToursRef}>
          <Container>
            <Row>
              <Col>
                <div 
                  className="section-header mb-4" 
                  style={getSpecialAnimationStyle('dayTours', 0, 'slide-right')}
                >
                  <h2 className="section-title">塔斯马尼亚精彩一日游</h2>
                  <div className="section-subtitle">探索塔斯马尼亚最受欢迎的一日游线路</div>
                </div>
              </Col>
            </Row>
            <Row>
              {error.dayTours ? (
                <Col><ErrorMessage message={error.dayTours} /></Col>
              ) : loading.dayTours ? (
                <Col><LoadingSpinner /></Col>
              ) : dayTours.length === 0 ? (
                <Col><div className="no-data-message">暂无一日游数据</div></Col>
              ) : (
                dayTours.map((tour, index) => renderDestinationCard(tour, index, 'day'))
              )}
            </Row>
          </Container>
        </section>

        {/* 联系我们部分 */}
        <section className="call_us" ref={callUsRef}>
          <Container>
            <Row className="align-items-center">
              <Col 
                md="8"
                style={getSpecialAnimationStyle('callUs', 0, 'slide-right')}
              >
                <div className="section-title">
                  <h5 className="title">开启旅程</h5>
                  <h2 className="heading">准备好一场难忘的旅行了吗？</h2>
                  <p className="text">塔斯马尼亚拥有澳大利亚最美丽的自然风光，让我们带您领略这片净土的魅力，创造终生难忘的回忆。</p>
                </div>
              </Col>
              <Col 
                md="4" 
                className="text-center mt-3 mt-md-0"
                style={getSpecialAnimationStyle('callUs', 1, 'scale')}
              >
                <a
                  href="tel:6398312365"
                  className="secondary_btn bounce"
                  rel="no"
                >
                  联系我们
                </a>
              </Col>
            </Row>
          </Container>
          <div className="overlay"></div>
        </section>
        
        {/* 客户评价部分 */}
        <section className="testimonials-redesigned" ref={testimonialsRef}>
          <div className="testimonial-bg-element bg-element-1"></div>
          <div className="testimonial-bg-element bg-element-2"></div>
          <Container>
            <Row>
              <Col>
                <div 
                  className="section-header"
                  style={getSpecialAnimationStyle('testimonials', 0, 'scale')}
                >
                  <h2 className="section-title">客户评价</h2>
                  <div className="section-subtitle">听听我们的客户怎么说</div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col 
                md={4} 
                className="mb-4"
                style={getSpecialAnimationStyle('testimonials', 1, 'rotate')}
              >
                <div className="testimonial-card-redesigned animate-testimonial">
                  <div className="card-body">
                    <div className="testimonial-quote-icon">
                      <FaQuoteRight />
                    </div>
                    <div className="testimonial-rating-redesigned">
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                    </div>
                    <p className="testimonial-text-redesigned">
                      "我和家人参加了酒杯湾一日游，风景太美了！导游非常专业，给我们介绍了很多当地的历史和文化，让这次旅行变得更加难忘。强烈推荐给想要深度体验塔斯马尼亚的游客。"
                    </p>
                    <div className="testimonial-author-redesigned">
                      <div className="testimonial-author-avatar">
                        王
                      </div>
                      <div className="testimonial-author-info-redesigned">
                        <div className="testimonial-author-name">王先生</div>
                        <div className="testimonial-author-location">来自上海</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col 
                md={4} 
                className="mb-4"
                style={getSpecialAnimationStyle('testimonials', 2, 'scale')}
              >
                <div className="testimonial-card-redesigned animate-testimonial">
                  <div className="card-body">
                    <div className="testimonial-quote-icon">
                      <FaQuoteRight />
                    </div>
                    <div className="testimonial-rating-redesigned">
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                    </div>
                    <p className="testimonial-text-redesigned">
                      "塔斯马尼亚五日游超出了我的期望！住宿、餐饮都安排得很好，行程紧凑但不赶，让我们有足够的时间欣赏每个景点。尤其是摇篮山，太美了，以后有机会还想再去！"
                    </p>
                    <div className="testimonial-author-redesigned">
                      <div className="testimonial-author-avatar">
                        李
                      </div>
                      <div className="testimonial-author-info-redesigned">
                        <div className="testimonial-author-name">李女士</div>
                        <div className="testimonial-author-location">来自北京</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col 
                md={4} 
                className="mb-4"
                style={getSpecialAnimationStyle('testimonials', 3, 'rotate')}
              >
                <div className="testimonial-card-redesigned animate-testimonial">
                  <div className="card-body">
                    <div className="testimonial-quote-icon">
                      <FaQuoteRight />
                    </div>
                    <div className="testimonial-rating-redesigned">
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                      <FaStar className="star" />
                    </div>
                    <p className="testimonial-text-redesigned">
                      "作为一个摄影爱好者，我参加了摇篮山跟团游，导游知道我对摄影感兴趣，特意带我们去了几个绝佳的拍摄点。服务非常贴心，行程安排也很合理，让我拍到了很多满意的照片。"
                    </p>
                    <div className="testimonial-author-redesigned">
                      <div className="testimonial-author-avatar">
                        张
                      </div>
                      <div className="testimonial-author-info-redesigned">
                        <div className="testimonial-author-name">张先生</div>
                        <div className="testimonial-author-location">来自广州</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
        
        {/* 精彩瞬间部分 */}
        <section className="gallery-redesigned" ref={galleryRef}>
          <div className="gallery-bg-element bg-element-1"></div>
          <div className="gallery-bg-element bg-element-2"></div>
          <Container>
            <Row>
              <Col>
                <div 
                  className="section-header"
                  style={getSpecialAnimationStyle('gallery', 0, 'slide-left')}
                >
                  <h2 className="section-title">精彩瞬间</h2>
                  <div className="section-subtitle">记录塔斯马尼亚的美丽风光与难忘时刻</div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col 
                md="12"
                style={getSpecialAnimationStyle('gallery', 1, 'fade')}
              >
                <Gallery />
              </Col>
            </Row>
          </Container>
        </section>
      </div>
    </>
  );
};

export default Home;
