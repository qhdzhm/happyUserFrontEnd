import React, { useState } from 'react';
import { InputGroup, Form, Button, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaSearch, FaPlane, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { getFlightByNumber } from '../services/flightService';
import { toast } from 'react-hot-toast';

/**
 * 航班信息查询组件
 * 用于查询航班信息并自动填充到表单中
 * 
 * @param {Object} props
 * @param {string} props.flightNumber - 当前航班号
 * @param {string} props.flightDate - 当前日期
 * @param {function} props.onFlightInfoFound - 找到航班信息时的回调函数
 * @param {string} props.type - 航班类型 'arrival' 或 'departure'
 * @param {string} props.label - 标签文本
 * @param {string} props.placeholder - 输入框占位符
 */
const FlightInfoLookup = ({
  flightNumber,
  flightDate,
  onFlightInfoFound,
  type = 'arrival',
  label = '航班号',
  placeholder = '例如: JQ723',
  onChange,
  name
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [flightInfo, setFlightInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // 处理航班号变化
  const handleFlightNumberChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    // 清除之前的结果
    setFlightInfo(null);
    setError(null);
    setShowResult(false);
  };
  
  // 查询航班信息
  const handleLookup = async () => {
    if (!flightNumber) {
      toast.error('请输入航班号');
      return;
    }
    
    if (!flightDate) {
      toast.error('请选择日期');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFlightInfo(null);
    setShowResult(true);
    
    try {
      // 格式化日期为YYYY-MM-DD
      const formattedDate = new Date(flightDate).toISOString().split('T')[0];
      
      const response = await getFlightByNumber(flightNumber, formattedDate);
      
      if (response && response.code === 1 && response.data) {
        setFlightInfo(response.data);
        
        // 将航班信息传递给父组件
        if (onFlightInfoFound) {
          onFlightInfoFound(response.data, type);
        }
        
        toast.success('已找到航班信息');
      } else {
        setError(response?.msg || '未找到航班信息');
        toast.error('未找到航班信息');
      }
    } catch (error) {
      console.error('查询航班信息失败:', error);
      setError(error.message || '查询航班信息失败，请稍后重试');
      toast.error('查询失败: ' + (error.message || '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 格式化日期时间
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleString('zh-CN', options);
  };
  
  return (
    <div className="flight-info-lookup">
      <Form.Group className="mb-3">
        <Form.Label>{label}</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            value={flightNumber || ''}
            onChange={handleFlightNumberChange}
            placeholder={placeholder}
            name={name}
          />
          <Button 
            variant="outline-primary" 
            onClick={handleLookup}
            disabled={isLoading || !flightNumber || !flightDate}
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : <FaSearch />} 查询
          </Button>
        </InputGroup>
        <Form.Text className="text-muted">
          输入航班号并选择日期后点击查询按钮
        </Form.Text>
      </Form.Group>
      
      {showResult && (
        <div className="flight-info-result mb-4">
          {isLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">正在查询航班信息...</p>
            </div>
          ) : error ? (
            <Alert variant="warning" className="mb-0">
              <strong>查询错误:</strong> {error}
            </Alert>
          ) : flightInfo ? (
            <Card className="flight-info-card border-primary">
              <Card.Header className="bg-primary text-white">
                <FaPlane className="me-2" /> {flightInfo.airline_name} {flightInfo.flight_number}
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="airport-info mb-2">
                      <strong>{flightInfo.departure_city}</strong>
                      <div className="airport-code">{flightInfo.departure_airport}</div>
                    </div>
                    <div className="time-info">
                      <FaCalendarAlt className="me-1 text-muted" /> 
                      <span>{formatDateTime(flightInfo.scheduled_departure)}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="airport-info mb-2">
                      <strong>{flightInfo.arrival_city}</strong>
                      <div className="airport-code">{flightInfo.arrival_airport}</div>
                    </div>
                    <div className="time-info">
                      <FaCalendarAlt className="me-1 text-muted" /> 
                      <span>{formatDateTime(flightInfo.scheduled_arrival)}</span>
                    </div>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={6}>
                    <div className="flight-status">
                      <strong>状态:</strong> {flightInfo.status || '计划中'}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="flight-aircraft">
                      <strong>机型:</strong> {flightInfo.aircraft_type || '未知'}
                    </div>
                  </Col>
                </Row>
                {flightInfo.delay_minutes > 0 && (
                  <Alert variant="warning" className="mt-3 mb-0">
                    <FaClock className="me-2" /> 
                    航班延误 {flightInfo.delay_minutes} 分钟
                  </Alert>
                )}
              </Card.Body>
              <Card.Footer className="bg-light">
                <small className="text-muted">信息更新时间: {new Date().toLocaleString()}</small>
              </Card.Footer>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default FlightInfoLookup; 