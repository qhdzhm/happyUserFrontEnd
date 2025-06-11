import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart } from 'react-icons/fa';
import { getImageUrl } from "../../utils/imageUtils";
import { useSelector } from 'react-redux';

// 现代化设计的旅游卡片组件
const RedesignedCard = ({ tour: destination }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated } = useSelector(state => state.auth);

  if (!destination) {
    return null;
  }

  // 获取持续时间显示文本
  const getDuration = () => {
    if (destination.duration) {
      return destination.duration;
    } else if (destination.days) {
      return `${destination.days}天${destination.nights || destination.days - 1}晚`;
        } else {
      return `${destination.hours || 8}小时`;
    }
  };

  // 检查是否有图片
  const hasImage = () => {
    return getImageUrl(destination) !== '';
    };

  // 根据产品类型生成详情页链接
  const getDetailLink = () => {
    if (!destination || !destination.id) return '/';
    
    let apiTourType = 'day';
    
    // 通过多种方式判断旅游类型
    if (destination.api_tour_type) {
      apiTourType = destination.api_tour_type;
    }
    else if ((destination.name || destination.title || '').match(/团|多日|(\d+)日游|蜜月|浪漫|家庭|探险|文化探索/i) && 
       !(destination.name || destination.title || '').includes('一日游')) {
      apiTourType = 'group';
    }
    else if (destination.section === 'group_tours') {
      apiTourType = 'group';
    }
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
    else if (destination.id > 100) {
      apiTourType = 'group';
    }
    
    // 返回相应的详情页链接
    if (apiTourType === 'group') {
      return `/group-tours/${destination.id}`;
    } else {
      return `/day-tours/${destination.id}`;
    }
  };

  // 处理预订按钮点击
  const handleBookNow = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    let tourType = 'day';
    
    if (getDetailLink().includes('group-tours')) {
      tourType = 'group';
    }
    
    // 准备预订参数
    const params = new URLSearchParams();
    params.append('tourId', destination.id);
    params.append('tourName', destination.name || destination.title || '');
    params.append('type', tourType);
    params.append('price', destination.price);
    params.append('arrivalDate', startDate.toISOString().split('T')[0]);
    params.append('departureDate', endDate.toISOString().split('T')[0]);
    
    // 如果已登录则直接跳转到预订页面，否则先跳转到登录页
    if (isAuthenticated) {
      navigate(`/tours?${params.toString()}`);
    } else {
      navigate('/login', { 
        state: { 
          from: `/tours?${params.toString()}`, 
          message: "请先登录后再进行预订" 
        } 
      });
    }
  };

  // 渲染现代化设计的旅游卡片
  return (
    <div className="redesigned-tour-card simplified-card fullimage-card">
      <div className="redesigned-tour-card-image">
        {imageError || !hasImage() ? (
          <div className="image-placeholder">
            <span>暂无图片</span>
          </div>
        ) : (
          <img
            src={getImageUrl(destination)}
            alt={destination.name || destination.title || '塔斯马尼亚旅游'}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {/* 添加产品名称 */}
        <div className="tour-name-overlay">
          <h3 className="tour-name">{destination.name || destination.title || '塔斯马尼亚旅游'}</h3>
        </div>

        {/* 半透明覆盖层 - 包含价格和按钮 */}
        <div className="overlay-content">
          {/* 价格显示 */}
            <div className="redesigned-tour-price">
              <span className="redesigned-price-amount">${destination.price ? destination.price.toFixed(2) : '0.00'}</span>
            </div>
          
          {/* 按钮区域 */}
          <div className="redesigned-tour-buttons">
            <Link to={getDetailLink()} className="redesigned-tour-btn redesigned-details-btn">
              查看详情
            </Link>
            <button onClick={handleBookNow} className="redesigned-tour-btn redesigned-book-btn">
              <FaShoppingCart /> 立即预订
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedesignedCard; 