import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaCalendarAlt, FaQuoteLeft } from 'react-icons/fa';
import './CustomerReviews.css';

const CustomerReviews = ({ tourId, tourType, reviews = [], loading = false }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [displayReviews, setDisplayReviews] = useState([]);

  // 默认展示的评价数量
  const DEFAULT_DISPLAY_COUNT = 3;

  useEffect(() => {
    // 模拟评价数据（如果没有真实数据）
    if (!reviews || reviews.length === 0) {
      const mockReviews = [
        {
          id: 1,
          userName: "张先生",
          rating: 5,
          date: "2024-01-15",
          title: "非常棒的一日游体验！",
          content: "导游非常专业，景点安排合理，车辆舒适。特别是摇篮山的风景让人印象深刻，推荐给所有想要体验塔斯马尼亚自然美景的朋友！",
          verified: true,
          helpful: 12
        },
        {
          id: 2,
          userName: "李女士",
          rating: 4.5,
          date: "2024-01-08",
          title: "值得推荐的旅程",
          content: "整体体验很好，导游很耐心地为我们介绍当地文化和历史。酒店安排也不错，就是天气有点变化无常，建议准备好防雨衣物。",
          verified: true,
          helpful: 8
        },
        {
          id: 3,
          userName: "王先生",
          rating: 5,
          date: "2024-01-03",
          title: "超出期望的旅行",
          content: "HTAS的服务真的很贴心，从接机到送机都安排得很周到。布鲁尼岛的海鲜大餐和薰衣草庄园都让我们难忘。会推荐给朋友！",
          verified: true,
          helpful: 15
        },
        {
          id: 4,
          userName: "陈女士",
          rating: 4,
          date: "2023-12-28",
          title: "不错的家庭旅行选择",
          content: "带着孩子参加的跟团游，导游很照顾小朋友，行程安排也比较轻松。酒杯湾的景色确实很美，孩子们玩得很开心。",
          verified: false,
          helpful: 6
        },
        {
          id: 5,
          userName: "刘先生",
          rating: 5,
          date: "2023-12-20",
          title: "专业的中文服务",
          content: "作为第一次来塔斯马尼亚的游客，选择HTAS是正确的决定。中文导游让我们更好地了解了当地文化，朗塞斯顿的历史让人印象深刻。",
          verified: true,
          helpful: 10
        }
      ];
      // 避免无限循环，只在初始化时设置
      setDisplayReviews(prev => prev.length === 0 ? mockReviews : prev);
    } else {
      setDisplayReviews(reviews);
    }
  }, [reviews]);

  // 渲染星级评分
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // 实心星
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-warning" />);
    }

    // 半星
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-warning" />);
    }

    // 空星
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
    }

    return stars;
  };

  // 计算平均评分
  const calculateAverageRating = () => {
    if (displayReviews.length === 0) return 0;
    const totalRating = displayReviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / displayReviews.length).toFixed(1);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 要显示的评价
  const reviewsToShow = showAllReviews 
    ? displayReviews 
    : displayReviews.slice(0, DEFAULT_DISPLAY_COUNT);

  if (loading) {
    return (
      <div className="customer-reviews-loading text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">正在加载客户评价...</p>
      </div>
    );
  }

  return (
    <div className="customer-reviews-section">
      {/* 评价概览 */}
      <div className="reviews-overview mb-4">
        <Row className="align-items-center">
          <Col md={6}>
            <div className="rating-summary">
              <div className="average-rating-display">
                <span className="average-score">{calculateAverageRating()}</span>
                <div className="rating-stars ms-2">
                  {renderStarRating(parseFloat(calculateAverageRating()))}
                </div>
              </div>
              <p className="rating-text text-muted">
                基于 {displayReviews.length} 条客户评价
              </p>
            </div>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = displayReviews.filter(r => Math.floor(r.rating) === stars).length;
                const percentage = displayReviews.length > 0 ? (count / displayReviews.length) * 100 : 0;
                return (
                  <div key={stars} className="rating-bar-item">
                    <span className="stars-label">{stars}星</span>
                    <div className="rating-progress">
                      <div 
                        className="rating-progress-fill" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="count-label">({count})</span>
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      </div>

      {/* 评价列表 */}
      <div className="reviews-list">
        {reviewsToShow.length > 0 ? (
          <>
            {reviewsToShow.map((review) => (
              <Card key={review.id} className="review-card mb-3">
                <Card.Body>
                  <Row>
                    <Col>
                      <div className="review-header d-flex justify-content-between align-items-start mb-2">
                        <div className="reviewer-info">
                          <div className="reviewer-name d-flex align-items-center">
                            <FaUser className="me-2 text-muted" />
                            <strong>{review.userName}</strong>
                            {review.verified && (
                              <Badge bg="success" className="ms-2 small">
                                verified
                              </Badge>
                            )}
                          </div>
                          <div className="review-date text-muted small">
                            <FaCalendarAlt className="me-1" />
                            {formatDate(review.date)}
                          </div>
                        </div>
                        <div className="review-rating">
                          {renderStarRating(review.rating)}
                          <span className="rating-score ms-2">({review.rating})</span>
                        </div>
                      </div>
                      
                      {review.title && (
                        <h6 className="review-title mb-2">{review.title}</h6>
                      )}
                      
                      <div className="review-content">
                        <FaQuoteLeft className="quote-icon text-muted" />
                        <p className="review-text ms-3">{review.content}</p>
                      </div>
                      
                      {review.helpful && (
                        <div className="review-helpful mt-2">
                          <small className="text-muted">
                            {review.helpful} 人觉得这条评价有用
                          </small>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            {/* 显示更多按钮 */}
            {displayReviews.length > DEFAULT_DISPLAY_COUNT && (
              <div className="text-center mt-3">
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews 
                    ? `收起评价` 
                    : `查看全部 ${displayReviews.length} 条评价`
                  }
                </Button>
              </div>
            )}
          </>
        ) : (
          <Alert variant="info">
            <Alert.Heading>暂无客户评价</Alert.Heading>
            <p>成为第一个评价这个旅游产品的客户吧！</p>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews; 