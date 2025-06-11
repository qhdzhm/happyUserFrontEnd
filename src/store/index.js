import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

// 导入reducers
import authReducer from './slices/authSlice';
import toursReducer from './slices/toursSlice';
import bookingReducer from './slices/bookingSlice';
import uiReducer from './slices/uiSlice';

// 合并reducers
const rootReducer = combineReducers({
  auth: authReducer,
  tours: toursReducer,
  booking: bookingReducer,
  ui: uiReducer
});

// 创建store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些action类型的序列化检查
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
        // 忽略这些路径的序列化检查
        ignoredPaths: ['auth.user', 'tours.currentTour']
      }
    })
});

// 同时导出默认和命名导出
export { store };
export default store; 