import request from '../utils/request';
import { addAuthHeaders } from '../utils/auth';

/**
 * 邮件服务 - 处理邮件发送相关的API请求
 */

/**
 * 发送订单确认邮件给代理商
 * @param {Object} data - 邮件数据
 * @param {string} data.orderId - 订单ID
 * @param {string} data.recipientType - 接收人类型 ('agent' | 'operator')
 * @param {string} data.agentId - 代理商ID
 * @param {string} data.operatorId - 操作员ID (可选)
 * @param {Object} data.orderDetails - 订单详情
 * @returns {Promise} - 请求Promise
 */
export const sendConfirmationEmail = (data) => {
  const headers = addAuthHeaders();
  
  return request.post('/email/send-confirmation', data, { headers });
};

/**
 * 发送发票邮件给代理商主号
 * @param {Object} data - 发票数据
 * @param {string} data.orderId - 订单ID
 * @param {string} data.agentId - 代理商主号ID
 * @param {string} data.operatorId - 操作员ID (可选)
 * @param {Object} data.invoiceDetails - 发票详情
 * @returns {Promise} - 请求Promise
 */
export const sendInvoiceEmail = (data) => {
  const headers = addAuthHeaders();
  
  return request.post('/email/send-invoice', data, { headers });
};

/**
 * 获取用户邮箱地址
 * @param {string} userId - 用户ID
 * @returns {Promise} - 请求Promise
 */
export const getUserEmail = (userId) => {
  const headers = addAuthHeaders();
  
  return request.get(`/users/${userId}/email`, {}, { headers });
};

/**
 * 获取代理商邮箱地址
 * @param {string} agentId - 代理商ID
 * @returns {Promise} - 请求Promise
 */
export const getAgentEmail = (agentId) => {
  const headers = addAuthHeaders();
  
  return request.get(`/agents/${agentId}/email`, {}, { headers });
};

export default {
  sendConfirmationEmail,
  sendInvoiceEmail,
  getUserEmail,
  getAgentEmail
}; 