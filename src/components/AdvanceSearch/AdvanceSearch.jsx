import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "../AdvanceSearch/search.css";
import { Container, Row, Col, Button, Dropdown, Form, InputGroup, Spinner } from "react-bootstrap";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaChevronDown, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import { getAllDayTours, getAllGroupTours } from "../../utils/api";
import { toast } from "react-hot-toast";

const AdvanceSearch = ({ inBanner = false }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedTourType, setSelectedTourType] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [keyword, setKeyword] = useState(""); // 关键字搜索
  const [showSuggestions, setShowSuggestions] = useState(false); // 控制建议下拉框显示
  const [suggestions, setSuggestions] = useState([]); // 存储产品建议
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // 存储过滤后的产品建议
  const [loadingSuggestions, setLoadingSuggestions] = useState(false); // 加载状态
  const [selectedTour, setSelectedTour] = useState(null); // 选中的产品
  const [allTours, setAllTours] = useState([]); // 存储所有产品用于本地过滤
  const suggestionsRef = useRef(null); // 用于点击外部关闭建议框
  const inputRef = useRef(null); // 输入框引用

  // 直接在组件中定义行程类型选项
  const tourTypeOptions = ["一日游", "跟团游"];

  // 用于处理点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当选择旅游类型时立即加载该类型的所有产品
  useEffect(() => {
    if (selectedTourType) {
      fetchTourSuggestions();
      // 当用户选择了类型后，直接显示建议下拉菜单
      setShowSuggestions(true);
    } else {
      // 当没有选择产品类型时，加载所有产品
      fetchAllTourSuggestions();
    }
  }, [selectedTourType]);

  // 初始加载所有产品，无论是否选择了类型
  useEffect(() => {
    fetchAllTourSuggestions();
  }, []); // 只在组件挂载时执行一次

  // 当关键字或所有产品列表变化时进行本地过滤
  useEffect(() => {
    filterSuggestions();
  }, [keyword, allTours]);

  // 使用模糊匹配进行本地过滤
  const filterSuggestions = () => {
    if (!allTours.length) {
      setFilteredSuggestions([]);
      return;
    }

    // 如果没有关键字，显示所有产品
    if (!keyword.trim()) {
      setFilteredSuggestions(allTours);
      return;
    }

    // 使用模糊匹配查找相关产品
    const searchTerm = keyword.toLowerCase().trim();
    
    const filtered = allTours.filter(tour => {
      const tourName = (tour.name || '').toLowerCase();
      
      // 完全匹配
      if (tourName.includes(searchTerm)) {
        return true;
      }
      
      // 拆分关键词进行部分匹配
      const keywords = searchTerm.split(/\s+/);
      return keywords.some(word => tourName.includes(word));
    });
    
    setFilteredSuggestions(filtered);
  };

  // 获取旅游产品建议
  const fetchTourSuggestions = async () => {
    if (!selectedTourType) return;
    
    setLoadingSuggestions(true);
    
    try {
      let params = {};
      // 根据选中的旅游类型确定API参数
      if (selectedTourType === "一日游") {
        params.tourTypes = "day_tour";
      } else if (selectedTourType === "跟团游") {
        params.tourTypes = "group_tour";
      }
      
      let response;
      
      // 使用适当的API获取建议
      if (params.tourTypes === "day_tour") {
        response = await getAllDayTours(params);
      } else {
        response = await getAllGroupTours(params);
      }
      
      if (response && response.code === 1 && response.data) {
        // 从响应中提取产品列表
        const tours = Array.isArray(response.data) 
          ? response.data 
          : (response.data.records || []);
        
        // 确保我们能获取到产品数据
        console.log(`获取到${tours.length}个${selectedTourType}产品`);
          
        const formattedTours = tours.map(tour => ({
          id: tour.id,
          name: tour.title || tour.name || `${selectedTourType} ${tour.id}`,
          type: params.tourTypes === "day_tour" ? "day-tours" : "group-tours",
          image: tour.coverImage || tour.image || tour.image_url || '/images/placeholder.jpg',
          uniqueKey: `${params.tourTypes}-${tour.id}`
        }));
        
        // 存储所有产品用于本地过滤
        setAllTours(formattedTours);
        setFilteredSuggestions(formattedTours);
      } else {
        setAllTours([]);
        setFilteredSuggestions([]);
        console.error("获取产品列表失败:", response);
      }
    } catch (error) {
      console.error("获取旅游建议失败:", error);
      setAllTours([]);
      setFilteredSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 新增：获取所有产品的函数
  const fetchAllTourSuggestions = async () => {
    setLoadingSuggestions(true);
    
    try {
      console.log('开始获取所有产品数据...');
      
      // 同时获取一日游和跟团游数据
      const [dayToursResponse, groupToursResponse] = await Promise.all([
        getAllDayTours({ _source: 'search' }).catch(err => {
          console.error('获取一日游数据失败:', err);
          return null;
        }),
        getAllGroupTours({ _source: 'search' }).catch(err => {
          console.error('获取跟团游数据失败:', err);
          return null;
        })
      ]);
      
      let allTours = [];
      
      // 处理一日游数据
      if (dayToursResponse && dayToursResponse.code === 1 && dayToursResponse.data) {
        const dayTours = Array.isArray(dayToursResponse.data) 
          ? dayToursResponse.data 
          : (dayToursResponse.data.records || []);
        
        console.log('一日游原始数据:', dayTours);
        
        const formattedDayTours = dayTours.map(tour => ({
          id: tour.id,
          name: tour.title || tour.name || `一日游 ${tour.id}`,
          type: "day-tours",
          image: tour.coverImage || tour.image || tour.image_url || tour.cover_image || '/images/placeholder.jpg',
          tourType: '一日游',
          uniqueKey: `day-${tour.id}`
        }));
        
        allTours = [...allTours, ...formattedDayTours];
        console.log('格式化后的一日游数据:', formattedDayTours);
      } else {
        console.log('一日游数据响应异常:', dayToursResponse);
      }
      
      // 处理跟团游数据
      if (groupToursResponse && groupToursResponse.code === 1 && groupToursResponse.data) {
        const groupTours = Array.isArray(groupToursResponse.data) 
          ? groupToursResponse.data 
          : (groupToursResponse.data.records || []);
        
        console.log('跟团游原始数据:', groupTours);
        
        const formattedGroupTours = groupTours.map(tour => ({
          id: tour.id,
          name: tour.title || tour.name || `跟团游 ${tour.id}`,
          type: "group-tours",
          image: tour.coverImage || tour.image || tour.image_url || tour.cover_image || '/images/placeholder.jpg',
          tourType: '跟团游',
          uniqueKey: `group-${tour.id}`
        }));
        
        allTours = [...allTours, ...formattedGroupTours];
        console.log('格式化后的跟团游数据:', formattedGroupTours);
      } else {
        console.log('跟团游数据响应异常:', groupToursResponse);
      }
      
      console.log(`成功获取到${allTours.length}个产品（包含所有类型）`);
      
      // 存储所有产品用于本地过滤
      setAllTours(allTours);
      setFilteredSuggestions(allTours);
      
      if (allTours.length === 0) {
        console.warn('警告：没有获取到任何产品数据');
      }
      
    } catch (error) {
      console.error("获取所有产品失败:", error);
      setAllTours([]);
      setFilteredSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleTourTypeSelect = (value) => {
    setSelectedTourType(value);
    // 清空之前的建议
    setAllTours([]);
    setFilteredSuggestions([]);
    setKeyword("");
    setSelectedTour(null);
    
    // 如果选择了一日游且已经有开始日期，自动设置结束日期
    if (value === "一日游" && startDate) {
      setEndDate(startDate);
      console.log("选择一日游，自动设置结束日期等于开始日期");
    }
    // 如果选择了跟团游，清空结束日期，等待用户选择具体产品或手动设置
    else if (value === "跟团游") {
      setEndDate(null);
      console.log("选择跟团游，清空结束日期，等待进一步选择");
    }
  };

  // 处理关键字输入
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    
    // 无论是否选择了产品类型，都显示建议
    if (!showSuggestions) {
      setShowSuggestions(true);
    }
    
    // 如果还没有加载产品数据，则立即加载
    if (allTours.length === 0) {
      fetchAllTourSuggestions();
    }
    
    // 如果之前选择了特定产品，但用户改变了输入，清除选择
    if (selectedTour && value !== selectedTour.name) {
      setSelectedTour(null);
    }
  };

  // 选择产品
  const handleSelectTour = (tour) => {
    setSelectedTour(tour);
    setKeyword(tour.name);
    setShowSuggestions(false);
    
    // 根据选择的产品自动设置产品类型
    if (tour.tourType) {
      setSelectedTourType(tour.tourType);
    }
    
    // 如果已经选择了开始日期，根据产品类型自动计算结束日期
    if (startDate) {
      calculateEndDate(tour, startDate);
    }
  };

  // 根据产品和开始日期计算结束日期
  const calculateEndDate = (tour, startDateValue) => {
    if (!tour || !startDateValue) return;
    
    // 一日游：结束日期等于开始日期
    if (tour.tourType === "一日游" || tour.type === "day-tours") {
      setEndDate(startDateValue);
      return;
    }
    
    // 多日游：根据产品信息计算结束日期
    if (tour.tourType === "跟团游" || tour.type === "group-tours") {
      // 尝试从产品名称中提取天数信息
      const duration = extractDurationFromTourName(tour.name);
      const calculatedEndDate = new Date(startDateValue);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + duration - 1);
      setEndDate(calculatedEndDate);
      
      console.log(`多日游产品 "${tour.name}" 天数: ${duration}天，结束日期:`, calculatedEndDate.toISOString().split('T')[0]);
      return;
    }
  };

  // 从产品名称中提取天数信息
  const extractDurationFromTourName = (tourName) => {
    if (!tourName) return 3; // 默认3天
    
    // 常见的天数表达模式
    const patterns = [
      /(\d+)天(\d+)夜/,     // "3天2夜"
      /(\d+)日(\d+)夜/,     // "3日2夜"  
      /(\d+)天/,            // "3天"
      /(\d+)日/,            // "3日"
      /(\d+)D(\d+)N/i,      // "3D2N"
      /(\d+)天游/,          // "3天游"
    ];
    
    for (const pattern of patterns) {
      const match = tourName.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 30) { // 合理的天数范围
          return days;
        }
      }
    }
    
    // 如果没有找到天数信息，根据产品类型返回默认值
    if (tourName.includes("深度") || tourName.includes("豪华")) {
      return 5; // 深度游默认5天
    } else if (tourName.includes("周末") || tourName.includes("短途")) {
      return 2; // 短途游默认2天
    }
    
    return 3; // 其他情况默认3天
  };

  // 处理开始日期变化
  const handleStartDateChange = (date) => {
    setStartDate(date);
    
    if (date) {
      // 如果已经选择了具体产品，根据产品计算结束日期
      if (selectedTour) {
        calculateEndDate(selectedTour, date);
      } 
      // 如果只选择了产品类型（一日游），自动设置结束日期等于开始日期
      else if (selectedTourType === "一日游") {
        setEndDate(date);
      }
      // 如果是跟团游但没选择具体产品，不自动设置结束日期，让用户手动选择
    }
  };

  // 处理结束日期变化
  const handleEndDateChange = (date) => {
    // 如果是一日游（无论是选择了类型还是具体产品），不允许用户手动修改结束日期
    if (selectedTourType === "一日游" || 
        (selectedTour && (selectedTour.tourType === "一日游" || selectedTour.type === "day-tours"))) {
      return;
    }
    setEndDate(date);
  };

  // 切换显示建议下拉菜单
  const toggleSuggestions = () => {
    if (!showSuggestions) {
      setShowSuggestions(true);
      // 如果没有加载产品，则加载所有产品
      if (allTours.length === 0) {
        fetchAllTourSuggestions();
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // 搜索提交 - 增强版本
  const handleSearch = () => {
    if (!startDate) {
      toast.error('请选择出发日期');
      return;
    }

    if (selectedTour) {
      // 验证selectedTour的type属性
      if (!selectedTour.type) {
        console.error('⚠️ selectedTour缺少type属性:', selectedTour);
        toast.error('产品信息不完整，请重新选择产品');
        return;
      }

      const params = new URLSearchParams();
      params.append('fromSearch', 'true');
      params.append('startDate', startDate.toISOString().split('T')[0]);
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }
      params.append('adults', adults);
      params.append('children', children);
      
      // 添加总人数（方便后端计算）
      params.append('totalGuests', adults + children);
      
      // 添加产品信息
      params.append('tourName', selectedTour.name);
      params.append('tourType', selectedTour.tourType || selectedTour.type);
      
      console.log("导航到产品详情页，参数:", params.toString());
      navigate(`/${selectedTour.type}/${selectedTour.id}?${params.toString()}`);
      return;
    }
    
    // 否则，构建查询参数并导航到搜索结果页
    const queryParams = new URLSearchParams();
    
    // 设置正确的tourTypes参数格式
    if (selectedTourType === "一日游") {
      queryParams.append('tourTypes', 'day_tour');
    } else if (selectedTourType === "跟团游") {
      queryParams.append('tourTypes', 'group_tour');
    } else {
      // 如果没有选择产品类型，搜索所有类型
      queryParams.append('tourTypes', 'all');
    }
    
    // 添加关键字搜索参数
    if (keyword.trim()) {
      queryParams.append('keyword', keyword.trim());
    }
    
    // 添加日期信息
    queryParams.append('startDate', startDate.toISOString().split('T')[0]);
    
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString().split('T')[0]);
    }
    
    // 添加人数信息
    queryParams.append('adults', adults);
    queryParams.append('children', children);
    queryParams.append('totalGuests', adults + children);
    
    // 添加标记
    queryParams.append('fromAdvanceSearch', 'true');
    
    console.log("导航到搜索结果页，参数:", queryParams.toString());
    navigate(`/tours?${queryParams.toString()}`);
  };

  const increaseAdults = () => {
    setAdults(prev => prev + 1);
  };

  const decreaseAdults = () => {
    if (adults > 1) {
      setAdults(prev => prev - 1);
    }
  };

  const increaseChildren = () => {
    setChildren(prev => prev + 1);
  };

  const decreaseChildren = () => {
    if (children > 0) {
      setChildren(prev => prev - 1);
    }
  };

  const toggleGuestDropdown = () => {
    setShowGuestDropdown(!showGuestDropdown);
  };

  // 自定义旅客选择器组件
  const GuestSelector = () => {
    return (
      <>
        <label className="item-search-label">旅客</label>
        <Dropdown className="dropdown-custom" show={showGuestDropdown} onToggle={toggleGuestDropdown}>
          <Dropdown.Toggle id="dropdown-custom-components">
            <span>{adults} 成人, {children} 儿童</span>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <div className="guest-selector-content">
              <div className="guest-type">
                <span>成人</span>
                <div className="guest-controls">
                  <button 
                    className="guest-btn" 
                    onClick={decreaseAdults}
                    disabled={adults <= 1}
                    type="button"
                  >
                    <span>-</span>
                  </button>
                  <span className="guest-count">{adults}</span>
                  <button 
                    className="guest-btn" 
                    onClick={increaseAdults}
                    type="button"
                  >
                    <span>+</span>
                  </button>
                </div>
              </div>
              <div className="guest-type">
                <span>儿童</span>
                <div className="guest-controls">
                  <button 
                    className="guest-btn" 
                    onClick={decreaseChildren}
                    disabled={children <= 0}
                    type="button"
                  >
                    <span>-</span>
                  </button>
                  <span className="guest-count">{children}</span>
                  <button 
                    className="guest-btn" 
                    onClick={increaseChildren}
                    type="button"
                  >
                    <span>+</span>
                  </button>
                </div>
              </div>
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </>
    );
  };

  // 重置所有筛选项
  const handleReset = () => {
    setSelectedTourType("");
    setKeyword("");
    setStartDate(null);
    setEndDate(null);
    setAdults(1);
    setChildren(0);
    setSelectedTour(null);
    setShowSuggestions(false);
    setAllTours([]);
    setFilteredSuggestions([]);
  };

  // 如果是在banner中渲染，则使用不同的样式和结构
  if (inBanner) {
    return (
      <div className={`box-search-banner`}>
        <div className="box-search-row">
          <div className="search-item">
            <label>产品类型</label>
            <div className="search-item-content">
              <CustomDropdown
                onSelect={handleTourTypeSelect}
                options={tourTypeOptions}
                darkMode={true}
                icon={<FaMapMarkerAlt />}
              />
            </div>
          </div>
          
          {/* 关键字搜索框 */}
          <div className="search-item">
            <label>关键字或选择产品</label>
            <div className="search-item-content search-keyword-content" ref={suggestionsRef}>
              <div className="keyword-input-container">
                <div className="keyword-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="keyword-input"
                    placeholder={selectedTourType ? `输入关键字或选择${selectedTourType}产品` : "输入关键字搜索所有产品"}
                    value={keyword}
                    onChange={handleKeywordChange}
                    onFocus={() => setShowSuggestions(true)}
                    ref={inputRef}
                  />
                  <button 
                    className={`dropdown-toggle-btn ${showSuggestions ? 'active' : ''}`}
                    onClick={toggleSuggestions}
                  >
                    <FaChevronDown />
                  </button>
                </div>
                
                {/* 产品建议下拉框 */}
                {showSuggestions && (
                  <div className="tour-suggestions-dropdown">
                    {loadingSuggestions ? (
                      <div className="suggestions-loading">
                        <Spinner animation="border" size="sm" />
                        <span>加载产品中...</span>
                      </div>
                    ) : filteredSuggestions.length > 0 ? (
                      <>
                        <div className="suggestions-header">
                          选择{selectedTourType || '所有'}产品 ({filteredSuggestions.length}/{allTours.length})
                        </div>
                        <div className="suggestions-list">
                          {filteredSuggestions.map(tour => (
                            <div 
                              key={tour.uniqueKey || `${tour.type}-${tour.id}`}
                              className={`tour-suggestion-item ${selectedTour && selectedTour.id === tour.id ? 'active' : ''}`}
                              onClick={() => handleSelectTour(tour)}
                            >
                              <div className="tour-suggestion-img">
                                <img src={tour.image} alt={tour.name} />
                              </div>
                              <div className="tour-suggestion-info">
                                <div className="tour-suggestion-name" title={tour.name}>
                                  {tour.name}
                                </div>
                                {tour.tourType && (
                                  <div className="tour-suggestion-type">
                                    {tour.tourType}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="no-suggestions">
                        <span>未找到{selectedTourType || ''}产品</span>
                        {keyword && (
                          <div className="no-matches-hint">
                            尝试使用其他关键词
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="search-item">
            <label>出发日期</label>
            <div className="search-item-content">
              <div className="input-with-icon">
                <FaCalendarAlt className="search-icon" />
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="选择日期"
                  dateFormat="yyyy-MM-dd"
                  className="banner-datepicker"
                  minDate={new Date()} // 不允许选择过去的日期
                />
              </div>
            </div>
          </div>
          
          <div className="search-item">
            <label>结束日期</label>
            <div className="search-item-content">
              <div className="input-with-icon">
                <FaCalendarAlt className="search-icon" />
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || new Date()}
                  placeholderText={
                    selectedTourType === "一日游" || 
                    (selectedTour && (selectedTour.tourType === "一日游" || selectedTour.type === "day-tours"))
                      ? "自动设置同天" 
                      : selectedTour 
                        ? "自动计算" 
                        : "选择日期"
                  }
                  dateFormat="yyyy-MM-dd"
                  className="banner-datepicker"
                  disabled={
                    selectedTourType === "一日游" || 
                    (selectedTour && (selectedTour.tourType === "一日游" || selectedTour.type === "day-tours"))
                  }
                />
              </div>
            </div>
          </div>
          
          <div className="search-item">
            <label>旅客</label>
            <div className="search-item-content">
              <div className="input-with-icon">
                <Dropdown className="dropdown-custom guest-dropdown" show={showGuestDropdown} onToggle={toggleGuestDropdown}>
                  <Dropdown.Toggle id="dropdown-custom-components" className="banner-dropdown">
                    <span>{adults} 成人, {children} 儿童</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <div className="guest-selector-content">
                      <div className="guest-type">
                        <span>成人</span>
                        <div className="guest-controls">
                          <button 
                            className="guest-btn" 
                            onClick={decreaseAdults}
                            disabled={adults <= 1}
                            type="button"
                          >
                            <span>-</span>
                          </button>
                          <span className="guest-count">{adults}</span>
                          <button 
                            className="guest-btn" 
                            onClick={increaseAdults}
                            type="button"
                          >
                            <span>+</span>
                          </button>
                        </div>
                      </div>
                      <div className="guest-type">
                        <span>儿童</span>
                        <div className="guest-controls">
                          <button 
                            className="guest-btn" 
                            onClick={decreaseChildren}
                            disabled={children <= 0}
                            type="button"
                          >
                            <span>-</span>
                          </button>
                          <span className="guest-count">{children}</span>
                          <button 
                            className="guest-btn" 
                            onClick={increaseChildren}
                            type="button"
                          >
                            <span>+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
          
          <div className="button-group">
            <button className="search-submit-btn" onClick={handleSearch}>
              <FaSearch /> 搜索
            </button>
            <button className="reset-btn" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 原始版本的搜索组件（不在banner中）
  return (
    <>
      <section className="box-search-advance">
        <Container>
          <Row>
            <Col md={12} xs={12}>
              <div className="box-search shadow-sm">
                <div className="item-search">
                  {/*  添加行程类型下拉菜单 */}
                  <CustomDropdown
                    label="产品类型"
                    onSelect={handleTourTypeSelect}
                    options={tourTypeOptions}
                  />
                </div>
                
                {/* 改进的关键字搜索框 */}
                <div className="item-search">
                  <label className="item-search-label">关键字或选择产品</label>
                  <div className="keyword-search-container" ref={suggestionsRef}>
                    <div className="keyword-regular-input-container">
                      <i className="bi bi-search keyword-icon"></i>
                      <div className="keyword-input-wrapper">
                        <input
                          type="text"
                          className="keyword-input-regular"
                          placeholder={selectedTourType ? `输入关键字或选择${selectedTourType}产品` : "输入关键字搜索所有产品"}
                          value={keyword}
                          onChange={handleKeywordChange}
                          onFocus={() => setShowSuggestions(true)}
                          ref={inputRef}
                        />
                        <button 
                          className={`dropdown-toggle-btn regular ${showSuggestions ? 'active' : ''}`}
                          onClick={toggleSuggestions}
                        >
                          <FaChevronDown />
                        </button>
                      </div>
                      
                      {/* 产品建议下拉框 - 常规搜索样式 */}
                      {showSuggestions && (
                        <div className="tour-suggestions-dropdown-regular">
                          {loadingSuggestions ? (
                            <div className="suggestions-loading">
                              <Spinner animation="border" size="sm" />
                              <span>加载产品中...</span>
                            </div>
                          ) : filteredSuggestions.length > 0 ? (
                            <>
                              <div className="suggestions-header">
                                选择{selectedTourType || '所有'}产品 ({filteredSuggestions.length}/{allTours.length})
                              </div>
                              <div className="suggestions-list">
                                {filteredSuggestions.map(tour => (
                                  <div 
                                    key={tour.uniqueKey || `${tour.type}-${tour.id}`}
                                    className={`tour-suggestion-item ${selectedTour && selectedTour.id === tour.id ? 'active' : ''}`}
                                    onClick={() => handleSelectTour(tour)}
                                  >
                                    <div className="tour-suggestion-img">
                                      <img src={tour.image} alt={tour.name} />
                                    </div>
                                    <div className="tour-suggestion-info">
                                      <div className="tour-suggestion-name" title={tour.name}>
                                        {tour.name}
                                      </div>
                                      {tour.tourType && (
                                        <div className="tour-suggestion-type">
                                          {tour.tourType}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="no-suggestions">
                              <span>未找到{selectedTourType || ''}产品</span>
                              {keyword && (
                                <div className="no-matches-hint">
                                  尝试使用其他关键词
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="item-search item-search-2">
                  <label className="item-search-label">到达时间</label>
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="选择日期"
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()} // 不允许选择过去的日期
                  />
                </div>
                
                <div className="item-search item-search-2">
                  <label className="item-search-label">离开时间</label>
                  <DatePicker
                    selected={endDate}
                    onChange={handleEndDateChange}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    placeholderText={
                      selectedTourType === "一日游" || 
                      (selectedTour && (selectedTour.tourType === "一日游" || selectedTour.type === "day-tours"))
                        ? "自动设置同天" 
                        : selectedTour 
                          ? "自动计算" 
                          : "选择日期"
                    }
                    dateFormat="yyyy-MM-dd"
                    disabled={
                      selectedTourType === "一日游" || 
                      (selectedTour && (selectedTour.tourType === "一日游" || selectedTour.type === "day-tours"))
                    }
                  />
                </div>
                
                <div className="item-search">
                  {/* 使用自定义旅客选择器 */}
                  <GuestSelector />
                </div>
                
                <div className="item-search bd-none">
                  <Button 
                    className="primaryBtn flex-even d-flex justify-content-center"
                    onClick={handleSearch}
                  >
                    <i className="bi bi-search me-2"></i> 搜索 
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default AdvanceSearch;
