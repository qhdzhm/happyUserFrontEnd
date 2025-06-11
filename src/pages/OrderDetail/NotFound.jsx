import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container className="py-5 text-center">
      <Alert variant="warning">
        <h2>404 - 页面未找到</h2>
        <p>很抱歉，您访问的页面不存在。</p>
      </Alert>
      <Link to="/">
        <Button variant="primary">返回首页</Button>
      </Link>
    </Container>
  );
};

export default NotFound; 