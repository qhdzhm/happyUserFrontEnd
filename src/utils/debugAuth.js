/**
 * 认证调试工具 - 帮助诊断和控制认证模式
 */

/**
 * 启用Cookie-only认证模式
 */
export const enableCookieOnlyAuth = () => {
  localStorage.setItem('forceCookieAuth', 'true');
  console.log('✅ 已启用Cookie-only认证模式');
  
  // 清除现有的token
  const tokenKeys = ['token', 'authentication', 'userToken', 'jwt'];
  tokenKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 已清除localStorage中的token');
  
  // 提示用户重新加载页面
  console.log('🔄 请刷新页面以生效');
};

/**
 * 禁用Cookie-only认证模式
 */
export const disableCookieOnlyAuth = () => {
  localStorage.removeItem('forceCookieAuth');
  console.log('❌ 已禁用Cookie-only认证模式，回到Token认证');
  console.log('🔄 请刷新页面以生效');
};

/**
 * 检查当前认证模式状态
 */
export const checkAuthMode = () => {
  const { shouldUseCookieAuth, hasUserInfoCookie, getCookies } = require('./auth');
  
  const forceCookieAuth = localStorage.getItem('forceCookieAuth');
  const useCookieAuth = shouldUseCookieAuth();
  const hasUserInfo = hasUserInfoCookie();
  
  console.log('🔍 认证模式诊断:');
  console.log('  - 强制Cookie认证:', forceCookieAuth === 'true' ? '✅ 是' : '❌ 否');
  console.log('  - 检测到userInfo Cookie:', hasUserInfo ? '✅ 是' : '❌ 否');
  console.log('  - 当前认证模式:', useCookieAuth ? '🍪 Cookie' : '🔑 Token');
  
  // 显示当前Cookie
  const cookies = getCookies();
  console.log('  - 当前Cookie:', Object.keys(cookies).length > 0 ? cookies : '无');
  
  // 显示localStorage中的认证信息
  const tokenKeys = ['token', 'authentication', 'userToken', 'jwt'];
  const tokens = {};
  tokenKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) tokens[key] = value.substring(0, 20) + '...';
  });
  console.log('  - localStorage中的token:', Object.keys(tokens).length > 0 ? tokens : '无');
  
  return {
    forceCookieAuth: forceCookieAuth === 'true',
    useCookieAuth,
    hasUserInfo,
    cookies,
    tokens
  };
};

/**
 * 清除所有认证信息
 */
export const clearAllAuth = () => {
  // 清除localStorage
  const allKeys = ['token', 'authentication', 'userToken', 'jwt', 'userType', 'username', 'agentId', 'userId', 'forceCookieAuth'];
  allKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 已清除所有localStorage认证信息');
  console.log('⚠️  注意: Cookie需要在后端清除');
  console.log('🔄 请刷新页面以生效');
};

// 认证调试工具
export const debugCurrentAuthState = () => {
  console.log('🔍 当前认证状态调试：');
  console.log('📊 localStorage信息:', {
    token: localStorage.getItem('token'),
    userType: localStorage.getItem('userType'),
    username: localStorage.getItem('username'),
    agentId: localStorage.getItem('agentId'),
    operatorId: localStorage.getItem('operatorId'),
    discountRate: localStorage.getItem('discountRate'),
    canSeeDiscount: localStorage.getItem('canSeeDiscount'),
    canSeeCredit: localStorage.getItem('canSeeCredit')
  });
  
  console.log('🍪 Cookie信息:');
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      console.log(`  ${name}: ${decodeURIComponent(value)}`);
    }
  });
  
  const { isAuthenticated, getUserType, isAgent } = require('./auth');
  console.log('🔐 认证函数结果:', {
    isAuthenticated: isAuthenticated(),
    userType: getUserType(),
    isAgent: isAgent()
  });
};

// 在浏览器控制台中可用的全局函数
if (typeof window !== 'undefined') {
  window.authDebug = {
    enableCookieOnly: enableCookieOnlyAuth,
    disableCookieOnly: disableCookieOnlyAuth,
    checkMode: checkAuthMode,
    clearAll: clearAllAuth
  };
  
  console.log('🔧 认证调试工具已加载，可在控制台使用:');
  console.log('  - authDebug.enableCookieOnly() - 启用Cookie-only模式');
  console.log('  - authDebug.disableCookieOnly() - 禁用Cookie-only模式');
  console.log('  - authDebug.checkMode() - 检查当前认证模式');
  console.log('  - authDebug.clearAll() - 清除所有认证信息');
  
  window.debugAuth = debugCurrentAuthState;
} 