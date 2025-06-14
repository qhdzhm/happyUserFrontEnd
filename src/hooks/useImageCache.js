import { useState, useEffect, useCallback } from 'react';
import { getCachedImageUrl, preloadImages } from '../utils/imageCache';
import { convertToCdnUrl } from '../utils/imageUtils';

/**
 * 图片缓存Hook
 * @param {string} imageUrl - 图片URL
 * @param {Object} options - 选项
 * @returns {Object} 缓存状态和方法
 */
export const useImageCache = (imageUrl, options = {}) => {
  const [cachedUrl, setCachedUrl] = useState(imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadImage = useCallback(async (url) => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      // 先转换为CDN URL
      const cdnUrl = convertToCdnUrl(url);
      // 然后获取缓存的URL
      const cached = await getCachedImageUrl(cdnUrl);
      setCachedUrl(cached);
    } catch (err) {
      setError(err);
      setCachedUrl(url); // 降级到原始URL
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImage(imageUrl);
  }, [imageUrl, loadImage]);

  const retry = useCallback(() => {
    loadImage(imageUrl);
  }, [imageUrl, loadImage]);

  return {
    src: cachedUrl,
    isLoading,
    error,
    retry
  };
};

/**
 * 图片列表预加载Hook
 * @param {string[]} imageUrls - 图片URL数组
 * @param {Object} options - 选项
 */
export const useImagePreload = (imageUrls = [], options = {}) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);

  const startPreload = useCallback(async () => {
    if (!imageUrls.length) return;

    setIsPreloading(true);
    setPreloadedCount(0);

    try {
      // 转换为CDN URL
      const cdnUrls = imageUrls.map(convertToCdnUrl);
      
      // 预加载图片
      await preloadImages(cdnUrls);
      setPreloadedCount(cdnUrls.length);
    } catch (error) {
      console.warn('图片预加载失败:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [imageUrls]);

  useEffect(() => {
    if (options.autoStart !== false) {
      startPreload();
    }
  }, [startPreload, options.autoStart]);

  return {
    isPreloading,
    preloadedCount,
    totalCount: imageUrls.length,
    startPreload
  };
}; 