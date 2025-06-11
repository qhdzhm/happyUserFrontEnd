/**
 * 图片处理工具函数集
 */

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
      return item[prop];
    }
  }
  
  // 无有效图片时返回空字符串
  return '';
}; 