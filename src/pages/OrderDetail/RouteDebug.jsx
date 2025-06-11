import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';

const RouteDebug = () => {
  const params = useParams();
  const location = useLocation();
  
  return (
    <Container className="py-5">
      <Alert variant="info">
        <h2>路由调试页面</h2>
        <p>当前路径: <code>{location.pathname}</code></p>
        <p>URL参数:</p>
        <pre>{JSON.stringify(params, null, 2)}</pre>
        <p>URL查询参数:</p>
        <pre>{JSON.stringify(location.search, null, 2)}</pre>
        <p>URL状态:</p>
        <pre>{JSON.stringify(location.state, null, 2)}</pre>
      </Alert>
    </Container>
  );
};

export default RouteDebug; 