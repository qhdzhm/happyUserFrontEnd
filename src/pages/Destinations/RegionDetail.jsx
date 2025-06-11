import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Nav, Tab, Carousel } from "react-bootstrap";
import { FaMapMarkerAlt, FaCalendarAlt, FaInfoCircle, FaHiking, FaUtensils, FaBed, FaCamera, FaLeaf } from "react-icons/fa";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Link, useParams } from "react-router-dom";
import "./regionDetail.css";

// 导入图片
import image1 from "../../assets/images/new/1.jpg";
import image2 from "../../assets/images/new/2.jpg";
import image3 from "../../assets/images/new/3.jpg";
import image4 from "../../assets/images/new/4.jpg";
import image5 from "../../assets/images/new/5.jpg";
import image6 from "../../assets/images/new/6.jpg";
import image7 from "../../assets/images/new/7.jpg";
import image8 from "../../assets/images/new/8.jpg";

// 区域详细数据
const regionsDetailData = [
  {
    id: 1,
    region: "霍巴特及周边",
    description: "塔斯马尼亚的首府，融合历史文化与现代艺术的魅力城市",
    longDescription: "霍巴特是塔斯马尼亚的首府，也是澳大利亚第二古老的城市。这座城市坐落在威灵顿山脚下，拥有迷人的港口风光和丰富的殖民历史。在这里，您可以漫步于历史悠久的萨拉曼卡市场，欣赏精美的手工艺品和当地美食；参观世界闻名的MONA现代艺术博物馆，体验前卫艺术的震撼；或者登上威灵顿山，俯瞰整个霍巴特城市和德文特河的壮丽景色。霍巴特周边地区还有许多值得探索的景点，如历史悠久的里士满小镇和风景如画的休恩谷。",
    image: image1,
    galleryImages: [image1, image2, image3, image4],
    attractions: [
      {
        name: "萨拉曼卡市场",
        description: "澳大利亚最著名的户外市场之一，提供各种手工艺品、当地美食和新鲜农产品。",
        image: image1
      },
      {
        name: "威灵顿山",
        description: "霍巴特的标志性景点，海拔1271米，可俯瞰整个城市和德文特河的壮丽景色。",
        image: image2
      },
      {
        name: "MONA博物馆",
        description: "澳大利亚最大的私人博物馆，展示前卫和有争议的现代艺术作品。",
        image: image3
      },
      {
        name: "电池角历史区",
        description: "保存完好的殖民时期建筑群，讲述霍巴特的早期历史。",
        image: image4
      }
    ],
    activities: [
      {
        name: "历史古迹探索",
        description: "参观殖民时期的历史建筑和遗迹，了解塔斯马尼亚的早期历史。",
        icon: <FaMapMarkerAlt />
      },
      {
        name: "美食品尝",
        description: "品尝当地海鲜、奶酪、葡萄酒和威士忌等美食。",
        icon: <FaUtensils />
      },
      {
        name: "艺术体验",
        description: "参观MONA博物馆和其他艺术画廊，体验塔斯马尼亚的艺术文化。",
        icon: <FaCamera />
      }
    ],
    bestSeason: "全年皆宜，夏季尤佳",
    recommendedDays: "2-3天",
    accommodation: [
      {
        name: "霍巴特大酒店",
        type: "豪华酒店",
        description: "位于市中心的五星级酒店，提供豪华住宿和一流服务。",
        image: image5
      },
      {
        name: "萨拉曼卡精品旅馆",
        type: "精品旅馆",
        description: "位于历史悠久的萨拉曼卡区，提供舒适的住宿和独特的氛围。",
        image: image6
      },
      {
        name: "河景公寓",
        type: "自助式公寓",
        description: "位于德文特河畔，提供设备齐全的公寓和美丽的河景。",
        image: image7
      }
    ],
    dining: [
      {
        name: "海鲜码头餐厅",
        type: "海鲜",
        description: "提供新鲜的当地海鲜和塔斯马尼亚葡萄酒。",
        image: image8
      },
      {
        name: "殖民时代酒馆",
        type: "传统澳式",
        description: "位于历史建筑内的酒馆，提供传统澳式美食和当地啤酒。",
        image: image1
      },
      {
        name: "山顶餐厅",
        type: "现代澳式",
        description: "位于威灵顿山顶，提供现代澳式美食和壮丽的城市景色。",
        image: image2
      }
    ],
    relatedTours: [1, 3, 5]
  },
  {
    id: 2,
    region: "菲欣纳半岛",
    description: "壮丽的海岸线和世界级的徒步路线，自然爱好者的天堂",
    longDescription: "菲欣纳半岛位于塔斯马尼亚东海岸，以其壮观的海岸线和世界级的徒步路线而闻名。这里有著名的酒杯湾，其完美的新月形海滩和清澈的蓝色海水被评为世界上最美丽的海滩之一。菲欣纳国家公园内有多条徒步路线，包括著名的酒杯湾徒步和温希海滩徒步，让游客可以欣赏到壮丽的海岸景观和丰富的野生动物。塔斯曼拱门和魔鬼厨房等自然奇观展示了大自然的鬼斧神工。这里还是观赏野生动物的理想地点，可以看到袋鼠、袋熊和各种鸟类。",
    image: image2,
    galleryImages: [image2, image3, image4, image5],
    attractions: [
      {
        name: "酒杯湾",
        description: "世界上最美丽的海滩之一，拥有完美的新月形海滩和清澈的蓝色海水。",
        image: image2
      },
      {
        name: "菲欣纳国家公园",
        description: "拥有多条世界级徒步路线和壮丽的海岸景观。",
        image: image3
      },
      {
        name: "塔斯曼拱门",
        description: "由海水侵蚀形成的自然石拱，是菲欣纳半岛的标志性景点。",
        image: image4
      },
      {
        name: "魔鬼厨房",
        description: "由海水侵蚀形成的奇特岩石地貌，浪潮冲击岩石时发出轰鸣声。",
        image: image5
      }
    ],
    activities: [
      {
        name: "徒步旅行",
        description: "体验世界级的徒步路线，如酒杯湾徒步和温希海滩徒步。",
        icon: <FaHiking />
      },
      {
        name: "野生动物观赏",
        description: "观赏袋鼠、袋熊和各种鸟类等野生动物。",
        icon: <FaLeaf />
      },
      {
        name: "摄影",
        description: "捕捉壮丽的海岸景观和自然奇观。",
        icon: <FaCamera />
      }
    ],
    bestSeason: "春季至秋季",
    recommendedDays: "2-4天",
    accommodation: [
      {
        name: "酒杯湾度假村",
        type: "度假村",
        description: "位于酒杯湾附近的豪华度假村，提供舒适的住宿和壮丽的海景。",
        image: image6
      },
      {
        name: "菲欣纳海滨小屋",
        type: "海滨小屋",
        description: "位于海滩附近的舒适小屋，提供自助式住宿。",
        image: image7
      },
      {
        name: "国家公园露营地",
        type: "露营地",
        description: "位于菲欣纳国家公园内的露营地，提供基本设施和亲近自然的体验。",
        image: image8
      }
    ],
    dining: [
      {
        name: "海湾餐厅",
        type: "海鲜",
        description: "提供新鲜的当地海鲜和塔斯马尼亚葡萄酒，享有美丽的海景。",
        image: image1
      },
      {
        name: "国家公园咖啡馆",
        type: "咖啡馆",
        description: "位于菲欣纳国家公园内的咖啡馆，提供简单的餐点和饮料。",
        image: image2
      },
      {
        name: "当地酒馆",
        type: "酒馆",
        description: "提供传统澳式美食和当地啤酒，是结识当地人的好地方。",
        image: image3
      }
    ],
    relatedTours: [2, 4, 6]
  }
];

const RegionDetail = () => {
  const { id } = useParams();
  const [region, setRegion] = useState(null);
  const [activeTab, setActiveTab] = useState("attractions");

  useEffect(() => {
    // 在实际应用中，这里应该从API获取数据
    // 这里我们模拟从预设数据中获取
    const regionId = parseInt(id);
    const foundRegion = regionsDetailData.find(r => r.id === regionId);
    
    if (foundRegion) {
      setRegion(foundRegion);
      document.title = `${foundRegion.region} | 塔斯马尼亚旅游`;
    }
    
    window.scrollTo(0, 0);
  }, [id]);

  if (!region) {
    return (
      <Container className="py-5 text-center">
        <h2>正在加载...</h2>
      </Container>
    );
  }

  return (
    <>
      <Breadcrumbs 
        title={region.region} 
        pagename="旅游区域" 
        childpagename={region.region}
        subtitle={region.description}
      />
      
      {/* 区域介绍 */}
      <section className="region-intro py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} md={12} className="mb-4 mb-lg-0">
              <div className="region-carousel">
                <Carousel>
                  {region.galleryImages.map((image, index) => (
                    <Carousel.Item key={index}>
                      <img
                        className="d-block w-100 carousel-image"
                        src={image}
                        alt={`${region.region} - 图片 ${index + 1}`}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="region-description">
                <h2 className="mb-4">关于{region.region}</h2>
                <p className="region-long-description">{region.longDescription}</p>
                <div className="region-info mt-4">
                  <div className="info-item">
                    <FaCalendarAlt />
                    <span>最佳旅游季节: {region.bestSeason}</span>
                  </div>
                  <div className="info-item">
                    <FaInfoCircle />
                    <span>建议游览时间: {region.recommendedDays}</span>
                  </div>
                </div>
                <Link to="/tours">
                  <Button variant="primary" className="mt-4">查看相关行程</Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* 区域详情选项卡 */}
      <section className="region-details py-5 bg-light">
        <Container>
          <Tab.Container id="region-tabs" defaultActiveKey="attractions">
            <Nav variant="pills" className="region-nav mb-4">
              <Nav.Item>
                <Nav.Link eventKey="attractions" onClick={() => setActiveTab("attractions")}>
                  必游景点
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="activities" onClick={() => setActiveTab("activities")}>
                  推荐活动
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="accommodation" onClick={() => setActiveTab("accommodation")}>
                  住宿推荐
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="dining" onClick={() => setActiveTab("dining")}>
                  美食指南
                </Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content>
              <Tab.Pane eventKey="attractions">
                <h3 className="tab-title">必游景点</h3>
                <p className="tab-description">探索{region.region}的标志性景点和自然奇观</p>
                <Row>
                  {region.attractions.map((attraction, index) => (
                    <Col lg={6} md={6} className="mb-4" key={index}>
                      <Card className="attraction-card h-100">
                        <div className="attraction-image">
                          <img src={attraction.image} alt={attraction.name} className="img-fluid" />
                        </div>
                        <Card.Body>
                          <Card.Title>{attraction.name}</Card.Title>
                          <Card.Text>{attraction.description}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              <Tab.Pane eventKey="activities">
                <h3 className="tab-title">推荐活动</h3>
                <p className="tab-description">体验{region.region}的特色活动和户外探险</p>
                <Row>
                  {region.activities.map((activity, index) => (
                    <Col lg={4} md={6} className="mb-4" key={index}>
                      <Card className="activity-card h-100">
                        <Card.Body>
                          <div className="activity-icon">
                            {activity.icon}
                          </div>
                          <Card.Title>{activity.name}</Card.Title>
                          <Card.Text>{activity.description}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              <Tab.Pane eventKey="accommodation">
                <h3 className="tab-title">住宿推荐</h3>
                <p className="tab-description">在{region.region}找到最适合您的住宿选择</p>
                <Row>
                  {region.accommodation.map((place, index) => (
                    <Col lg={4} md={6} className="mb-4" key={index}>
                      <Card className="accommodation-card h-100">
                        <div className="accommodation-image">
                          <img src={place.image} alt={place.name} className="img-fluid" />
                          <div className="accommodation-type">{place.type}</div>
                        </div>
                        <Card.Body>
                          <Card.Title>{place.name}</Card.Title>
                          <Card.Text>{place.description}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
              
              <Tab.Pane eventKey="dining">
                <h3 className="tab-title">美食指南</h3>
                <p className="tab-description">品尝{region.region}的当地美食和特色餐厅</p>
                <Row>
                  {region.dining.map((restaurant, index) => (
                    <Col lg={4} md={6} className="mb-4" key={index}>
                      <Card className="dining-card h-100">
                        <div className="dining-image">
                          <img src={restaurant.image} alt={restaurant.name} className="img-fluid" />
                          <div className="dining-type">{restaurant.type}</div>
                        </div>
                        <Card.Body>
                          <Card.Title>{restaurant.name}</Card.Title>
                          <Card.Text>{restaurant.description}</Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Container>
      </section>
      
      {/* 相关行程 */}
      <section className="related-tours py-5">
        <Container>
          <div className="section-title text-center mb-4">
            <h2>相关行程推荐</h2>
            <p>探索{region.region}的精选旅游路线</p>
          </div>
          
          <div className="row">
            {region.relatedTours.map((item, index) => (
              <div className="col-md-4 mb-4" key={index}>
                <div className="region-tour-card">
                  <img src={image3} alt={item.name} />
                  <div className="region-tour-content">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="mt-3">
                      <Link to={`/tours/${item.id}`} className="btn btn-outline-primary">了解更多</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <Link to="/tours">
              <Button variant="primary">查看更多行程</Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
};

export default RegionDetail; 