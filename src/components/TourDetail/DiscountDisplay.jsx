import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Divider, Spin, Alert } from 'antd';
import { DollarOutlined, PercentageOutlined, GiftOutlined } from '@ant-design/icons';
import { calculateTourDiscount } from '../../utils/api';
import { isOperator } from '../../utils/auth';

const { Title, Text } = Typography;

const DiscountDisplay = ({ tour, isAgent, onPriceCalculated }) => {
  const [discountInfo, setDiscountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 检查是否为操作员
  const isUserOperator = isOperator();

  useEffect(() => {
    if (!tour || !tour.price) return;

    const calculateDiscount = async () => {
      // 如果不是代理商或者是操作员，不需要计算折扣
      if (!isAgent || isUserOperator) {
        console.log('用户不是代理商或者是操作员，使用原价');
        setDiscountInfo({
          originalPrice: tour.price,
          discountedPrice: tour.price,
          discountRate: 1.0,
          savedAmount: 0,
          tourId: tour.id,
          tourType: tour.type
        });
        
        // 回调通知父组件价格已计算
        if (onPriceCalculated) {
          onPriceCalculated(tour.price, tour.price);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('准备计算折扣价格，旅游产品信息:', JSON.stringify(tour, null, 2));
        
        // 从localStorage获取关键信息
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        const agentId = localStorage.getItem('agentId');
        
        console.log('当前用户信息:', {
          token: token ? `${token.substring(0, 10)}...` : '无Token',
          userType,
          agentId
        });
        
        if (!agentId) {
          console.error('缺少代理商ID，无法计算折扣');
          throw new Error('无法获取代理商ID');
        }
        
        // 调用API计算折扣价格 - 使用正确的API路径和参数
        console.log('调用calculateTourDiscount API进行折扣计算');
        const result = await calculateTourDiscount({
          id: tour.id,
          tourId: tour.id,
          type: tour.type,
          tourType: tour.type,
          price: tour.price,
          originalPrice: tour.price,
          agentId: parseInt(agentId, 10)
        });
        
        console.log('折扣计算结果:', JSON.stringify(result, null, 2));
        
        // 验证返回的结果是否有效
        if (!result || result.error) {
          throw new Error(result?.error || '折扣计算失败');
        }
        
        setDiscountInfo(result);
        
        // 回调通知父组件价格已计算
        if (onPriceCalculated) {
          onPriceCalculated(result.discountedPrice, result.originalPrice);
        }
      } catch (err) {
        console.error('折扣计算出错:', err);
        setError(`折扣计算失败: ${err.message}`);
        
        // 发生错误时使用原价
        setDiscountInfo({
          originalPrice: tour.price,
          discountedPrice: tour.price,
          discountRate: 1.0,
          savedAmount: 0,
          tourId: tour.id,
          tourType: tour.type,
          error: err.message
        });
        
        // 回调通知父组件价格已计算(使用原价)
        if (onPriceCalculated) {
          onPriceCalculated(tour.price, tour.price);
        }
      } finally {
        setLoading(false);
      }
    };

    calculateDiscount();
  }, [tour, isAgent, onPriceCalculated, isUserOperator]);

  if (!tour || loading) {
    return (
      <Card className="discount-card" bordered={false}>
        <Spin tip="计算价格中...">
          <div className="discount-loading" style={{ height: '120px' }} />
        </Spin>
      </Card>
    );
  }

  if (!discountInfo) {
    return null;
  }

  // 提取折扣信息
  const {
    originalPrice = tour.price,
    discountedPrice = tour.price,
    discountRate = 1.0,
    savedAmount = 0
  } = discountInfo;

  // 是否有折扣 - 操作员不显示折扣信息
  const hasDiscount = !isUserOperator && discountedPrice < originalPrice;
  
  // 折扣百分比
  const discountPercentage = Math.round((1 - discountRate) * 100);

  return (
    <Card className="discount-card" bordered={false}>
      {error && !isUserOperator && (
        <Alert
          message="折扣计算出错"
          description={error}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      
      <Row gutter={[16, 16]} align="middle">
        <Col span={24}>
          <div className="price-display">
            {hasDiscount ? (
              <>
                <Title level={4} style={{ marginBottom: 0 }}>
                  代理商价格: <span className="discount-price">${discountedPrice.toFixed(2)}</span>
                  <span className="original-price">${originalPrice.toFixed(2)}</span>
                </Title>
                <div className="discount-tags">
                  <Tag color="green" icon={<PercentageOutlined />}>{discountPercentage}% 折扣</Tag>
                  <Tag color="red" icon={<DollarOutlined />}>省 ${savedAmount.toFixed(2)}</Tag>
                </div>
              </>
            ) : (
              <Title level={4} style={{ marginBottom: 0 }}>
                价格: ${originalPrice.toFixed(2)}
              </Title>
            )}
          </div>
        </Col>
        
        {hasDiscount && !isUserOperator && (
          <>
            <Col span={24}>
              <Divider style={{ margin: '12px 0' }} />
              <div className="discount-details">
                <Text strong>折扣详情:</Text>
                <ul className="discount-list">
                  <li><Text>原价: ${originalPrice.toFixed(2)}</Text></li>
                  <li><Text>折扣: {discountPercentage}% ({discountRate.toFixed(2)})</Text></li>
                  <li><Text>折后价: ${discountedPrice.toFixed(2)}</Text></li>
                  <li><Text type="success" strong>节省: ${savedAmount.toFixed(2)}</Text></li>
                </ul>
              </div>
            </Col>
            <Col span={24}>
              <div className="agent-note">
                <Text type="secondary">
                  <GiftOutlined style={{ marginRight: 8 }} />
                  代理商专享折扣已自动应用
                </Text>
              </div>
            </Col>
          </>
        )}
      </Row>
    </Card>
  );
};

export default DiscountDisplay; 