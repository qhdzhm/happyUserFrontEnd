import request from '../utils/request';
import { addAuthHeaders } from '../utils/auth';

/**
 * 航班查询服务 - 处理与航班信息相关的API请求
 */

/**
 * 根据航班号和日期查询航班信息
 * @param {string} flightNumber - 航班号 (例如: JQ723)
 * @param {string} flightDate - 航班日期 (YYYY-MM-DD格式)
 * @returns {Promise} - 请求Promise
 */
export const getFlightByNumber = async (flightNumber, flightDate) => {
  try {
    const headers = addAuthHeaders();
    console.log(`查询航班信息: ${flightNumber}, 日期: ${flightDate}`);
    
    const response = await request.get('/api/flights/search', {
      flightNumber,
      flightDate
    }, { headers });
    
    return response;
  } catch (error) {
    console.error('查询航班信息失败:', error);
    throw error;
  }
};

/**
 * 查询飞往塔斯马尼亚霍巴特的所有航班
 * @param {string} departureCity - 出发城市 (可选, 如: Sydney, Melbourne)
 * @param {string} departureDate - 出发日期 (YYYY-MM-DD格式, 可选)
 * @returns {Promise} - 请求Promise
 */
export const getFlightsToHobart = async (departureCity, departureDate) => {
  try {
    const headers = addAuthHeaders();
    const params = {};
    
    if (departureCity) params.departureCity = departureCity;
    if (departureDate) params.departureDate = departureDate;
    
    const response = await request.get('/api/flights/to-hobart', params, { headers });
    return response;
  } catch (error) {
    console.error('获取飞往霍巴特航班信息失败:', error);
    throw error;
  }
};

/**
 * 查询飞往塔斯马尼亚朗塞斯顿的所有航班
 * @param {string} departureCity - 出发城市 (可选, 如: Sydney, Melbourne)
 * @param {string} departureDate - 出发日期 (YYYY-MM-DD格式, 可选)
 * @returns {Promise} - 请求Promise
 */
export const getFlightsToLaunceston = async (departureCity, departureDate) => {
  try {
    const headers = addAuthHeaders();
    const params = {};
    
    if (departureCity) params.departureCity = departureCity;
    if (departureDate) params.departureDate = departureDate;
    
    const response = await request.get('/api/flights/to-launceston', params, { headers });
    return response;
  } catch (error) {
    console.error('获取飞往朗塞斯顿航班信息失败:', error);
    throw error;
  }
};

/**
 * 获取航空公司列表
 * @returns {Promise} - 请求Promise
 */
export const getAirlines = async () => {
  try {
    const headers = addAuthHeaders();
    const response = await request.get('/api/flights/airlines', {}, { 
      headers,
      useCache: true,
      cacheTime: 24 * 60 * 60 * 1000 // 缓存24小时
    });
    return response;
  } catch (error) {
    console.error('获取航空公司列表失败:', error);
    throw error;
  }
};

/**
 * 检查航班状态
 * @param {string} flightNumber - 航班号
 * @param {string} flightDate - 航班日期 (YYYY-MM-DD格式)
 * @returns {Promise} - 请求Promise
 */
export const checkFlightStatus = async (flightNumber, flightDate) => {
  try {
    const headers = addAuthHeaders();
    const response = await request.get('/api/flights/status', {
      flightNumber,
      flightDate
    }, { headers });
    return response;
  } catch (error) {
    console.error('检查航班状态失败:', error);
    throw error;
  }
};

export default {
  getFlightByNumber,
  getFlightsToHobart,
  getFlightsToLaunceston,
  getAirlines,
  checkFlightStatus
}; 