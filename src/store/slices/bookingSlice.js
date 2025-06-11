import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  checkAvailability
} from '../../utils/api';

// 异步action：创建预订
export const createNewBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await createBooking(bookingData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '创建预订失败');
    }
  }
);

// 异步action：获取用户预订
export const fetchUserBookings = createAsyncThunk(
  'booking/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserBookings();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '获取用户预订失败');
    }
  }
);

// 异步action：根据ID获取预订
export const fetchBookingById = createAsyncThunk(
  'booking/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getBookingById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '获取预订详情失败');
    }
  }
);

// 异步action：取消预订
export const cancelUserBooking = createAsyncThunk(
  'booking/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await cancelBooking(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '取消预订失败');
    }
  }
);

// 异步action：检查可用性
export const checkTourAvailability = createAsyncThunk(
  'booking/checkAvailability',
  async (params, { rejectWithValue }) => {
    try {
      const response = await checkAvailability(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '检查可用性失败');
    }
  }
);

// 初始状态
const initialState = {
  bookings: [],
  currentBooking: null,
  availability: null,
  loading: false,
  error: null,
  bookingData: {
    tourId: null,
    tourType: null,
    startDate: null,
    endDate: null,
    adults: 1,
    children: 0,
    totalPrice: 0,
    specialRequests: ''
  }
};

// 创建slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // 设置预订数据
    setBookingData: (state, action) => {
      state.bookingData = { ...state.bookingData, ...action.payload };
    },
    // 清除预订数据
    clearBookingData: (state) => {
      state.bookingData = initialState.bookingData;
    },
    // 计算总价
    calculateTotalPrice: (state, action) => {
      const { basePrice, childPrice } = action.payload;
      const { adults, children } = state.bookingData;
      state.bookingData.totalPrice = (adults * basePrice) + (children * childPrice);
    }
  },
  extraReducers: (builder) => {
    builder
      // 创建预订
      .addCase(createNewBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(createNewBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        state.bookings.push(action.payload);
      })
      .addCase(createNewBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取用户预订
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 根据ID获取预订
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 取消预订
      .addCase(cancelUserBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelUserBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        );
        if (state.currentBooking && state.currentBooking.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(cancelUserBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 检查可用性
      .addCase(checkTourAvailability.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkTourAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload;
      })
      .addCase(checkTourAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// 导出actions
export const { setBookingData, clearBookingData, calculateTotalPrice } = bookingSlice.actions;

// 导出reducer
export default bookingSlice.reducer; 