import React, { useState, useEffect } from 'react';
import { getCacheStatus, clearImageCache } from '../../utils/imageCache';
import './CacheManager.css';

/**
 * 缓存管理组件
 * 显示缓存状态和提供清理功能
 */
const CacheManager = ({ className }) => {
  const [cacheStatus, setCacheStatus] = useState({
    memoryCache: 0,
    indexedDBCache: 0,
    memoryCacheLimit: 50
  });
  const [isClearing, setIsClearing] = useState(false);
  const [lastClearTime, setLastClearTime] = useState(null);

  // 获取缓存状态
  const refreshStatus = async () => {
    try {
      const status = await getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.warn('获取缓存状态失败:', error);
    }
  };

  // 清理缓存
  const handleClearCache = async () => {
    if (isClearing) return;
    
    setIsClearing(true);
    try {
      await clearImageCache();
      setLastClearTime(new Date().toLocaleString());
      await refreshStatus();
    } catch (error) {
      console.error('清理缓存失败:', error);
      alert('清理缓存失败，请刷新页面后重试');
    } finally {
      setIsClearing(false);
    }
  };

  // 格式化缓存大小（估算）
  const formatCacheSize = (count) => {
    const estimatedSizePerImage = 100; // KB
    const totalSizeKB = count * estimatedSizePerImage;
    
    if (totalSizeKB < 1024) {
      return `约 ${totalSizeKB} KB`;
    } else {
      return `约 ${(totalSizeKB / 1024).toFixed(1)} MB`;
    }
  };

  useEffect(() => {
    refreshStatus();
    // 定期更新状态
    const interval = setInterval(refreshStatus, 10000); // 每10秒更新一次
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`cache-manager ${className || ''}`}>
      <div className="cache-manager-header">
        <h3>图片缓存管理</h3>
        <button className="refresh-button" onClick={refreshStatus}>
          🔄 刷新
        </button>
      </div>

      <div className="cache-stats">
        <div className="stat-item">
          <div className="stat-label">内存缓存</div>
          <div className="stat-value">
            {cacheStatus.memoryCache} / {cacheStatus.memoryCacheLimit}
          </div>
          <div className="stat-description">
            当前页面的快速缓存
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">本地缓存</div>
          <div className="stat-value">
            {cacheStatus.indexedDBCache} 张图片
          </div>
          <div className="stat-description">
            {formatCacheSize(cacheStatus.indexedDBCache)}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">缓存时效</div>
          <div className="stat-value">7天</div>
          <div className="stat-description">
            自动清理过期缓存
          </div>
        </div>
      </div>

      <div className="cache-actions">
        <button 
          className="clear-cache-button"
          onClick={handleClearCache}
          disabled={isClearing}
        >
          {isClearing ? '清理中...' : '🗑️ 清理所有缓存'}
        </button>

        {lastClearTime && (
          <div className="last-clear-time">
            上次清理: {lastClearTime}
          </div>
        )}
      </div>

      <div className="cache-info">
        <h4>缓存说明</h4>
        <ul>
          <li><strong>内存缓存:</strong> 存储在浏览器内存中，页面刷新后清空，访问最快</li>
          <li><strong>本地缓存:</strong> 存储在浏览器本地数据库中，关闭浏览器后仍然保留</li>
          <li><strong>CDN加速:</strong> 图片通过CDN域名访问，提供更快的加载速度</li>
          <li><strong>自动转换:</strong> 旧的OSS链接会自动转换为CDN链接</li>
        </ul>
      </div>
    </div>
  );
};

export default CacheManager; 