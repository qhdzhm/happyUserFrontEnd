import { api } from './api';
import { addAuthHeaders } from '../utils/auth';

/**
 * 处理一日游数据，确保ID字段的一致性
 * @param {Object|Array} data - API返回的数据
 * @returns {Object|Array} - 处理后的数据
 */
const processDayTourData = (data) => {
  if (!data) return data;
  
  // 处理数组数据
  if (Array.isArray(data)) {
    return data.map(item => processDayTourData(item));
  }
  
  // 处理单个对象
  let processedData = { ...data };
  
  // 确保id字段存在
  if (processedData.dayTourId && !processedData.id) {
    processedData.id = processedData.dayTourId;
  } else if (processedData.id && !processedData.dayTourId) {
    processedData.dayTourId = processedData.id;
  }
  
  return processedData;
};

/**
 * 一日游相关API服务
 */
export const tourService = {
  /**
   * 获取一日游列表（分页）
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} - 包含一日游列表的对象
   */
  getDayTours: (params = {}) => {
    return api.get('/user', params).then(response => {
      if (response && response.code === 1) {
        // 处理分页数据
        if (response.data && response.data.records) {
          response.data.records = processDayTourData(response.data.records);
        } else if (Array.isArray(response.data)) {
          response.data = processDayTourData(response.data);
        }
      }
      return response;
    });
  },

  /**
   * 获取一日游详情
   * @param {number} id - 一日游ID
   * @returns {Promise<Object>} - 一日游详情
   */
  getDayTourById: (id) => {
    return api.get(`/user/day-tours/${id}`).then(response => {
      if (response && response.code === 1 && response.data) {
        response.data = processDayTourData(response.data);
      }
      return response;
    });
  },

  /**
   * 获取一日游亮点
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 亮点列表
   */
  getDayTourHighlights: (id) => {
    return api.get(`/user/admin/daytour/highlights/${id}`);
  },

  /**
   * 获取一日游包含项
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 包含项列表
   */
  getDayTourInclusions: (id) => {
    return api.get(`/user/admin/daytour/inclusions/${id}`);
  },

  /**
   * 获取一日游不包含项
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 不包含项列表
   */
  getDayTourExclusions: (id) => {
    return api.get(`/user/admin/daytour/exclusions/${id}`);
  },

  /**
   * 获取一日游常见问题
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 常见问题列表
   */
  getDayTourFaqs: (id) => {
    return api.get(`/user/admin/daytour/faqs/${id}`);
  },

  /**
   * 获取一日游旅行提示
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 旅行提示列表
   */
  getDayTourTips: (id) => {
    return api.get(`/user/admin/daytour/tips/${id}`);
  },

  /**
   * 获取一日游行程安排
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 行程安排列表
   */
  getDayTourItineraries: (id) => {
    return api.get(`/user/admin/daytour/itineraries/${id}`);
  },

  /**
   * 获取一日游日程安排
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 日程安排列表
   */
  getDayTourSchedules: (id) => {
    return api.get(`/user/${id}/schedules`);
  },

  /**
   * 获取一日游图片
   * @param {number} id - 一日游ID
   * @returns {Promise<Array>} - 图片列表
   */
  getDayTourImages: (id) => {
    return api.get(`/user/admin/daytour/images/${id}`);
  },

  /**
   * 获取热门一日游
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} - 热门一日游列表
   */
  getHotDayTours: (limit = 6) => {
    return api.get('/user/hot', { limit }).then(response => {
      if (response && response.code === 1 && response.data) {
        response.data = processDayTourData(response.data);
      }
      return response;
    });
  },

  /**
   * 获取推荐一日游
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>} - 推荐一日游列表
   */
  getRecommendedDayTours: (limit = 6) => {
    return api.get('/user/recommended', { limit }).then(response => {
      if (response && response.code === 1 && response.data) {
        response.data = processDayTourData(response.data);
      }
      return response;
    });
  },

  /**
   * 按主题获取一日游
   * @param {string} theme - 主题名称
   * @param {Object} params - 其他查询参数
   * @returns {Promise<Array>} - 按主题筛选的一日游列表
   */
  getDayToursByTheme: (theme, params = {}) => {
    return api.get(`/user/theme/${theme}`, params).then(response => {
      if (response && response.code === 1 && response.data) {
        response.data = processDayTourData(response.data);
      }
      return response;
    });
  },

  /**
   * 获取所有一日游主题
   * @returns {Promise<Array>} - 主题列表
   */
  getAllThemes: () => {
    return api.get('/user/themes');
  }
};

export default tourService; 