import React, { useEffect } from "react";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import aboutImg from "../../assets/images/about/aboutimg.png";
import "../About/about.css";
import icons1 from "../../assets/images/icons/destination.png";
import icons2 from "../../assets/images/icons/best-price.png";
import icons3 from "../../assets/images/icons/quick.png";
import { FaMapMarkerAlt, FaUsers, FaHandshake, FaAward, FaHeart, FaShieldAlt } from "react-icons/fa";

const About = () => {
  useEffect(() => {
    document.title = "关于我们 | 塔斯马尼亚旅游";
    window.scroll(0, 0);
  }, []);

  return (
    <>
      <Breadcrumbs title="关于我们" pagename="关于我们" />
      
      {/* 主要介绍部分 */}
      <section className="about-main-section py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} md={12}>
              <div className="about-content">
                <div className="section-title mb-4">
                  <h2>探索塔斯马尼亚的奇妙之旅</h2>
                </div>
                <p className="about-text mb-4">
                  欢迎来到塔斯马尼亚旅游网，我们是专注于为中国游客提供塔斯马尼亚深度旅行体验的专业旅游服务平台。自2015年成立以来，我们始终秉持"让每一次旅行都成为难忘回忆"的理念，致力于为游客打造最地道、最精彩的塔斯马尼亚之旅。
                </p>
                <p className="about-text mb-4">
                  塔斯马尼亚作为澳大利亚最美丽的岛屿之一，拥有纯净的自然环境、丰富的野生动物资源、独特的历史文化和世界级的美食美酒。我们的团队由热爱旅行、熟悉当地的专业人士组成，他们将为您提供最贴心的服务和最专业的建议，让您的塔斯马尼亚之旅充满惊喜与感动。
                </p>
                <div className="about-stats">
                  <Row>
                    <Col md={4} sm={4} className="stat-item">
                      <div className="stat-number">8+</div>
                      <div className="stat-text">年专业经验</div>
                    </Col>
                    <Col md={4} sm={4} className="stat-item">
                      <div className="stat-number">5000+</div>
                      <div className="stat-text">满意客户</div>
                    </Col>
                    <Col md={4} sm={4} className="stat-item">
                      <div className="stat-number">50+</div>
                      <div className="stat-text">精选路线</div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="about-image-container">
                <img
                  src={aboutImg}
                  alt="塔斯马尼亚风景"
                  className="img-fluid main-about-image"
                />
                <div className="about-image-overlay">
                  <h3>发现塔斯马尼亚的美</h3>
                  <p>让我们带您领略这片净土的独特魅力</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 我们的优势部分 */}
      <section className="our-advantages py-5">
        <Container>
          <div className="section-title text-center mb-5">
            <h2>我们的优势</h2>
            <p>为什么选择我们？</p>
          </div>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <Card className="advantage-card h-100">
                <Card.Body>
                  <div className="advantage-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <Card.Title>深度本地体验</Card.Title>
                  <Card.Text>
                    我们的行程不仅包含经典景点，更注重带您探索当地人才知道的隐秘之地，体验真正的塔斯马尼亚生活方式。从野生动物观赏到美食品尝，从历史遗迹到自然奇观，每一站都精心挑选，让您的旅程与众不同。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="advantage-card h-100">
                <Card.Body>
                  <div className="advantage-icon">
                    <FaUsers />
                  </div>
                  <Card.Title>专业中文团队</Card.Title>
                  <Card.Text>
                    我们的团队成员不仅精通中英双语，更深入了解中国游客的需求和偏好。无论是行程规划、景点讲解还是紧急情况处理，我们都能提供专业、贴心的中文服务，让您在异国他乡感受宾至如归的温暖。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="advantage-card h-100">
                <Card.Body>
                  <div className="advantage-icon">
                    <FaHandshake />
                  </div>
                  <Card.Title>灵活定制服务</Card.Title>
                  <Card.Text>
                    我们深知每位游客的需求各不相同，因此提供灵活的行程定制服务。无论您是追求奢华体验、亲子出游还是探险冒险，我们都能根据您的兴趣、时间和预算，量身打造最适合您的塔斯马尼亚之旅。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="advantage-card h-100">
                <Card.Body>
                  <div className="advantage-icon">
                    <FaAward />
                  </div>
                  <Card.Title>品质保证</Card.Title>
                  <Card.Text>
                    我们与当地最优质的酒店、餐厅和景点保持长期合作关系，确保为客户提供最高品质的服务。我们的每一条路线都经过反复考察和优化，力求让您的每一分钱都物有所值，每一刻都值得回味。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="advantage-card h-100">
                <Card.Body>
                  <div className="advantage-icon">
                    <FaHeart />
                  </div>
                  <Card.Title>贴心关怀</Card.Title>
                  <Card.Text>
                    从您咨询的那一刻起，到旅程结束后的回访，我们全程提供贴心服务。行前详细指导、旅途中24小时支持、特殊需求安排...我们关注每一个细节，让您的旅行无忧无虑，尽情享受塔斯马尼亚的美好。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="advantage-card h-100">
                <Card.Body>
                  <div className="advantage-icon">
                    <FaShieldAlt />
                  </div>
                  <Card.Title>安全可靠</Card.Title>
                  <Card.Text>
                    游客的安全是我们的首要考虑。我们的所有行程都符合严格的安全标准，车辆定期检修，导游接受专业培训，并配备紧急联络设备。我们还提供全面的旅游保险建议，让您安心出行，尽享乐趣。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 我们的故事部分 */}
      <section className="our-story py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} md={12} className="order-lg-1 order-2">
              <div className="story-content">
                <div className="section-title mb-4">
                  <h2>我们的故事</h2>
                </div>
                <p className="story-text mb-3">
                  塔斯马尼亚旅游网的创始团队由一群热爱旅行、热爱塔斯马尼亚的华人组成。2015年，几位在塔斯马尼亚留学和工作的中国朋友发现，虽然这里风景如画、物产丰富，但中国游客却因语言障碍和信息不足而难以深度体验这片美丽的土地。
                </p>
                <p className="story-text mb-3">
                  怀着让更多中国游客了解和爱上塔斯马尼亚的初心，我们创立了这个专注于塔斯马尼亚旅游的平台。从最初的几条经典路线，到如今覆盖全岛各类特色体验的全方位服务，我们一路成长，始终坚持"专业、真实、用心"的服务理念。
                </p>
                <p className="story-text mb-4">
                  多年来，我们见证了无数游客在这片土地上的惊喜与感动，也收获了众多客户的信任与好评。每一位游客的笑容和每一条感谢的留言，都是我们前进的动力。未来，我们将继续探索塔斯马尼亚的每一个角落，挖掘更多独特的旅行体验，为您呈现最真实、最美好的塔斯马尼亚。
                </p>
                <Button variant="primary" className="learn-more-btn">了解更多</Button>
              </div>
            </Col>
            <Col lg={6} md={12} className="order-lg-2 order-1 mb-4 mb-lg-0">
              <div className="story-image-grid">
                <div className="story-image story-image-1">
                  <img src="https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="塔斯马尼亚风景" className="img-fluid" />
                </div>
                <div className="story-image story-image-2">
                  <img src="https://images.unsplash.com/photo-1489447068241-b3490214e879?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="塔斯马尼亚风景" className="img-fluid" />
                </div>
                <div className="story-image story-image-3">
                  <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="塔斯马尼亚风景" className="img-fluid" />
                </div>
                <div className="story-image story-image-4">
                  <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="塔斯马尼亚风景" className="img-fluid" />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 我们的承诺部分 */}
      <section className="our-promise py-5">
        <Container>
          <div className="section-title text-center mb-5">
            <h2>我们的承诺</h2>
            <p>每一次旅行，我们都竭诚为您服务</p>
          </div>
          <Row>
            <Col md={4} className="mb-4">
              <div className="promise-card text-center">
                <div className="promise-icon">
                  <img src={icons1} alt="目的地" className="img-fluid" />
                </div>
                <h3>精选目的地</h3>
                <p>
                  我们精心挑选塔斯马尼亚最具特色的景点和体验，让您的旅程充满惊喜与发现。无论是世界遗产、自然奇观还是文化体验，我们都为您提供最优质的选择。
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="promise-card text-center">
                <div className="promise-icon">
                  <img src={icons2} alt="最优价格" className="img-fluid" />
                </div>
                <h3>最优价格</h3>
                <p>
                  我们承诺提供最具竞争力的价格，让您在享受高品质服务的同时不必担心预算问题。我们定期推出特别优惠和季节性折扣，为您的旅行增添更多价值。
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="promise-card text-center">
                <div className="promise-icon">
                  <img src={icons3} alt="快速预订" className="img-fluid" />
                </div>
                <h3>便捷服务</h3>
                <p>
                  从在线咨询到行程预订，从接机服务到全程导览，我们提供一站式旅游解决方案，让您的旅行规划和体验都轻松便捷，尽享塔斯马尼亚的美好时光。
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 加入我们部分 */}
      <section className="join-us py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={8} className="mx-auto text-center">
              <div className="join-us-content">
                <h2>与我们一起探索塔斯马尼亚</h2>
                <p className="mb-4">
                  无论您是首次来访的游客，还是寻找深度体验的旅行者，我们都能为您提供最适合的塔斯马尼亚之旅。立即联系我们，开启您的精彩旅程！
                </p>
                <div className="join-us-buttons">
                  <Button variant="primary" className="me-3">浏览行程</Button>
                  <Button variant="outline-primary">联系我们</Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default About;
