import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Nav, Tab } from "react-bootstrap";
import { FaMapMarkerAlt, FaCalendarAlt, FaInfoCircle, FaHeart, FaChevronRight } from "react-icons/fa";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Link } from "react-router-dom";
import "./travelRegions.css";

// 导入图片
import image1 from "../../assets/images/new/1.jpg";
import image2 from "../../assets/images/new/2.jpg";
import image3 from "../../assets/images/new/3.jpg";
import image4 from "../../assets/images/new/4.jpg";
import image5 from "../../assets/images/new/5.jpg";
import image6 from "../../assets/images/new/6.jpg";
import image7 from "../../assets/images/new/7.jpg";
import image8 from "../../assets/images/new/8.jpg";

// 区域数据
const regionsData = [
  {
    id: 1,
    region: "霍巴特及周边",
    description: "塔斯马尼亚的首府，融合历史文化与现代艺术的魅力城市",
    image: image1,
    attractions: ["萨拉曼卡市场", "威灵顿山", "MONA博物馆"],
    activities: ["历史古迹探索", "美食品尝", "艺术体验"],
    bestSeason: "全年皆宜，夏季尤佳",
    recommendedDays: "2-3天"
  },
  {
    id: 2,
    region: "菲欣纳半岛",
    description: "壮丽的海岸线和世界级的徒步路线，自然爱好者的天堂",
    image: image2,
    attractions: ["酒杯湾", "菲欣纳国家公园", "塔斯曼拱门"],
    activities: ["徒步旅行", "野生动物观赏", "摄影"],
    bestSeason: "春季至秋季",
    recommendedDays: "2-4天"
  },
  {
    id: 3,
    region: "摇篮山-圣克莱尔湖",
    description: "世界遗产区域，拥有壮观的山脉和原始森林",
    image: image3,
    attractions: ["摇篮山", "多芬湖", "谢菲尔德小镇"],
    activities: ["徒步旅行", "野生动物观赏", "划船"],
    bestSeason: "春季至秋季",
    recommendedDays: "2-3天"
  },
  {
    id: 4,
    region: "塔斯马尼亚东海岸",
    description: "绵延的白沙滩和清澈的海水，是度假放松的理想之地",
    image: image4,
    attractions: ["菲欣纳湾", "玛丽亚岛", "比奇诺"],
    activities: ["海滩度假", "海鲜美食", "水上活动"],
    bestSeason: "夏季",
    recommendedDays: "3-5天"
  },
  {
    id: 5,
    region: "塔斯马尼亚西海岸",
    description: "原始荒野和丰富的采矿历史，探险者的乐园",
    image: image5,
    attractions: ["戈登河", "斯特拉恩", "萨拉曼卡峡谷"],
    activities: ["探险", "历史遗迹", "雨林徒步"],
    bestSeason: "春季至秋季",
    recommendedDays: "2-3天"
  },
  {
    id: 6,
    region: "布鲁尼岛和塔斯曼半岛",
    description: "丰富的野生动物和历史遗迹，自然与历史的完美结合",
    image: image6,
    attractions: ["亚瑟港", "塔斯曼国家公园", "布鲁尼岛灯塔"],
    activities: ["历史遗迹", "野生动物观赏", "海岸徒步"],
    bestSeason: "全年",
    recommendedDays: "2-4天"
  },
  {
    id: 7,
    region: "拉特罗布和德文波特",
    description: "北部海岸线上的历史小镇，充满维多利亚时期的魅力",
    image: image7,
    attractions: ["德文波特灯塔", "拉特罗布薰衣草农场", "默西河"],
    activities: ["历史遗迹", "农场体验", "美食品尝"],
    bestSeason: "春季至夏季",
    recommendedDays: "1-2天"
  },
  {
    id: 8,
    region: "塔斯马尼亚中部高地",
    description: "高山湖泊和荒野，是钓鱼和徒步的胜地",
    image: image8,
    attractions: ["大湖", "圣克莱尔湖", "高地湖泊"],
    activities: ["钓鱼", "徒步", "野生动物观赏"],
    bestSeason: "夏季",
    recommendedDays: "2-3天"
  }
];

const TravelRegions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    document.title = "旅游区域 | 塔斯马尼亚旅游";
    window.scrollTo(0, 0);
  }, []);

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(item => item !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  return (
    <>
      <Breadcrumbs 
        title="探索塔斯马尼亚的绝美旅游区域" 
        pagename="旅游区域" 
        subtitle="从壮丽的海岸线到神秘的原始森林，从历史古迹到现代艺术，塔斯马尼亚的每一个角落都值得您深入探索"
      />
      
      {/* 区域概览 */}
      <section className="regions-section py-5">
        <Container>
          <div className="section-title text-center mb-4">
            <h2>塔斯马尼亚区域概览</h2>
            <p>探索塔斯马尼亚的各个区域，发现不同地区的独特魅力</p>
          </div>
          
          <Row>
            {regionsData.map(region => (
              <Col lg={6} md={6} className="mb-4" key={region.id}>
                <div className="region-card">
                  <img src={region.image} alt={region.region} className="img-fluid" />
                  <div className="region-overlay">
                    <h3>{region.region}</h3>
                    <p>{region.description}</p>
                    <Link to={`/region-detail/${region.id}`}>
                      <Button variant="light" size="sm">探索详情 <FaChevronRight /></Button>
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* 区域筛选和列表 */}
      <section className="regions-section py-5">
        <Container>
          <div className="section-title text-center mb-4">
            <h2>探索旅游区域</h2>
            <p>按照您的兴趣发现塔斯马尼亚的精彩</p>
          </div>
          
          {/* 筛选选项卡 */}
          <Tab.Container id="region-tabs" defaultActiveKey="all">
            <Nav variant="pills" className="region-nav mb-4">
              <Nav.Item>
                <Nav.Link eventKey="all">全部</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="nature">自然风光</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="culture">历史文化</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="food">美食体验</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="adventure">探险活动</Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content>
              <Tab.Pane eventKey="all">
                <Row>
                  {regionsData.map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="region-card h-100">
                        <div className="region-image">
                          <img src={destination.image} alt={destination.region} className="img-fluid" />
                          <Button 
                            variant="link" 
                            className={`favorite-btn ${favorites.includes(destination.id) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(destination.id)}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                        <Card.Body>
                          <Card.Title>{destination.region}</Card.Title>
                          <Card.Text>{destination.description}</Card.Text>
                          <div className="region-info">
                            <div className="info-item">
                              <FaMapMarkerAlt />
                              <span>必游景点: {destination.attractions.join(', ')}</span>
                            </div>
                            <div className="info-item">
                              <FaCalendarAlt />
                              <span>最佳季节: {destination.bestSeason}</span>
                            </div>
                            <div className="info-item">
                              <FaInfoCircle />
                              <span>建议游览: {destination.recommendedDays}</span>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <div className="d-flex justify-content-between">
                            <Link to={`/tours`}>
                              <Button variant="outline-primary">相关行程</Button>
                            </Link>
                            <Link to={`/region-detail/${destination.id}`}>
                              <Button variant="primary">查看详情</Button>
                            </Link>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              {/* 自然风光分类 */}
              <Tab.Pane eventKey="nature">
                <Row>
                  {regionsData.filter(item => ["摇篮山-圣克莱尔湖", "塔斯马尼亚东海岸", "塔斯马尼亚西海岸", "塔斯马尼亚中部高地"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="region-card h-100">
                        <div className="region-image">
                          <img src={destination.image} alt={destination.region} className="img-fluid" />
                          <Button 
                            variant="link" 
                            className={`favorite-btn ${favorites.includes(destination.id) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(destination.id)}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                        <Card.Body>
                          <Card.Title>{destination.region}</Card.Title>
                          <Card.Text>{destination.description}</Card.Text>
                          <div className="region-info">
                            <div className="info-item">
                              <FaMapMarkerAlt />
                              <span>必游景点: {destination.attractions.join(', ')}</span>
                            </div>
                            <div className="info-item">
                              <FaCalendarAlt />
                              <span>最佳季节: {destination.bestSeason}</span>
                            </div>
                            <div className="info-item">
                              <FaInfoCircle />
                              <span>建议游览: {destination.recommendedDays}</span>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <div className="d-flex justify-content-between">
                            <Link to={`/tours`}>
                              <Button variant="outline-primary">相关行程</Button>
                            </Link>
                            <Link to={`/region-detail/${destination.id}`}>
                              <Button variant="primary">查看详情</Button>
                            </Link>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              {/* 历史文化分类 */}
              <Tab.Pane eventKey="culture">
                <Row>
                  {regionsData.filter(item => ["霍巴特及周边", "布鲁尼岛和塔斯曼半岛", "拉特罗布和德文波特"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="region-card h-100">
                        <div className="region-image">
                          <img src={destination.image} alt={destination.region} className="img-fluid" />
                          <Button 
                            variant="link" 
                            className={`favorite-btn ${favorites.includes(destination.id) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(destination.id)}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                        <Card.Body>
                          <Card.Title>{destination.region}</Card.Title>
                          <Card.Text>{destination.description}</Card.Text>
                          <div className="region-info">
                            <div className="info-item">
                              <FaMapMarkerAlt />
                              <span>必游景点: {destination.attractions.join(', ')}</span>
                            </div>
                            <div className="info-item">
                              <FaCalendarAlt />
                              <span>最佳季节: {destination.bestSeason}</span>
                            </div>
                            <div className="info-item">
                              <FaInfoCircle />
                              <span>建议游览: {destination.recommendedDays}</span>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <div className="d-flex justify-content-between">
                            <Link to={`/tours`}>
                              <Button variant="outline-primary">相关行程</Button>
                            </Link>
                            <Link to={`/region-detail/${destination.id}`}>
                              <Button variant="primary">查看详情</Button>
                            </Link>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              {/* 美食体验分类 */}
              <Tab.Pane eventKey="food">
                <Row>
                  {regionsData.filter(item => ["霍巴特及周边", "拉特罗布和德文波特"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="region-card h-100">
                        <div className="region-image">
                          <img src={destination.image} alt={destination.region} className="img-fluid" />
                          <Button 
                            variant="link" 
                            className={`favorite-btn ${favorites.includes(destination.id) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(destination.id)}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                        <Card.Body>
                          <Card.Title>{destination.region}</Card.Title>
                          <Card.Text>{destination.description}</Card.Text>
                          <div className="region-info">
                            <div className="info-item">
                              <FaMapMarkerAlt />
                              <span>必游景点: {destination.attractions.join(', ')}</span>
                            </div>
                            <div className="info-item">
                              <FaCalendarAlt />
                              <span>最佳季节: {destination.bestSeason}</span>
                            </div>
                            <div className="info-item">
                              <FaInfoCircle />
                              <span>建议游览: {destination.recommendedDays}</span>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <div className="d-flex justify-content-between">
                            <Link to={`/tours`}>
                              <Button variant="outline-primary">相关行程</Button>
                            </Link>
                            <Link to={`/region-detail/${destination.id}`}>
                              <Button variant="primary">查看详情</Button>
                            </Link>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              {/* 探险活动分类 */}
              <Tab.Pane eventKey="adventure">
                <Row>
                  {regionsData.filter(item => ["菲欣纳半岛", "塔斯马尼亚西海岸", "塔斯马尼亚中部高地"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="region-card h-100">
                        <div className="region-image">
                          <img src={destination.image} alt={destination.region} className="img-fluid" />
                          <Button 
                            variant="link" 
                            className={`favorite-btn ${favorites.includes(destination.id) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(destination.id)}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                        <Card.Body>
                          <Card.Title>{destination.region}</Card.Title>
                          <Card.Text>{destination.description}</Card.Text>
                          <div className="region-info">
                            <div className="info-item">
                              <FaMapMarkerAlt />
                              <span>必游景点: {destination.attractions.join(', ')}</span>
                            </div>
                            <div className="info-item">
                              <FaCalendarAlt />
                              <span>最佳季节: {destination.bestSeason}</span>
                            </div>
                            <div className="info-item">
                              <FaInfoCircle />
                              <span>建议游览: {destination.recommendedDays}</span>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <div className="d-flex justify-content-between">
                            <Link to={`/tours`}>
                              <Button variant="outline-primary">相关行程</Button>
                            </Link>
                            <Link to={`/region-detail/${destination.id}`}>
                              <Button variant="primary">查看详情</Button>
                            </Link>
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Container>
      </section>
    </>
  );
};

export default TravelRegions; 