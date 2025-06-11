import request from '../utils/request';

// 获取每日行程安排
export const getDailySchedule = (params) => {
  return request.get('/admin/tour-guide-vehicle-assignment/daily-schedule', { params });
};

// 获取指定日期的详细分配记录
export const getDailyAssignments = (date) => {
  return request.get(`/admin/tour-guide-vehicle-assignment/by-date`, { 
    params: { assignmentDate: date } 
  });
};

// 导出每日行程
export const exportDailySchedule = (params) => {
  return request.get('/admin/tour-guide-vehicle-assignment/export', { 
    params,
    responseType: 'blob'
  });
}; 