import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  DatePicker, 
  Select, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Space,
  Descriptions,
  message,
  Spin
} from 'antd';
import { PrinterOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getDailySchedule } from '../../api/tourAssignment';
import './index.scss';

const { Title, Text } = Typography;
const { Option } = Select;

const DailySchedule = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');

  // 获取每日行程数据
  const fetchDailySchedule = async (date, destination = '') => {
    try {
      setLoading(true);
      const params = {
        date: date.format('YYYY-MM-DD'),
        destination: destination
      };
      
      const response = await getDailySchedule(params);
      if (response.code === 1) {
        setScheduleData(response.data || []);
      } else {
        message.error('获取每日行程失败');
      }
    } catch (error) {
      console.error('获取每日行程失败:', error);
      message.error('获取每日行程失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySchedule(selectedDate, selectedDestination);
  }, [selectedDate, selectedDestination]);

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '姓名',
      dataIndex: 'passengerName',
      key: 'passengerName',
      width: 100,
      render: (text) => <Text>{text}</Text>
    },
    {
      title: '人数',
      dataIndex: 'totalPeople',
      key: 'totalPeople',
      width: 60,
      align: 'center'
    },
    {
      title: '联系方式',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 120,
      render: (text) => <Text copyable>{text}</Text>
    },
    {
      title: '地址',
      dataIndex: 'pickupLocation',
      key: 'pickupLocation',
      width: 200,
      ellipsis: true,
      render: (text) => <Text title={text}>{text}</Text>
    },
    {
      title: '送',
      dataIndex: 'dropoffLocation',
      key: 'dropoffLocation',
      width: 100,
      ellipsis: true
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 150,
      ellipsis: true,
      render: (text) => {
        if (!text) return '-';
        return (
          <Text 
            title={text}
            style={{ 
              color: text.includes('bonorong') ? '#ff4d4f' : 'inherit' 
            }}
          >
            {text}
          </Text>
        );
      }
    },
    {
      title: '下一站',
      dataIndex: 'nextDestination',
      key: 'nextDestination',
      width: 100,
      render: (text) => {
        if (!text) return '-';
        const color = text.includes('Wineglass') ? '#52c41a' : 
                     text.includes('HBA') ? '#1890ff' : 'default';
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  // 获取独特的目的地列表
  const destinations = [...new Set(scheduleData.map(item => item.destination))].filter(Boolean);

  // 计算统计信息
  const totalPeople = scheduleData.reduce((sum, item) => sum + (item.totalPeople || 0), 0);
  const totalOrders = scheduleData.length;

  // 分组数据按导游和车辆
  const groupedData = scheduleData.reduce((groups, item) => {
    const key = `${item.guideName}-${item.licensePlate}`;
    if (!groups[key]) {
      groups[key] = {
        guideName: item.guideName,
        licensePlate: item.licensePlate,
        vehicleType: item.vehicleType,
        destination: item.destination,
        orders: []
      };
    }
    groups[key].orders.push(item);
    return groups;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // 导出功能实现
    message.info('导出功能开发中...');
  };

  const handleRefresh = () => {
    fetchDailySchedule(selectedDate, selectedDestination);
  };

  return (
    <div className="daily-schedule">
      {/* 头部控制区域 */}
      <Card className="control-card">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space>
              <Text strong>日期:</Text>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <Text strong>目的地:</Text>
              <Select
                value={selectedDestination}
                onChange={setSelectedDestination}
                placeholder="全部目的地"
                style={{ width: 150 }}
                allowClear
              >
                {destinations.map(dest => (
                  <Option key={dest} value={dest}>{dest}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={12}>
            <Space style={{ float: 'right' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
              >
                刷新
              </Button>
              <Button 
                icon={<PrinterOutlined />} 
                onClick={handlePrint}
              >
                打印
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                onClick={handleExport}
                type="primary"
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Card className="stats-card">
        <Descriptions column={4} size="small">
          <Descriptions.Item label="日期">
            <Text strong>{selectedDate.format('YYYY年MM月DD日')}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="总订单">
            <Text strong style={{ color: '#1890ff' }}>{totalOrders}单</Text>
          </Descriptions.Item>
          <Descriptions.Item label="总人数">
            <Text strong style={{ color: '#52c41a' }}>{totalPeople}人</Text>
          </Descriptions.Item>
          <Descriptions.Item label="导游/车辆组">
            <Text strong style={{ color: '#722ed1' }}>{Object.keys(groupedData).length}组</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 分组显示每个导游的行程 */}
      <Spin spinning={loading}>
        {Object.entries(groupedData).map(([key, group]) => {
          const groupTotalPeople = group.orders.reduce((sum, order) => sum + (order.totalPeople || 0), 0);
          
          return (
            <Card 
              key={key}
              className="schedule-group-card"
              title={
                <Row>
                  <Col span={12}>
                    <Space>
                      <Tag color="blue">{group.destination}</Tag>
                      <Text strong>导游: {group.guideName}</Text>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space style={{ float: 'right' }}>
                      <Text strong>
                        {group.licensePlate} {group.vehicleType} - {groupTotalPeople}人
                      </Text>
                    </Space>
                  </Col>
                </Row>
              }
            >
              <Table
                dataSource={group.orders}
                columns={columns}
                rowKey={(record) => `${record.orderNumber}-${record.passengerName}`}
                pagination={false}
                size="small"
                bordered
                className="schedule-table"
              />
            </Card>
          );
        })}
      </Spin>

      {/* 空状态 */}
      {!loading && scheduleData.length === 0 && (
        <Card className="empty-card">
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Title level={4} type="secondary">
              {selectedDate.format('YYYY-MM-DD')} 暂无行程安排
            </Title>
            <Text type="secondary">请选择其他日期或检查是否有分配记录</Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailySchedule; 