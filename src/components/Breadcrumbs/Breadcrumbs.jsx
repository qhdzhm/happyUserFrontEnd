import React from "react";
import "../Breadcrumbs/breadcrumbs.css";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from 'react-router-dom';
// 导入背景图片
import backgroundImage from "../../assets/images/about/img7.jpg";

const Breadcrumbs = (props) => {
  // 处理页面名称生成正确的URL
  const getPageUrl = (pageName) => {
    if (!pageName) return '/';
    
    // 处理特殊页面
    const pageNameLower = pageName.toLowerCase();
    
    // 旅游类型相关页面需要添加查询参数
    if (pageNameLower === '旅游路线' || pageNameLower === 'tours') {
      return '/tours';
    } else if (pageNameLower === '一日游' || pageNameLower === 'day tours') {
      return '/tours?tourTypes=day_tour';
    } else if (pageNameLower === '跟团游' || pageNameLower === 'group tours') {
      return '/tours?tourTypes=group_tour';
    }
    
    // 其他页面使用标准转换
    return `/${pageNameLower.replace(/\s+/g, '-')}`;
  };

  return (
    <div className="breadcrumbs-section">
      {/* 主标题区域 */}
      <div className="page-header" >
        <div className="overlay"></div>
        <Container>
          <div className="page-header-content">
            <h1>{props.title}</h1>
            {props.subtitle && <p className="page-subtitle">{props.subtitle}</p>}
          </div>
        </Container>
      </div>
      
      {/* 面包屑导航区域 */}
      <div className="breadcrumbs-container">
        <Container>
          <div className="breadcrumbs-wrapper">
            <div className="breadcrumbs-links">
              <Link to="/">首页</Link>
              <i className="bi bi-chevron-right"></i>
              {props.childpagename ? (
                <>
                  <Link to={getPageUrl(props.pagename)}>{props.pagename}</Link>
                  <i className="bi bi-chevron-right"></i>
                  <span>{props.childpagename}</span>
                </>
              ) : (
                <span>{props.pagename}</span>
              )}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Breadcrumbs;
