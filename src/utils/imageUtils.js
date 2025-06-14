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
 * @param {string} ossUrl - OSS原始URL
 * @param {boolean} useFallback - 是否使用OSS域名作为备用
 * @returns {string} CDN URL 或原始OSS URL
 */
export const convertToCdnUrl = (ossUrl, useFallback = false) => {
  if (!ossUrl || typeof ossUrl !== 'string') return ossUrl;
  
  // 如果已经是CDN URL，直接返回
  if (ossUrl.includes('img.htas.com.au')) {
    // 如果使用备用方案，转换回OSS URL
    if (useFallback) {
      return ossUrl.replace('http://img.htas.com.au', 'https://hmlead22.oss-cn-beijing.aliyuncs.com');
    }
    return ossUrl;
  }
  
  // 如果使用备用方案，直接返回OSS URL
  if (useFallback) {
    return ossUrl;
  }
  
  // 转换OSS URL为CDN URL
  for (const ossDomain of OSS_DOMAINS) {
    if (ossUrl.includes(ossDomain)) {
      // 提取文件路径
      const urlParts = ossUrl.split(ossDomain);
      if (urlParts.length > 1) {
        let filePath = urlParts[1];
        // 移除查询参数
        if (filePath.includes('?')) {
          filePath = filePath.split('?')[0];
        }
        // 确保路径以/开头
        if (!filePath.startsWith('/')) {
          filePath = '/' + filePath;
        }
        return CDN_DOMAIN + filePath;
      }
    }
  }
  
  return ossUrl; // 如果无法转换，返回原URL
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