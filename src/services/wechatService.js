import request from '../utils/request';
import { addAuthHeaders, setToken } from '../utils/auth';

/**
 * 微信相关服务 - 处理微信登录相关API请求
 */

/**
 * 获取微信登录二维码URL
 * @returns {Promise} - 请求Promise
 */
export const getWechatQrCodeUrl = () => {
  return request.get('/api/user/wechat/qrcode-url');
};

/**
 * 使用微信授权码登录
 * @param {string} code - 微信授权码
 * @returns {Promise} - 请求Promise
 */
export const wechatLogin = (code) => {
  return request.get(`/api/user/wechat/login?code=${code}`).then(response => {
    // 如果登录成功，保存token
    if (response && response.code === 1 && response.data) {
      const { token, id, userType } = response.data;
      
      // 保存token
      setToken(token);
      
      // 保存其他用户信息
      if (id) localStorage.setItem('userId', id);
      if (userType) localStorage.setItem('userType', userType);
    }
    
    return response;
  });
};

/**
 * 检查微信登录状态
 * @param {string} state - 微信登录状态参数
 * @returns {Promise} - 请求Promise
 */
export const checkWechatLoginStatus = (state) => {
  return request.get(`/api/user/wechat/check-status?state=${state}`);
};

export default {
  getWechatQrCodeUrl,
  wechatLogin,
  checkWechatLoginStatus
}; 