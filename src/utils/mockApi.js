import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// 创建一个模拟适配器实例
const mock = new MockAdapter(axios);

// 预设账号
const presetUsers = [
  {
    id: 1,
    name: '张三',
    email: 'user@example.com',
    password: 'password123',
    phone: '13800138000',
    address: '上海市浦东新区'
  }
];

// 预设旅游产品
const presetTours = [
  {
    id: 1,
    title: '霍巴特一日游',
    description: '探索霍巴特的美丽风景和历史文化',
    price: 199,
    duration: 8,
    rating: 4.5,
    image: 'https://via.placeholder.com/300x200',
    location: '霍巴特',
    category: '一日游',
    featured: true,
    itinerary: [
      { time: '09:00', activity: '从酒店出发' },
      { time: '10:00', activity: '参观萨拉曼卡广场' },
      { time: '12:00', activity: '午餐时间' },
      { time: '14:00', activity: '参观威灵顿山' },
      { time: '17:00', activity: '返回酒店' }
    ]
  },
  {
    id: 2,
    title: '朗塞斯顿两日游',
    description: '体验朗塞斯顿的自然风光和美食',
    price: 399,
    duration: 16,
    rating: 4.7,
    image: 'https://via.placeholder.com/300x200',
    location: '朗塞斯顿',
    category: '多日游',
    featured: true,
    itinerary: [
      { time: '第一天 09:00', activity: '从酒店出发' },
      { time: '第一天 10:30', activity: '参观卡塔拉克峡谷' },
      { time: '第一天 12:30', activity: '午餐时间' },
      { time: '第一天 14:00', activity: '参观葡萄酒庄' },
      { time: '第一天 18:00', activity: '晚餐和住宿' },
      { time: '第二天 09:00', activity: '早餐后出发' },
      { time: '第二天 10:00', activity: '参观摇篮山' },
      { time: '第二天 13:00', activity: '午餐时间' },
      { time: '第二天 15:00', activity: '返回朗塞斯顿' }
    ]
  },
  {
    id: 3,
    title: '菲欣纳国家公园探险',
    description: '探索塔斯马尼亚最美丽的国家公园之一',
    price: 299,
    duration: 10,
    rating: 4.8,
    image: 'https://via.placeholder.com/300x200',
    location: '菲欣纳',
    category: '一日游',
    featured: false,
    itinerary: [
      { time: '08:00', activity: '从酒店出发' },
      { time: '10:00', activity: '到达菲欣纳国家公园' },
      { time: '10:30', activity: '徒步探索' },
      { time: '13:00', activity: '野餐午餐' },
      { time: '14:30', activity: '继续探索' },
      { time: '16:00', activity: '返程' },
      { time: '18:00', activity: '返回酒店' }
    ]
  },
  {
    id: 4,
    title: '酒杯湾一日游',
    description: '参观塔斯马尼亚最著名的海滩',
    price: 249,
    duration: 9,
    rating: 4.9,
    image: 'https://via.placeholder.com/300x200',
    location: '酒杯湾',
    category: '一日游',
    featured: true,
    itinerary: [
      { time: '08:30', activity: '从酒店出发' },
      { time: '10:30', activity: '到达酒杯湾' },
      { time: '11:00', activity: '海滩活动' },
      { time: '13:00', activity: '午餐时间' },
      { time: '14:30', activity: '徒步到瞭望台' },
      { time: '16:00', activity: '返程' },
      { time: '18:30', activity: '返回酒店' }
    ]
  }
];

// 预设评论
const presetReviews = [
  {
    id: 1,
    tourId: 1,
    userId: 1,
    userName: '张三',
    rating: 5,
    comment: '非常棒的旅行体验，导游很专业，景点也很美丽！',
    date: '2023-04-15'
  },
  {
    id: 2,
    tourId: 1,
    userId: 2,
    userName: '李四',
    rating: 4,
    comment: '整体不错，就是天气有点热。',
    date: '2023-04-10'
  },
  {
    id: 3,
    tourId: 2,
    userId: 1,
    userName: '张三',
    rating: 5,
    comment: '两天的行程安排得很合理，住宿也很舒适。',
    date: '2023-03-22'
  }
];

// 预设订单
const presetOrders = [
  {
    id: 1,
    tourId: 1,
    userId: 1,
    startDate: '2023-05-01',
    endDate: '2023-05-01',
    adults: 2,
    children: 0,
    totalPrice: 398,
    status: 'confirmed',
    createdAt: '2023-04-15',
    tour: {
      id: 1,
      title: '霍巴特一日游',
      image: 'https://via.placeholder.com/300x200'
    }
  }
];

// 预设收藏
const presetFavorites = [
  {
    userId: 1,
    tourId: 2
  }
];

// 模拟登录 API
mock.onPost('/api/auth/login').reply((config) => {
  console.log('Mock API received login request:', config);
  const { email, password } = JSON.parse(config.data);
  console.log('Parsed credentials:', { email, password });
  
  // 查找匹配的用户
  const user = presetUsers.find(u => u.email === email && u.password === password);
  console.log('Found user:', user);
  
  if (user) {
    // 登录成功，返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = user;
    const response = {
      token: 'mock-token',
      user: userWithoutPassword
    };
    console.log('Mock API login success response:', response);
    return [
      200, 
      response
    ];
  } else {
    // 登录失败
    const errorResponse = { 
      message: '邮箱或密码不正确' 
    };
    console.log('Mock API login error response:', errorResponse);
    return [
      401, 
      errorResponse
    ];
  }
});

// 模拟注册 API
mock.onPost('/api/auth/register').reply((config) => {
  const userData = JSON.parse(config.data);
  
  // 检查邮箱是否已被使用
  const existingUser = presetUsers.find(u => u.email === userData.email);
  
  if (existingUser) {
    // 邮箱已被使用
    return [
      400, 
      { 
        message: '该邮箱已被注册' 
      }
    ];
  } else {
    // 创建新用户
    const newUser = {
      id: presetUsers.length + 1,
      ...userData,
      phone: userData.phone || '',
      address: userData.address || ''
    };
    
    // 添加到用户列表
    presetUsers.push(newUser);
    
    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = newUser;
    
    return [
      200, 
      {
        token: 'mock-token',
        user: userWithoutPassword
      }
    ];
  }
});

// 模拟获取用户信息 API
mock.onGet('/api/users/profile').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    // 模拟已登录状态，返回第一个用户的信息（实际应用中应该根据 token 解析用户 ID）
    const { password, ...userWithoutPassword } = presetUsers[0];
    return [200, userWithoutPassword];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟更新用户信息 API
mock.onPut('/api/users/profile').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    // 解析更新数据
    const updateData = JSON.parse(config.data);
    
    // 更新第一个用户的信息（实际应用中应该根据 token 解析用户 ID）
    const userIndex = 0;
    presetUsers[userIndex] = {
      ...presetUsers[userIndex],
      ...updateData,
      // 确保 ID 不变
      id: presetUsers[userIndex].id
    };
    
    // 返回更新后的用户信息（不包含密码）
    const { password, ...userWithoutPassword } = presetUsers[userIndex];
    return [200, userWithoutPassword];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟更新用户密码 API
mock.onPut('/api/users/password').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    // 解析更新数据
    const { oldPassword, newPassword } = JSON.parse(config.data);
    
    // 检查旧密码是否正确
    if (presetUsers[0].password !== oldPassword) {
      return [400, { message: '旧密码不正确' }];
    }
    
    // 更新密码
    presetUsers[0].password = newPassword;
    
    return [200, { message: '密码更新成功' }];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟获取所有旅游产品 API
mock.onGet('/api/tours').reply((config) => {
  // 获取查询参数
  const params = config.params || {};
  let result = [...presetTours];
  
  // 根据分类筛选
  if (params.category) {
    result = result.filter(tour => tour.category === params.category);
  }
  
  // 根据位置筛选
  if (params.location) {
    result = result.filter(tour => tour.location === params.location);
  }
  
  // 根据价格范围筛选
  if (params.minPrice) {
    result = result.filter(tour => tour.price >= params.minPrice);
  }
  
  if (params.maxPrice) {
    result = result.filter(tour => tour.price <= params.maxPrice);
  }
  
  // 根据持续时间筛选
  if (params.minDuration) {
    result = result.filter(tour => tour.duration >= params.minDuration);
  }
  
  if (params.maxDuration) {
    result = result.filter(tour => tour.duration <= params.maxDuration);
  }
  
  return [200, result];
});

// 模拟获取热门旅游产品 API
mock.onGet('/api/tours/hot').reply((config) => {
  // 获取查询参数
  const params = config.params || {};
  const limit = params.limit || 6;
  
  // 按评分排序并限制数量
  const hotTours = [...presetTours]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
  
  return [200, hotTours];
});

// 模拟获取推荐旅游产品 API
mock.onGet('/api/tours/recommended').reply((config) => {
  // 获取查询参数
  const params = config.params || {};
  const limit = params.limit || 4;
  
  // 筛选推荐产品并限制数量
  const recommendedTours = presetTours
    .filter(tour => tour.featured)
    .slice(0, limit);
  
  return [200, recommendedTours];
});

// 模拟搜索旅游产品 API
mock.onGet('/api/tours/search').reply((config) => {
  // 获取查询参数
  const params = config.params || {};
  const keyword = params.keyword || '';
  
  if (!keyword) {
    return [200, []];
  }
  
  // 根据关键词搜索
  const searchResults = presetTours.filter(tour => 
    tour.title.toLowerCase().includes(keyword.toLowerCase()) || 
    tour.description.toLowerCase().includes(keyword.toLowerCase()) ||
    tour.location.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return [200, searchResults];
});

// 模拟根据 ID 获取旅游产品 API
mock.onGet(/\/api\/tours\/\d+$/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const tour = presetTours.find(t => t.id === id);
  
  if (tour) {
    return [200, tour];
  } else {
    return [404, { message: '未找到该旅游产品' }];
  }
});

// 模拟获取旅游产品评论 API
mock.onGet(/\/api\/tours\/\d+\/reviews/).reply((config) => {
  const tourId = parseInt(config.url.split('/')[3]);
  const reviews = presetReviews.filter(r => r.tourId === tourId);
  
  return [200, reviews];
});

// 模拟创建旅游产品评论 API
mock.onPost(/\/api\/tours\/\d+\/reviews/).reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const tourId = parseInt(config.url.split('/')[3]);
    const reviewData = JSON.parse(config.data);
    
    // 创建新评论
    const newReview = {
      id: presetReviews.length + 1,
      tourId,
      userId: 1, // 假设是当前登录用户
      userName: presetUsers[0].name,
      ...reviewData,
      date: new Date().toISOString().split('T')[0]
    };
    
    // 添加到评论列表
    presetReviews.push(newReview);
    
    return [200, newReview];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟获取可用日期 API
mock.onGet(/\/api\/tours\/\d+\/available-dates/).reply((config) => {
  const tourId = parseInt(config.url.split('/')[3]);
  const params = config.params || {};
  const month = params.month || new Date().getMonth() + 1;
  const year = params.year || new Date().getFullYear();
  
  // 生成当月的可用日期
  const availableDates = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    // 随机生成可用状态
    const isAvailable = Math.random() > 0.3;
    
    if (isAvailable) {
      availableDates.push(`${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`);
    }
  }
  
  return [200, availableDates];
});

// 模拟检查日期可用性 API
mock.onGet(/\/api\/tours\/\d+\/check-availability/).reply((config) => {
  const tourId = parseInt(config.url.split('/')[3]);
  const params = config.params || {};
  const date = params.date;
  
  if (!date) {
    return [400, { message: '日期参数缺失' }];
  }
  
  // 随机生成可用状态
  const isAvailable = Math.random() > 0.2;
  const availableSpots = isAvailable ? Math.floor(Math.random() * 10) + 1 : 0;
  
  return [200, { 
    available: isAvailable,
    availableSpots,
    date
  }];
});

// 模拟价格计算 API
mock.onGet(/\/api\/tours\/\d+\/calculate-price/).reply((config) => {
  const tourId = parseInt(config.url.split('/')[3]);
  const params = config.params || {};
  const { adults = 1, children = 0 } = params;
  
  const tour = presetTours.find(t => t.id === tourId);
  
  if (!tour) {
    return [404, { message: '未找到该旅游产品' }];
  }
  
  // 计算价格
  const adultPrice = tour.price;
  const childPrice = tour.price * 0.5;
  const totalPrice = adultPrice * adults + childPrice * children;
  
  return [200, {
    basePrice: tour.price,
    adultPrice,
    childPrice,
    adults,
    children,
    totalPrice
  }];
});

// 模拟创建预订 API
mock.onPost('/api/bookings').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const bookingData = JSON.parse(config.data);
    
    // 创建新预订
    const newBooking = {
      id: presetOrders.length + 1,
      userId: 1, // 假设是当前登录用户
      ...bookingData,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      // 添加旅游产品信息
      tour: presetTours.find(t => t.id === bookingData.tourId)
    };
    
    // 添加到预订列表
    presetOrders.push(newBooking);
    
    return [200, newBooking];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟获取用户订单 API
mock.onGet('/api/users/orders').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    // 获取当前用户的订单
    const userOrders = presetOrders.filter(order => order.userId === 1);
    
    return [200, userOrders];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟获取用户订单详情 API
mock.onGet(/\/api\/users\/orders\/\d+/).reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const orderId = parseInt(config.url.split('/').pop());
    const order = presetOrders.find(o => o.id === orderId && o.userId === 1);
    
    if (order) {
      return [200, order];
    } else {
      return [404, { message: '未找到该订单' }];
    }
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟根据 ID 获取预订 API
mock.onGet(/\/api\/bookings\/\d+/).reply((config) => {
  const id = parseInt(config.url.split('/').pop());
  const booking = presetOrders.find(o => o.id === id);
  
  if (booking) {
    return [200, booking];
  } else {
    return [404, { message: '未找到该预订' }];
  }
});

// 模拟取消预订 API
mock.onPut(/\/api\/bookings\/\d+\/cancel/).reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const id = parseInt(config.url.split('/')[3]);
    const bookingIndex = presetOrders.findIndex(o => o.id === id);
    
    if (bookingIndex !== -1) {
      // 更新预订状态
      presetOrders[bookingIndex].status = 'cancelled';
      
      return [200, presetOrders[bookingIndex]];
    } else {
      return [404, { message: '未找到该预订' }];
    }
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟支付预订 API
mock.onPost(/\/api\/bookings\/\d+\/pay/).reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const id = parseInt(config.url.split('/')[3]);
    const bookingIndex = presetOrders.findIndex(o => o.id === id);
    
    if (bookingIndex !== -1) {
      // 更新预订状态
      presetOrders[bookingIndex].status = 'confirmed';
      
      return [200, presetOrders[bookingIndex]];
    } else {
      return [404, { message: '未找到该预订' }];
    }
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟获取用户收藏列表 API
mock.onGet('/api/users/favorites').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    // 获取当前用户的收藏
    const userFavorites = presetFavorites.filter(fav => fav.userId === 1);
    
    // 添加旅游产品信息
    const favoritesWithTourInfo = userFavorites.map(fav => {
      const tour = presetTours.find(t => t.id === fav.tourId);
      return {
        ...fav,
        tour
      };
    });
    
    return [200, favoritesWithTourInfo];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟添加收藏 API
mock.onPost('/api/users/favorites').reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const { tourId } = JSON.parse(config.data);
    
    // 检查是否已收藏
    const existingFavorite = presetFavorites.find(fav => fav.userId === 1 && fav.tourId === tourId);
    
    if (existingFavorite) {
      return [400, { message: '已经收藏过该旅游产品' }];
    }
    
    // 添加新收藏
    const newFavorite = {
      userId: 1,
      tourId
    };
    
    presetFavorites.push(newFavorite);
    
    // 添加旅游产品信息
    const tour = presetTours.find(t => t.id === tourId);
    
    return [200, {
      ...newFavorite,
      tour
    }];
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 模拟删除收藏 API
mock.onDelete(/\/api\/users\/favorites\/\d+/).reply((config) => {
  // 从请求头中获取 token
  const token = config.headers.Authorization;
  
  if (token && token.includes('mock-token')) {
    const tourId = parseInt(config.url.split('/').pop());
    
    // 查找收藏索引
    const favoriteIndex = presetFavorites.findIndex(fav => fav.userId === 1 && fav.tourId === tourId);
    
    if (favoriteIndex !== -1) {
      // 删除收藏
      presetFavorites.splice(favoriteIndex, 1);
      
      return [200, { message: '成功取消收藏' }];
    } else {
      return [404, { message: '未找到该收藏' }];
    }
  } else {
    // 未登录或 token 无效
    return [401, { message: '未授权，请先登录' }];
  }
});

// 登出用户
mock.onPost('/api/auth/logout').reply(200, {
  success: true,
  message: '登出成功'
});

// 获取代理商折扣率
mock.onGet('/api/agent/discount-rate').reply((config) => {
  // 从请求头获取token
  const token = config.headers.Authorization;
  
  if (!token) {
    return [401, { message: '未授权，请登录' }];
  }
  
  // 返回代理商折扣率
  return [200, {
    discount_rate: 0.9 // 模拟9折的折扣率
  }];
});

// ==================== 用户管理相关 API (仅管理员) ====================

export default mock; 