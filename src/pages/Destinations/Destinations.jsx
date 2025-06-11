import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Nav, Tab } from "react-bootstrap";
import { FaMapMarkerAlt, FaCalendarAlt, FaInfoCircle, FaHeart, FaChevronRight } from "react-icons/fa";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Link } from "react-router-dom";
import "./destinations.css";

// 导入图片
import image1 from "../../assets/images/new/1.jpg";
import image2 from "../../assets/images/new/2.jpg";
import image3 from "../../assets/images/new/3.jpg";
import image4 from "../../assets/images/new/4.jpg";
import image5 from "../../assets/images/new/5.jpg";
import image6 from "../../assets/images/new/6.jpg";
import image7 from "../../assets/images/new/7.jpg";
import image8 from "../../assets/images/new/8.jpg";

// 假设这是目的地数据
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

const Destinations = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    document.title = "目的地 | 塔斯马尼亚旅游";
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
        title="探索塔斯马尼亚的绝美目的地" 
        pagename="目的地" 
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
      
      {/* 目的地筛选和列表 */}
      <section className="destinations-section py-5">
        <Container>
          <div className="section-title text-center mb-4">
            <h2>探索目的地</h2>
            <p>按照您的兴趣发现塔斯马尼亚的精彩</p>
          </div>
          
          {/* 筛选选项卡 */}
          <Tab.Container id="destination-tabs" defaultActiveKey="all">
            <Nav variant="pills" className="destination-nav mb-4">
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
                      <Card className="destination-card h-100">
                        <div className="destination-image">
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
                          <div className="destination-info">
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
              {/* 其他分类的内容与all相同，实际应用中可以根据分类筛选 */}
              <Tab.Pane eventKey="nature">
                <Row>
                  {regionsData.filter(item => ["摇篮山-圣克莱尔湖", "塔斯马尼亚东海岸", "塔斯马尼亚西海岸", "塔斯马尼亚中部高地"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="destination-card h-100">
                        <div className="destination-image">
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
                          <div className="destination-info">
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
              <Tab.Pane eventKey="culture">
                <Row>
                  {regionsData.filter(item => ["霍巴特及周边", "布鲁尼岛和塔斯曼半岛", "拉特罗布和德文波特"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="destination-card h-100">
                        <div className="destination-image">
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
                          <div className="destination-info">
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
              <Tab.Pane eventKey="food">
                <Row>
                  {regionsData.filter(item => ["霍巴特及周边", "拉特罗布和德文波特"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="destination-card h-100">
                        <div className="destination-image">
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
                          <div className="destination-info">
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
              <Tab.Pane eventKey="adventure">
                <Row>
                  {regionsData.filter(item => ["菲欣纳半岛", "塔斯马尼亚西海岸", "塔斯马尼亚中部高地"].includes(item.region)).map(destination => (
                    <Col lg={4} md={6} className="mb-4" key={destination.id}>
                      <Card className="destination-card h-100">
                        <div className="destination-image">
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
                          <div className="destination-info">
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
      
      {/* 季节推荐 */}
      <section className="seasonal-section py-5">
        <Container>
          <div className="section-title text-center mb-4">
            <h2>季节推荐</h2>
            <p>不同季节的塔斯马尼亚，不同的精彩</p>
          </div>
          
          <div className="season-tabs">
            <Tab.Container id="season-tabs" defaultActiveKey="spring">
              <Nav variant="tabs" className="season-nav mb-4">
                <Nav.Item>
                  <Nav.Link eventKey="spring">春季 (9-11月)</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="summer">夏季 (12-2月)</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="autumn">秋季 (3-5月)</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="winter">冬季 (6-8月)</Nav.Link>
                </Nav.Item>
              </Nav>
              
              <Tab.Content>
                <Tab.Pane eventKey="spring">
                  <div className="season-content">
                    <Row>
                      <Col md={6}>
                        <img src={image1} alt="塔斯马尼亚春季" className="img-fluid season-image" />
                      </Col>
                      <Col md={6}>
                        <div className="season-description">
                          <h3>春暖花开的塔斯马尼亚</h3>
                          <p>春季是塔斯马尼亚的花季，各种野花盛开，气温适宜，是徒步和观赏野生动物的绝佳时节。</p>
                          <h4>春季推荐目的地：</h4>
                          <ul>
                            <li>菲欣纳国家公园 - 观赏野花和野生动物</li>
                            <li>摇篮山-圣克莱尔湖国家公园 - 徒步旅行的理想时节</li>
                            <li>霍巴特植物园 - 欣赏春季花卉</li>
                          </ul>
                          <Link to="/tours">
                            <Button variant="outline-primary">查看春季行程</Button>
                          </Link>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="summer">
                  <div className="season-content">
                    <Row>
                      <Col md={6}>
                        <img src={image2} alt="塔斯马尼亚夏季" className="img-fluid season-image" />
                      </Col>
                      <Col md={6}>
                        <div className="season-description">
                          <h3>阳光明媚的塔斯马尼亚</h3>
                          <p>夏季是塔斯马尼亚最热闹的季节，气温宜人，是海滩度假、户外活动和参加各种节日活动的最佳时机。</p>
                          <h4>夏季推荐目的地：</h4>
                          <ul>
                            <li>酒杯湾 - 享受阳光沙滩</li>
                            <li>塔斯马尼亚东海岸 - 海滩度假和水上活动</li>
                            <li>霍巴特 - 参加夏季音乐节和美食节</li>
                          </ul>
                          <Link to="/tours">
                            <Button variant="outline-primary">查看夏季行程</Button>
                          </Link>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="autumn">
                  <div className="season-content">
                    <Row>
                      <Col md={6}>
                        <img src={image3} alt="塔斯马尼亚秋季" className="img-fluid season-image" />
                      </Col>
                      <Col md={6}>
                        <div className="season-description">
                          <h3>金色秋天的塔斯马尼亚</h3>
                          <p>秋季是塔斯马尼亚最美的季节之一，落叶乔木变成金黄色，气温凉爽，是摄影和品尝当季美食的好时机。</p>
                          <h4>秋季推荐目的地：</h4>
                          <ul>
                            <li>摇篮山国家公园 - 欣赏秋季落叶美景</li>
                            <li>塔马谷 - 品尝葡萄酒和当季水果</li>
                            <li>霍巴特周边 - 参观农场和果园</li>
                          </ul>
                          <Link to="/tours">
                            <Button variant="outline-primary">查看秋季行程</Button>
                          </Link>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Tab.Pane>
                <Tab.Pane eventKey="winter">
                  <div className="season-content">
                    <Row>
                      <Col md={6}>
                        <img src={image4} alt="塔斯马尼亚冬季" className="img-fluid season-image" />
                      </Col>
                      <Col md={6}>
                        <div className="season-description">
                          <h3>宁静冬日的塔斯马尼亚</h3>
                          <p>冬季的塔斯马尼亚安静而神秘，高山地区被白雪覆盖，是欣赏雪景、泡温泉和参加冬季节日的好时机。</p>
                          <h4>冬季推荐目的地：</h4>
                          <ul>
                            <li>威灵顿山 - 欣赏雪景</li>
                            <li>霍巴特 - 参加冬季美食节和黑暗艺术节</li>
                            <li>塔斯马尼亚中部高地 - 体验冰雪活动</li>
                          </ul>
                          <Link to="/tours">
                            <Button variant="outline-primary">查看冬季行程</Button>
                          </Link>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </Container>
      </section>
      
      {/* 旅行灵感 */}
      <section className="inspiration-section py-5">
        <Container>
          <div className="section-title text-center mb-4">
            <h2>旅行灵感</h2>
            <p>为您的塔斯马尼亚之旅提供创意</p>
          </div>
          
          <Row>
            <Col md={4} className="mb-4">
              <div className="inspiration-card">
                <img src={image5} alt="家庭旅行" className="img-fluid" />
                <div className="inspiration-content">
                  <h3>家庭亲子游</h3>
                  <p>适合全家人的塔斯马尼亚体验，让孩子们近距离接触自然，学习知识</p>
                  <Link to="/tours">
                    <Button variant="link">查看详情</Button>
                  </Link>
                </div>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="inspiration-card">
                <img src={image6} alt="浪漫之旅" className="img-fluid" />
                <div className="inspiration-content">
                  <h3>浪漫之旅</h3>
                  <p>为情侣和夫妻打造的浪漫体验，从海滩日落到精品酒店</p>
                  <Link to="/tours">
                    <Button variant="link">查看详情</Button>
                  </Link>
                </div>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="inspiration-card">
                <img src={image7} alt="探险之旅" className="img-fluid" />
                <div className="inspiration-content">
                  <h3>探险之旅</h3>
                  <p>挑战自我，体验塔斯马尼亚的刺激冒险活动</p>
                  <Link to="/tours">
                    <Button variant="link">查看详情</Button>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Destinations;