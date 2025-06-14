import React, { useState, useEffect, useMemo } from 'react';
import { FaBookmark, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './LandingBanner.css';

const LandingBanner = ({ dayTours = [], groupTours = [], loading = false }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [translateXValue, setTranslateXValue] = useState(0);
  const [isProgressAnimationPlay, setIsProgressAnimationPlay] = useState(false);
  const navigate = useNavigate();

  // 使用useMemo缓存转换结果，避免无限循环
  const dynamicBannerData = useMemo(() => {
    console.log('LandingBanner - 转换数据:', { 
      loading, 
      dayTours: dayTours.length, 
      groupTours: groupTours.length,
      dayToursData: dayTours.slice(0, 2), // 只显示前2个用于调试
      groupToursData: groupTours.slice(0, 2)
    });
    
    // 如果正在加载或没有数据，返回空数组
    if (loading || (dayTours.length === 0 && groupTours.length === 0)) {
      console.log('LandingBanner - 数据加载中或无数据');
      return [];
    }

    const slides = [];
    
    // 优先显示团队游产品，然后是一日游，最多取6个
    const allTours = [...groupTours, ...dayTours].slice(0, 6);
    console.log('LandingBanner - 合并后的tours数据:', allTours.length, '个产品（优先团队游）');
    
    allTours.forEach((tour, index) => {
      // 获取产品图片 - 优先使用bannerimg/bannerImage，然后是coverImage
      const tourImage = tour.bannerimg || tour.bannerImage || tour.coverImage || tour.thumbnailUrl || tour.imageUrl || tour.image || '';
      
      
      
      slides.push({
        id: tour.id || index + 1,
        image: tourImage, // 主背景图片 - 使用bannerimg/bannerImage（如果有）或coverImage
        background: tour.coverImage || tourImage, // 卡片背景图片（使用coverImage，如果没有则使用Banner图片）
        title: tour.name || tour.title || `旅游产品 ${index + 1}`,
        subtitle: tour.destination || tour.location || tour.region || tour.category || '精彩旅程',
        // 保存原始tour数据用于跳转
        tourData: tour,
        tourType: index < groupTours.length ? 'group' : 'day' // 判断是团队游还是一日游（优先团队游）
      });
    });

    console.log('LandingBanner - 最终slides数据:', slides);
    return slides;
  }, [dayTours, groupTours, loading]); // 只有当这些依赖项变化时才重新计算

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProgressAnimationPlay(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleProgressAnimation = () => {
    if (currentCardIndex < dynamicBannerData.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setTranslateXValue((prev) => prev - 270);
    } else {
      // 重置到第一个
      setCurrentCardIndex(0);
      setTranslateXValue(0);
    }
  };

  const handleLeftChevronClick = () => {
    if (currentCardIndex > 0) {
      setIsProgressAnimationPlay(false);
      setCurrentCardIndex((prev) => prev - 1);
      setTranslateXValue((prev) => prev + 270);
    }
  };

  const handleRightChevronClick = () => {
    if (currentCardIndex < dynamicBannerData.length - 1) {
      setIsProgressAnimationPlay(false);
      setCurrentCardIndex((prev) => prev + 1);
      setTranslateXValue((prev) => prev - 270);
    }
  };

  const calculateProgressBarWidth = () => {
    if (currentCardIndex === 0) return 0;
    const denominator = (dynamicBannerData.length - 1) / currentCardIndex;
    return (1 / denominator) * 100;
  };

  // 处理查看详情按钮点击
  const handleViewDetails = () => {
    const currentSlide = dynamicBannerData[currentCardIndex];
    
    // 如果有tourData，说明是API数据，跳转到对应详情页
    if (currentSlide.tourData) {
      const tourId = currentSlide.tourData.id;
      const tourType = currentSlide.tourType;
      
      if (tourType === 'day') {
        navigate(`/day-tours/${tourId}`);
      } else {
        navigate(`/group-tours/${tourId}`);
      }
    } else {
      // 如果是默认数据，跳转到所有旅游页面
      navigate('/tours');
    }
  };

  // 处理主背景图片点击
  const handleBackgroundClick = (e) => {
    // 只有点击背景本身时才触发，避免点击内容区域时触发
    if (e.target === e.currentTarget) {
      console.log('背景点击，当前产品:', dynamicBannerData[currentCardIndex]?.title);
      handleViewDetails(); // 复用查看详情的逻辑
    }
  };

  // 处理卡片点击
  const handleCardClick = (e, cardIndex) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发背景点击
    
    // 由于使用了slice(1)，所以cardIndex对应的是slice后的索引
    // 需要+1才能对应到原始数组中的正确位置
    const originalIndex = cardIndex + 1;
    const targetSlide = dynamicBannerData[originalIndex];
    
    console.log('卡片点击调试:', {
      cardIndex,
      originalIndex,
      targetSlide: targetSlide?.title,
      tourId: targetSlide?.tourData?.id,
      tourType: targetSlide?.tourType
    });
    
    if (targetSlide && targetSlide.tourData) {
      const tourId = targetSlide.tourData.id;
      const tourType = targetSlide.tourType;
      
      if (tourType === 'day') {
        navigate(`/day-tours/${tourId}`);
      } else {
        navigate(`/group-tours/${tourId}`);
      }
    } else {
      // 如果是默认数据，跳转到所有旅游页面
      navigate('/tours');
    }
  };

  useEffect(() => {
    let timeout = null;
    clearTimeout(timeout);
    if (!isProgressAnimationPlay && currentCardIndex < dynamicBannerData.length - 1) {
      timeout = setTimeout(() => {
        setIsProgressAnimationPlay(true);
        clearTimeout(timeout);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [currentCardIndex, isProgressAnimationPlay, dynamicBannerData.length]);

  // 如果没有数据，不渲染任何内容
  if (dynamicBannerData.length === 0) {
    return null;
  }

  return (
    <div className="landing-banner">
      {/* 顶部全屏进度条 */}
      <div className="top-progress-bar">
        <div 
          className={`top-progress-fill ${isProgressAnimationPlay && currentCardIndex < dynamicBannerData.length - 1 ? 'animate' : ''}`}
          onAnimationIteration={handleProgressAnimation}
          onAnimationEnd={handleProgressAnimation}
        />
      </div>

      {/* 主背景容器 */}
      <div 
        className="background-container clickable-background"
        style={{
          backgroundImage: `url(${dynamicBannerData[currentCardIndex].image})`
        }}
        onClick={handleBackgroundClick}
        title={`查看 ${dynamicBannerData[currentCardIndex].title} 详情`}
      >
        {/* 内容主体 */}
        <main className="main-container">
          <div className="content-wrapper">
            
            {/* Hero区域 - 左侧40% */}
            <div className="hero-section" onClick={(e) => e.stopPropagation()}>
              <div className="hero-content">
                <h2 className="hero-title">{dynamicBannerData[currentCardIndex].title}</h2>
                <div className="hero-wrapper">
                  <h3 className="hero-subtitle">{dynamicBannerData[currentCardIndex].subtitle}</h3>
                  <p className="hero-text">
                    探索塔斯马尼亚的自然之美，体验独特的旅行魅力。我们为您提供最专业的中文旅游服务，
                    带您发现这片神奇土地的每一个角落。
                  </p>
                  <div className="hero-actions">
                    <button className="bookmark-button" aria-label="收藏此地点">
                      <FaBookmark />
                    </button>
                    <button className="discover-button" onClick={handleViewDetails}>
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片滑动器区域 - 右侧60% */}
            <div className="card-slider-container" onClick={(e) => e.stopPropagation()}>
              <div className="card-slider">
                <div 
                  className="card-slider-wrapper"
                  style={{ transform: `translateX(${translateXValue}px)` }}
                >
                  {dynamicBannerData.slice(1).map((data, i) => (
                    <div
                      key={data.id}
                      className={`slider-card clickable-card ${i + 1 === currentCardIndex ? 'active' : ''}`}
                      style={{
                        backgroundImage: `url(${data.background})`
                      }}
                      onClick={(e) => handleCardClick(e, i)}
                      title={`查看 ${data.title} 详情`}
                    >
                      <h4 className="card-title">{data.title}</h4>
                      <h5 className="card-subtitle">{data.subtitle}</h5>
                    </div>
                  ))}
                </div>
                
                {/* 控制区域 */}
                <div className="slider-controls">
                  <button 
                    className="control-button"
                    onClick={handleLeftChevronClick}
                    aria-label="上一个地点"
                  >
                    <FaChevronLeft size="16px" />
                  </button>
                  <button 
                    className="control-button next-button"
                    onClick={handleRightChevronClick}
                    aria-label="下一个地点"
                  >
                    <FaChevronRight size="16px" />
                  </button>
                  
                  <div className="linear-progress">
                    <div 
                      className="linear-progress-bar"
                      style={{ width: `${calculateProgressBarWidth()}%` }}
                    />
                  </div>
                  
                  <p className="counter">
                    0{currentCardIndex + 1}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingBanner; 