/**
 * 图片处理工具函数集
 */

// CDN域名配置 - 临时使用HTTP协议避免SSL问题
const CDN_DOMAIN = 'http://img.htas.com.au';
const OSS_DOMAINS = [
  'hmlead22.oss-cn-beijing.aliyuncs.com',
  'oss-cn-beijing.aliyuncs.com'
];

/**
 * 将OSS URL转换为CDN URL
 * @param {string} originalUrl - 原始OSS URL
 * @param {boolean} useOssDirectly - 是否直接使用OSS域名（备用方案）
 * @returns {string} CDN URL或原始URL
 */
export const convertToCdnUrl = (originalUrl, useOssDirectly = false) => {
  if (!originalUrl || typeof originalUrl !== 'string') {
    return originalUrl;
  }

  // 简化版本，直接返回原始URL
  return originalUrl;

  // 以下代码暂时注释，等SSL证书修复后恢复
  /*
  const OSS_DOMAIN = 'hmlead22.oss-cn-beijing.aliyuncs.com';
  const CDN_DOMAIN = 'img.htas.com.au';
  
  // 如果明确要求使用OSS直连
  if (useOssDirectly) {
    if (originalUrl.includes(CDN_DOMAIN)) {
      return originalUrl.replace(CDN_DOMAIN, OSS_DOMAIN);
    }
    return originalUrl;
  }
  
  // 检查是否是OSS域名，如果是则转换为CDN
  if (originalUrl.includes(OSS_DOMAIN)) {
    const cdnUrl = originalUrl.replace(OSS_DOMAIN, CDN_DOMAIN);
    console.log('🔄 URL转换: OSS -> CDN', {
      original: originalUrl,
      cdn: cdnUrl
    });
    return cdnUrl;
  }
  
  // 如果已经是CDN域名或其他域名，直接返回
  return originalUrl;
  */
};

/**
 * 获取图片URL，根据可用性选择最佳的路径
 * @param {Object} item - 包含图片信息的对象
 * @returns {string} 图片URL
 */
export const getImageUrl = (item) => {
  if (!item) return '';
  
  // 按优先级尝试可能的图片属性
  const possibleProps = [
    'image', 'img', 'coverImage', 'cover_image', 
    'thumbnail', 'imageUrl', 'image_url', 'photo'
  ];
  
  for (const prop of possibleProps) {
    if (item[prop] && typeof item[prop] === 'string' && item[prop].trim()) {
      // 转换为CDN URL
      return convertToCdnUrl(item[prop]);
    }
  }
  
  // 无有效图片时返回空字符串
  return '';
}; 