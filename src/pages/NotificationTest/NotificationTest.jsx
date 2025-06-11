import React, { useState } from 'react';
import { Card, Button, Space, message, Typography, Divider, Row, Col } from 'antd';
import { 
  BellOutlined, 
  DollarOutlined, 
  MessageOutlined, 
  EditOutlined,
  UserAddOutlined,
  ExclamationCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { notificationApi } from '@/api/notification';
import NotificationCenter from '@/components/NotificationCenter/NotificationCenter';

const { Title, Text } = Typography;

const NotificationTest = () => {
  const [loading, setLoading] = useState(false);

  // 测试创建各种类型的通知
  const createTestNotifications = async () => {
    setLoading(true);
    try {
      await notificationApi.createTestNotification();
      message.success('测试通知创建成功！请查看右上角通知中心');
    } catch (error) {
      message.error('创建测试通知失败');
    } finally {
      setLoading(false);
    }
  };

  // 模拟不同类型的通知
  const simulateNotifications = [
    {
      title: '新订单通知',
      description: '模拟用户下单时的通知',
      icon: <DollarOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: '聊天请求通知',
      description: '模拟用户发起客服请求时的通知',
      icon: <MessageOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: '订单修改通知',
      description: '模拟用户修改或取消订单时的通知',
      icon: <EditOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: '用户注册通知',
      description: '模拟新用户注册时的通知',
      icon: <UserAddOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    },
    {
      title: '退款申请通知',
      description: '模拟用户申请退款时的通知',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      color: '#ff4d4f'
    },
    {
      title: '投诉建议通知',
      description: '模拟用户提交投诉建议时的通知',
      icon: <WarningOutlined style={{ color: '#ff7a45' }} />,
      color: '#ff7a45'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>🔔 实时通知系统测试</Title>
        <NotificationCenter />
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="通知系统功能说明" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text>
                <strong>🎯 功能特点：</strong>
              </Text>
              <ul>
                <li>✅ <strong>实时通知</strong>：通过WebSocket实时推送通知到前端</li>
                <li>✅ <strong>声音提醒</strong>：新通知到达时播放提示音</li>
                <li>✅ <strong>桌面通知</strong>：支持浏览器桌面通知（需要用户授权）</li>
                <li>✅ <strong>视觉提醒</strong>：通知图标闪烁、未读数量显示</li>
                <li>✅ <strong>分类管理</strong>：不同类型通知有不同图标和颜色</li>
                <li>✅ <strong>已读管理</strong>：支持单个和批量标记已读</li>
              </ul>
              
              <Divider />
              
              <Text>
                <strong>🔔 通知触发场景：</strong>
              </Text>
              <ul>
                <li>💰 <strong>新订单</strong>：用户下单时自动发送通知给管理员</li>
                <li>💬 <strong>聊天请求</strong>：用户发起客服请求时通知客服</li>
                <li>📝 <strong>订单修改</strong>：用户修改、取消订单时通知管理员</li>
                <li>👤 <strong>用户注册</strong>：新用户注册时通知管理员</li>
                <li>💸 <strong>退款申请</strong>：用户申请退款时紧急通知管理员</li>
                <li>⚠️ <strong>投诉建议</strong>：用户提交投诉时紧急通知管理员</li>
              </ul>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="测试通知功能" extra={
            <Button 
              type="primary" 
              icon={<BellOutlined />}
              loading={loading}
              onClick={createTestNotifications}
            >
              创建测试通知
            </Button>
          }>
            <Row gutter={[16, 16]}>
              {simulateNotifications.map((item, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card 
                    size="small"
                    style={{ 
                      borderLeft: `4px solid ${item.color}`,
                      height: '100%'
                    }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.icon}
                        <Text strong>{item.title}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {item.description}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="使用说明">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>1. 测试步骤：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>点击上方"创建测试通知"按钮</li>
                  <li>观察右上角通知图标的变化（红色数字表示未读数量）</li>
                  <li>听到提示音（如果浏览器支持）</li>
                  <li>看到桌面通知弹窗（需要授权）</li>
                  <li>点击通知图标查看通知列表</li>
                </ul>
              </div>
              
              <div>
                <Text strong>2. 实际使用场景：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>当用户在前端下单时，后台管理员会收到新订单通知</li>
                  <li>当用户发起客服请求时，客服人员会收到聊天请求通知</li>
                  <li>当用户修改或取消订单时，管理员会收到订单变更通知</li>
                  <li>所有通知都会实时推送，无需刷新页面</li>
                </ul>
              </div>

              <div>
                <Text strong>3. 技术实现：</Text>
                <ul style={{ marginTop: '8px' }}>
                  <li>后端：Spring Boot + WebSocket + MySQL</li>
                  <li>前端：React + Ant Design + WebSocket客户端</li>
                  <li>实时通信：WebSocket双向通信</li>
                  <li>数据存储：MySQL数据库持久化通知记录</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NotificationTest; 