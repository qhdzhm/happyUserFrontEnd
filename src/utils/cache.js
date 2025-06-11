/**
 * 简单的缓存工具，用于缓存 API 请求结果
 */

// 缓存对象
const cache = {};

// 默认缓存时间（毫秒）
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5分钟

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number} expireTime - 过期时间（毫秒）
 */
export const setCache = (key, value, expireTime = DEFAULT_CACHE_TIME) => {
  cache[key] = {
    value,
    expire: Date.now() + expireTime
  };
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {any|null} - 缓存值或null（如果缓存不存在或已过期）
 */
export const getCache = (key) => {
  const data = cache[key];
  
  if (!data) {
    return null;
  }
  
  // 检查是否过期
  if (data.expire < Date.now()) {
    // 删除过期缓存
    delete cache[key];
    return null;
  }
  
  return data.value;
};

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
export const removeCache = (key) => {
  delete cache[key];
};

/**
 * 清除所有缓存
 */
export const clearCache = () => {
  Object.keys(cache).forEach(key => {
    delete cache[key];
  });
};

/**
 * 清除过期缓存
 */
export const clearExpiredCache = () => {
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    if (cache[key].expire < now) {
      delete cache[key];
    }
  });
};

// 定期清除过期缓存
setInterval(clearExpiredCache, 60 * 1000); // 每分钟清除一次过期缓存 