import React, { useState, useEffect, useRef } from 'react';
import { Accordion, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import './filters.css';

// 直接在组件中定义数据
const Categories = [
  "自然风光",
  "海滩",
  "城市观光",
  "岛屿",
  "历史文化",
  "购物美食",
  "美食体验"
];

const TourTypes = [
  "一日游",
  "跟团游"
];

const DayTourDuration = [
  "2-4小时",
  "4-6小时",
  "6-8小时",
  "8小时以上"
];

const GroupTourDuration = [
  "2-3天",
  "4-5天",
  "6-7天",
  "7天以上"
];

const PriceRange = [
  "0-500",
  "500-1000",
  "1000-2000",
  "2000-3000",
  "3000以上"
];

const Ratings = [3, 3.5, 4, 4.5, 5];

const Filters = ({ onApplyFilters }) => {
  const navigate = useNavigate();
  const locationHook = useLocation();
  const queryParams = new URLSearchParams(locationHook.search);
  const isInitialMount = useRef(true);
  
  // 初始化筛选状态
  const [selectedCategories, setSelectedCategories] = useState(
    queryParams.get('categories') ? queryParams.get('categories').split(',') : []
  );
  const [selectedTourTypes, setSelectedTourTypes] = useState(
    queryParams.get('tourTypes') ? queryParams.get('tourTypes').split(',') : []
  );
  const [selectedDuration, setSelectedDuration] = useState(
    queryParams.get('duration') ? queryParams.get('duration').split(',') : []
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(
    queryParams.get('priceRange') ? queryParams.get('priceRange').split(',') : []
  );
  const [selectedRatings, setSelectedRatings] = useState(
    queryParams.get('ratings') ? queryParams.get('ratings').split(',').map(Number) : []
  );

  // 使用useEffect监听筛选状态变化，添加防抖机制
  useEffect(() => {
    // 跳过初始渲染
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // 添加防抖，300ms后应用筛选
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    
    // 清除上一个定时器
    return () => clearTimeout(timer);
  }, [selectedCategories, selectedTourTypes, selectedDuration, selectedPriceRange, selectedRatings]);

  // 处理类别选择
  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(item => item !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // 处理行程类型选择
  const handleTourTypeChange = (tourType) => {
    if (selectedTourTypes.includes(tourType)) {
      setSelectedTourTypes(selectedTourTypes.filter(item => item !== tourType));
    } else {
      setSelectedTourTypes([...selectedTourTypes, tourType]);
    }
  };

  // 处理时长选择
  const handleDurationChange = (duration) => {
    if (selectedDuration.includes(duration)) {
      setSelectedDuration(selectedDuration.filter(item => item !== duration));
    } else {
      setSelectedDuration([...selectedDuration, duration]);
    }
  };

  // 处理价格范围选择
  const handlePriceRangeChange = (priceRange) => {
    if (selectedPriceRange.includes(priceRange)) {
      setSelectedPriceRange(selectedPriceRange.filter(item => item !== priceRange));
    } else {
      setSelectedPriceRange([...selectedPriceRange, priceRange]);
    }
  };

  // 处理评分选择
  const handleRatingChange = (rating) => {
    if (selectedRatings.includes(rating)) {
      setSelectedRatings(selectedRatings.filter(item => item !== rating));
    } else {
      setSelectedRatings([...selectedRatings, rating]);
    }
  };

  // 应用筛选
  const applyFilters = () => {
    const params = new URLSearchParams(locationHook.search);
    
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    } else {
      params.delete('categories');
    }
    
    if (selectedTourTypes.length > 0) {
      params.set('tourTypes', selectedTourTypes.join(','));
    } else {
      params.delete('tourTypes');
    }
    
    if (selectedDuration.length > 0) {
      params.set('duration', selectedDuration.join(','));
    } else {
      params.delete('duration');
    }
    
    if (selectedPriceRange.length > 0) {
      params.set('priceRange', selectedPriceRange.join(','));
    } else {
      params.delete('priceRange');
    }
    
    if (selectedRatings.length > 0) {
      params.set('ratings', selectedRatings.join(','));
    } else {
      params.delete('ratings');
    }
    
    // 保留原有的日期和旅客信息
    const startDate = queryParams.get('startDate');
    const endDate = queryParams.get('endDate');
    const adults = queryParams.get('adults');
    const children = queryParams.get('children');
    const tourType = queryParams.get('tourType');
    
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (adults) params.set('adults', adults);
    if (children) params.set('children', children);
    if (tourType) params.set('tourType', tourType);
    
    // 导航到新的URL
    navigate(`/search?${params.toString()}`);
    
    // 如果提供了回调函数，则调用它
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  return (
    <div className="side_bar">
      <div className="filter_box shadow-sm rounded-2">
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>类别</Accordion.Header>
            <Accordion.Body>
              {Categories.map((category, index) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`category-${index}`}
                  label={category}
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="1">
            <Accordion.Header>行程类型</Accordion.Header>
            <Accordion.Body>
              {TourTypes.map((tourType, index) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`tourType-${index}`}
                  label={tourType}
                  checked={selectedTourTypes.includes(tourType)}
                  onChange={() => handleTourTypeChange(tourType)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="2">
            <Accordion.Header>时长</Accordion.Header>
            <Accordion.Body>
              {/* 根据选择的旅游类型显示不同的时长选项 */}
              {selectedTourTypes.includes("一日游") && DayTourDuration.map((duration, index) => (
                <Form.Check
                  key={`day-${index}`}
                  type="checkbox"
                  id={`duration-day-${index}`}
                  label={duration}
                  checked={selectedDuration.includes(duration)}
                  onChange={() => handleDurationChange(duration)}
                  className="mb-2"
                />
              ))}
              {selectedTourTypes.includes("跟团游") && GroupTourDuration.map((duration, index) => (
                <Form.Check
                  key={`group-${index}`}
                  type="checkbox"
                  id={`duration-group-${index}`}
                  label={duration}
                  checked={selectedDuration.includes(duration)}
                  onChange={() => handleDurationChange(duration)}
                  className="mb-2"
                />
              ))}
              {/* 如果没有选择特定类型，显示所有选项 */}
              {selectedTourTypes.length === 0 && [...DayTourDuration, ...GroupTourDuration].map((duration, index) => (
                <Form.Check
                  key={`all-${index}`}
                  type="checkbox"
                  id={`duration-all-${index}`}
                  label={duration}
                  checked={selectedDuration.includes(duration)}
                  onChange={() => handleDurationChange(duration)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="3">
            <Accordion.Header>价格范围</Accordion.Header>
            <Accordion.Body>
              {PriceRange.map((range, index) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`priceRange-${index}`}
                  label={range}
                  checked={selectedPriceRange.includes(range)}
                  onChange={() => handlePriceRangeChange(range)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="4">
            <Accordion.Header>评分</Accordion.Header>
            <Accordion.Body>
              {Ratings.map((rating, index) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`rating-${index}`}
                  label={`${rating}星及以上`}
                  checked={selectedRatings.includes(rating)}
                  onChange={() => handleRatingChange(rating)}
                  className="mb-2"
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
};

export default Filters; 