import React from "react";
import "./footer.css"
import { Col, Container, Row, Form, Button } from "react-bootstrap";
import { NavLink, useLocation } from "react-router-dom";
import tasmaniaVideo from "../../../assets/videos/footer.mp4";
import logo from "../../../assets/images/logo/logo.png";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <>
    <footer className={`${isHomePage ? 'home-page-footer' : ''}`}>
      <div className="video-container">
        <video autoPlay muted loop className="footer-video">
          <source src={tasmaniaVideo} type="video/mp4" />
        </video>
        <div className="footer-overlay"></div>
      </div>

      <div className="footer-subscribe-section">
        <Container>
          <div className="keep-in-touch text-center">
            <h5>联系我们</h5>
            <h2 className="travel-title">与我们一起旅行</h2>
            <div className="email-subscription">
              <Form className="d-flex justify-content-center">
                <div className="email-input-container">
                  <Form.Control type="email" placeholder="请输入您的邮箱地址" className="footer-email-input" />
                  <Button className="send-btn">发送 <i className="bi bi-send-fill"></i></Button>
                </div>
              </Form>
            </div>
          </div>
        </Container>
      </div>

      <div className="footer-main">
        <Container>
          <div className="footer-content">
            <Row className="g-4">
              <Col lg="6" md="6" sm="12">
                <div className="footer-brand">
                  <div className="brand-logo">
                    <img src={logo} alt="Happy Tassie Holiday" className="footer-logo-img" />
                  </div>
                  <p className="brand-description">
                    塔斯马尼亚岛是一个充满魅力的自然天堂，拥有壮丽的自然风光、丰富的野生动物和独特的文化遗产。
                  </p>
                </div>
              </Col>
              
              <Col lg="6" md="6" sm="12">
                <Row>
                  <Col lg="4" md="4" sm="12">
                    <div className="footer-links">
                      <h5>我们的服务</h5>
                      <ul>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 塔斯马尼亚观光</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 私人定制</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 旅游保险</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 专业摄影</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 安全保障</NavLink></li>
                      </ul>
                    </div>
                  </Col>
                  
                  <Col lg="4" md="4" sm="12">
                    <div className="footer-links">
                      <h5>热门目的地</h5>
                      <ul>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 霍巴特</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 摇篮山</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 菲欣娜湾</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 布鲁尼岛</NavLink></li>
                        <li><NavLink to="/"><i className="bi bi-chevron-right"></i> 朗塞斯顿</NavLink></li>
                      </ul>
                    </div>
                  </Col>
                  
                  <Col lg="4" md="4" sm="12">
                    <div className="footer-qrcode">
                      <h5>扫码关注</h5>
                      <div className="qrcode-box">
                        <i className="bi bi-qr-code"></i>
                        <p>微信公众号</p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
            
          </div>
        </Container>
        
        <div className="footer-copyright">
          <p>HAPPY TASSIE TRAVEL | 版权所有 © 2024 澳大利亚塔斯马尼亚旅行社</p>
        </div>
      </div>
    </footer>


    </>
  );
};

export default Footer;

