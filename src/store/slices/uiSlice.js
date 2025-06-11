import { createSlice } from '@reduxjs/toolkit';
import { VIEW_MODES, THEMES } from '../../utils/constants';

// UI初始状态
const initialState = {
  language: localStorage.getItem('language') || 'zh',
  theme: localStorage.getItem('theme') || 'light',
  searchParams: {},
  quickSearchValues: {},
  isLoading: false,
  isSearching: false,
  sidebarOpen: false,
  searchResults: null,
  searchTerm: '',
  currentPage: 1,
  isMobile: window.innerWidth < 768,
  isNavbarOpen: false,
  isFilterOpen: false,
  // 通知消息
  notification: {
    show: false,
    type: 'info', // 'info', 'success', 'warning', 'danger'
    message: '',
    duration: 3000 // 3秒
  },
  isSidebarOpen: false,
  isSearchModalOpen: false,
  isCartModalOpen: false,
  isFilterModalOpen: false,
  activeCurrency: 'CNY',
  activeLanguage: 'zh-CN',
  searchQuery: ''
};

// 创建UI切片
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    setQuickSearchValues: (state, action) => {
      state.quickSearchValues = { ...state.quickSearchValues, ...action.payload };
    },
    clearSearchParams: (state) => {
      state.searchParams = {};
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsSearching: (state, action) => {
      state.isSearching = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    // 打开导航栏
    openNavbar: (state) => {
      state.isNavbarOpen = true;
    },
    // 关闭导航栏
    closeNavbar: (state) => {
      state.isNavbarOpen = false;
    },
    // 切换导航栏状态
    toggleNavbar: (state) => {
      state.isNavbarOpen = !state.isNavbarOpen;
    },
    // 打开筛选器
    openFilter: (state) => {
      state.isFilterOpen = true;
    },
    // 关闭筛选器
    closeFilter: (state) => {
      state.isFilterOpen = false;
    },
    // 切换筛选器状态
    toggleFilter: (state) => {
      state.isFilterOpen = !state.isFilterOpen;
    },
    // 显示通知
    showNotification: (state, action) => {
      const { type = 'info', message, duration = 3000 } = action.payload;
      state.notification = {
        show: true,
        type,
        message,
        duration
      };
      
      // 控制台输出通知信息（调试用）
      console.log(`[通知 - ${type}]: ${message}`);
    },
    // 隐藏通知
    hideNotification: (state) => {
      state.notification.show = false;
    },
    // 侧边栏状态切换
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
    
    // 搜索模态框
    openSearchModal: (state) => {
      state.isSearchModalOpen = true;
    },
    
    closeSearchModal: (state) => {
      state.isSearchModalOpen = false;
    },
    
    // 购物车模态框
    openCartModal: (state) => {
      state.isCartModalOpen = true;
    },
    
    closeCartModal: (state) => {
      state.isCartModalOpen = false;
    },
    
    // 筛选模态框
    openFilterModal: (state) => {
      state.isFilterModalOpen = true;
    },
    
    closeFilterModal: (state) => {
      state.isFilterModalOpen = false;
    },
    
    // 设置货币
    setCurrency: (state, action) => {
      state.activeCurrency = action.payload;
    },
    
    // 设置语言
    setLanguage: (state, action) => {
      state.activeLanguage = action.payload;
    },
    
    // 设置搜索查询
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    }
  },
});

// 导出actions
export const {
  setLanguage,
  setTheme,
  setSearchParams,
  setQuickSearchValues,
  clearSearchParams,
  setLoading,
  setIsSearching,
  toggleSidebar,
  setSidebarOpen,
  setSearchResults,
  setSearchTerm,
  setCurrentPage,
  setIsMobile,
  openNavbar,
  closeNavbar,
  toggleNavbar,
  openFilter,
  closeFilter,
  toggleFilter,
  showNotification,
  hideNotification,
  openSearchModal,
  closeSearchModal,
  openCartModal,
  closeCartModal,
  openFilterModal,
  closeFilterModal,
  setCurrency,
  setSearchQuery
} = uiSlice.actions;

// 导出reducer
export default uiSlice.reducer; 