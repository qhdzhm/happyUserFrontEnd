import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Form, InputGroup, Button, Dropdown, Spinner, Alert } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaStar,
  FaSortAmountDown,
  FaThLarge,
  FaList 
} from "react-icons/fa";

// 内部组件导入
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import Filters from "./Filters";
import PriceDisplay from "../../components/PriceDisplay";
import LoginPrompt from "../../components/Common/LoginPrompt/LoginPrompt";

// API函数导入
import { getAllDayTours, getAllGroupTours } from "../../utils/api";

// CSS样式导入
import "./Tours.css";

const Tours = () => {
  // 状态管理
  const [dayTours, setDayTours] = useState([]);
  const [groupTours, setGroupTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("推荐");
  
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 路由相关
  const location = useLocation();
  const navigate = useNavigate();
  
  // 筛选器引用
  const filtersRef = useRef();
  
  // 从URL获取查询参数
  const queryParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);
  
  // 解构查询参数
  const tourTypes = queryParams.get('tourTypes') || '';
  const selectedTourType = (() => {
    if (tourTypes === 'day_tour') return '一日游';
    if (tourTypes === 'group_tour') return '跟团游';
    if (tourTypes === 'all') return '全部';
    return '一日游'; // 默认值
  })();
  const selectedLocation = queryParams.get('location') || '';
  const selectedDuration = queryParams.get('duration') || '';
  const selectedMinPrice = queryParams.get('min_price') || '';
  const selectedMaxPrice = queryParams.get('max_price') || '';
  const selectedRatings = queryParams.get('rating') || '';
  const selectedThemes = queryParams.get('themes') ? queryParams.get('themes').split(',') : [];
  const selectedSuitableFor = queryParams.get('suitable_for') ? queryParams.get('suitable_for').split(',') : [];
  const startDate = queryParams.get('start_date') || '';
  const endDate = queryParams.get('end_date') || '';
  
  const selectedPriceRange = selectedMinPrice && selectedMaxPrice ? 
    `${selectedMinPrice}-${selectedMaxPrice}` : '';

  // 窗口调整处理
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && showFilters) {
        setShowFilters(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showFilters]);

  // 获取时长显示
  const getDuration = (item) => {
    if (item.duration_hours) {
      return `${item.duration_hours}小时`;
    } else if (item.duration_days && item.duration_nights) {
      return `${item.duration_days}天${item.duration_nights}晚`;
    } else if (item.duration) {
      return item.duration;
    }
    return "8小时";
  };

  // 数据获取
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [dayToursResponse, groupToursResponse] = await Promise.all([
          getAllDayTours(),
          getAllGroupTours()
        ]);
        
        console.log("获取到的一日游数据:", dayToursResponse);
        console.log("获取到的跟团游数据:", groupToursResponse);
        
        // 检查图片字段
        if (dayToursResponse?.data?.records?.length > 0) {
          console.log("一日游第一个产品的图片信息:", {
            image_url: dayToursResponse.data.records[0].image_url,
            cover_image: dayToursResponse.data.records[0].cover_image,
            所有字段: Object.keys(dayToursResponse.data.records[0])
          });
        }
        
        // 处理一日游数据
        if (dayToursResponse?.code === 1 && dayToursResponse.data?.records) {
          setDayTours(dayToursResponse.data.records);
          console.log("成功获取一日游数据:", dayToursResponse.data.records.length, "条");
        } else if (dayToursResponse?.success && Array.isArray(dayToursResponse.data)) {
          setDayTours(dayToursResponse.data);
        } else if (Array.isArray(dayToursResponse)) {
          setDayTours(dayToursResponse);
        } else {
          console.warn("一日游数据格式异常:", dayToursResponse);
          setDayTours([]);
        }
        
        // 处理跟团游数据
        if (groupToursResponse?.code === 1 && groupToursResponse.data?.records) {
          setGroupTours(groupToursResponse.data.records);
          console.log("成功获取跟团游数据:", groupToursResponse.data.records.length, "条");
        } else if (groupToursResponse?.success && Array.isArray(groupToursResponse.data)) {
          setGroupTours(groupToursResponse.data);
        } else if (Array.isArray(groupToursResponse)) {
          setGroupTours(groupToursResponse);
        } else {
          console.warn("跟团游数据格式异常:", groupToursResponse);
          setGroupTours([]);
      }
      
    } catch (error) {
        console.error("获取旅游数据失败:", error);
        setError("加载旅游数据失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
    };

    fetchTours();
  }, []);
  
  // 认证检查
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // 获取产品描述，提供默认值
  const getProductDescription = (tour) => {
    const description = tour.description || tour.intro || tour.des || tour.summary;
    if (description && description.trim()) {
      return description;
    }
    
    // 提供默认描述
    if (tour.title || tour.name) {
      return `探索塔斯马尼亚的美丽风光，体验${tour.title || tour.name}带来的独特旅游项目。`;
    }
    return "探索塔斯马尼亚的美丽风光，体验独特的旅游项目。";
  };

  // 过滤和排序逻辑
  const filteredDayTours = useMemo(() => {
    let filtered = dayTours.filter(tour => {
      // 搜索过滤
      if (searchTerm && !tour.title?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !tour.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // 位置过滤
      if (selectedLocation && tour.location !== selectedLocation) {
        return false;
      }
      
      // 价格过滤
      if (selectedMinPrice && Number(tour.price) < Number(selectedMinPrice)) {
        return false;
      }
      if (selectedMaxPrice && Number(tour.price) > Number(selectedMaxPrice)) {
        return false;
      }
      
      // 评分过滤
      if (selectedRatings && Number(tour.rating) < Number(selectedRatings)) {
          return false;
      }
      
      return true;
    });

    // 排序
    if (sortBy === "价格从低到高") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "价格从高到低") {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "评分") {
      filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
    }
    
    return filtered;
  }, [dayTours, searchTerm, selectedLocation, selectedMinPrice, selectedMaxPrice, selectedRatings, sortBy]);

  const filteredGroupTours = useMemo(() => {
    let filtered = groupTours.filter(tour => {
      // 搜索过滤
      if (searchTerm && !tour.title?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !tour.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // 位置过滤
      if (selectedLocation && tour.departure !== selectedLocation && tour.location !== selectedLocation) {
        return false;
      }
      
      // 价格过滤
      if (selectedMinPrice && Number(tour.price) < Number(selectedMinPrice)) {
        return false;
      }
      if (selectedMaxPrice && Number(tour.price) > Number(selectedMaxPrice)) {
          return false;
      }
      
      // 评分过滤
      if (selectedRatings && Number(tour.rating) < Number(selectedRatings)) {
          return false;
      }
      
      return true;
    });

    // 排序逻辑同一日游
    if (sortBy === "价格从低到高") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "价格从高到低") {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "评分") {
      filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
    }
    
    return filtered;
  }, [groupTours, searchTerm, selectedLocation, selectedMinPrice, selectedMaxPrice, selectedRatings, sortBy]);

  // 事件处理函数
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
  };

  const clearAllFilters = () => {
    navigate(location.pathname);
  };

  // 处理筛选应用
  const handleApplyFilters = () => {
    // 筛选参数已经通过URL更新，这里可以触发数据重新获取或其他必要的操作
    console.log('筛选条件已应用');
    // 如果需要重新获取数据，可以在这里添加相关逻辑
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 渲染产品卡片
  const renderTourCard = (tour, tourType) => {
    const tourLink = tourType === 'day' ? `/day-tours/${tour.id}` : `/group-tours/${tour.id}`;
    
    // 获取产品图片URL
    const getImageUrl = () => {
      // 尝试各种可能的图片字段
      const imageFields = [
        tour.imageUrl,
        tour.image_url, 
        tour.cover_image,
        tour.coverImage,
        tour.images,
        tour.photo,
        tour.thumbnail
      ];
      
      for (const field of imageFields) {
        if (field && typeof field === 'string' && field.trim()) {
          return field;
        }
      }
      
      // 如果没有图片，根据产品类型返回不同的占位图
      if (tourType === 'day') {
        return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&crop=center";
    } else {
        return "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=250&fit=crop&crop=center";
      }
    };
    
    const imageUrl = getImageUrl();
    
    if (viewMode === "list") {
      return (
        <div className="list-view-card">
          <div className="row g-0">
            <div className="col-md-4">
              <div className="list-tour-img-container h-100">
                <img 
                  src={imageUrl}
                  className="list-tour-img h-100" 
                  alt={tour.title || tour.name || "旅游产品"}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x200/f8f9fa/666?text=塔斯马尼亚旅游";
                  }}
                />
                <div className="tour-duration-overlay">
                  <FaCalendarAlt className="me-1" />
                  {getDuration(tour)}
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="d-flex flex-column h-100 p-3">
                <h5 className="tour-title">
                  {tour.title || tour.name || "旅游产品"}
                </h5>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <FaMapMarkerAlt className="text-danger me-1" />
                    <span className="text-muted small">
                      {tour.location || tour.departure || "塔斯马尼亚"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center rating-stars">
                    <FaStar className="text-warning me-1" />
                    <span className="text-warning">{tour.rating || 4.5}</span>
                  </div>
                </div>
                <p className="tour-description mb-3">
                  {getProductDescription(tour)}
                </p>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mt-2">
                                          <div className="tour-price-container">
                        <PriceDisplay 
                          originalPrice={Number(tour.price)} 
                          discountedPrice={tour.discount_price ? Number(tour.discount_price) : null} 
                          currency="$"
                          size="sm"
                        />
                        <span className="text-muted small">起/人</span>
                      </div>
                    <Link to={tourLink} className="btn btn-sm btn-outline-primary view-details-btn">
                      查看详情
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // 网格视图使用自定义卡片布局
      return (
        <div className="tour-card h-100">
          <div className="tour-image-container">
            <img 
              src={imageUrl}
              className="tour-image" 
              alt={tour.title || tour.name || "旅游产品"}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/400x200/f8f9fa/666?text=塔斯马尼亚旅游";
              }}
            />
            <div className="tour-duration-badge">
              <FaCalendarAlt className="me-1" />
              {getDuration(tour)}
            </div>
          </div>
          <div className="tour-card-body p-3">
            <h5 className="tour-card-title mb-2">
              {tour.title || tour.name || "旅游产品"}
            </h5>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center">
                <FaMapMarkerAlt className="text-danger me-1" />
                <span className="text-muted small">
                  {tour.location || tour.departure || "塔斯马尼亚"}
                </span>
              </div>
              <div className="d-flex align-items-center">
                <FaStar className="text-warning me-1" />
                <span className="text-warning">{tour.rating || 4.5}</span>
              </div>
            </div>
            <p className="tour-card-description text-muted small mb-3">
              {getProductDescription(tour)}
            </p>
            <div className="d-flex justify-content-between align-items-center">
              <div className="tour-price-display">
                <PriceDisplay 
                  originalPrice={Number(tour.price)} 
                  discountedPrice={tour.discount_price ? Number(tour.discount_price) : null} 
                  currency="$"
                  size="sm"
                />
                <span className="text-muted small">起/人</span>
              </div>
              <Link to={tourLink} className="btn btn-sm btn-primary">
                查看详情
              </Link>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="tours-page">
      {/* 面包屑导航 */}
      <Breadcrumbs title="旅游路线" pagename="旅游路线" />
      
      {/* 页面介绍区域 */}
      <div className="tour-intro-section">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="tour-intro-content">
                <h2>
                  {selectedTourType === '一日游' ? '探索塔斯马尼亚的一日游行程' : 
                   selectedTourType === '跟团游' ? '探索塔斯马尼亚的跟团游行程' : 
                   '探索塔斯马尼亚的奇妙之旅'}
                </h2>
                <p>
                  {selectedTourType === '一日游' ? '选择适合您的行程，开启一段难忘的旅程。' : 
                   selectedTourType === '跟团游' ? '选择适合您的行程，开启一段难忘的旅程。' : 
                   '从一日游到跟团游，找到最适合您的行程。'}
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="search-box-container">
                <InputGroup className="tour-search-box">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="搜索目的地、景点或活动..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* 主内容区域 */}
      <div className="tour-main-content">
        <Container>
          {/* 期间选择和结果计数 */}
          <div className="tour-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
              <div className="d-flex align-items-center mb-3 mb-md-0">
                {startDate && endDate && (
                  <div className="selected-dates me-3">
                    <FaCalendarAlt className="me-2" />
                    <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                    <Button 
                      variant="link" 
                      className="clear-dates p-0 ms-2" 
                      onClick={() => navigate(location.pathname)}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                )}
                <div className="results-count">
                  {loading ? (
                    <span>加载中...</span>
                  ) : (
                    <span>
                      显示 {(() => {
                        let count = 0;
                        if (selectedTourType === '全部' || selectedTourType === '一日游') {
                          count += filteredDayTours.length;
                        }
                        if (selectedTourType === '全部' || selectedTourType === '跟团游') {
                          count += filteredGroupTours.length;
                        }
                        return count;
                      })()} 个结果
                      {(selectedLocation || selectedMinPrice || selectedMaxPrice || selectedRatings) && (
                        <Button 
                          variant="link"
                          className="clear-all p-0 ms-2"
                          onClick={clearAllFilters}
                        >
                          清除所有筛选
                        </Button>
                      )}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="tour-controls d-flex align-items-center">
                {/* 排序下拉菜单 */}
                <Dropdown className="sort-dropdown me-3">
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
                    <FaSortAmountDown className="me-2" />
                    <span className="d-none d-md-inline">排序: </span>{sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item active={sortBy === "推荐"} onClick={() => handleSortChange("推荐")}>推荐</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "价格从低到高"} onClick={() => handleSortChange("价格从低到高")}>价格从低到高</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "价格从高到低"} onClick={() => handleSortChange("价格从高到低")}>价格从高到低</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "评分"} onClick={() => handleSortChange("评分")}>评分最高</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                
                {/* 视图切换按钮 */}
                <div className="view-switcher d-none d-md-flex">
                  <Button 
                    variant={viewMode === "grid" ? "primary" : "outline-secondary"} 
                    className="me-2" 
                    onClick={() => setViewMode("grid")}
                  >
                    <FaThLarge />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "primary" : "outline-secondary"} 
                    onClick={() => setViewMode("list")}
                  >
                    <FaList />
                  </Button>
                </div>
                
                {/* 移动端筛选按钮 */}
                <div className="d-md-none">
                  <Button 
                    variant="outline-primary"
                    onClick={toggleFilters}
                  >
                    <FaFilter className="me-2" />
                    筛选
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 登录提示 */}
          {!isAuthenticated && (
            <LoginPrompt message="登录后可以查看更多旅游产品和享受会员价格。" />
          )}
          
          <Row>
            {/* 筛选侧边栏 */}
            <Col lg={3} className={`filters-sidebar ${showFilters ? 'show' : 'd-none d-lg-block'}`}>
              <div className="sidebar-header d-flex justify-content-between align-items-center d-lg-none mb-3">
                <h3 className="mb-0">筛选条件</h3>
                <Button variant="link" className="close-filters p-0" onClick={toggleFilters}>
                  <FaTimes />
                </Button>
              </div>
              
              <Filters 
                ref={filtersRef}
                onApplyFilters={handleApplyFilters}
                selectedTourType={selectedTourType}
                selectedLocation={selectedLocation}
                selectedDuration={selectedDuration}
                selectedPriceRange={selectedPriceRange}
                selectedRatings={selectedRatings}
                selectedThemes={selectedThemes}
                selectedSuitableFor={selectedSuitableFor}
                startDate={startDate}
                endDate={endDate}
              />
            </Col>
            
            {/* 旅游列表 */}
            <Col lg={9}>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">正在加载旅游数据...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">
                  <Alert.Heading>加载失败</Alert.Heading>
                  <p>{error}</p>
                </Alert>
              ) : (
                <>
                  {/* 一日游列表 */}
                  {filteredDayTours.length > 0 && (selectedTourType === '全部' || selectedTourType === '一日游') && (
                    <div className="tour-section mb-5">
                      <h3 className="section-title">一日游</h3>
                      <Row className={viewMode === "list" ? "list-view" : ""}>
                        {filteredDayTours.map((tour) => (
                          <Col key={`day-${tour.id}`} lg={viewMode === "list" ? 12 : 4} md={viewMode === "list" ? 12 : 6} className="mb-4">
                            {renderTourCard(tour, 'day')}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                  
                  {/* 跟团游列表 */}
                  {filteredGroupTours.length > 0 && (selectedTourType === '全部' || selectedTourType === '跟团游') && (
                    <div className="tour-section">
                      <h3 className="section-title">跟团游</h3>
                      <Row className={viewMode === "list" ? "list-view" : ""}>
                        {filteredGroupTours.map((tour) => (
                          <Col key={`group-${tour.id}`} lg={viewMode === "list" ? 12 : 4} md={viewMode === "list" ? 12 : 6} className="mb-4">
                            {renderTourCard(tour, 'group')}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {/* 无结果提示 */}
                  {(() => {
                    let shouldShow = true;
                    if (selectedTourType === '全部') {
                      shouldShow = filteredDayTours.length === 0 && filteredGroupTours.length === 0;
                    } else if (selectedTourType === '一日游') {
                      shouldShow = filteredDayTours.length === 0;
                    } else if (selectedTourType === '跟团游') {
                      shouldShow = filteredGroupTours.length === 0;
                    }
                    return shouldShow;
                  })() && (
                    <div className="text-center py-5">
                      <h4>暂无相关旅游产品</h4>
                      <p>尝试调整筛选条件或清除所有筛选来查看更多产品。</p>
                      <Button variant="outline-primary" onClick={clearAllFilters}>
                        清除所有筛选
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Tours;