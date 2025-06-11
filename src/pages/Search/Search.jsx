import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Offcanvas } from "react-bootstrap";
import { useLocation, Link, NavLink } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import Filters from "./Filters";
import "./search.css";
import { FaStar, FaMapMarkerAlt, FaRegClock, FaUsers } from 'react-icons/fa';
import PriceDisplay from '../../components/PriceDisplay';

// 创建临时的本地数据
const mockAttractions = [
  {
    id: 1,
    name: "摇篮山国家公园一日游",
    location: "塔斯马尼亚北部",
    description: "世界遗产，拥有壮观的山脉和原始森林，是徒步爱好者的天堂。",
    type: "自然风光",
    tourType: ["一日游"],
    rating: 4.9,
    price: 120,
    duration: "8小时",
    category: "自然风光",
    themes: ["自然风光", "户外活动", "摄影之旅"],
    suitableFor: ["家庭", "情侣", "朋友", "独自旅行"]
  },
  {
    id: 2,
    name: "酒杯湾海滩一日游",
    location: "塔斯马尼亚东部",
    description: "拥有世界上最美丽的海滩之一，湛蓝的海水和洁白的沙滩形成鲜明对比。",
    type: "海滩",
    tourType: ["一日游"],
    rating: 4.8,
    price: 100,
    duration: "6小时",
    category: "海滩",
    themes: ["自然风光", "户外活动", "摄影之旅"],
    suitableFor: ["家庭", "情侣", "朋友"]
  },
  {
    id: 3,
    name: "霍巴特市区观光一日游",
    location: "霍巴特",
    description: "塔斯马尼亚首府，拥有丰富的历史建筑和萨拉曼卡市场。",
    type: "城市观光",
    tourType: ["一日游"],
    rating: 4.6,
    price: 80,
    duration: "5小时",
    category: "城市观光",
    themes: ["城市观光", "历史文化", "美食体验"],
    suitableFor: ["家庭", "老年人", "朋友"]
  }
];

const Search = () => {
  const location = useLocation();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});
  const [show, setShow] = useState(false);
  
  const handleFilterClose = () => setShow(false);
  const handleFilterShow = () => setShow(true);

  useEffect(() => {
    document.title = "搜索结果 | 塔斯马尼亚旅游";
    window.scrollTo(0, 0);

    // 解析URL查询参数
    const queryParams = new URLSearchParams(location.search);
    const params = {
      tourType: queryParams.get("tourType") || "",
      startDate: queryParams.get("startDate") || "",
      endDate: queryParams.get("endDate") || "",
      adults: queryParams.get("adults") ? parseInt(queryParams.get("adults")) : 0,
      children: queryParams.get("children") ? parseInt(queryParams.get("children")) : 0,
      categories: queryParams.get("categories") ? queryParams.get("categories").split(",") : [],
      tourTypes: queryParams.get("tourTypes") ? queryParams.get("tourTypes").split(",") : [],
      duration: queryParams.get("duration") ? queryParams.get("duration").split(",") : [],
      priceRange: queryParams.get("priceRange") ? queryParams.get("priceRange").split(",") : [],
      ratings: queryParams.get("ratings") ? queryParams.get("ratings").split(",").map(Number) : []
    };
    setSearchParams(params);

    // 根据参数过滤景点
    filterAttractions(params);
  }, [location.search]);

  const filterAttractions = (params) => {
    // 使用 mockAttractions 代替 tasmaniaAttractions
    let results = [...mockAttractions];

    // 按行程类型过滤
    if (params.tourType) {
      results = results.filter(
        attraction => attraction.tourType.includes(params.tourType)
      );
    }
    
    // 按类别筛选
    if (params.categories && params.categories.length > 0) {
      results = results.filter(attraction => 
        params.categories.includes(attraction.category)
      );
    }
    
    // 按行程类型筛选（从左侧筛选）
    if (params.tourTypes && params.tourTypes.length > 0) {
      results = results.filter(attraction => 
        attraction.tourType.some(type => params.tourTypes.includes(type))
      );
    }
    
    // 按时长筛选
    if (params.duration && params.duration.length > 0) {
      results = results.filter(attraction => {
        const hours = parseInt(attraction.duration);
        
        if (params.duration.includes('4小时以下') && hours < 4) return true;
        if (params.duration.includes('4-6小时') && hours >= 4 && hours <= 6) return true;
        if (params.duration.includes('6-8小时') && hours > 6 && hours <= 8) return true;
        if (params.duration.includes('8小时以上') && hours > 8 && !attraction.duration.includes('天')) return true;
        if (params.duration.includes('多日游') && attraction.duration.includes('天')) return true;
        
        return false;
      });
    }
    
    // 按价格范围筛选
    if (params.priceRange && params.priceRange.length > 0) {
      results = results.filter(attraction => {
        const price = attraction.price;
        
        if (params.priceRange.includes('$0-$50') && price <= 50) return true;
        if (params.priceRange.includes('$50-$100') && price > 50 && price <= 100) return true;
        if (params.priceRange.includes('$100-$150') && price > 100 && price <= 150) return true;
        if (params.priceRange.includes('$150-$200') && price > 150 && price <= 200) return true;
        if (params.priceRange.includes('$200以上') && price > 200) return true;
        
        return false;
      });
    }
    
    // 按评分筛选
    if (params.ratings && params.ratings.length > 0) {
      const minRating = Math.min(...params.ratings);
      results = results.filter(attraction => 
        attraction.rating >= minRating
      );
    }
    
    setSearchResults(results);
    setLoading(false);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <>
      <Breadcrumbs title="搜索结果" pagename="搜索" />
      <section className="py-5 tour_list">
        <Container>
          {searchParams.tourType || 
           searchParams.startDate || 
           searchParams.endDate || 
           searchParams.adults > 0 || 
           searchParams.children > 0 ? (
            <Row className="mb-4">
              <Col lg={12}>
                <div className="search-summary">
                  <h2>搜索结果</h2>
                  <p>
                    {searchParams.tourType && <span>行程类型: <strong>{searchParams.tourType}</strong> | </span>}
                    {searchParams.startDate && <span>开始日期: <strong>{formatDate(searchParams.startDate)}</strong> | </span>}
                    {searchParams.endDate && <span>结束日期: <strong>{formatDate(searchParams.endDate)}</strong> | </span>}
                    {searchParams.adults > 0 && <span>成人: <strong>{searchParams.adults}</strong> | </span>}
                    {searchParams.children > 0 && <span>儿童: <strong>{searchParams.children}</strong></span>}
                  </p>
                  <p>找到 <strong>{searchResults.length}</strong> 个结果</p>
                </div>
              </Col>
            </Row>
          ) : null}
          <Row>
            <Col xl="3" lg="4" md="12" sm="12">
              <div className="d-lg-none d-block">
                <button className="primaryBtn mb-4" onClick={handleFilterShow}>
                  <i className="bi bi-funnel"></i> 筛选
                </button>
              </div>
              <div className="filters d-lg-block d-none">
                <Filters />
              </div>
            </Col>
            <Col xl="9" lg="8" md="12" sm="12">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">加载中...</span>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="no-results">
                  <h3>没有找到符合条件的结果</h3>
                  <p>请尝试调整搜索条件</p>
                </div>
              ) : (
                <Row>
                  {searchResults.map((attraction) => (
                    <Col xl={4} lg={6} md={6} sm={6} className="mb-5" key={attraction.id}>
                      <Card className="rounded-2 shadow-sm popular">
                        <Card.Img
                          variant="top"
                          src={attraction.image}
                          className="img-fluid"
                          alt={attraction.name}
                        />
                        <Card.Body>
                          <Card.Text>
                            <FaMapMarkerAlt className="me-2" />
                            <span className="text">{attraction.location}</span>
                          </Card.Text>
                          <Card.Title>
                            <NavLink className="text-dark text-decoration-none" to={`/tour-details/${attraction.id}`}>
                              {attraction.name}
                            </NavLink>
                          </Card.Title>
                          <p className="reviwe">
                            <FaStar className="me-1" />
                            <span>{attraction.rating.toFixed(1)} </span>
                            <span>({Math.floor(Math.random() * 100) + 10} 评价)</span>
                          </p>
                          {attraction.tourType.map((type, index) => (
                            <span key={index} 
                              className={`badge me-2 ${type === "日游" ? "bg-info" : "bg-primary"}`}>
                              {type}
                            </span>
                          ))}
                        </Card.Body>
                        <Card.Footer className="py-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <p className="mb-0">
                              起价 
                              <PriceDisplay 
                                price={Number(attraction.price)}
                                discountPrice={attraction.discount_price ? Number(attraction.discount_price) : null}
                                currency="$"
                                size="sm"
                                showBadge={false}
                              />
                            </p>
                            <p className="mb-0">
                              <FaRegClock className="me-1" /> {attraction.duration}
                            </p>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* 移动端筛选抽屉 */}
      <Offcanvas show={show} onHide={handleFilterClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>筛选</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Filters />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Search; 