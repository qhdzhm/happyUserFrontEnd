import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Pagination, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { tourService } from '../../services';
import * as api from '../../utils/api';
import { calculateTourDiscount, calculateBatchTourDiscounts } from '../../utils/api';
import { BsFilter, BsArrowDownUp, BsCheckCircle } from 'react-icons/bs';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './TourList.css';
import Cards from '../Cards/Cards';
import RedesignedCard from '../Cards/RedesignedCard';
import '../../pages/Home/home-tours-redesign.css';

// 创建折扣价格批量获取计时器
let batchDiscountTimer = null;
// 待处理的旅游产品
const pendingTours = [];

// 创建价格缓存
const priceCache = {};

const TourList = ({ category, limit, showViewAll = false }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toursWithDiscount, setToursWithDiscount] = useState([]);
  const isAgent = localStorage.getItem('userType') === 'agent';
  const agentId = localStorage.getItem('agentId');

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        let data;
        
        // 根据不同的场景使用不同的服务方法
        if (category === 'hot') {
          // 获取热门旅游产品，使用缓存
          data = await tourService.getHotTours(limit);
        } else if (category === 'recommended') {
          // 获取推荐旅游产品，使用缓存
          data = await tourService.getRecommendedTours(limit);
        } else {
          // 获取所有或特定分类的旅游产品，使用缓存
          data = await tourService.getAllTours({ category, limit });
        }
        
        // 确保所有数据都有类型
        data = data.map(tour => ({
          ...tour,
          type: tour.type || getTourType(tour)
        }));
        
        setTours(data);
        
        // 如果是代理商，计算折扣价格
        if (isAgent && agentId) {
          const enhanced = await fetchDiscountPrices(data);
          setToursWithDiscount(enhanced);
        } else {
          setToursWithDiscount(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTours();
  }, [category, limit, isAgent, agentId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!toursWithDiscount || toursWithDiscount.length === 0) {
    return (
      <div className="alert alert-info" role="alert">
        暂无旅游产品
      </div>
    );
  }

  // 根据旅游信息判断类型
  function getTourType(tour) {
    // 检查是否有明确类型
    if (tour.tour_type) return tour.tour_type;
    if (tour.type) return tour.type;
    
    // 根据名称判断
    if (tour.name && tour.name.includes('一日游')) return 'day_tour';
    if (tour.name && /团|多日|(\d+)日游|蜜月|浪漫|家庭|探险|文化探索/i.test(tour.name)) return 'group_tour';
    
    // 根据ID判断
    if (tour.id > 100 || tour.id === 9) return 'group_tour';
    
    // 默认为一日游
    return 'day_tour';
  }
  
  // 批量获取折扣价格
  const fetchDiscountPrices = async (tours) => {
    // 检查是否为代理商
    if (!isAgent || !agentId || !tours || tours.length === 0) {
      return tours;
    }
    
    setLoading(true);
    
    // 预处理旅游类型数据
    const processedTours = tours.map((tour, index) => {
      // 识别旅游类型特征
      const nameIndicatesDayTour = tour.name && tour.name.toLowerCase().includes('一日游');
      const nameIndicatesGroupTour = tour.name && 
        (/团|多日|(\d+)日游|蜜月|浪漫|家庭|探险|文化探索/i.test(tour.name)) ? 
        tour.name.match(/团|多日|(\d+)日游|蜜月|浪漫|家庭|探险|文化探索/i) : null;
      
      // 基于名称和已有类型信息，确定最可能的类型
      const isMostLikelyDayTour = nameIndicatesDayTour || 
                                 (tour.tour_type && tour.tour_type.includes('day')) ||
                                 (tour.section === 'day_tours');
                                 
      const isMostLikelyGroupTour = nameIndicatesGroupTour || 
                                   (tour.tour_type && tour.tour_type.includes('group')) ||
                                   (tour.section === 'group_tours');
      
      // 确定最终类型
      let tourType;
      let apiTourType;
      
      if (isMostLikelyDayTour && !isMostLikelyGroupTour) {
        tourType = 'day_tour';
        apiTourType = 'day';
      } else if (isMostLikelyGroupTour && !isMostLikelyDayTour) {
        tourType = 'group_tour';
        apiTourType = 'group';
      } else if (nameIndicatesDayTour) {
        tourType = 'day_tour';
        apiTourType = 'day';
      } else if (nameIndicatesGroupTour) {
        tourType = 'group_tour';
        apiTourType = 'group';
      } else if (tour.id > 100) {
        // 根据ID范围判断（仅作为最后手段）
        tourType = 'group_tour';
        apiTourType = 'group';
      } else {
        tourType = 'day_tour'; // 默认
        apiTourType = 'day';
      }
      
      // 返回增强后的旅游数据
      return {
        ...tour,
        tour_type: tourType,
        api_tour_type: apiTourType,
        index // 添加索引便于后续排序
      };
    });
    
    try {
      // 准备批量请求项目
      const batchItems = processedTours.map(tour => ({
        tourId: Number(tour.id),
        tourType: tour.api_tour_type,
        originalPrice: Number(tour.price),
        agentId: Number(agentId),
        index: tour.index
      }));
      
      // 使用批量API计算折扣价格
      const discountResults = await calculateBatchTourDiscounts(batchItems);
      
      // 将折扣结果合并到旅游数据中
      const toursWithDiscount = processedTours.map((tour, index) => {
        const discountResult = discountResults.find(item => item.tourId === tour.id);
        
        if (discountResult) {
          return {
            ...tour,
            discountPrice: Number(discountResult.discountedPrice),
            discountRate: Number(discountResult.discountRate),
            savedAmount: Number(discountResult.savedAmount)
          };
        }
        
        // 如果没有找到对应的折扣结果，使用默认折扣率
        const defaultRate = localStorage.getItem('discountRate') || 0.9;
        const discountedPrice = Math.round(tour.price * defaultRate);
        
        return {
          ...tour,
          discountPrice: discountedPrice,
          discountRate: defaultRate,
          savedAmount: tour.price - discountedPrice
        };
      });
      
      setLoading(false);
      return toursWithDiscount;
    } catch (error) {
      console.error('批量获取折扣价格失败:', error);
      
      // 回退到单个计算方式
      try {
        // 计算折扣价格的Promise数组
        const discountPromises = processedTours.map(async (tour) => {
          try {
            // 调用单个计算API
            const discountData = await calculateTourDiscount({
              tourId: Number(tour.id),
              tourType: tour.api_tour_type,
              originalPrice: Number(tour.price),
              agentId: Number(agentId)
            });
            
            // 返回增强后的旅游数据
            return {
              ...tour,
              discountPrice: Number(discountData.discountedPrice),
              discountRate: Number(discountData.discountRate),
              savedAmount: Number(discountData.savedAmount)
            };
          } catch (error) {
            // 使用默认折扣率计算
            const defaultRate = localStorage.getItem('discountRate') || 0.9;
            const discountedPrice = Math.round(tour.price * defaultRate);
            
            return {
              ...tour,
              discountPrice: discountedPrice,
              discountRate: defaultRate,
              savedAmount: tour.price - discountedPrice
            };
          }
        });
        
        // 等待所有折扣计算完成
        const toursWithDiscount = await Promise.all(discountPromises);
        setLoading(false);
        return toursWithDiscount;
      } catch (fallbackError) {
        setLoading(false);
        // 返回预处理后但没有折扣的旅游数据
        return processedTours.map(tour => {
          const defaultRate = localStorage.getItem('discountRate') || 0.9;
          const discountedPrice = Math.round(tour.price * defaultRate);
          return {
            ...tour,
            discountPrice: discountedPrice,
            discountRate: defaultRate,
            savedAmount: tour.price - discountedPrice
          };
        });
      }
    }
  };

  return (
    <div className="tour-list">
      <Row>
        {toursWithDiscount.map((tour) => (
          <Col key={tour.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
            <RedesignedCard tour={tour} />
          </Col>
        ))}
      </Row>
      
      {showViewAll && tours.length > 0 && (
        <div className="text-center mt-4">
          <Link 
            to={`/tours?tourTypes=${category === 'day-tours' ? 'day_tour' : 'group_tour'}`} 
            className="btn btn-outline-primary"
          >
            查看全部
          </Link>
        </div>
      )}
    </div>
  );
};

export default TourList; 