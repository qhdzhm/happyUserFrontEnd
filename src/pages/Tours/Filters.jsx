import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Accordion, Form, Button, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { getDayTourThemes, getGroupTourThemes, getSuitableForOptions, getAllDayTours } from "../../utils/api";

// 使用forwardRef将组件转换为可引用的组件
const Filters = forwardRef(({ onApplyFilters, searchLoading }, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // 筛选选项数据状态
  const [tourTypes] = useState(['一日游', '跟团游', '全部']); // 固定选项
  const [locations] = useState([
    "塔斯马尼亚北部", "塔斯马尼亚南部", "塔斯马尼亚东部", 
    "塔斯马尼亚西部", "塔斯马尼亚中部", "塔斯马尼亚东南部", "霍巴特"
  ]); // 静态地点数据
  const [dayTourThemes, setDayTourThemes] = useState([]);
  const [groupTourThemes, setGroupTourThemes] = useState([]);
  const [dayTourDurations] = useState([
    "2-4小时", "4-6小时", "6-8小时", "8小时以上"
  ]); // 静态一日游时长数据
  const [groupTourDurations] = useState([
    "2-3天", "4-5天", "6-7天", "7天以上"
  ]); // 静态跟团游时长数据
  const [priceRanges] = useState([
    "0-500", "500-1000", "1000-2000", "2000-3000", "3000以上"
  ]); // 静态价格范围数据
  const [suitableForOptions, setSuitableForOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dayTours, setDayTours] = useState([]); // 添加一日游产品列表状态

  // 选中的筛选值
  const [selectedTourType, setSelectedTourType] = useState(() => {
    // 首先检查URL路径
    const path = location.pathname.toLowerCase();
    if (path.includes('day-tours')) {
      console.log('Filters: 从URL路径检测到一日游类型');
      return '一日游';
    } else if (path.includes('group-tours')) {
      console.log('Filters: 从URL路径检测到跟团游类型');
      return '跟团游';
    }
    
    // 如果URL路径没有提供明确类型，则检查查询参数
    const tourType = queryParams.get('tourTypes');
    if (tourType === 'day_tour') return '一日游';
    if (tourType === 'group_tour') return '跟团游';
    if (tourType === 'all') return '全部';
    return '一日游'; // 默认为一日游
  });
  const [selectedDuration, setSelectedDuration] = useState(
    queryParams.get('duration') ? queryParams.get('duration').split(',') : []
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(
    queryParams.get('priceRange') ? queryParams.get('priceRange').split(',') : []
  );
  const [selectedRatings, setSelectedRatings] = useState(
    queryParams.get('ratings') ? queryParams.get('ratings').split(',').map(Number) : []
  );
  const [selectedThemes, setSelectedThemes] = useState(
    queryParams.get('themes') ? queryParams.get('themes').split(',') : []
  );
  const [selectedSuitableFor, setSelectedSuitableFor] = useState(
    queryParams.get('suitableFor') ? queryParams.get('suitableFor').split(',') : []
  );
  const [selectedLocation, setSelectedLocation] = useState(
    queryParams.get('location') ? queryParams.get('location').split(',') : []
  );

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    clearFilters: () => {
      // 清除所有筛选条件，但保留旅游类型
      setSelectedLocation([]);
      setSelectedDuration([]);
      setSelectedPriceRange([]);
      setSelectedRatings([]);
      setSelectedThemes([]);
      setSelectedSuitableFor([]);
    }
  }));

  // 从API获取筛选数据
  useEffect(() => {
    const fetchFilterData = async () => {
      setIsLoading(true);
      try {
        // 静态选项数据已在useState中直接设置，无需动态设置
        
        // 设置默认值，防止API请求失败情况
        setDayTourThemes(["自然风光", "城市观光", "历史文化", "美食体验", "摄影之旅", "户外活动"]);
        setGroupTourThemes(["休闲度假", "探险体验", "文化探索", "美食之旅", "亲子游", "蜜月旅行"]);
        setSuitableForOptions(["家庭", "情侣", "朋友", "独自旅行", "老年人", "儿童"]);
        
        // 获取一日游产品列表
        try {
          const dayToursResponse = await getAllDayTours();
          if (dayToursResponse && dayToursResponse.code === 1 && Array.isArray(dayToursResponse.data)) {
            setDayTours(dayToursResponse.data);
          } else if (dayToursResponse && dayToursResponse.code === 1 && dayToursResponse.data && Array.isArray(dayToursResponse.data.records)) {
            setDayTours(dayToursResponse.data.records);
          } else {
            console.warn("获取一日游产品列表失败，使用空数组", dayToursResponse);
            setDayTours([]);
          }
        } catch (err) {
          console.warn("获取一日游产品列表出错", err);
          setDayTours([]);
        }
        
        // 尝试获取一日游主题
        try {
          const dayThemesResponse = await getDayTourThemes();
          console.log('一日游主题API响应:', dayThemesResponse);
          if (dayThemesResponse && dayThemesResponse.code === 1) {
            let themes = [];
            
            // 处理不同格式的API响应
            if (Array.isArray(dayThemesResponse.data)) {
              // 如果data本身是一个数组
              themes = dayThemesResponse.data.flatMap(item => {
                // 如果是对象，尝试获取主题名
                if (item && typeof item === 'object') {
                  return item.name || item.theme_name || item.theme || '';
                } 
                // 如果是字符串，直接使用
                else if (typeof item === 'string') {
                  return item;
                }
                // 如果是其他类型，尝试转为字符串
                else {
                  return String(item || '');
                }
              }).filter(Boolean); // 过滤掉空值
            } 
            // 如果data是一个对象，有themes属性是数组
            else if (dayThemesResponse.data && Array.isArray(dayThemesResponse.data.themes)) {
              themes = dayThemesResponse.data.themes.map(theme => 
                typeof theme === 'object' ? (theme.name || theme.theme_name || '') : String(theme || '')
              ).filter(Boolean);
            }
            
            if (themes.length > 0) {
              // 去重
              const uniqueThemes = [...new Set(themes)];
              setDayTourThemes(uniqueThemes);
              console.log('处理后的一日游主题:', uniqueThemes);
            }
          } else {
            console.warn("获取一日游主题失败，使用默认值", dayThemesResponse);
          }
        } catch (err) {
          console.warn("获取一日游主题失败，使用默认值", err);
        }
        
        // 尝试获取跟团游主题
        try {
          const groupThemesResponse = await getGroupTourThemes();
          console.log('跟团游主题API响应:', groupThemesResponse);
          if (groupThemesResponse && groupThemesResponse.code === 1) {
            let themes = [];
            
            // 处理不同格式的API响应
            if (Array.isArray(groupThemesResponse.data)) {
              // 如果data本身是一个数组
              themes = groupThemesResponse.data.flatMap(item => {
                // 如果是对象，尝试获取主题名
                if (item && typeof item === 'object') {
                  return item.name || item.theme_name || item.theme || '';
                } 
                // 如果是字符串，直接使用
                else if (typeof item === 'string') {
                  return item;
                }
                // 如果是其他类型，尝试转为字符串
                else {
                  return String(item || '');
                }
              }).filter(Boolean); // 过滤掉空值
            } 
            // 如果data是一个对象，有themes属性是数组
            else if (groupThemesResponse.data && Array.isArray(groupThemesResponse.data.themes)) {
              themes = groupThemesResponse.data.themes.map(theme => 
                typeof theme === 'object' ? (theme.name || theme.theme_name || '') : String(theme || '')
              ).filter(Boolean);
            }
            
            if (themes.length > 0) {
              // 去重
              const uniqueThemes = [...new Set(themes)];
              setGroupTourThemes(uniqueThemes);
              console.log('处理后的跟团游主题:', uniqueThemes);
            }
          } else {
            console.warn("获取跟团游主题失败，使用默认值", groupThemesResponse);
          }
        } catch (err) {
          console.warn("获取跟团游主题失败，使用默认值", err);
        }
        
        // 尝试获取适合人群选项
        try {
          const suitableForResponse = await getSuitableForOptions();
          console.log('适合人群API响应:', suitableForResponse);
          if (suitableForResponse && suitableForResponse.code === 1) {
            let options = [];
            
            // 处理API响应数据
            if (suitableForResponse.data && Array.isArray(suitableForResponse.data)) {
              // 遍历data数组
              options = suitableForResponse.data.map(item => {
                // 如果是对象，获取名称
                if (item && typeof item === 'object') {
                  return item.name || '';
                } 
                // 如果是字符串，直接使用
                else if (typeof item === 'string') {
                  return item;
                }
                return '';
              }).filter(Boolean); // 过滤掉空值
            }
            
            if (options.length > 0) {
              // 去重
              const uniqueOptions = [...new Set(options)];
              setSuitableForOptions(uniqueOptions);
              console.log('处理后的适合人群选项:', uniqueOptions);
            }
          } else {
            console.warn("获取适合人群选项失败，使用默认值", suitableForResponse);
          }
        } catch (err) {
          console.warn("获取适合人群选项失败，使用默认值", err);
        }
      } catch (error) {
        console.error("获取筛选数据失败:", error);
        // 已经设置了默认值，所以这里不需要额外处理
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // 处理旅游类型选择 - 修改为单选，并在选择后自动应用
  const handleTourTypeChange = (tourType) => {
    // 选择新的类型
    setSelectedTourType(tourType);
    
    // 如果选择的是'全部'类型，清除所有筛选条件
    if (tourType === '全部') {
      setSelectedLocation([]);
      setSelectedThemes([]);
      setSelectedDuration([]);
      setSelectedPriceRange([]);
      setSelectedRatings([]);
      setSelectedSuitableFor([]);
    }
    // 否则，清除之前可能选择的不兼容筛选条件
    else {
      setSelectedThemes([]);
      setSelectedDuration([]);
      
      // 如果从一日游切换到跟团游，清除地点筛选
      if (tourType === '跟团游') {
        setSelectedLocation([]);
      }
    }
    
    // 当选择了新的旅游类型时，自动应用筛选
    setTimeout(() => {
      const params = new URLSearchParams();
      
      // 保留原有的查询参数
      const startDate = queryParams.get('startDate');
      const endDate = queryParams.get('endDate');
      const adults = queryParams.get('adults');
      const children = queryParams.get('children');
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (adults) params.append('adults', adults);
      if (children) params.append('children', children);
      
      // 添加新选择的旅游类型
      if (tourType === '一日游') {
        params.append('tourTypes', 'day_tour');
      } else if (tourType === '跟团游') {
        params.append('tourTypes', 'group_tour');
      } else if (tourType === '全部') {
        params.append('tourTypes', 'all');
        
        // 确保清除所有筛选参数
        params.delete('location');
        params.delete('duration');
        params.delete('priceRange');
        params.delete('ratings');
        params.delete('themes');
        params.delete('suitableFor');
        params.delete('tourIds');
        params.delete('keyword');
      }
      
      // 更新URL
      navigate({ search: params.toString() });
      
      // 调用父组件的回调函数
      if (onApplyFilters) {
        onApplyFilters();
      }
    }, 0);
  };

  // 地点选择处理函数已移除（未使用）

  // 处理时长选择
  const handleDurationChange = (e) => {
    const { value, checked } = e.target;
    const newDurations = checked
      ? [...selectedDuration, value]
      : selectedDuration.filter(duration => duration !== value);
    
    setSelectedDuration(newDurations);
    
    // 立即应用筛选
    setTimeout(() => {
      updateFiltersAndNavigate({
        duration: newDurations
      });
    }, 0);
  };

  // 价格范围选择处理函数已移除（未使用）

  // 评分选择处理函数已移除（未使用）

  // 主题选择处理函数已移除（未使用）

  // 适合人群选择处理函数已移除（未使用）

  // 新增一个帮助函数来更新URL和触发导航
  const updateFiltersAndNavigate = (changedFilters) => {
    const params = new URLSearchParams();
    
    // 保留原有的查询参数
    const startDate = queryParams.get('startDate');
    const endDate = queryParams.get('endDate');
    const adults = queryParams.get('adults');
    const children = queryParams.get('children');
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (adults) params.append('adults', adults);
    if (children) params.append('children', children);
    
    // 添加旅游类型筛选参数（这是必须的）
    if (selectedTourType) {
      if (selectedTourType === '一日游') {
        params.append('tourTypes', 'day_tour');
      } else if (selectedTourType === '跟团游') {
        params.append('tourTypes', 'group_tour');
      } else if (selectedTourType === '全部') {
        params.append('tourTypes', 'all');
      } else {
        params.append('tourTypes', selectedTourType);
      }
    }
    
    // 添加地点筛选（只有一日游才有）
    if (selectedTourType === '一日游') {
      const locations = changedFilters.location || selectedLocation;
      if (locations.length > 0) {
        params.append('location', locations.join(','));
      }
    }
    
    // 添加其他筛选条件
    const durations = changedFilters.duration || selectedDuration;
    if (durations.length > 0) {
      params.append('duration', durations.join(','));
    }
    
    const priceRanges = changedFilters.priceRange || selectedPriceRange;
    if (priceRanges.length > 0) {
      params.append('priceRange', priceRanges.join(','));
    }
    
    const ratings = changedFilters.ratings || selectedRatings;
    if (ratings.length > 0) {
      params.append('ratings', ratings.join(','));
    }
    
    const themes = changedFilters.themes || selectedThemes;
    if (themes.length > 0) {
      params.append('themes', themes.join(','));
    }
    
    const suitableFor = changedFilters.suitableFor || selectedSuitableFor;
    if (suitableFor.length > 0) {
      params.append('suitableFor', suitableFor.join(','));
    }
    
    // 更新URL
    navigate({ search: params.toString() });
    
    // 调用父组件的回调函数
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // 应用筛选 - 点击按钮时手动触发
  const applyFilters = () => {
    // 调用共享的导航函数，无需额外的筛选变化
    updateFiltersAndNavigate({});
  };

  // 清除筛选
  const clearFilters = () => {
    // 保留旅游类型，但清除其他筛选条件
    const tourType = selectedTourType; // 保存当前旅游类型
    
    // 清除所有筛选条件
    setSelectedLocation([]);
    setSelectedDuration([]);
    setSelectedPriceRange([]);
    setSelectedRatings([]);
    setSelectedThemes([]);
    setSelectedSuitableFor([]);
    
    // 保留原有的查询参数
    const params = new URLSearchParams();
    const startDate = queryParams.get('startDate');
    const endDate = queryParams.get('endDate');
    const adults = queryParams.get('adults');
    const children = queryParams.get('children');
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (adults) params.append('adults', adults);
    if (children) params.append('children', children);
    
    // 保留旅游类型参数
    if (tourType) {
      if (tourType === '一日游') {
        params.append('tourTypes', 'day_tour');
      } else if (tourType === '跟团游') {
        params.append('tourTypes', 'group_tour');
      } else if (tourType === '全部') {
        params.append('tourTypes', 'all');
      } else {
        params.append('tourTypes', 'day_tour'); // 如果没有有效类型，默认设置为一日游
      }
    } else {
      // 如果没有选择旅游类型，默认设置为一日游
      params.append('tourTypes', 'day_tour');
    }
    
    // 更新URL
    navigate({ search: params.toString() });
    
    // 调用父组件的回调函数
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="filter_box text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">加载筛选选项...</p>
      </div>
    );
  }

  return (
    <div className="filter_box">
      <h5 className="mb-4">筛选条件</h5>
      
      {/* 旅游类型选择 - 始终显示在最上方 */}
      <div className="mb-4">
        <h6 className="mb-3">选择行程类型</h6>
        <div className="tour-type-selection d-flex flex-row">
          {tourTypes.map((type, index) => (
            <Button
              key={index}
              variant={selectedTourType === type ? "primary" : "outline-primary"}
              onClick={() => handleTourTypeChange(type)}
              className="mb-2 me-2 small"
              size="sm"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      
      {/* 只有选择了旅游类型后才显示其他筛选选项 */}
      {selectedTourType && (
        <>
          {/* 一日游 - 仅显示产品名称筛选 */}
          {selectedTourType === '一日游' && (
            <div className="mb-4 text-center">
              <p className="text-muted">已选择一日游产品</p>
              <p className="small text-muted">查看所有一日游产品</p>
            </div>
          )}

          {/* 跟团游 - 仅显示时长筛选 */}
          {selectedTourType === '跟团游' && (
            <Accordion defaultActiveKey={['0']} alwaysOpen>
              <Accordion.Item eventKey="0">
                <Accordion.Header>时长</Accordion.Header>
                <Accordion.Body>
                  <Form>
                    {groupTourDurations.map((duration, index) => (
                      <Form.Check
                        key={index}
                        type="checkbox"
                        id={`duration-${index}`}
                        label={duration}
                        value={duration}
                        checked={selectedDuration.includes(duration)}
                        onChange={handleDurationChange}
                        className="mb-2"
                      />
                    ))}
                  </Form>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}

          {/* 全部类型 - 不显示任何筛选条件 */}
          {selectedTourType === '全部' && (
            <div className="mb-4 text-center">
              <p className="text-muted">已选择查看全部产品</p>
              <p className="small text-muted">显示所有一日游和跟团游产品</p>
            </div>
          )}

          {/* 一日游 - 显示产品名称筛选 */}
          {false && selectedTourType === '一日游' && (  // 设置为false使其不会显示
            <div className="mb-4">
              <h6 className="mb-3">产品名称</h6>
              <Form>
                {isLoading ? (
                  <div className="text-center my-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">加载产品列表...</span>
                  </div>
                ) : dayTours.length > 0 ? (
                  dayTours.map((tour, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      id={`tour-${tour.id || index}`}
                      label={tour.title || tour.name || `旅游产品 ${index + 1}`}
                      value={tour.id}
                      onChange={(e) => {
                        const tourId = e.target.value;
                        const params = new URLSearchParams(location.search);
                        const currentSelectedIds = params.get('tourIds') ? params.get('tourIds').split(',') : [];
                        
                        if (e.target.checked) {
                          if (!currentSelectedIds.includes(tourId)) {
                            currentSelectedIds.push(tourId);
                          }
                        } else {
                          const index = currentSelectedIds.indexOf(tourId);
                          if (index > -1) {
                            currentSelectedIds.splice(index, 1);
                          }
                        }
                        
                        if (currentSelectedIds.length > 0) {
                          params.set('tourIds', currentSelectedIds.join(','));
                        } else {
                          params.delete('tourIds');
                        }
                        
                        navigate({ search: params.toString() });
                        if (onApplyFilters) {
                          onApplyFilters();
                        }
                      }}
                      checked={queryParams.get('tourIds') ? 
                        queryParams.get('tourIds').split(',').includes(String(tour.id)) : 
                        false}
                      className="mb-2"
                    />
                  ))
                ) : (
                  <p className="text-muted">暂无可用产品</p>
                )}
              </Form>
            </div>
          )}
        </>
      )}
      
      {/* 按钮操作区 - 只有选择了旅游类型才显示 */}
      {selectedTourType && (
        <div className="mt-4 d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={clearFilters}>
            清除筛选
          </Button>
          <Button variant="primary" onClick={applyFilters}>
            应用筛选
          </Button>
        </div>
      )}
    </div>
  );
});

export default Filters;
