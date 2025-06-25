/**
 * 认证清理工具 - 清除localStorage中的旧token数据
 * 用于从Token认证模式迁移到Cookie-only认证模式
 */

/**
 * 清除所有localStorage中的token相关数据
 */
export const cleanupLegacyTokens = () => {
  const tokenKeys = [
    'token', 
    'authentication', 
    'userToken', 
    'jwt',
    'agent_token',
    'user_token',
    'token_meta'
  ];
  
  let cleanedCount = 0;
  
  tokenKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleanedCount++;
      console.log(`🧹 已清除旧token: ${key}`);
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`✅ 共清除了 ${cleanedCount} 个旧token数据`);
    console.log('🍪 系统现在使用Cookie-only认证模式');
  } else {
    console.log('✅ localStorage中没有发现旧token数据');
  }
  
  return cleanedCount;
};

/**
 * 检查localStorage中是否还有token数据
 */
export const checkForLegacyTokens = () => {
  const tokenKeys = [
    'token', 
    'authentication', 
    'userToken', 
    'jwt',
    'agent_token',
    'user_token',
    'token_meta'
  ];
  
  const foundTokens = [];
  
  tokenKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      foundTokens.push({
        key,
        preview: value.substring(0, 20) + '...'
      });
    }
  });
  
  if (foundTokens.length > 0) {
    console.warn('⚠️ 检测到localStorage中还有旧token数据:');
    foundTokens.forEach(token => {
      console.warn(`  - ${token.key}: ${token.preview}`);
    });
    console.log('💡 运行 cleanupLegacyTokens() 来清除这些数据');
  } else {
    console.log('✅ localStorage中没有旧token数据');
  }
  
  return foundTokens;
};

/**
 * 自动运行清理（在应用启动时调用）
 */
export const autoCleanupOnStart = () => {
  console.log('🔍 检查是否需要清理旧token数据...');
  
  const foundTokens = checkForLegacyTokens();
  
  if (foundTokens.length > 0) {
    console.log('🧹 自动清理旧token数据...');
    cleanupLegacyTokens();
    
    // 显示用户友好的提示
    if (typeof window !== 'undefined' && window.location) {
      console.log('🔄 建议刷新页面以确保认证状态正确');
    }
  }
};

// 在浏览器环境中添加到全局对象
if (typeof window !== 'undefined') {
  window.authCleanup = {
    cleanup: cleanupLegacyTokens,
    check: checkForLegacyTokens,
    auto: autoCleanupOnStart
  };
  
  console.log('🔧 认证清理工具已加载，可在控制台使用:');
  console.log('  - authCleanup.cleanup() - 清除旧token');
  console.log('  - authCleanup.check() - 检查旧token');
  console.log('  - authCleanup.auto() - 自动清理');
}

export default {
  cleanupLegacyTokens,
  checkForLegacyTokens,
  autoCleanupOnStart
}; 