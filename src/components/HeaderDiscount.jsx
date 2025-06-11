import React, { useState, useEffect } from 'react';
import './DiscountDisplay.css';
import { calculateTourDiscount, getAgentDiscountRate } from '../utils/api';

/**
 * 顶部折扣信息提示组件，根据用户类型显示不同的折扣信息
 */
const HeaderDiscount = () => {
  const [discountRate, setDiscountRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 从localStorage获取代理商ID
  const isAgent = localStorage.getItem('userType') === 'agent';
  const agentId = localStorage.getItem('agentId');
  
  // 从API获取折扣率
  const fetchDiscountRate = async () => {
    console.log('HeaderDiscount - 开始获取代理商折扣率...');
    setLoading(true);
    
    try {
      // 尝试从localStorage获取缓存的折扣率
      const cachedRate = localStorage.getItem('discountRate');
      if (cachedRate) {
        console.log('HeaderDiscount - 从localStorage获取的折扣率:', cachedRate);
        setDiscountRate(parseFloat(cachedRate));
      }
      
      // 如果没有缓存或需要更新，从API获取
      console.log('HeaderDiscount - 从API获取最新折扣率');
      const rateFromApi = await getAgentDiscountRate();
      console.log('HeaderDiscount - API返回的折扣率:', rateFromApi);
      
      // 更新状态
      setDiscountRate(parseFloat(rateFromApi));
      
      // 使用获取的折扣率做一次测试API调用
      console.log('HeaderDiscount - 测试折扣计算...');
      
      // 使用更长的延迟来避免与其他API请求竞争
      setTimeout(async () => {
        try {
          // 包装在try-catch中，并使用Promise.resolve确保即使出错也能继续
          const testResult = await Promise.resolve().then(() => {
            return calculateTourDiscount({
              tourId: 1,
              tourType: 'day',
              originalPrice: 100,
              agentId: agentId
            }).catch(err => {
              // 在回调内部捕获错误，避免错误传播
              console.warn('HeaderDiscount - 折扣计算测试API调用失败 (已处理):', err);
              // 返回默认结果
              return {
                originalPrice: 100,
                discountedPrice: 100 * parseFloat(rateFromApi.discountRate || 0.9),
                discountRate: parseFloat(rateFromApi.discountRate || 0.9),
                savedAmount: 100 * (1 - parseFloat(rateFromApi.discountRate || 0.9))
              };
            });
          });
          
          console.log('HeaderDiscount - 折扣计算测试结果:', testResult);
        } catch (testError) {
          // 这个catch块应该永远不会执行，但为了安全起见
          console.error('HeaderDiscount - 折扣计算测试异常 (外层错误):', testError);
        }
      }, 1000); // 延迟时间增加到1000毫秒
      
      // 清除错误
      setError(null);
    } catch (err) {
      console.error('HeaderDiscount - 获取折扣率失败:', err);
      setError('无法获取折扣率，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  // 组件加载时获取折扣率
  useEffect(() => {
    if (isAgent && agentId) {
      fetchDiscountRate();
    }
  }, [isAgent, agentId]);
  
  // 如果不是代理商，不显示组件
  if (!isAgent || !agentId) {
    return null;
  }
  
  // 根据不同状态渲染不同内容
  if (loading) {
    return (
      <div className="discount-display header-discount loading">
        <span>正在获取折扣...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="discount-display header-discount error">
        <span>{error}</span>
      </div>
    );
  }
  
  if (discountRate && discountRate < 1) {
    // 将折扣率转换为百分比
    const discountPercentage = Math.round((1 - discountRate) * 100);
    
    return (
      <div className="discount-display header-discount">
        <span className="discount-badge">代理商专享{discountPercentage}%折扣</span>
      </div>
    );
  }
  
  // 默认返回空
  return null;
}

export default HeaderDiscount; 