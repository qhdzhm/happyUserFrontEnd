import React from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const Cart = () => {
  // 从Redux获取购物车状态
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // 模拟购物车数据
  const cartItems = [
    {
      id: 1,
      name: '霍巴特一日游',
      image: '/images/placeholder.jpg',
      price: 899,
      quantity: 2,
      date: '2023-10-15',
      type: 'day_tour'
    },
    {
      id: 2,
      name: '塔斯马尼亚环岛三日游',
      image: '/images/placeholder.jpg',
      price: 2499,
      quantity: 1,
      date: '2023-11-20',
      type: 'group_tour'
    }
  ];
  
  // 计算总价
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // 如果用户未登录，显示提示信息
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先<Link to="/login">登录</Link>查看购物车
        </Alert>
      </Container>
    );
  }
  
  // 如果购物车为空，显示提示信息
  if (cartItems.length === 0) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <h2 className="mb-4">购物车</h2>
            <Alert variant="info">
              您的购物车是空的，<Link to="/tours">去看看旅游项目</Link>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h2 className="mb-4">购物车</h2>
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <ListGroup variant="flush">
                {cartItems.map(item => (
                  <ListGroup.Item key={item.id} className="py-3">
                    <Row className="align-items-center">
                      <Col xs={3} md={2}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="img-fluid rounded"
                        />
                      </Col>
                      <Col xs={9} md={4}>
                        <h5>{item.name}</h5>
                        <p className="text-muted mb-0">
                          日期: {item.date}
                        </p>
                        <Badge bg={item.type === 'day_tour' ? 'info' : 'primary'}>
                          {item.type === 'day_tour' ? '一日游' : '跟团游'}
                        </Badge>
                      </Col>
                      <Col xs={12} md={2} className="mt-3 mt-md-0">
                        <div className="d-flex align-items-center quantity-control">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus />
                          </Button>
                          <Form.Control
                            type="number"
                            min="1"
                            value={item.quantity}
                            className="text-center mx-2"
                            style={{ width: '50px' }}
                            readOnly
                          />
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                          >
                            <FaPlus />
                          </Button>
                        </div>
                      </Col>
                      <Col xs={6} md={2} className="text-start text-md-end mt-3 mt-md-0">
                        <h5>${item.price.toFixed(2)}</h5>
                        <p className="text-muted mb-0">
                          小计: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </Col>
                      <Col xs={6} md={2} className="text-end mt-3 mt-md-0">
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
          <div className="d-flex justify-content-between">
            <Link to="/tours">
              <Button variant="outline-secondary">
                继续购物
              </Button>
            </Link>
            <Button variant="outline-danger">
              清空购物车
            </Button>
          </div>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header as="h5">订单汇总</Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>商品总额</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>折扣</span>
                  <span>-$0.00</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>服务费</span>
                  <span>$0.00</span>
                </ListGroup.Item>
              </ListGroup>
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">总计</h5>
                <h4 className="mb-0">${cartTotal.toFixed(2)}</h4>
              </div>
              <Link to="/checkout">
                <Button variant="primary" size="lg" className="w-100">
                  去结算
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart; 