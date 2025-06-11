import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Badge, Alert } from 'react-bootstrap';
import { FaTags, FaGift } from 'react-icons/fa';
import { getAgentDiscountRate, calculateTourDiscount } from '../../utils/api';
import './HeaderDiscount.css';

/**
 * 顶部折扣信息提示组件，根据用户类型显示不同的折扣信息
 */
const HeaderDiscount = () => {
  // 从Redux获取用户信息
  const { user } = useSelector(state => state.auth);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 获取用户类型
  const userRole = user?.role || localStorage.getItem('userType');
  const isAgent = userRole === 'agent';
  const agentId = localStorage.getItem('agentId');
  
  // 从后端获取最新折扣率
  useEffect(() => {
    const fetchDiscountRate = async () => {
      if (isAgent) {
        try {
          setLoading(true);
          setError(null);
          console.log('HeaderDiscount - 开始获取代理商折扣率...');
          
          // 从API获取最新折扣率
          console.log('HeaderDiscount - 从API获取最新折扣率');
          const response = await getAgentDiscountRate(agentId);
          console.log('HeaderDiscount - API返回的折扣信息:', response);
          
          if (response && response.discountRate) {
            setDiscountInfo(response);
            localStorage.setItem('discountRate', response.discountRate);
            
            // 测试折扣计算API
            console.log('HeaderDiscount - 测试折扣计算...');
            try {
              const testDiscount = await calculateTourDiscount({
                tourId: 1,
                tourType: 'day-tour',
                originalPrice: 100,
                agentId: agentId
              });
              console.log('HeaderDiscount - 折扣计算测试结果:', testDiscount);
            } catch (e) {
              console.error('HeaderDiscount - 折扣计算测试失败:', e);
            }
          } else {
            console.warn('HeaderDiscount - 获取到无效的折扣率信息:', response);
            setError('无法获取折扣率');
          }
        } catch (error) {
          console.error('HeaderDiscount - 获取折扣率失败:', error);
          setError('获取折扣率失败');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchDiscountRate();
    
    // 定期刷新折扣率（每10分钟）
    const intervalId = setInterval(fetchDiscountRate, 10 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isAgent, agentId]);
  
  // 如果不是代理商、或没有有效折扣率，不显示组件
  if (!isAgent || !agentId || (discountInfo && discountInfo.discountRate >= 1)) {
    return null;
  }
  
  // 折扣百分比
  const discountPercent = discountInfo?.savedPercent?.toFixed(0) || '';
  
  return (
    <div className="header-discount-bar">
      <div className="container">
        {loading ? (
          <div className="discount-content">
            <span className="discount-text">获取折扣信息中...</span>
          </div>
        ) : error ? (
          <div className="discount-content error">
            <span className="discount-text">{error}</span>
          </div>
        ) : discountPercent ? (
          <div className="discount-content">
            <FaTags className="discount-icon me-2" />
            <span className="discount-text">
              尊敬的代理商，您当前享有<Badge bg="danger" className="mx-1">{discountPercent}%</Badge>的专属折扣！
            </span>
            <FaGift className="discount-icon ms-2" />
          </div>
        ) : (
          <div className="discount-content">
            <span className="discount-text">加载中...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderDiscount; 