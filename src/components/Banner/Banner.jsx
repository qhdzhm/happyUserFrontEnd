import React, { useState, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import "../Banner/banner.css";
import AdvanceSearch from "../AdvanceSearch/AdvanceSearch";
import { FaChevronDown } from 'react-icons/fa';

const Banner = () => {
  const [isPaused, setIsPaused] = useState(false);

  const handleVideoControl = () => {
    setIsPaused(!isPaused);
    const video = document.querySelector(".video-container video");
    if (video) {
      if (isPaused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  // 处理向下滚动
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  // Add useEffect to ensure proper fullscreen display
  useEffect(() => {
    // Set the body and html elements to have full height
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'auto';
    
    // 添加全屏滚动类
    document.documentElement.classList.add('fullscreen-scroll-active');
    
    // Ensure the banner is at the top
    window.scrollTo(0, 0);
    
    return () => {
      // Cleanup styles when component unmounts
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.documentElement.classList.remove('fullscreen-scroll-active');
    };
  }, []);

  return (
    <>
      <section className="slider fullscreen-banner">
        <div className="video-container">
          <video className="d-block w-100" autoPlay={!isPaused} muted loop>
            <source
              src={require("../../assets/videos/tasmania.mp4")}
              type="video/mp4"
            />
            您的浏览器不支持视频标签。
          </video>
          <Container fluid className="banner-content-container">
            <div className="banner-content">
              {/* 搜索框部分保留 */}
              <div className="banner-search-container">
                <div className="search-header">
                  <h4 className="search-subtitle">精选旅游套餐</h4>
                  <h2 className="search-title">查找理想行程 </h2>
                </div>
                <div className="banner-search-box">
                  <AdvanceSearch inBanner={true} />
                </div>
              </div>
            </div>
          </Container>
          {/* 添加向下滚动指示器 */}
          <div className="scroll-down-indicator" onClick={handleScrollDown}>
            <FaChevronDown />
          </div>
        </div>
      </section>
    </>
  );
};

export default Banner;
