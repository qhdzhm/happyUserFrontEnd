import React, { useState, useEffect } from 'react';
import { clearImageCache, getCacheStatus } from '../utils/imageCache';
import CachedImage from '../components/CachedImage/CachedImage';
import CacheManager from '../components/CacheManager/CacheManager';
import './TestCache.css';

const TestCache = () => {
  const [cacheStatus, setCacheStatus] = useState({});

  // 清理所有缓存
  const clearAllCache = async () => {
    await clearImageCache();
    window.location.reload();
  };

  // 刷新页面
  const refreshPage = () => {
    window.location.reload();
  };

  // 测试图片列表 (使用北京区域的OSS)
  const testImages = [
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/149c2355-ad43-4bce-808a-01b78b5e2cfe.jpg',
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/de43d750-d6ae-41a4-8124-adee979379ca.jpg',  
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/ca67710b-96fe-4d54-94b6-b020ca63f487.jpg',
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/cf1c8436-d9ce-49d3-a935-7e14e5f5a478.jpg'
  ];

  useEffect(() => {
    const updateStatus = async () => {
      const status = await getCacheStatus();
      setCacheStatus(status);
    };
    updateStatus();
  }, []);

  return (
    <div className="test-cache-container">
      <div className="page-header">
        <h1>图片缓存测试页面</h1>
        <div className="test-actions">
          <button onClick={clearAllCache} className="clear-button">
            清理所有缓存
          </button>
          <button onClick={refreshPage} className="refresh-button">
            刷新页面
          </button>
        </div>
      </div>



      <CacheManager />

      <div className="test-images-section">
        <h2>测试图片缓存</h2>
        <p>观察控制台日志，查看图片缓存是否正常工作</p>
        <div className="test-images-grid">
          {testImages.map((imageUrl, index) => (
            <div key={index} className="test-image-item">
              <CachedImage
                src={imageUrl}
                alt={`测试图片 ${index + 1}`}
                className="test-image"
              />
              <div className="image-info">
                <p>图片 {index + 1}</p>
                <p className="image-url">{imageUrl}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestCache; 