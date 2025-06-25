import request from '../utils/request';
import { addAuthHeaders } from '../utils/auth';

/**
 * 预订服务 - 处理与预订相关的API请求
 */

/**
 * 创建预订
 * @param {Object} data - 预订数据
 * @returns {Promise} - 请求Promise
 */
export const createBooking = (data) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  return request.post('/bookings', data, { headers });
};

/**
 * 创建旅游订单
 * @param {Object} data - 旅游订单数据，包含以下字段：
 * - tourId: 旅游项目ID (必填)
 * - tourType: 旅游类型 (day_tour:一日游,group_tour:团队游) (必填)
 * - userId: 用户ID (必填)
 * - tourStartDate: 行程开始日期 (必填)
 * - tourEndDate: 行程结束日期 (必填)
 * - contactPerson: 联系人 (必填)
 * - contactPhone: 联系电话 (必填)
 * - groupSize: 团队规模 (必填)
 * - agentId: 代理商ID (选填)
 * - flightNumber: 航班号 (选填)
 * - returnFlightNumber: 返程航班号 (选填)
 * - pickupDate: 接客日期 (选填)
 * - dropoffDate: 送客日期 (选填)
 * - pickupLocation: 接客地点 (选填)
 * - dropoffLocation: 送客地点 (选填)
 * - serviceType: 服务类型 (选填)
 * - luggageCount: 行李数量 (选填)
 * - passengerContact: 乘客联系方式 (选填)
 * - hotelLevel: 酒店等级 (选填)
 * - roomType: 房间类型 (选填)
 * - hotelRoomCount: 酒店间房数量 (选填)
 * - roomDetails: 每个房间的样式 (选填)
 * - specialRequests: 特殊请求 (选填)
 * - itineraryDetails: 行程详情 (选填)
 * - status: 订单状态 (选填)
 * - paymentStatus: 支付状态 (选填)
 * - totalPrice: 总价 (选填)
 * - passengers: 乘客列表 (选填)
 * @returns {Promise} - 请求Promise
 */
export const createTourBooking = (data) => {
  // 检查用户认证状态
  const isAuthenticated = !!localStorage.getItem('token') || !!localStorage.getItem('user');
  
  // 只在用户已认证时添加认证头部
  let headers = {};
  if (isAuthenticated) {
    headers = addAuthHeaders();
    console.log('用户已认证，添加认证头部');
  } else {
    console.log('游客模式下单，不添加认证头部');
  }
  
  // 打印请求信息，用于调试
  console.log('创建旅游订单请求:', {
    url: '/user/bookings/tour/create',
    headers: Object.keys(headers),
    authentication: headers.authentication ? `${headers.authentication.substring(0, 10)}...` : 'none',
    data: { ...data, passengers: data.passengers?.length || 0 },
    isGuestMode: !isAuthenticated
  });
  
  // 调用新的API接口
  return request.post('/user/bookings/tour/create', data, { headers });
};

/**
 * 计算旅游价格（统一接口，支持可选项目）
 * @param {number} tourId - 旅游ID
 * @param {string} tourType - 旅游类型 (day_tour, group_tour)
 * @param {number} adultCount - 成人数量
 * @param {number} childCount - 儿童数量
 * @param {string} hotelLevel - 酒店星级
 * @param {number} agentId - 代理商ID (可选)
 * @param {number} roomCount - 房间数量 (可选)
 * @param {number} userId - 用户ID (可选)
 * @param {Array} childrenAges - 儿童年龄数组 (可选)
 * @param {string} roomType - 房间类型 (可选)
 * @param {Object} selectedOptionalTours - 用户选择的可选项目 (可选)
 * @returns {Promise} 返回价格数据
 */
export const calculateTourPrice = async (tourId, tourType, adultCount, childCount, hotelLevel, agentId = null, roomCount = 1, userId = null, childrenAges = [], roomType = null, selectedOptionalTours = null) => {
  try {
    // 将所有参数解析为适当的类型
    const numericTourId = parseInt(tourId, 10);
    const numericAdultCount = parseInt(adultCount, 10);
    const numericChildCount = parseInt(childCount, 10);
    const numericRoomCount = parseInt(roomCount, 10);
    const numericAgentId = agentId ? parseInt(agentId, 10) : null;
    const numericUserId = userId ? parseInt(userId, 10) : null;
    
    // 添加认证头部（如果用户已登录）
    const headers = addAuthHeaders();
    const isAuthenticated = !!localStorage.getItem('token') || !!localStorage.getItem('user');
    
    console.log('价格计算请求 - 用户认证状态:', isAuthenticated);
    
    // 构建请求体数据
    const requestData = {
      tourId: numericTourId,
      tourType: tourType,
      adultCount: numericAdultCount,
      childCount: numericChildCount,
      hotelLevel: hotelLevel,
      roomCount: numericRoomCount
    };
    
    // 添加可选参数 - 优化房型数据处理
    if (roomType) {
      // 如果roomType是数组，传递roomTypes参数；否则传递单个roomType
      if (Array.isArray(roomType)) {
        requestData.roomTypes = JSON.stringify(roomType);
        console.log('传递多房间类型:', roomType);
      } else {
        // 单个房型也转换为数组格式，保持一致性
        requestData.roomTypes = JSON.stringify([roomType]);
        console.log('传递单个房间类型（转为数组）:', [roomType]);
      }
    }
    
    if (childrenAges && childrenAges.length > 0) {
      requestData.childrenAges = childrenAges.join(',');
    }
    
    if (numericAgentId) {
      requestData.agentId = numericAgentId;
    }
    
    // 添加用户ID
    const localUserId = localStorage.getItem('userId');
    if (!numericUserId && localUserId) {
      requestData.userId = parseInt(localUserId, 10);
    } else if (numericUserId) {
      requestData.userId = numericUserId;
    }
    
    // 添加选择的可选项目（如果有）
    if (selectedOptionalTours && Object.keys(selectedOptionalTours).length > 0) {
      requestData.selectedOptionalTours = JSON.stringify(selectedOptionalTours);
      console.log('添加可选项目参数:', selectedOptionalTours);
    }
    
    console.log('计算价格请求数据:', requestData);
    
    // 构建表单数据
    const formData = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // 使用统一的API接口 - 清理配置避免toUpperCase错误
    const url = '/user/bookings/tour/calculate-price';
    const cleanConfig = { 
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    // 只在用户已认证且有认证头时才添加认证信息
    if (isAuthenticated && headers && Object.keys(headers).length > 0) {
      Object.assign(cleanConfig.headers, headers);
      console.log('添加认证头部到价格计算请求');
    } else {
      console.log('游客模式价格计算请求，不添加认证头部');
    }
    
    console.log('🚀 即将发送价格计算请求:', {
      url: url,
      formData: Object.fromEntries(formData.entries()),
      config: cleanConfig
    });

    const response = await request.post(url, formData, cleanConfig);
    
    console.log('✅ 价格计算响应成功:', response);
    return response;

  } catch (error) {
    console.error('❌ 计算旅游价格时出错:', error);
    console.error('❌ 错误详情:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    throw error;
  }
};

/**
 * 获取酒店价格差异列表
 * @returns {Promise} - 请求Promise
 */
export const getHotelPrices = () => {
  try {
    console.log('getHotelPrices 开始执行...');
    
    // 添加认证头部
    const headers = addAuthHeaders();
    console.log('构建请求头:', Object.keys(headers));
    
    // 记录请求信息
    console.log('即将发送请求到: /user/bookings/hotel-prices');
    
    // 使用缓存，缓存时间为1小时
    // 避免链式调用可能导致的toUpperCase错误
    const result = request.get('/user/bookings/hotel-prices', { 
      params: {},  // 确保params是一个空对象而非null
      useCache: true, 
      cacheTime: 60 * 60 * 1000,
      headers
    });
    
    // 使用单独的事件监听，不影响返回结果
    result.then(
      response => {
        console.log('酒店价格API响应成功:', response);
      }
    ).catch(
      error => {
        console.error('酒店价格API响应错误:', error);
      }
    );
    
    // 直接返回原始Promise对象
    return result;
  } catch (error) {
    console.error('获取酒店价格差异列表错误:', error);
    console.error('错误堆栈:', error.stack);
    
    // 返回一个已拒绝的Promise，避免进一步处理
    return Promise.reject({
      code: 0,
      message: error.message || "获取酒店价格差异列表时发生错误",
      data: null
    });
  }
};

/**
 * 获取预订详情
 * @param {string} id - 预订ID
 * @returns {Promise} - 请求Promise
 */
export const getBookingById = (id) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 使用缓存，缓存时间为5分钟
  return request.get(`/bookings/${id}`, {}, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000,
    headers
  });
};

/**
 * 取消预订
 * @param {string} id - 预订ID
 * @returns {Promise} - 请求Promise
 */
export const cancelBooking = (id) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 取消预订后清除缓存
  const response = request.put(`/bookings/${id}/cancel`, {}, { headers });
  request.clearCache(`/bookings/${id}`);
  request.clearCache('/users/orders');
  return response;
};

/**
 * 支付预订
 * @param {string} id - 预订ID
 * @param {Object} paymentData - 支付数据
 * @returns {Promise} - 请求Promise
 */
export const payBooking = (id, paymentData) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 支付预订后清除缓存
  const response = request.post(`/bookings/${id}/pay`, paymentData, { headers });
  request.clearCache(`/bookings/${id}`);
  request.clearCache('/users/orders');
  return response;
};

/**
 * 获取可用日期
 * @param {string} tourId - 旅游产品ID
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const getAvailableDates = (tourId, params = {}) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 使用缓存，缓存时间为30分钟
  return request.get(`/tours/${tourId}/available-dates`, params, { 
    useCache: true, 
    cacheTime: 30 * 60 * 1000,
    headers
  });
};

/**
 * 检查日期可用性
 * @param {string} tourId - 旅游产品ID
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const checkDateAvailability = (tourId, params) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 不使用缓存，确保获取最新数据
  return request.get(`/tours/${tourId}/check-availability`, params, { headers });
};

/**
 * 获取价格计算
 * @param {string} tourId - 旅游产品ID
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const calculatePrice = (tourId, params) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 不使用缓存，确保获取最新数据
  return request.get(`/tours/${tourId}/calculate-price`, params, { headers });
};

/**
 * 获取用户订单列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码，从1开始
 * @param {number} params.pageSize - 每页记录数
 * @param {string} [params.orderNumber] - 订单号（支持模糊搜索）
 * @param {string} [params.status] - 订单状态
 * @param {string} [params.paymentStatus] - 支付状态
 * @param {string} [params.tourType] - 旅游类型
 * @param {string} [params.startDate] - 开始日期 (yyyy-MM-dd格式)
 * @param {string} [params.endDate] - 结束日期 (yyyy-MM-dd格式)
 * @param {string} [params.contactPerson] - 联系人（支持模糊搜索）
 * @param {string} [params.contactPhone] - 联系电话（支持模糊搜索）
 * @returns {Promise} - 请求Promise
 */
export const getOrderList = (params = {}) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 确保参数至少有默认值 - 关键点：page必须为大于等于1的整数
  const page = Math.max(1, parseInt(params.page || 1, 10));
  const pageSize = Math.max(1, parseInt(params.pageSize || 10, 10));
  
  // 构建URL查询参数
  const url = `/orders/list?page=${page}&pageSize=${pageSize}`;
  
  // 添加其他非空参数
  const otherParams = Object.entries(params).filter(([key, value]) => {
    return key !== 'page' && key !== 'pageSize' && 
           value !== null && value !== undefined && value !== '';
  }).map(([key, value]) => {
    // 特殊处理日期类型参数，确保格式正确
    if (key === 'startDate' || key === 'endDate') {
      // 如果日期已经是标准ISO格式(yyyy-MM-dd)，直接使用
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return [key, value];
      }
      
      // 否则尝试转换为ISO格式
      if (value) {
        try {
          const date = new Date(value);
          // 确保是有效日期
          if (!isNaN(date.getTime())) {
            // 格式化为yyyy-MM-dd
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return [key, `${year}-${month}-${day}`];
          }
        } catch (e) {
          console.error(`日期转换错误 ${key}:`, e);
        }
      }
    }
    return [key, value];
  });
  
  // 将其他参数添加到URL
  const fullUrl = otherParams.reduce((acc, [key, value]) => {
    return `${acc}&${key}=${encodeURIComponent(value)}`;
  }, url);
  
  console.log('查询订单列表，完整URL:', fullUrl);
  
  // 使用完整URL直接请求
  return request.get(fullUrl, {}, { 
    useCache: false,
    headers
  });
};

/**
 * 取消订单
 * @param {number} orderId - 订单ID
 * @returns {Promise} - 请求Promise
 */
export const cancelOrder = async (orderId) => {
  try {
    // 添加认证头部
    const headers = addAuthHeaders();
    
    // 发送取消订单请求
    console.log(`发送取消订单请求: ${orderId}`);
    const response = await request.post(`/orders/${orderId}/cancel`, {}, { headers });
    
    // 清除缓存，确保数据一致性
    request.clearCache(`/user/orders/${orderId}`);
    request.clearCache('/orders/list');
    
    return response;
  } catch (error) {
    console.error('取消订单失败:', error);
    throw error;
  }
};

/**
 * 获取订单详情
 * @param {string} orderId - 订单ID
 * @returns {Promise<object>} - 订单详情数据
 */
export const getOrderDetail = async (orderId) => {
  try {
    // 添加认证头部
    const headers = addAuthHeaders();
    
    console.log(`获取订单详情，URL: /api/orders/${orderId}，令牌: ${headers.authentication ? '已设置' : '未设置'}`);
    
    // 判断orderId是否是以"HT"开头的订单号
    const isOrderNumber = typeof orderId === 'string' && orderId.startsWith('HT');
    
    // 尝试多个可能的API路径
    try {
      // 对于以"HT"开头的订单号，先尝试订单号API路径
      if (isOrderNumber) {
        console.log('尝试使用订单号获取订单详情');
        try {
          const response = await request.get(`/user/order-numbers/${orderId}`, {}, {
            headers
          });
          return response;
        } catch (error) {
          console.warn('订单号路径失败，继续尝试其他路径...');
        }
      }
      
      // 尝试订单API路径
      const response = await request.get(`/orders/${orderId}`, {}, {
        headers
      });
      return response;
    } catch (error) {
      console.warn('第一个API路径失败，尝试最后备用路径...', error);
      
      // 直接尝试bookings路径，跳过/api/user/orders/${orderId}路径
      const response = await request.get(`/user/bookings/${orderId}`, {}, {
        headers
      });
      return response;
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    throw error;
  }
};

/**
 * 修改订单信息
 * @param {Object} updateData - 包含订单ID和更新字段的对象
 * @returns {Promise} 请求Promise
 */
export const updateOrderByAgent = async (updateData) => {
  try {
    // 添加认证头部
    const headers = addAuthHeaders();
    
    console.log('用户修改订单，数据:', updateData);
    
    // 根据用户类型选择不同的API端点
    const userType = localStorage.getItem('userType');
    let endpoint;
    
    if (userType === 'agent') {
      // 代理商使用专用接口
      endpoint = '/orders/agent/update';
    } else {
      // 普通用户使用通用接口，需要在URL中包含订单ID
      endpoint = `/orders/${updateData.bookingId}`;
    }
    
    console.log(`使用API端点: ${endpoint}, 用户类型: ${userType}`);
    
    // 调用修改订单API
    const response = await request.put(endpoint, updateData, { headers });
    
    return response;
  } catch (error) {
    console.error('修改订单时出错:', error);
    throw error;
  }
};

export default {
  createBooking,
  createTourBooking,
  calculateTourPrice,
  getHotelPrices,
  getBookingById,
  cancelBooking,
  payBooking,
  getAvailableDates,
  checkDateAvailability,
  calculatePrice,
  getOrderList,
  cancelOrder,
  getOrderDetail,
  updateOrderByAgent
}; 