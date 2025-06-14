import React, { useState } from 'react';
import { useImageCache } from '../../hooks/useImageCache';
import './CachedImage.css';

/**
 * 带缓存功能的图片组件
 * 自动处理CDN转换和本地缓存
 */
const CachedImage = ({ 
  src, 
  alt, 
  className, 
  style,
  placeholder,
  showLoading = true,
  onLoad,
  onError,
  ...props 
}) => {
  const { src: cachedSrc, isLoading, error, retry } = useImageCache(src);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setImageError(true);
    setImageLoaded(false);
    onError?.(e);
  };

  const handleRetry = () => {
    setImageError(false);
    setImageLoaded(false);
    retry();
  };

  // 如果有错误且没有加载成功，显示错误状态
  if ((error || imageError) && !imageLoaded) {
    return (
      <div className={`cached-image-error ${className || ''}`} style={style}>
        <div className="error-content">
          <div className="error-icon">📷</div>
          <div className="error-text">图片加载失败</div>
          <button className="retry-button" onClick={handleRetry}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cached-image-container ${className || ''}`} style={style}>
      {/* 加载中状态 */}
      {(isLoading || !imageLoaded) && showLoading && (
        <div className="cached-image-loading">
          {placeholder || (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <div className="loading-text">加载中...</div>
            </div>
          )}
        </div>
      )}

      {/* 实际图片 */}
      <img
        src={cachedSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`cached-image ${imageLoaded ? 'loaded' : 'loading'}`}
        {...props}
      />
    </div>
  );
};

export default CachedImage; 