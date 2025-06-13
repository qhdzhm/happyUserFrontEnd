import React from 'react';
import { Helmet } from 'react-helmet-async';

const BaiduSEO = ({ tourData, tourType, pageType = 'product' }) => {
  
  // 生成百度偏好的页面标题
  const generateBaiduTitle = () => {
    if (pageType === 'home') {
      return 'HTAS塔斯马尼亚华人旅游-专业中文导游服务-澳洲旅行社';
    }
    
    if (pageType === 'list') {
      const typeText = tourType === 'day' ? '一日游' : '跟团游';
      return `塔斯马尼亚${typeText}产品-HTAS华人旅行社-中文导游服务`;
    }
    
    // 产品页面标题
    const productName = tourData?.title || tourData?.name || '旅游产品';
    const typeText = tourType === 'day' ? '一日游' : '跟团游';
    return `${productName}-塔斯马尼亚${typeText}-HTAS华人旅行社`;
  };

  // 生成百度偏好的描述
  const generateBaiduDescription = () => {
    if (pageType === 'home') {
      return 'HTAS专业提供塔斯马尼亚旅游服务，中文导游带您游览摇篮山、酒杯湾、布鲁尼岛等景点。一日游、跟团游多种选择，优质服务，合理价格。立即预订咨询400-123-4567。';
    }
    
    if (pageType === 'list') {
      const typeText = tourType === 'day' ? '一日游' : '跟团游';
      return `HTAS塔斯马尼亚${typeText}产品大全，摇篮山、酒杯湾、布鲁尼岛等热门景点，专业中文导游，优质服务保障。在线预订享优惠价格。`;
    }
    
    // 产品页面描述
    const productName = tourData?.title || tourData?.name || '旅游产品';
    const description = tourData?.description || tourData?.intro || '专业旅游服务';
    const shortDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;
    
    return `HTAS专业提供${productName}服务，中文导游深度体验塔斯马尼亚风光。${shortDesc}包含交通、导游、门票。立即预订享优惠，咨询400-123-4567。`;
  };

  // 生成关键词
  const generateKeywords = () => {
    const baseKeywords = ['塔斯马尼亚旅游', 'HTAS', '中文导游', '澳洲旅游'];
    
    if (pageType === 'home') {
      return [...baseKeywords, '塔斯马尼亚华人旅行社', '摇篮山', '酒杯湾', '布鲁尼岛'].join(',');
    }
    
    if (tourData?.title || tourData?.name) {
      const productKeywords = [tourData.title || tourData.name];
      if (tourType === 'day') {
        productKeywords.push('一日游', '当日往返');
      } else {
        productKeywords.push('跟团游', '多日游');
      }
      return [...baseKeywords, ...productKeywords].join(',');
    }
    
    return baseKeywords.join(',');
  };

  // 生成百度结构化数据
  const generateBaiduStructuredData = () => {
    if (pageType === 'home' || pageType === 'list') {
      return {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "name": "HTAS塔斯马尼亚华人旅游",
        "description": "专业的塔斯马尼亚中文导游服务",
        "url": "https://www.htas.com.au",
        "telephone": "+61-3-6234-5678",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "霍巴特",
          "addressRegion": "塔斯马尼亚",
          "addressCountry": "澳大利亚"
        },
        "areaServed": "塔斯马尼亚州",
        "priceRange": "$$",
        "serviceType": ["一日游", "跟团游", "定制游"]
      };
    }
    
    // 产品页面结构化数据
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": tourData?.title || tourData?.name,
      "description": tourData?.description || tourData?.intro,
      "brand": {
        "@type": "Brand",
        "name": "HTAS",
        "url": "https://www.htas.com.au"
      },
      "offers": {
        "@type": "Offer",
        "price": tourData?.price || "0",
        "priceCurrency": "AUD",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "HTAS塔斯马尼亚华人旅游"
        }
      },
      "category": tourType === 'day' ? "一日游" : "跟团游",
      "serviceType": "旅游服务"
    };
  };

  return (
    <Helmet>
      {/* 基础SEO标签 */}
      <title>{generateBaiduTitle()}</title>
      <meta name="description" content={generateBaiduDescription()} />
      <meta name="keywords" content={generateKeywords()} />
      
      {/* 百度特有标签 */}
      <meta name="baidu-site-verification" content="codeva-YOUR_VERIFICATION_CODE" />
      <meta name="mobile-agent" content="format=html5; url=https://m.htas.com.au/" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* 移动适配 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      
      {/* 百度结构化数据 */}
      <script type="application/ld+json">
        {JSON.stringify(generateBaiduStructuredData())}
      </script>
      
      {/* 百度站长验证 */}
      <meta name="baidu_union_verify" content="YOUR_BAIDU_UNION_CODE" />
      
      {/* 百度智能小程序 */}
      <meta name="baidu-tc-verification" content="YOUR_TC_CODE" />
    </Helmet>
  );
};

export default BaiduSEO; 