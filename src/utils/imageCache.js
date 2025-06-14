/**
 * 图片缓存系统
 * 多层缓存策略：内存缓存 -> IndexedDB -> 网络请求
 */

import { convertToCdnUrl } from './imageUtils.js';

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
  console.log('开始从网络获取图片:', originalUrl);
  
  try {
    // 1. 首先尝试CDN URL
    const cdnUrl = convertToCdnUrl(originalUrl);
    console.log('尝试CDN URL:', cdnUrl);
    
    if (cdnUrl !== originalUrl) {
      try {
        const cdnResponse = await fetch(cdnUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/*,*/*;q=0.8'
          }
        });
        
        if (cdnResponse.ok) {
          const blob = await cdnResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          // 缓存到内存和IndexedDB
          memoryCache.set(cacheKey, objectUrl);
          await saveToIndexedDB(cacheKey, {
            url: objectUrl,
            blob: blob,
            timestamp: Date.now(),
            originalUrl: originalUrl,
            source: 'cdn'
          });
          
          console.log('✓ CDN图片获取成功，已缓存');
          return objectUrl;
        }
      } catch (cdnError) {
        console.log('网络请求图片失败:', cdnError);
        console.log('CDN失败，尝试使用OSS原始域名...');
      }
    }
    
    // 2. CDN失败，尝试OSS原始URL（仅当URL不同时）
    if (cdnUrl !== originalUrl) {
      try {
        const ossResponse = await fetch(originalUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'image/*,*/*;q=0.8'
          }
        });
        
        if (ossResponse.ok) {
          const blob = await ossResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          // 缓存到内存和IndexedDB
          memoryCache.set(cacheKey, objectUrl);
          await saveToIndexedDB(cacheKey, {
            url: objectUrl,
            blob: blob, 
            timestamp: Date.now(),
            originalUrl: originalUrl,
            source: 'oss'
          });
          
          console.log('✓ OSS图片获取成功，已缓存');
          return objectUrl;
        }
      } catch (ossError) {
        console.log('OSS备用方案也失败:', ossError);
      }
    }
    
    // 3. 都失败了，直接返回原始URL（不进行fetch，避免CORS问题）
    console.log('⚠️ CDN和OSS都失败，直接使用原始URL（不缓存）');
    return originalUrl;
    
  } catch (error) {
    console.log('获取缓存图片失败，使用原始URL:', error);
    return originalUrl;
  }
}

/**
 * 获取缓存的图片URL
 * @param {string} imageUrl - 图片URL
 * @param {Object} options - 选项
 * @returns {Promise<string>} 可用的图片URL
 */
export const getCachedImageUrl = async (imageUrl) => {
  if (!imageUrl) return imageUrl;
  
  try {
    // 1. 检查内存缓存
    if (memoryCache.has(imageUrl)) {
      return memoryCache.get(imageUrl);
    }
    
    // 2. 检查IndexedDB缓存
    const cachedBlob = await getFromIndexedDB(imageUrl);
    if (cachedBlob) {
      const objectUrl = URL.createObjectURL(cachedBlob);
      addToMemoryCache(imageUrl, objectUrl);
      return objectUrl;
    }
    
    // 3. 网络请求
    const objectUrl = await fetchAndCacheImage(imageUrl, imageUrl);
    
    return objectUrl;
  } catch (error) {
    console.warn('获取缓存图片失败，使用原始URL:', error);
    return imageUrl; // 降级到原始URL
  }
};

/**
 * 预加载图片
 * @param {string[]} imageUrls - 图片URL数组
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

// 定期清理过期缓存
setInterval(cleanupIndexedDB, 24 * 60 * 60 * 1000); // 每天清理一次

// 页面卸载时清理内存缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryCache.forEach(objectUrl => URL.revokeObjectURL(objectUrl));
  });
} 