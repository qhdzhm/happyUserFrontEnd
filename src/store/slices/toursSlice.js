import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAllTours,
  getTourById,
  getDayTours,
  getGroupTours,
  searchTours
} from '../../utils/api';

// 异步action：获取所有旅游产品
export const fetchAllTours = createAsyncThunk(
  'tours/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllTours();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '获取旅游产品失败');
    }
  }
);

// 异步action：根据ID获取旅游产品
export const fetchTourById = createAsyncThunk(
  'tours/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getTourById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '获取旅游产品详情失败');
    }
  }
);

// 异步action：获取一日游产品
export const fetchDayTours = createAsyncThunk(
  'tours/fetchDayTours',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getDayTours(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '获取一日游产品失败');
    }
  }
);

// 异步action：获取跟团游产品
export const fetchGroupTours = createAsyncThunk(
  'tours/fetchGroupTours',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await getGroupTours(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '获取跟团游产品失败');
    }
  }
);

// 异步action：搜索旅游产品
export const searchTourProducts = createAsyncThunk(
  'tours/search',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchTours(searchParams);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '搜索旅游产品失败');
    }
  }
);

// 初始状态
const initialState = {
  tours: [],
  dayTours: [],
  groupTours: [],
  currentTour: null,
  searchResults: [],
  loading: false,
  error: null,
  filters: {
    location: [],
    tourType: '',
    themes: [],
    duration: [],
    priceRange: [],
    rating: null,
    suitableFor: []
  }
};

// 创建slice
const toursSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    // 设置筛选条件
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    // 清除筛选条件
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    // 清除当前旅游产品
    clearCurrentTour: (state) => {
      state.currentTour = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取所有旅游产品
      .addCase(fetchAllTours.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllTours.fulfilled, (state, action) => {
        state.loading = false;
        state.tours = action.payload;
      })
      .addCase(fetchAllTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 根据ID获取旅游产品
      .addCase(fetchTourById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTourById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTour = action.payload;
      })
      .addCase(fetchTourById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取一日游产品
      .addCase(fetchDayTours.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDayTours.fulfilled, (state, action) => {
        state.loading = false;
        state.dayTours = action.payload;
      })
      .addCase(fetchDayTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取跟团游产品
      .addCase(fetchGroupTours.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroupTours.fulfilled, (state, action) => {
        state.loading = false;
        state.groupTours = action.payload;
      })
      .addCase(fetchGroupTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 搜索旅游产品
      .addCase(searchTourProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchTourProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchTourProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// 导出actions
export const { setFilters, clearFilters, clearCurrentTour } = toursSlice.actions;

// 导出reducer
export default toursSlice.reducer; 