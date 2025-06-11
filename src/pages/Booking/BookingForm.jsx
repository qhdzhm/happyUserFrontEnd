import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Dropdown, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaSearch, FaChevronDown, FaCalendarAlt, FaUsers, FaTimes } from 'react-icons/fa';
import { getAllDayTours, getAllGroupTours } from '../../utils/api';
import './BookingForm.css';

const BookingForm = () => {
  const navigate = useNavigate();
  
  // 获取用户信息，判断是否为中介
  const { isAuthenticated, user, userType } = useSelector(state => state.auth);
  
  // 更全面的中介检测逻辑
  const localUserType = localStorage.getItem('userType');
  const isAgent = userType === 'agent' || 
                  userType === 'operator' || 
                  userType === 'agent_operator' ||
                  localUserType === 'agent' || 
                  localUserType === 'operator' ||
                  localUserType === 'agent_operator';
  
  // 调试信息
  
  
  // 搜索状态
  const [selectedTourType, setSelectedTourType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedTour, setSelectedTour] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // 日期和人数状态
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  
  // 引用
  const suggestionsRef = useRef(null);
  const guestDropdownRef = useRef(null);
  
  // 产品类型选项
  const tourTypeOptions = ['一日游', '跟团游'];

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setShowGuestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取产品数据
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // 过滤建议
  useEffect(() => {
    filterSuggestions();
  }, [keyword, suggestions, selectedTourType]);

  // 获取所有产品
  const fetchAllProducts = async () => {
    setLoadingSuggestions(true);
    try {
      const [dayToursResponse, groupToursResponse] = await Promise.all([
        getAllDayTours({ _source: 'booking' }).catch(() => null),
        getAllGroupTours({ _source: 'booking' }).catch(() => null)
      ]);

      let allProducts = [];

      // 处理一日游数据
      if (dayToursResponse?.code === 1 && dayToursResponse.data) {
        const dayTours = Array.isArray(dayToursResponse.data) ? 
          dayToursResponse.data : (dayToursResponse.data.records || []);
        
        const formattedDayTours = dayTours.map(tour => ({
          id: tour.id,
          name: tour.title || tour.name || `一日游 ${tour.id}`,
          type: 'day-tours',
          tourType: '一日游',
          image: tour.coverImage || tour.image || '/images/placeholder.jpg',
          uniqueKey: `day-${tour.id}`
        }));
        
        allProducts = [...allProducts, ...formattedDayTours];
      }

      // 处理跟团游数据
      if (groupToursResponse?.code === 1 && groupToursResponse.data) {
        const groupTours = Array.isArray(groupToursResponse.data) ? 
          groupToursResponse.data : (groupToursResponse.data.records || []);
        
        const formattedGroupTours = groupTours.map(tour => ({
          id: tour.id,
          name: tour.title || tour.name || `跟团游 ${tour.id}`,
          type: 'group-tours',
          tourType: '跟团游',
          image: tour.coverImage || tour.image || '/images/placeholder.jpg',
          uniqueKey: `group-${tour.id}`
        }));
        
        allProducts = [...allProducts, ...formattedGroupTours];
      }

      setSuggestions(allProducts);
    } catch (error) {
      console.error('获取产品数据失败:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 过滤建议
  const filterSuggestions = () => {
    let filtered = suggestions;
    
    // 按产品类型过滤
    if (selectedTourType) {
      filtered = filtered.filter(tour => tour.tourType === selectedTourType);
    }
    
    // 按关键字过滤
    if (keyword.trim()) {
      const searchTerm = keyword.toLowerCase().trim();
      filtered = filtered.filter(tour => 
        tour.name.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredSuggestions(filtered);
  };

  // 处理产品类型选择
  const handleTourTypeSelect = (type) => {
    setSelectedTourType(type);
    setSelectedTour(null);
    setKeyword('');
    setShowSuggestions(true);
    
    // 如果选择一日游且已有开始日期，自动设置结束日期
    if (type === '一日游' && startDate) {
      setEndDate(startDate);
    }
    // 如果选择跟团游，清空结束日期让用户重新选择或等待产品选择后自动计算
    else if (type === '跟团游') {
      setEndDate(null);
    }
  };

  // 处理关键字输入
  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
    setShowSuggestions(true);
  };

  // 处理产品选择
  const handleSelectTour = (tour) => {
    setSelectedTour(tour);
    setKeyword(tour.name);
    setShowSuggestions(false);
    
    // 如果是一日游，自动设置结束日期为同一天
    if (tour.tourType === '一日游' && startDate) {
      setEndDate(startDate);
    }
    // 如果是多日游且已选择开始日期，自动计算结束日期
    else if (tour.tourType === '跟团游' && startDate) {
      calculateEndDate(tour, startDate);
    }
  };

  // 根据产品和开始日期计算结束日期
  const calculateEndDate = (tour, startDateValue) => {
    if (!tour || !startDateValue) return;
    
    console.log('🔢 计算结束日期输入参数:', {
      产品名称: tour.name,
      产品类型: tour.tourType,
      开始日期对象: startDateValue,
      开始日期ISO: startDateValue.toISOString().split('T')[0],
      开始日期本地: startDateValue.toLocaleDateString(),
      时区偏移: startDateValue.getTimezoneOffset()
    });
    
    // 一日游：结束日期等于开始日期
    if (tour.tourType === "一日游") {
      setEndDate(startDateValue);
      return;
    }
    
    // 多日游：根据产品信息计算结束日期
    if (tour.tourType === "跟团游") {
      const duration = extractDurationFromTourName(tour.name);
      
      // 为了避免时区问题，创建一个新的日期对象，使用本地时间
      const calculatedEndDate = new Date(startDateValue.getTime());
      // 修正计算逻辑：对于N日游，从开始日期加上(N-1)天
      // 例如：5日游，10号开始，应该是10、11、12、13、14，即10号+4天=14号
      calculatedEndDate.setDate(calculatedEndDate.getDate() + duration - 1);
      
      console.log(`多日游产品 "${tour.name}" 计算详情:`, {
        持续天数: duration,
        加天数: duration - 1,
        原始开始日期: startDateValue.toISOString().split('T')[0],
        计算后结束日期: calculatedEndDate.toISOString().split('T')[0],
        开始日期本地: startDateValue.toLocaleDateString(),
        结束日期本地: calculatedEndDate.toLocaleDateString()
      });
      
      setEndDate(calculatedEndDate);
    }
  };

  // 从产品名称中提取天数信息
  const extractDurationFromTourName = (tourName) => {
    if (!tourName) return 3;
    
    console.log(`🔍 解析产品名称: "${tourName}"`);
    
    const patterns = [
      /(\d+)天(\d+)夜/,     // "3天2夜"
      /(\d+)日(\d+)夜/,     // "3日2夜"  
      /(\d+)天/,            // "3天"
      /(\d+)日游/,          // "5日游"
      /(\d+)日/,            // "3日"
      /(\d+)D(\d+)N/i,      // "3D2N"
      /(\d+)天游/,          // "3天游"
    ];
    
    for (const pattern of patterns) {
      const match = tourName.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        console.log(`✅ 匹配到模式 ${pattern.source}: ${match[1]}天`);
        if (days > 0 && days <= 30) {
          return days;
        }
      }
    }
    
    console.log(`⚠️ 未匹配到天数模式，使用关键词推测`);
    // 根据关键词推测天数
    if (tourName.includes("深度") || tourName.includes("豪华")) {
      return 5;
    } else if (tourName.includes("周末") || tourName.includes("短途")) {
      return 2;
    }
    
    console.log(`❌ 无法确定天数，使用默认值3天`);
    return 3; // 默认3天
  };

  // 处理开始日期变化
  const handleStartDateChange = (date) => {
    console.log('📅 日期选择器变化:', {
      选择的日期: date,
      日期类型: typeof date,
      本地日期字符串: date ? date.toLocaleDateString() : null,
      ISO字符串: date ? date.toISOString().split('T')[0] : null,
      时区偏移: date ? date.getTimezoneOffset() : null
    });
    
    setStartDate(date);
    
    // 如果选择了一日游或者选中的产品是一日游，自动设置结束日期
    if ((selectedTourType === '一日游' || selectedTour?.tourType === '一日游') && date) {
      setEndDate(date);
    }
    // 如果选择了具体的多日游产品，重新计算结束日期
    else if (selectedTour && selectedTour.tourType === '跟团游' && date) {
      calculateEndDate(selectedTour, date);
    }
  };

  // 处理结束日期变化
  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  // 人数控制
  const handleGuestChange = (type, operation) => {
    if (type === 'adults') {
      if (operation === 'increase') {
        setAdults(prev => prev + 1);
      } else if (operation === 'decrease' && adults > 1) {
        setAdults(prev => prev - 1);
      }
    } else if (type === 'children') {
      if (operation === 'increase') {
        setChildren(prev => prev + 1);
      } else if (operation === 'decrease' && children > 0) {
        setChildren(prev => prev - 1);
      }
    }
  };

  // 本地日期格式化函数 - 避免时区问题
  const formatLocalDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 处理搜索
  const handleSearch = () => {
    if (!startDate) {
      alert('请选择出发日期');
      return;
    }

    // 添加详细的日期调试信息
    console.log('🔍 搜索处理 - 日期状态调试:', {
      原始startDate对象: startDate,
      原始endDate对象: endDate,
      startDate类型: typeof startDate,
      endDate类型: typeof endDate,
      startDate_ISO字符串: startDate ? startDate.toISOString().split('T')[0] : null,
      startDate_本地格式: startDate ? formatLocalDate(startDate) : null,
      endDate_ISO字符串: endDate ? endDate.toISOString().split('T')[0] : null,
      endDate_本地格式: endDate ? formatLocalDate(endDate) : null,
      startDate本地日期: startDate ? startDate.toLocaleDateString() : null,
      endDate本地日期: endDate ? endDate.toLocaleDateString() : null
    });

    // 如果选择了具体产品
    if (selectedTour) {
      // 验证selectedTour的type属性
      if (!selectedTour.type) {
        console.error('⚠️ selectedTour缺少type属性:', selectedTour);
        alert('产品信息不完整，请重新选择产品');
        return;
      }

      const params = new URLSearchParams({
        fromSearch: 'true',
        startDate: formatLocalDate(startDate),
        adults: adults.toString(),
        children: children.toString(),
        totalGuests: (adults + children).toString(),
        tourName: selectedTour.name,
        tourType: selectedTour.tourType
      });

      if (endDate) {
        params.append('endDate', formatLocalDate(endDate));
      }

      // 输出最终的URL参数供调试
      console.log('📋 生成的URL参数:', params.toString());

      // 添加更多调试信息
      console.log('🚀 搜索处理:', {
        isAgent,
        userType,
        localUserType,
        selectedTour,
        targetUrl: isAgent ? `/agent-booking/${selectedTour.type}/${selectedTour.id}` : `/${selectedTour.type}/${selectedTour.id}`
      });

      // 如果是中介用户，跳转到中介专用快速下单页面
      if (isAgent) {
        console.log('✅ 跳转到中介页面:', `/agent-booking/${selectedTour.type}/${selectedTour.id}?${params.toString()}`);
        navigate(`/agent-booking/${selectedTour.type}/${selectedTour.id}?${params.toString()}`);
        return;
      }

      // 普通用户跳转到产品详情页
      console.log('👤 跳转到普通用户页面:', `/${selectedTour.type}/${selectedTour.id}?${params.toString()}`);
      navigate(`/${selectedTour.type}/${selectedTour.id}?${params.toString()}`);
      return;
    }

    // 否则跳转到搜索结果页
    const params = new URLSearchParams({
      startDate: formatLocalDate(startDate),
      adults: adults.toString(),
      children: children.toString(),
      totalGuests: (adults + children).toString(),
      fromBookingForm: 'true'
    });

    if (selectedTourType) {
      params.append('tourTypes', selectedTourType === '一日游' ? 'day_tour' : 'group_tour');
    } else {
      params.append('tourTypes', 'all');
    }

    if (keyword.trim()) {
      params.append('keyword', keyword.trim());
    }

    if (endDate) {
      params.append('endDate', formatLocalDate(endDate));
    }

    navigate(`/tours?${params.toString()}`);
  };

  // 重置表单
  const handleReset = () => {
    setSelectedTourType('');
    setKeyword('');
    setSelectedTour(null);
    setStartDate(null);
    setEndDate(null);
    setAdults(1);
    setChildren(0);
    setShowSuggestions(false);
    setShowGuestDropdown(false);
  };

  return (
    <div className="booking-form-page">
      <Container>
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <div className="booking-form-card">
              <div className="form-header">
                <h2>立即预订</h2>
                <p>搜索您心仪的塔斯马尼亚旅游产品</p>
              </div>

              <div className="booking-form">
                {/* 产品类型选择 */}
                <div className="form-group">
                  <label>产品类型</label>
                  <div className="tour-type-buttons">
                    {tourTypeOptions.map(type => (
                      <button
                        key={type}
                        className={`tour-type-btn ${selectedTourType === type ? 'active' : ''}`}
                        onClick={() => handleTourTypeSelect(type)}
                      >
                        {type}
                      </button>
                    ))}
                    <button
                      className={`tour-type-btn ${selectedTourType === '' ? 'active' : ''}`}
                      onClick={() => handleTourTypeSelect('')}
                    >
                      全部
                    </button>
                  </div>
                </div>

                {/* 搜索框 */}
                <div className="form-group">
                  <label>搜索产品</label>
                  <div className="search-container" ref={suggestionsRef}>
                    <div className="search-input-wrapper">
                      <FaSearch className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder={selectedTourType ? `搜索${selectedTourType}产品` : '搜索所有产品'}
                        value={keyword}
                        onChange={handleKeywordChange}
                        onFocus={() => setShowSuggestions(true)}
                      />
                      {keyword && (
                        <button 
                          className="clear-btn"
                          onClick={() => {
                            setKeyword('');
                            setSelectedTour(null);
                          }}
                        >
                          <FaTimes />
                        </button>
                      )}
                      <button 
                        className={`dropdown-btn ${showSuggestions ? 'active' : ''}`}
                        onClick={() => setShowSuggestions(!showSuggestions)}
                      >
                        <FaChevronDown />
                      </button>
                    </div>

                    {/* 产品建议下拉框 */}
                    {showSuggestions && (
                      <div className="suggestions-dropdown">
                        {loadingSuggestions ? (
                          <div className="loading-state">
                            <Spinner animation="border" size="sm" />
                            <span>加载产品中...</span>
                          </div>
                        ) : filteredSuggestions.length > 0 ? (
                          <>
                            <div className="suggestions-header">
                              {selectedTourType || '所有'}产品 ({filteredSuggestions.length})
                            </div>
                            <div className="suggestions-list">
                              {filteredSuggestions.map(tour => (
                                <div
                                  key={tour.uniqueKey}
                                  className={`suggestion-item ${selectedTour?.id === tour.id ? 'active' : ''}`}
                                  onClick={() => handleSelectTour(tour)}
                                >
                                  <div className="suggestion-image">
                                    <img src={tour.image} alt={tour.name} />
                                  </div>
                                  <div className="suggestion-info">
                                    <div className="suggestion-name">{tour.name}</div>
                                    <div className="suggestion-type">{tour.tourType}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="no-results">
                            <span>未找到相关产品</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 日期选择 */}
                <Row>
                  <Col md={6}>
                    <div className="form-group">
                      <label>出发日期</label>
                      <div className="date-input-wrapper">
                        <FaCalendarAlt className="date-icon" />
                        <DatePicker
                          selected={startDate}
                          onChange={handleStartDateChange}
                          placeholderText="选择出发日期"
                          dateFormat="yyyy-MM-dd"
                          minDate={new Date()}
                          className="date-input"
                        />
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="form-group">
                      <label>返回日期</label>
                      <div className="date-input-wrapper">
                        <FaCalendarAlt className="date-icon" />
                        <DatePicker
                          selected={endDate}
                          onChange={handleEndDateChange}
                          placeholderText={
                            selectedTourType === '一日游' || selectedTour?.tourType === '一日游'
                              ? '自动设置同天'
                              : '选择返回日期'
                          }
                          dateFormat="yyyy-MM-dd"
                          minDate={startDate || new Date()}
                          disabled={selectedTourType === '一日游' || selectedTour?.tourType === '一日游'}
                          className="date-input"
                        />
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* 人数选择 */}
                <div className="form-group">
                  <label>旅客数量</label>
                  <div className="guest-selector" ref={guestDropdownRef}>
                    <button
                      className="guest-button"
                      onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    >
                      <FaUsers className="guest-icon" />
                      <span>{adults} 成人, {children} 儿童</span>
                      <FaChevronDown className={`dropdown-arrow ${showGuestDropdown ? 'active' : ''}`} />
                    </button>

                    {showGuestDropdown && (
                      <div className="guest-dropdown">
                        <div className="guest-item">
                          <span>成人</span>
                          <div className="guest-controls">
                            <button
                              className="guest-control-btn"
                              onClick={() => handleGuestChange('adults', 'decrease')}
                              disabled={adults <= 1}
                            >
                              -
                            </button>
                            <span className="guest-count">{adults}</span>
                            <button
                              className="guest-control-btn"
                              onClick={() => handleGuestChange('adults', 'increase')}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="guest-item">
                          <span>儿童</span>
                          <div className="guest-controls">
                            <button
                              className="guest-control-btn"
                              onClick={() => handleGuestChange('children', 'decrease')}
                              disabled={children <= 0}
                            >
                              -
                            </button>
                            <span className="guest-count">{children}</span>
                            <button
                              className="guest-control-btn"
                              onClick={() => handleGuestChange('children', 'increase')}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="form-actions">
                  <Button 
                    variant="outline-secondary" 
                    className="reset-button"
                    onClick={handleReset}
                  >
                    重置
                  </Button>
                  <Button 
                    variant="primary" 
                    className="search-button"
                    onClick={handleSearch}
                  >
                    <FaSearch /> 立即搜索
                  </Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BookingForm; 