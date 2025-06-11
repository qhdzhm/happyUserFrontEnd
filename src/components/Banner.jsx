import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Banner.css';

/**
 * 首页Banner组件
 */
const Banner = () => {
  return (
    <div className="home-banner">
      <div className="banner-overlay"></div>
      <Container className="banner-content">
        <Row className="align-items-center min-vh-80">
          <Col md={8} className="text-white text-center text-md-start">
            <h1 className="banner-title mb-4">探索塔斯马尼亚的自然之美</h1>
            <p className="banner-subtitle mb-4">
              Happy Tassie Travel为您提供最专业的中文旅游服务，带您探索塔斯马尼亚的自然风光、历史文化和美食体验。
            </p>
            <div className="banner-buttons">
              <Link to="/tours?tourTypes=day_tour">
                <Button variant="primary" size="lg" className="me-3 mb-3">
                  一日游
                </Button>
              </Link>
              <Link to="/tours?tourTypes=group_tour">
                <Button variant="outline-light" size="lg" className="mb-3">
                  跟团游
                </Button>
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Banner; 