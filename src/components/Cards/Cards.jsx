import React, { useEffect, useState, useRef, useCallback } from "react";
import "./cards.css";
import { NavLink, useNavigate } from "react-router-dom";
import { FaStar, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaShoppingCart } from 'react-icons/fa';
import { BsClock, BsTag } from 'react-icons/bs';
import { calculateTourDiscount } from "../../utils/api";
import { getImageUrl } from "../../utils/imageUtils";
import { useSelector } from 'react-redux';
import { isOperator } from '../../utils/auth';

// 组件内折扣价格请求的随机延迟时间范围
const MIN_REQUEST_DELAY = 300; // 最小延迟时间(毫秒)
const MAX_REQUEST_DELAY = 2000; // 最大延迟时间(毫秒)

// 生成随机延迟时间
const getRandomDelay = () => {
  return MIN_REQUEST_DELAY + Math.random() * (MAX_REQUEST_DELAY - MIN_REQUEST_DELAY);
};

const Cards = ({destination}) => {
  const navigate = useNavigate();
  const [discountPrice, setDiscountPrice] = useState(destination.discountPrice);
  const [loading, setLoading] = useState(false);
  const isAgent = localStorage.getItem('userType') === 'agent';
  const agentId = localStorage.getItem('agentId');
  const requestInProgressRef = useRef(false);
  // 图片加载状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  // 请求计时器引用
  const timerRef = useRef(null);
  const { isAuthenticated } = useSelector(state => state.auth);

  // 获取折扣价格的函数(使用useCallback以避免不必要的重新创建)
  const fetchDiscountPrice = useCallback(async () => {
    // 如果不是代理商或没有代理商ID，或者是操作员，不计算折扣价格
    if (!isAgent || !agentId || requestInProgressRef.current || isOperator()) return;
    
    try {
      // 获取旅游信息
      const tourId = destination.id;
      let tourType = destination.type || 'day-tour';
      const originalPrice = destination.price;

      // 确保所有必要字段都存在
      if (!tourId || !tourType || !originalPrice) {
        return;
      }
      
      // 设置加载状态
      setLoading(true);
      requestInProgressRef.current = true;

      // 确定API所需的tourType
      let apiTourType = 'day'; // 默认值
      if (typeof tourType === 'string') {
        if (tourType.includes('day')) {
          apiTourType = 'day';
        } else if (tourType.includes('group')) {
          apiTourType = 'group';
        }
      }

      try {
        // 调用API计算折扣
        const result = await calculateTourDiscount({
          tourId: Number(tourId),
          tourType: apiTourType,
          originalPrice: Number(originalPrice),
          agentId: Number(agentId)
        });

        // 检查返回的结果是否有效
        if (result && typeof result.discountedPrice === 'number') {
          // 设置折扣价格
          setDiscountPrice(Number(result.discountedPrice));
        } else {
          // 如果返回结果无效，使用默认折扣率计算
          const defaultDiscountRate = localStorage.getItem('discountRate') || 0.9;
          const discountedPrice = Math.round(originalPrice * defaultDiscountRate);
          
          // 设置折扣价格
          setDiscountPrice(discountedPrice);
        }
      } catch (apiError) {
        console.error('API调用失败，使用默认折扣率计算:', apiError);
        
        // 如果API调用失败，使用默认折扣率计算
        const defaultDiscountRate = localStorage.getItem('discountRate') || 0.9;
        const discountedPrice = Math.round(originalPrice * defaultDiscountRate);
        
        // 设置折扣价格
        setDiscountPrice(discountedPrice);
      }
    } catch (error) {
      console.error('折扣价格计算失败:', error);
    } finally {
      setLoading(false);
      requestInProgressRef.current = false;
    }
  }, [destination.id, destination.price, destination.type, isAgent, agentId]);

  useEffect(() => {
    // 清除之前的计时器(如果存在)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // 使用随机延迟来错开请求，避免同时发送太多请求
    timerRef.current = setTimeout(() => {
      fetchDiscountPrice();
    }, getRandomDelay());
    
    // 监听价格缓存清理事件
    const handleCacheClear = () => {
      // 在缓存清理后重新获取价格，同样使用随机延迟
      setTimeout(() => fetchDiscountPrice(), getRandomDelay());
    };
    
    // 添加事件监听
    document.addEventListener('priceCacheCleared', handleCacheClear);
    
    // 清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      document.removeEventListener('priceCacheCleared', handleCacheClear);
    };
  }, [fetchDiscountPrice]);

  // 生成详情页链接
  const getDetailLink = () => {
    if (!destination || !destination.id) return '/';
    
    // 直接使用卡片数据中的tour_type字段，避免依赖路径
    let apiTourType = 'day'; // 默认值
    
    // 判断逻辑 - 优先级从高到低
    // 1. 使用预处理时计算好的api_tour_type
    if (destination.api_tour_type) {
      apiTourType = destination.api_tour_type;
    }
    // 2. 检查产品名称中的关键词（对"蜜月"、"浪漫"等关键词特殊处理为跟团游）
    else if ((destination.name || destination.title || '').match(/团|多日|(\d+)日游|蜜月|浪漫|家庭|探险|文化探索/i) && 
       !(destination.name || destination.title || '').includes('一日游')) {
      apiTourType = 'group';
    }
    // 3. 检查section标记
    else if (destination.section === 'group_tours') {
      apiTourType = 'group';
    }
    // 4. 检查tour_type或type字段
    else if (destination.tour_type) {
      if (typeof destination.tour_type === 'string') {
        if (destination.tour_type.includes('group')) {
          apiTourType = 'group';
        } else if (destination.tour_type.includes('day')) {
          apiTourType = 'day';
        }
      }
    } 
    else if (destination.type) {
      if (typeof destination.type === 'string') {
        if (destination.type.includes('group')) {
          apiTourType = 'group';
        } else if (destination.type.includes('day')) {
          apiTourType = 'day';
        }
      }
    }
    // 5. 检查ID范围 - 这个规则要谨慎使用，仅作为最后的判断方式
    else if (destination.id > 100) {
      apiTourType = 'group';
    }
    
    // 根据类型使用不同的路径
    if (apiTourType === 'group') {
      return `/group-tours/${destination.id}`;
    } else {
      return `/day-tours/${destination.id}`;
    }
  };
  
  // 如果没有目的地数据，返回空组件
  if (!destination) {
    return null;
  }

  // 获取持续时间显示
  const getDuration = () => {
    if (destination.duration) {
      return destination.duration;
    } else if (destination.days) {
      return `${destination.days}天${destination.nights || destination.days - 1}晚`;
    } else {
      return `${destination.hours || 8}小时`;
    }
  };
  
  // 获取评分显示
  const getRating = () => {
    return destination.rating || destination.stars || 4.8;
  };

  // 检查是否有图片
  const hasImage = () => {
    return getImageUrl(destination) !== '';
  };

  // 检查是否有有效折扣
  const hasDiscount = () => {
    return !isOperator() && isAgent && discountPrice && discountPrice < destination.price;
  };
  
  // 获取分类名称
  const getCategoryName = () => {
    if (!destination.category) return '常规旅游';
    
    switch(destination.category) {
      case 'nature': return '自然风光';
      case 'culture': return '文化体验';
      case 'adventure': return '冒险活动';
      case 'food': return '美食之旅';
      case 'history': return '历史探索';
      case 'shopping': return '购物之旅';
      case 'photography': return '摄影之旅';
      default: return destination.category;
    }
  };
  
  // 计算折扣百分比
  const getDiscountPercentage = () => {
    if (!hasDiscount()) return null;
    
    const discountPercent = 100 - (discountPrice / destination.price * 100);
    return Math.round(discountPercent);
  };
  
  // 折扣标签
  const discountPercent = getDiscountPercentage();

  // 处理预订按钮点击
  const handleBookNow = () => {
    // 获取当前日期和7天后的日期
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    // 确定产品类型
    let tourType = 'day';
    
    // 从链接中判断
    if (getDetailLink().includes('group-tours')) {
      tourType = 'group';
    }
    
    // 构造URL参数
    const params = new URLSearchParams();
    params.append('tourId', destination.id);
    params.append('tourName', destination.name || destination.title || '');
    params.append('type', tourType);
    params.append('price', hasDiscount() ? discountPrice : destination.price);
    params.append('arrivalDate', startDate.toISOString().split('T')[0]);
    params.append('departureDate', endDate.toISOString().split('T')[0]);
    
    // 检查用户是否已登录，使用Redux状态
    if (isAuthenticated) {
      // 已登录，导航到预订页面
      navigate(`/booking?${params.toString()}`);
    } else {
      // 未登录，导航到登录页面，并传递跳转信息
      navigate('/login', { 
        state: { 
          from: `/booking?${params.toString()}`, 
          message: "请先登录后再进行预订" 
        } 
      });
    }
  };

  return (
    <div className="product-tour-card">
      <div className="product-tour-card-image">
        {imageError || !hasImage() ? (
          <div className="image-placeholder"></div>
        ) : (
          <img
            src={getImageUrl(destination)}
            alt={destination.name || destination.title || '塔斯马尼亚旅游'}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {discountPercent && !isOperator() && (
          <div className="discount-badge">
            节省{discountPercent}%
          </div>
        )}
        
        <div className="product-tour-card-duration">
          <BsClock /> {getDuration()}
        </div>
      </div>
      
      <div className="product-tour-card-content">
        <div className="product-tour-card-title">
          {destination.name || destination.title}
        </div>
        
        <div className="tour-card-location-rating">
          <div className="tour-location">
            <FaMapMarkerAlt className="location-icon" /> {destination.location || destination.region_name || '塔斯马尼亚'}
          </div>
          <div className="tour-rating">
            <FaStar className="star-icon" /> {getRating()}
          </div>
        </div>
        
        <div className="tour-card-info">
          <div className="tour-info-item">
            <BsTag className="info-icon" /> {getCategoryName()}
          </div>
          {destination.departure_address && (
            <div className="tour-info-item">
              <FaCalendarAlt className="info-icon" /> {destination.departure_info || '天天发团'}
            </div>
          )}
          {destination.suitable_for && (
            <div className="tour-info-item">
              <FaUserFriends className="info-icon" /> 适合: {destination.suitable_for}
            </div>
          )}
        </div>
        
        {destination.description && (
          <div className="product-tour-card-desc">
            {destination.description}
          </div>
        )}
        
        <div className="product-tour-card-footer">
          {loading ? (
            <div className="product-tour-card-price loading">
              价格计算中...
            </div>
          ) : (hasDiscount() && !isOperator()) ? (
            <div className="product-tour-card-price">
              <span className="discounted-price">${discountPrice.toFixed(2)}</span>
              <span className="original-price">${destination.price.toFixed(2)}</span>
              <span className="price-suffix">/人</span>
            </div>
          ) : (
            <div className="product-tour-card-price">
              ${destination.price ? destination.price.toFixed(2) : '0.00'}<span className="price-suffix">/人</span>
            </div>
          )}
          <div className="product-tour-card-buttons">
            <NavLink to={getDetailLink()} className="product-tour-card-details-btn">
              查看详情
            </NavLink>
            <button onClick={handleBookNow} className="product-tour-card-book-btn">
              <FaShoppingCart className="me-1" /> 立即预订
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cards;
