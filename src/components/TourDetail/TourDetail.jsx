import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab, ListGroup } from 'react-bootstrap';
import { tourService } from '../../services';
import './TourDetail.css';
import * as api from '../../utils/api';
import { formatPrice } from '../../utils/helpers';
import { useSelector } from 'react-redux';
import { calculateTourDiscount } from '../../utils/api';
import PriceDisplay from '../PriceDisplay';

const TourDetail = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 添加价格相关状态
  const [priceInfo, setPriceInfo] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  
  // 从Redux获取用户角色和代理商ID
  const userType = useSelector(state => state.auth.userType);
  const agentId = useSelector(state => state.auth.id);
  const isAgent = userType === 'agent';

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        setLoading(true);
        
        // 获取旅游产品详情，使用缓存
        const tourData = await tourService.getTourById(id);
        setTour(tourData);
        
        // 获取旅游产品评论，使用缓存
        const reviewsData = await tourService.getTourReviews(id);
        setReviews(reviewsData);
        
        setError(null);
        
        // 如果是代理商用户且tour有价格，计算折扣价
        if (tourData && tourData.price && isAgent && agentId) {
          fetchDiscountPrice(tourData.price);
        }
      } catch (err) {
        console.error('获取旅游产品详情失败:', err);
        setError('获取旅游产品详情失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [id, isAgent, agentId]);
  
  // 获取折扣价格
  const fetchDiscountPrice = async (originalPrice) => {
    try {
      setDiscountLoading(true);
      console.log('获取折扣价格，原价:', originalPrice, '代理商ID:', agentId);
      
      // 使用api.js中的calculateTourDiscount函数，它会自动处理token
      const result = await calculateTourDiscount({
        tourId: id,
        tourType: tour?.type || 'day-tour',
        originalPrice: originalPrice,
        agentId: agentId
      });
      
      console.log('折扣价格信息:', result);
      setPriceInfo(result);
    } catch (error) {
      console.error('获取折扣价格失败:', error);
      // 使用默认价格（不打折）
      setPriceInfo({
        originalPrice,
        discountedPrice: originalPrice,
        discountRate: 1.0,
        savedAmount: 0
      });
    } finally {
      setDiscountLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (!tour) {
    return (
      <Container className="py-5">
        <div className="alert alert-info" role="alert">
          未找到旅游产品
        </div>
      </Container>
    );
  }

  // 渲染价格区域
  const renderPriceDisplay = () => {
    // 如果是代理商且有折扣价信息
    if (isAgent && priceInfo) {
      return (
        <div className="tour-detail-price-container">
          <PriceDisplay 
            originalPrice={priceInfo.originalPrice}
            discountedPrice={priceInfo.discountedPrice}
            size="large"
            showBadge={true}
          />
        </div>
      );
    }
    
    // 非代理商或无折扣信息时显示原价
    return (
      <div className="tour-detail-price">
        <PriceDisplay 
          originalPrice={tour.price}
          size="large"
        />
      </div>
    );
  };

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8}>
          <div className="tour-detail-image-container mb-4">
            <img src={tour.image} alt={tour.title} className="tour-detail-image" />
            {discountLoading ? (
              <div className="tour-detail-price">价格计算中...</div>
            ) : (
              renderPriceDisplay()
            )}
          </div>
          
          <h1 className="tour-detail-title mb-3">{tour.title}</h1>
          
          <div className="tour-detail-info mb-4">
            <Badge bg="primary" className="me-2">
              <i className="bi bi-clock me-1"></i> {tour.duration} 小时
            </Badge>
            <Badge bg="success" className="me-2">
              <i className="bi bi-geo-alt me-1"></i> {tour.location}
            </Badge>
            <Badge bg="warning" className="me-2">
              <i className="bi bi-star-fill me-1"></i> {tour.rating}
            </Badge>
            <Badge bg="info">
              <i className="bi bi-tag me-1"></i> {tour.category}
            </Badge>
          </div>
          
          <Tabs defaultActiveKey="description" className="mb-4">
            <Tab eventKey="description" title="描述">
              <div className="p-3">
                <p className="tour-detail-description">{tour.description}</p>
              </div>
            </Tab>
            <Tab eventKey="itinerary" title="行程">
              <div className="p-3">
                <ListGroup variant="flush">
                  {tour.itinerary && tour.itinerary.map((item, index) => (
                    <ListGroup.Item key={index} className="d-flex">
                      <div className="tour-itinerary-time">{item.time}</div>
                      <div className="tour-itinerary-activity">{item.activity}</div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Tab>
            <Tab eventKey="reviews" title={`评论 (${reviews.length})`}>
              <div className="p-3">
                {reviews.length > 0 ? (
                  <div className="tour-reviews">
                    {reviews.map((review) => (
                      <Card key={review.id} className="mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center">
                              <div className="review-avatar">
                                {review.userName.charAt(0)}
                              </div>
                              <div className="ms-2">
                                <div className="review-name">{review.userName}</div>
                                <div className="review-date">{review.date}</div>
                              </div>
                            </div>
                            <div className="review-rating">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <i
                                  key={i}
                                  className={`bi ${
                                    i < review.rating ? 'bi-star-fill' : 'bi-star'
                                  }`}
                                ></i>
                              ))}
                            </div>
                          </div>
                          <p className="review-comment">{review.comment}</p>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">暂无评论</p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Col>
        
        <Col lg={4}>
          <Card className="booking-card">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">预订此行程</h5>
            </Card.Header>
            <Card.Body>
              <div className="booking-info mb-3">
                <div className="booking-info-item">
                  <i className="bi bi-cash"></i> 价格：
                  <PriceDisplay 
                    originalPrice={tour.price}
                    discountedPrice={isAgent && priceInfo ? priceInfo.discountedPrice : null}
                    size="medium"
                    showBadge={false}
                  />
                </div>
                <div className="booking-info-item">
                  <i className="bi bi-clock"></i> 持续时间：
                  <span className="fw-bold">{tour.duration} 小时</span>
                </div>
                <div className="booking-info-item">
                  <i className="bi bi-people"></i> 最小成团人数：
                  <span className="fw-bold">2 人</span>
                </div>
              </div>
              
              <Link to={`/booking/${tour.id}`} className="btn btn-primary w-100">
                立即预订
              </Link>
            </Card.Body>
          </Card>
          
          <Card className="mt-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">需要帮助？</h5>
            </Card.Header>
            <Card.Body>
              <div className="help-info">
                <div className="help-info-item">
                  <i className="bi bi-telephone"></i> 电话：
                  <span className="fw-bold">+61 3 6123 4567</span>
                </div>
                <div className="help-info-item">
                  <i className="bi bi-envelope"></i> 邮箱：
                  <span className="fw-bold">info@happytassietravel.com</span>
                </div>
                <div className="help-info-item">
                  <i className="bi bi-whatsapp"></i> WhatsApp：
                  <span className="fw-bold">+61 4 1234 5678</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TourDetail; 