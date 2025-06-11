import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <h1 className="display-1">404</h1>
          <h2 className="mb-4">页面未找到</h2>
          <p className="lead mb-4">抱歉，您访问的页面不存在。</p>
          <Link to="/">
            <Button variant="primary" size="lg">
              返回首页
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound; 