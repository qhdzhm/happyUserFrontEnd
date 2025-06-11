import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { calculateDiscount } from '../services/api';
import { Badge, Spinner } from 'react-bootstrap';
import './DiscountDisplay.css';

/**
 * 折扣显示组件
 * 用于显示代理商折扣信息
 */
const DiscountDisplay = ({ originalPrice }) => {
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 从Redux获取用户信息
  const { isAuthenticated, user, userType } = useSelector(state => state.auth);
  
  // 判断是否为代理商
  const isAgent = userType === 'agent' || localStorage.getItem('userType') === 'agent';
  
  // 计算折扣
  useEffect(() => {
    const getDiscountPrice = async () => {
      // 如果不是代理商或没有原价，则不计算
      if (!isAgent || originalPrice === undefined || originalPrice === null) {
        console.log('无需计算折扣:', { isAgent, originalPrice });
        return;
      }
      
      // 如果原价为0，则折扣价也为0
      if (originalPrice === 0) {
        setDiscountedPrice(0);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // 获取代理商ID
        const agentId = user?.id || localStorage.getItem('agentId') || localStorage.getItem('userId');
        
        if (!agentId) {
          console.warn('代理商ID不存在，无法计算折扣');
          setDiscountedPrice(originalPrice);
          setLoading(false);
          return;
        }
        
        console.log('计算折扣:', { originalPrice, agentId });
        
        // 调用折扣计算API
        const result = await calculateDiscount({ 
          originalPrice: Number(originalPrice), 
          agentId 
        });
        
        console.log('折扣计算结果:', result);
        
        // 设置折扣价 (确保为数字格式)
        setDiscountedPrice(Number(result.discountedPrice || originalPrice));
      } catch (err) {
        console.error('折扣计算错误:', err);
        
        // 设置错误信息
        setError(err.message || '折扣计算失败');
        
        // 出错时使用原价
        setDiscountedPrice(originalPrice);
      } finally {
        setLoading(false);
      }
    };
    
    // 执行折扣计算
    getDiscountPrice();
  }, [originalPrice, isAgent, user]);
  
  // 如果不是代理商，直接返回null
  if (!isAgent) {
    return null;
  }
  
  // 计算折扣百分比
  const calculateDiscountPercentage = () => {
    if (!discountedPrice || !originalPrice || discountedPrice >= originalPrice) {
      return 0;
    }
    return Math.round((1 - discountedPrice / originalPrice) * 100);
  };
  
  const discountPercentage = calculateDiscountPercentage();
  
  // 如果正在加载
  if (loading) {
    return (
      <div className="discount-loading">
        <Spinner animation="border" size="sm" /> 计算折扣中...
      </div>
    );
  }
  
  // 如果有错误且不是因为使用原价导致的
  if (error && discountedPrice !== originalPrice) {
    return (
      <div className="discount-error">
        <small className="text-danger">{error}</small>
      </div>
    );
  }
  
  // 如果没有折扣或折扣价与原价相同
  if (!discountedPrice || discountPercentage === 0 || discountedPrice >= originalPrice) {
    return null;
  }
  
  // 显示折扣信息
  return (
    <div className="discount-display">
      <div className="discount-price">
        <span className="price-label">代理商价格: </span>
        <span className="price-value">${discountedPrice.toFixed(2)}</span>
      </div>
      <Badge bg="danger" className="discount-badge">
        节省 {discountPercentage}%
      </Badge>
    </div>
  );
};

export default DiscountDisplay; 