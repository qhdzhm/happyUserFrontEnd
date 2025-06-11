import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import UserInfo from '../../components/UserInfo/UserInfo';
import PriceDisplay from '../../components/PriceDisplay';
import { 
  getUserType, 
  canSeeDiscount, 
  canSeeCredit, 
  isOperator, 
  isAgentMain,
  getAgentId,
  getOperatorId 
} from '../../utils/auth';

const TestOperator = () => {
  const [testPrices] = useState([
    {
      id: 1,
      name: '塔斯马尼亚一日游',
      originalPrice: 200,
      discountedPrice: 160,
      actualPaymentPrice: 160,
      showDiscount: canSeeDiscount()
    },
    {
      id: 2,
      name: '墨尔本三日游',
      originalPrice: 500,
      discountedPrice: 400,
      actualPaymentPrice: 400,
      showDiscount: canSeeDiscount()
    }
  ]);

  const userType = getUserType();
  const canViewDiscount = canSeeDiscount();
  const canViewCredit = canSeeCredit();
  const userIsOperator = isOperator();
  const userIsAgentMain = isAgentMain();

  return (
    <Container className="mt-4">
      <Row>
        <Col md={12}>
          <h2>操作员功能测试页面</h2>
          <Alert variant="info">
            这个页面用于测试代理商主账号和操作员账号的不同显示效果
          </Alert>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <UserInfo showPermissions={true} />
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>当前用户状态</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>用户类型：</strong> {userType}</p>
              <p><strong>是否为操作员：</strong> {userIsOperator ? '是' : '否'}</p>
              <p><strong>是否为代理商主账号：</strong> {userIsAgentMain ? '是' : '否'}</p>
              <p><strong>可以查看折扣：</strong> {canViewDiscount ? '是' : '否'}</p>
              <p><strong>可以查看信用额度：</strong> {canViewCredit ? '是' : '否'}</p>
              {getAgentId() && <p><strong>代理商ID：</strong> {getAgentId()}</p>}
              {getOperatorId() && <p><strong>操作员ID：</strong> {getOperatorId()}</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <h4>价格显示测试</h4>
          <Alert variant={userIsOperator ? 'warning' : 'success'}>
            {userIsOperator ? 
              '操作员视图：您看到的是原价，但实际支付时享受代理商折扣' :
              userIsAgentMain ?
              '代理商主账号视图：您可以看到折扣信息和优惠价格' :
              '普通用户视图：显示标准价格'
            }
          </Alert>
        </Col>
      </Row>

      <Row>
        {testPrices.map(price => (
          <Col md={6} key={price.id} className="mb-3">
            <Card>
              <Card.Body>
                <h6>{price.name}</h6>
                <PriceDisplay
                  originalPrice={price.originalPrice}
                  discountedPrice={price.discountedPrice}
                  actualPaymentPrice={price.actualPaymentPrice}
                  showDiscount={price.showDiscount}
                  showBadge={true}
                  size="large"
                />
                <div className="mt-2">
                  <small className="text-muted">
                    原价: ${price.originalPrice} | 
                    折扣价: ${price.discountedPrice}
                    {userIsOperator && ` | 实际支付: ${price.actualPaymentPrice}`}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>测试说明</h5>
            </Card.Header>
            <Card.Body>
              <h6>测试步骤：</h6>
              <ol>
                <li>使用代理商主账号登录 (agent1/123456) - 应该看到折扣价格和折扣信息</li>
                <li>退出登录，使用操作员账号登录 (operator1/123456) - 应该看到原价，但有提示享受代理商折扣</li>
                <li>对比两种登录方式下的价格显示差异</li>
              </ol>
              
              <h6 className="mt-3">预期效果：</h6>
              <ul>
                <li><strong>代理商主账号：</strong> 显示原价（划线）+ 折扣价 + 折扣标签</li>
                <li><strong>操作员账号：</strong> 只显示原价 + "享受代理商优惠价格"提示</li>
                <li><strong>权限控制：</strong> 操作员无法查看具体折扣率和信用额度信息</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TestOperator; 