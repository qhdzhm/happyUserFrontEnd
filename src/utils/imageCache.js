/**
 * 简化版图片缓存系统
 * 直接缓存图片到用户电脑，不依赖CDN
 */

// 内存缓存 - 最快速访问
const memoryCache = new Map();
const MAX_MEMORY_CACHE_SIZE = 50; // 最多缓存50张图片在内存中

// IndexedDB 配置
const DB_NAME = 'ImageCache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天过期

/**
 * 初始化IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * 从IndexedDB中获取图片
 */
const getFromIndexedDB = async (url) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp) < CACHE_DURATION) {
          resolve(result.blob);
        } else {
          // 过期删除
          if (result) {
            deleteFromIndexedDB(url);
          }
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.warn('IndexedDB访问失败:', error);
    return null;
  }
};

/**
 * 保存图片到IndexedDB
 */
const saveToIndexedDB = async (url, blob) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise((resolve, reject) => {
      const request = store.put({
        url,
        blob,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('保存到IndexedDB失败:', error);
  }
};

/**
 * 从IndexedDB删除过期图片
 */
const deleteFromIndexedDB = async (url) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(url);
  } catch (error) {
    console.warn('从IndexedDB删除失败:', error);
  }
};

/**
 * 内存缓存管理
 */
const addToMemoryCache = (url, objectUrl) => {
  // 如果超过最大缓存数量，删除最旧的缓存
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    const oldObjectUrl = memoryCache.get(firstKey);
    URL.revokeObjectURL(oldObjectUrl); // 释放内存
    memoryCache.delete(firstKey);
  }
  
  memoryCache.set(url, objectUrl);
};

/**
 * 从网络获取图片并缓存
 */
async function fetchAndCacheImage(originalUrl, cacheKey) {
  console.log('开始缓存图片:', originalUrl);
  
  try {
    const response = await fetch(originalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*;q=0.9'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      // 缓存到内存和IndexedDB
      addToMemoryCache(cacheKey, objectUrl);
      await saveToIndexedDB(cacheKey, blob);
      
      console.log('✓ 图片已缓存到本地:', originalUrl);
      return objectUrl;
    } else {
      console.log('📷 图片请求失败，使用原始URL:', response.status);
      return originalUrl;
    }
    
  } catch (error) {
    console.log('📷 图片缓存失败，使用原始URL:', error.message);
    return originalUrl;
  }
}

/**
 * 获取缓存的图片URL
 */
export const getCachedImageUrl = async (imageUrl) => {
  if (!imageUrl) return imageUrl;
  
  try {
    // 1. 检查内存缓存
    if (memoryCache.has(imageUrl)) {
      console.log('✓ 从内存缓存获取图片:', imageUrl);
      return memoryCache.get(imageUrl);
    }
    
    // 2. 检查IndexedDB缓存
    const cachedBlob = await getFromIndexedDB(imageUrl);
    if (cachedBlob) {
      const objectUrl = URL.createObjectURL(cachedBlob);
      addToMemoryCache(imageUrl, objectUrl);
      console.log('✓ 从IndexedDB缓存获取图片:', imageUrl);
      return objectUrl;
    }
    
    // 3. 尝试缓存（包括OSS图片）
    const objectUrl = await fetchAndCacheImage(imageUrl, imageUrl);
    return objectUrl;
    
  } catch (error) {
    console.warn('获取缓存图片失败，使用原始URL:', error);
    return imageUrl;
  }
};

/**
 * 预加载图片
 */
export const preloadImages = async (imageUrls) => {
  const promises = imageUrls
    .filter(url => url && !memoryCache.has(url))
    .slice(0, 10) // 限制同时预加载的数量
    .map(url => getCachedImageUrl(url).catch(() => null));
  
  await Promise.allSettled(promises);
};

/**
 * 清理所有缓存
 */
export const clearImageCache = async () => {
  // 清理内存缓存
  memoryCache.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
  memoryCache.clear();
  
  // 清理IndexedDB
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    console.log('✓ 缓存已清理');
  } catch (error) {
    console.warn('清理IndexedDB失败:', error);
  }
};

/**
 * 获取缓存状态
 */
export const getCacheStatus = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        resolve({
          memoryCache: memoryCache.size,
          indexedDBCache: countRequest.result,
          memoryCacheLimit: MAX_MEMORY_CACHE_SIZE
        });
      };
      countRequest.onerror = () => resolve({
        memoryCache: memoryCache.size,
        indexedDBCache: 0,
        memoryCacheLimit: MAX_MEMORY_CACHE_SIZE
      });
    });
  } catch (error) {
    return {
      memoryCache: memoryCache.size,
      indexedDBCache: 0,
      memoryCacheLimit: MAX_MEMORY_CACHE_SIZE
    };
  }
};

/**
 * 清理过期的IndexedDB缓存
 */
const cleanupIndexedDB = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    // 删除7天前的缓存
    const cutoffTime = Date.now() - CACHE_DURATION;
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    index.openCursor(range).onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn('清理IndexedDB缓存失败:', error);
  }
};

// 定期清理过期缓存
setInterval(cleanupIndexedDB, 24 * 60 * 60 * 1000); // 每天清理一次

// 页面卸载时清理内存缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryCache.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
  });
}

/**
 * 清理特定图片的缓存
 */
export const clearSpecificImageCache = async (imageUrl) => {
  try {
    // 清理内存缓存
    if (memoryCache.has(imageUrl)) {
      const objectUrl = memoryCache.get(imageUrl);
      URL.revokeObjectURL(objectUrl);
      memoryCache.delete(imageUrl);
    }
    
    // 清理IndexedDB缓存
    await deleteFromIndexedDB(imageUrl);
    
    console.log('✓ 已清理特定图片缓存:', imageUrl);
    return true;
  } catch (error) {
    console.warn('清理特定图片缓存失败:', error);
    return false;
  }
};

/**
 * 强制重新缓存图片
 */
export const forceRecacheImage = async (imageUrl) => {
  try {
    // 先清理旧缓存
    await clearSpecificImageCache(imageUrl);
    
    // 重新获取并缓存
    const newUrl = await getCachedImageUrl(imageUrl);
    console.log('✓ 已强制重新缓存图片:', imageUrl);
    return newUrl;
  } catch (error) {
    console.warn('强制重新缓存失败:', error);
    return imageUrl;
  }
}; 