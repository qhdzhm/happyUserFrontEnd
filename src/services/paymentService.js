import request from '../utils/request';
import { addAuthHeaders } from '../utils/auth';

/**
 * 支付服务 - 处理与支付相关的API请求
 */

/**
 * 创建支付记录
 * @param {Object} paymentData - 支付数据，包含以下字段：
 * - bookingId: 订单ID (必填)
 * - amount: 支付金额 (必填)
 * - paymentMethod: 支付方式 (必填)
 * - userId: 用户ID (选填)
 * @returns {Promise} - 请求Promise
 */
export const createPayment = (paymentData) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  return request.post('/api/user/payments/create', paymentData, { headers });
};

/**
 * 获取支付记录
 * @param {string} id - 支付记录ID
 * @returns {Promise} - 请求Promise
 */
export const getPaymentById = (id) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  return request.get(`/api/user/payments/${id}`, {}, { headers });
};

/**
 * 获取订单的支付记录
 * @param {string} bookingId - 订单ID
 * @returns {Promise} - 请求Promise
 */
export const getPaymentsByBookingId = (bookingId) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  return request.get(`/api/user/payments/booking/${bookingId}`, {}, { headers });
};

/**
 * 处理支付
 * @param {string} bookingId - 订单ID或订单号
 * @param {Object} paymentData - 支付数据
 * @returns {Promise} - 请求Promise
 * 
 * 🔒 安全说明：金额字段由后端重新计算和验证，前端不再传递价格信息
 */
export const processPayment = (bookingId, paymentData) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 判断是否是订单号格式（以HT开头的字符串）
  const isOrderNumber = typeof bookingId === 'string' && bookingId.startsWith('HT');
  
  // 完整记录所有支付参数用于调试
  console.log('支付处理参数：', {
    bookingId,
    isOrderNumber,
    paymentData,
    headers: Object.keys(headers),
    hasAuth: !!headers.authentication
  });
  
  // 根据ID类型使用不同的endpoint
  let endpoint;
  if (isOrderNumber) {
    console.log(`使用订单号格式的支付请求: ${bookingId}`);
    endpoint = `/api/user/order-numbers/${bookingId}/pay`;
  } else {
    console.log(`使用标准订单ID的支付请求: ${bookingId}`);
    endpoint = `/api/user/bookings/${bookingId}/pay`;
  }
  
  // 添加重试逻辑以提高可靠性
  return new Promise((resolve, reject) => {
    const doRequest = async (retries = 2) => {
      try {
        const response = await request.post(endpoint, paymentData, { headers });
        resolve(response);
      } catch (error) {
        if (retries > 0) {
          console.log(`支付请求失败，${retries}秒后重试...`);
          setTimeout(() => doRequest(retries - 1), 1000);
        } else {
          console.error('支付请求多次尝试失败', error);
          reject(error);
        }
      }
    };
    
    // 开始请求
    doRequest();
  });
};

/**
 * 导航到支付页面的辅助函数
 * @param {string} orderId - 订单ID
 * @param {Object} navigate - react-router-dom 的 navigate 函数
 * @param {Object} [extraData] - 额外的数据，将作为 state 传递给支付页面
 */
export const navigateToPayment = (orderId, navigate, extraData = {}) => {
  if (!orderId || !navigate) {
    console.error('导航到支付页面失败: 缺少订单ID或navigate函数');
    return;
  }
  
  navigate(`/payment/${orderId}`, { 
    state: extraData 
  });
};

/**
 * 检查订单是否已支付
 * @param {Object} orderData - 订单数据
 * @returns {boolean} - 是否已支付
 */
export const isOrderPaid = (orderData) => {
  if (!orderData) return false;
  
  // 检查支付状态
  return orderData.paymentStatus === 'paid' || 
         orderData.payment_status === 'paid' ||
         orderData.status === 'paid';
};

/**
 * 获取支付状态文本
 * @param {string} status - 支付状态
 * @returns {string} - 状态文本
 */
export const getPaymentStatusText = (status) => {
  switch(status) {
    case 'paid':
      return '已支付';
    case 'unpaid':
      return '待支付';
    case 'failed':
      return '支付失败';
    case 'refunded':
      return '已退款';
    case 'partially_refunded':
      return '部分退款';
    default:
      return '未知状态';
  }
};

/**
 * 获取可用的支付方式
 * @returns {Array} - 支付方式数组
 */
export const getAvailablePaymentMethods = () => {
  return [
    { id: 'wechat', name: '微信支付', icon: 'wechat' },
    { id: 'alipay', name: '支付宝', icon: 'alipay' },
    { id: 'credit_card', name: '信用卡', icon: 'credit-card' },
    { id: 'bank_transfer', name: '银行转账', icon: 'bank' }
  ];
};

/**
 * 使用信用额度支付
 * @param {Object} creditPaymentDTO - 信用额度支付数据，包含以下字段：
 * - bookingId: 订单ID或订单号 (必填)
 * - note: 备注 (可选)
 * @returns {Promise} - 请求Promise
 * 
 * 🔒 安全说明：金额字段由后端重新计算和验证，确保支付安全
 */
export const processCreditPayment = (creditPaymentDTO) => {
  // 添加认证头部
  const headers = addAuthHeaders();
  
  // 判断是否是订单号格式（以HT开头的字符串）
  const bookingId = creditPaymentDTO.bookingId;
  const isOrderNumber = typeof bookingId === 'string' && bookingId.startsWith('HT');
  
  // 完整记录所有参数用于调试
  console.log('信用额度支付处理参数：', {
    creditPaymentDTO,
    bookingId,
    isOrderNumber,
    headers: Object.keys(headers),
    hasAuth: !!headers.authentication
  });
  
  // 添加重试逻辑以提高可靠性
  return new Promise((resolve, reject) => {
    const doRequest = async (retries = 2) => {
      try {
        let response;
        
        // 如果是订单号格式，修改请求路径和参数
        if (isOrderNumber) {
          console.log(`使用订单号格式的信用额度支付请求: ${bookingId}`);
          // 创建新的DTO，将bookingId改为orderNumber
          const modifiedDTO = {
            ...creditPaymentDTO,
            orderNumber: bookingId,
            bookingId: undefined
          };
          response = await request.post('/api/user/payments/credit-by-order-number', modifiedDTO, { headers });
        } else {
          // 使用标准API路径
          response = await request.post('/api/user/payments/credit', creditPaymentDTO, { headers });
        }
        
        resolve(response);
      } catch (error) {
        if (retries > 0) {
          console.log(`信用额度支付请求失败，${retries}秒后重试...`);
          setTimeout(() => doRequest(retries - 1), 1000);
        } else {
          console.error('信用额度支付请求多次尝试失败', error);
          reject(error);
        }
      }
    };
    
    // 开始请求
    doRequest();
  });
};

export default {
  createPayment,
  getPaymentById,
  getPaymentsByBookingId,
  processPayment,
  processCreditPayment,
  navigateToPayment,
  isOrderPaid,
  getPaymentStatusText,
  getAvailablePaymentMethods
}; 