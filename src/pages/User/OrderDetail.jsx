import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './User.css';

/**
 * 订单详情页面 - 空组件
 */
const OrderDetail = () => {
  const { bookingId } = useParams();
  const { isAuthenticated } = useSelector(state => state.auth);

  // 如果未登录，提示登录
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先<Link to="/auth/login" className="alert-link">登录</Link>查看订单详情
        </Alert>
      </Container>
    );
  }

  // 登录后显示空页面
  return (
    <Container className="py-5">
      <div className="d-flex align-items-center mb-4">
        <Link to="/orders" className="btn btn-link ps-0 text-decoration-none">
          返回订单列表
        </Link>
        <h2 className="mb-0 ms-3">订单详情</h2>
      </div>
      
      <div className="text-center py-5">
        <p className="mb-4">订单详情功能维护中，请稍后再试...</p>
        <p className="text-muted mb-4">订单ID: {bookingId}</p>
        <Link to="/">
          <Button variant="primary">返回首页</Button>
        </Link>
      </div>
    </Container>
  );
};

export default OrderDetail; 