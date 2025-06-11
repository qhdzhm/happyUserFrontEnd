import React from 'react';
import { Card, Row, Col, Form } from 'react-bootstrap';
import { FaPlane } from 'react-icons/fa';
import FlightInfoLookup from './FlightInfoLookup';

/**
 * 航班信息表单部分
 * 
 * @param {Object} props
 * @param {Object} props.formData - 表单数据
 * @param {Function} props.handleChange - 表单字段变化处理函数
 * @param {Function} props.handleFlightInfoFound - 找到航班信息时的回调
 */
const FlightInfoSection = ({ formData, handleChange, handleFlightInfoFound }) => {
  
  // 处理找到航班信息时的回调
  const onFlightInfoFound = (flightInfo, type) => {
    if (handleFlightInfoFound) {
      handleFlightInfoFound(flightInfo, type);
    } else {
      // 默认处理：根据航班信息自动填充相关字段
      const updates = {};
      
      if (type === 'arrival') {
        updates.arrivalDepartureTime = flightInfo.scheduled_departure;
        updates.arrivalLandingTime = flightInfo.scheduled_arrival;
        
        // 如果没有设置接机地点，自动设置为霍巴特机场
        if (!formData.pickupLocation) {
          updates.pickupLocation = '霍巴特机场';
        }
        
        // 设置接机日期为航班到达日期
        const arrivalDate = new Date(flightInfo.scheduled_arrival);
        updates.pickupDate = arrivalDate.toISOString().split('T')[0];
      } else if (type === 'departure') {
        updates.returnDepartureTime = flightInfo.scheduled_departure;
        updates.returnLandingTime = flightInfo.scheduled_arrival;
        
        // 如果没有设置送机地点，自动设置为霍巴特机场
        if (!formData.dropoffLocation) {
          updates.dropoffLocation = '霍巴特机场';
        }
        
        // 设置送机日期为航班出发日期
        const departureDate = new Date(flightInfo.scheduled_departure);
        updates.dropoffDate = departureDate.toISOString().split('T')[0];
      }
      
      // 调用handleChange模拟表单更新
      Object.entries(updates).forEach(([name, value]) => {
        handleChange({
          target: { name, value }
        });
      });
    }
  };
  
  return (
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white">
        <FaPlane className="me-2" /> 航班信息
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-4">
          如果您需要接送机服务，请提供航班信息。您可以手动填写，也可以使用查询功能自动填充航班信息。
        </p>
        
        <Row>
          <Col md={6}>
            <FlightInfoLookup
              flightNumber={formData.flightNumber}
              flightDate={formData.tourStartDate}
              onFlightInfoFound={(data) => onFlightInfoFound(data, 'arrival')}
              type="arrival"
              label="抵达航班号"
              placeholder="例如: JQ723"
              onChange={handleChange}
              name="flightNumber"
            />
            
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>抵达航班起飞时间</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="arrivalDepartureTime"
                    value={formData.arrivalDepartureTime || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>抵达航班降落时间</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="arrivalLandingTime"
                    value={formData.arrivalLandingTime || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>接机地点</Form.Label>
              <Form.Control
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation || ''}
                onChange={handleChange}
                placeholder="例如: 霍巴特机场"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>接机日期</Form.Label>
              <Form.Control
                type="date"
                name="pickupDate"
                value={formData.pickupDate || ''}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <FlightInfoLookup
              flightNumber={formData.returnFlightNumber}
              flightDate={formData.tourEndDate}
              onFlightInfoFound={(data) => onFlightInfoFound(data, 'departure')}
              type="departure"
              label="返程航班号"
              placeholder="例如: JQ456"
              onChange={handleChange}
              name="returnFlightNumber"
            />
            
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>返程航班起飞时间</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="returnDepartureTime"
                    value={formData.returnDepartureTime || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>返程航班降落时间</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="returnLandingTime"
                    value={formData.returnLandingTime || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>送机地点</Form.Label>
              <Form.Control
                type="text"
                name="dropoffLocation"
                value={formData.dropoffLocation || ''}
                onChange={handleChange}
                placeholder="例如: 霍巴特机场"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>送机日期</Form.Label>
              <Form.Control
                type="date"
                name="dropoffDate"
                value={formData.dropoffDate || ''}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>行李数量</Form.Label>
              <Form.Control
                type="number"
                name="luggageCount"
                value={formData.luggageCount || 0}
                onChange={handleChange}
                min="0"
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default FlightInfoSection; 