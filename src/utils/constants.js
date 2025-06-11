// 旅游类型
export const TOUR_TYPES = {
  DAY_TOUR: 'day_tour',
  GROUP_TOUR: 'group_tour',
  PRIVATE_TOUR: 'private_tour',
  CUSTOM_TOUR: 'custom_tour'
};

// 旅游主题
export const TOUR_THEMES = [
  { id: 'nature', name: '自然风光' },
  { id: 'culture', name: '文化体验' },
  { id: 'adventure', name: '探险' },
  { id: 'food', name: '美食' },
  { id: 'history', name: '历史' },
  { id: 'wildlife', name: '野生动物' },
  { id: 'photography', name: '摄影' },
  { id: 'beach', name: '海滩' },
  { id: 'hiking', name: '徒步' },
  { id: 'shopping', name: '购物' }
];

// 旅游时长
export const TOUR_DURATIONS = [
  { id: 'half_day', name: '半日游', hours: 4 },
  { id: 'full_day', name: '一日游', hours: 8 },
  { id: 'two_days', name: '两日游', hours: 48 },
  { id: 'three_days', name: '三日游', hours: 72 },
  { id: 'week', name: '一周', hours: 168 },
  { id: 'custom', name: '自定义', hours: null }
];

// 适合人群
export const SUITABLE_FOR = [
  { id: 'families', name: '家庭' },
  { id: 'couples', name: '情侣' },
  { id: 'solo', name: '单人' },
  { id: 'seniors', name: '老年人' },
  { id: 'youth', name: '青少年' },
  { id: 'business', name: '商务' },
  { id: 'groups', name: '团体' }
];

// 价格范围
export const PRICE_RANGES = [
  { id: 'budget', name: '经济', min: 0, max: 100 },
  { id: 'mid_range', name: '中等', min: 100, max: 300 },
  { id: 'luxury', name: '豪华', min: 300, max: 1000 },
  { id: 'ultra_luxury', name: '超豪华', min: 1000, max: null }
];

// 评分
export const RATINGS = [
  { id: 5, name: '5星' },
  { id: 4, name: '4星及以上' },
  { id: 3, name: '3星及以上' },
  { id: 2, name: '2星及以上' },
  { id: 1, name: '1星及以上' }
];

// 预订状态
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// 支付方式
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  BANK_TRANSFER: 'bank_transfer'
};

// 支付状态
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络错误，请检查您的网络连接',
  SERVER_ERROR: '服务器错误，请稍后再试',
  UNAUTHORIZED: '未授权，请登录',
  FORBIDDEN: '无权访问',
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '验证错误，请检查您的输入',
  UNKNOWN_ERROR: '未知错误，请稍后再试'
};

// 本地存储键
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
  RECENT_SEARCHES: 'recent_searches',
  LANGUAGE: 'language',
  THEME: 'theme',
  AUTHENTICATION: 'authentication',
  USER_TOKEN: 'userToken'
};

// 不需要token的公共API列表
export const PUBLIC_APIS = [
  '/user/login',
  '/user/register',
  '/admin/employee/login',
  '/agent/login',
  '/auth/login',
  '/auth/register',
  '/user/shop/status',
  '/user/day-tours',
  '/user/group-tours',
  '/user/tours',
  '/user/tours/',
  '/user/day-tours/',
  '/user/group-tours/',
  '/user/tours/hot',
  '/user/tours/recommended',
  '/user/day-tours/themes',
  '/user/group-tours/themes',
  '/user/tours/suitable-for-options',
  '/user/tours/search',
  '/user/tours/1',
  '/user/tours/2',
  '/user/tours/3',
  '/user/tours/4',
  '/user/tours/5',
  '/user/tours/6',
  '/user/tours/7',
  '/user/tours/8',
  '/user/tours/9',
  '/user/tours/10',
  '/user/tours/11',
  '/user/tours/12',
  '/regions'
];

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// 排序选项
export const SORT_OPTIONS = [
  { id: 'recommended', name: '推荐' },
  { id: 'price_low_to_high', name: '价格从低到高' },
  { id: 'price_high_to_low', name: '价格从高到低' },
  { id: 'rating', name: '评分' },
  { id: 'popularity', name: '人气' },
  { id: 'newest', name: '最新' }
];

// 视图模式
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  MAP: 'map'
};

// 语言选项
export const LANGUAGES = [
  { id: 'zh', name: '中文' },
  { id: 'en', name: 'English' }
];

// 主题选项
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// 默认图片
export const DEFAULT_IMAGES = {
  // 内联SVG占位符图片，避免网络请求
  PLACEHOLDER: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRTVFNUU1Ii8+CjxwYXRoIGQ9Ik03NC41IDEwMEMxMDAuNSA2NS41IDE1OCA2OS41IDE0Mi41IDEyNC41QzEzMiAxNjAgNzMuNjY2NyAxNDAuNSA3NSAxMDBaIiBmaWxsPSIjRDlEOUQ5Ii8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjE2IiBmaWxsPSIjRDlEOUQ5Ii8+Cjwvc3ZnPgo=',
  // 备用路径，尽量避免使用
  TOUR: '/images/default-tour.jpg',
  USER: '/images/default-user.jpg',
  AGENT: '/images/default-agent.jpg'
};

// 图片相关配置
export const IMAGE_CONFIG = {
  // 加载延迟设置，以毫秒为单位
  LOADING_DELAY: 200,
  // 加载超时设置，以毫秒为单位
  LOADING_TIMEOUT: 5000,
  // 图片懒加载相关设置
  LAZY_LOADING: {
    // 懒加载阈值，使用IntersectionObserver时的可见性阈值
    THRESHOLD: 0.1,
    // 懒加载根边距，扩展预加载区域
    ROOT_MARGIN: '100px'
  },
  // 图片尺寸和质量配置
  QUALITY: {
    // 默认宽度
    DEFAULT_WIDTH: 300,
    // 默认高度
    DEFAULT_HEIGHT: 200,
    // WebP格式质量参数
    WEBP_QUALITY: 80
  }
}; 