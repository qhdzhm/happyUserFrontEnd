import request from '../utils/request';
import { addAuthHeaders } from '../utils/auth';

/**
 * 代理商服务 - 处理与代理商相关的API请求
 */

/**
 * 获取代理商信用额度
 * @param {string} agentId - 代理商ID
 * @returns {Promise} - 请求Promise
 */
export const getAgentCredit = (agentId) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 确保使用相对路径，避免直接请求前端服务器
  const apiUrl = '/api/agent/credit/info';
  
  return request.get(apiUrl, {}, { 
    headers,
    requireAuth: true // 明确指定需要认证
  });
};

/**
 * 申请增加信用额度
 * @param {Object} requestData - 申请数据，包含以下字段：
 * - requestAmount: 申请增加金额 (必填)
 * - reason: 申请原因 (必填)
 * @returns {Promise} - 请求Promise
 */
export const applyCreditIncrease = (requestData) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 更新API路径为/api/agent/credit/application
  return request.post('/api/agent/credit/application', requestData, { headers });
};

/**
 * 获取代理商信用额度交易历史
 * @param {string} agentId - 代理商ID (不再使用，后端从登录信息获取)
 * @param {Object} params - 查询参数，包含page, pageSize, type, startDate, endDate等
 * @returns {Promise} - 请求Promise
 */
export const getCreditTransactionHistory = (agentId, params = {}) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 修正参数名称 - 将type映射为transactionType
  const fixedParams = { ...params };
  if (fixedParams.type) {
    fixedParams.transactionType = fixedParams.type;
    delete fixedParams.type; // 删除原始type参数
  }
  
  // 更新API路径为/api/agent/credit/transactions
  return request.get('/api/agent/credit/transactions', fixedParams, { headers });
};

/**
 * 使用信用额度支付
 * @param {Object} paymentData - 支付数据，包含以下字段：
 * - bookingId: 订单ID (必填)
 * - amount: 支付金额 (必填) 
 * @returns {Promise} - 请求Promise
 */
export const payWithCredit = (paymentData) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 更新API路径为/api/agent/credit/payment
  return request.post('/api/agent/credit/payment', paymentData, { headers });
};

/**
 * 代理商修改密码
 * @param {Object} passwordData - 密码数据，包含以下字段：
 * - oldPassword: 当前密码 (必填)
 * - newPassword: 新密码 (必填)
 * @returns {Promise} - 请求Promise
 */
export const updatePassword = (passwordData) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  return request.put('/api/user/agent/password', passwordData, { headers });
};

export default {
  getAgentCredit,
  applyCreditIncrease,
  getCreditTransactionHistory,
  payWithCredit,
  updatePassword
}; 