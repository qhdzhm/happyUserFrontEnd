import { getUserInfo } from '../utils/api';
import { calculateTourDiscount } from '../utils/api';

// 创建价格缓存
const priceCache = {};

// 计算折扣价格并保存到价格缓存中
const fetchDiscountPrice = async (tourId, tourType, originalPrice) => {
  try {
    // 获取当前用户信息
    const userInfo = getUserInfo();
    // 检查是否为代理商
    if (!userInfo || userInfo.userType !== 'agent' || !userInfo.agentId) {
      return { 
        originalPrice, 
        discountedPrice: originalPrice,
        discountRate: 1,
        savedAmount: 0
      };
    }
    
    // 尝试从缓存获取
    const cacheKey = `${tourId}_${tourType}_${originalPrice}_${userInfo.agentId}`;
    const cachedPrice = priceCache[cacheKey];
    
    if (cachedPrice) {
      return cachedPrice;
    }
    
    // 调整API参数,确保包含正确的tourType
    let apiTourType;
    if (typeof tourType === 'string') {
      if (tourType.includes('day')) {
        apiTourType = 'day';
      } else if (tourType.includes('group')) {
        apiTourType = 'group';
      } else {
        apiTourType = tourType.toLowerCase();
      }
    } else {
      apiTourType = 'day'; // 默认值
    }
    
    // 调用API计算折扣价格
    try {
      const params = {
        tourId,
        tourType: apiTourType,
        originalPrice,
        agentId: userInfo.agentId
      };
      
      // 尝试使用GET方法调用
      const discountResult = await calculateTourDiscount(params);
      
      // 保存到缓存
      priceCache[cacheKey] = discountResult;
      
      return discountResult;
    } catch (apiError) {
      console.error(`计算折扣价格失败:`, apiError);
      // 如果API调用失败，尝试使用预设折扣率
      const discountRate = localStorage.getItem('discountRate') || 0.9;
      const discountedPrice = Math.round(originalPrice * discountRate);
      const result = {
        originalPrice,
        discountedPrice,
        discountRate,
        savedAmount: originalPrice - discountedPrice
      };
      
      // 保存到缓存
      priceCache[cacheKey] = result;
      
      return result;
    }
  } catch (error) {
    console.error(`获取折扣价格出错:`, error);
    return { 
      originalPrice, 
      discountedPrice: originalPrice,
      discountRate: 1,
      savedAmount: 0
    };
  }
};

export default fetchDiscountPrice; 