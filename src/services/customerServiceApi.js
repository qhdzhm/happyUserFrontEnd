import axios from 'axios';

const BASE_URL = '/api/user/service';

// 创建专用的axios实例
const apiClient = axios.create({
    timeout: 10000, // 10秒超时
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('agent-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('认证失败，可能需要重新登录');
        } else if (error.response?.status === 403) {
            console.warn('权限不足');
        } else if (error.code === 'ECONNABORTED') {
            console.error('请求超时');
        }
        return Promise.reject(error);
    }
);

// 客服API服务
export const customerServiceApi = {
    // 转人工服务
    transferToService: async (data) => {
        try {
            const response = await apiClient.post(`${BASE_URL}/transfer`, {
                sessionType: data.sessionType || 2, // 2-AI转人工
                subject: data.subject || 'AI转人工咨询',
                aiContextId: data.aiContextId,
                priority: data.priority || 1
            });
            return response.data;
        } catch (error) {
            console.error('转人工服务失败:', error);
            throw error;
        }
    },

    // 获取用户的活跃会话
    getActiveSession: async () => {
        try {
            const response = await apiClient.get(`${BASE_URL}/session/active`);
            return response.data;
        } catch (error) {
            console.error('获取活跃会话失败:', error);
            throw error;
        }
    },

    // 发送消息
    sendMessage: async (data) => {
        try {
            const response = await apiClient.post(`${BASE_URL}/message/send`, {
                sessionId: data.sessionId,
                messageType: data.messageType || 1, // 1-文本
                content: data.content,
                mediaUrl: data.mediaUrl
            });
            return response.data;
        } catch (error) {
            console.error('发送消息失败:', error);
            throw error;
        }
    },

    // 获取会话消息列表
    getSessionMessages: async (sessionId) => {
        try {
            const response = await apiClient.get(`${BASE_URL}/message/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('获取消息列表失败:', error);
            throw error;
        }
    },

    // 标记消息为已读
    markAsRead: async (sessionId) => {
        try {
            const response = await apiClient.put(`${BASE_URL}/message/read/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('标记已读失败:', error);
            throw error;
        }
    },

    // 结束会话
    endSession: async (sessionId) => {
        try {
            const response = await apiClient.put(`${BASE_URL}/session/end/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('结束会话失败:', error);
            throw error;
        }
    },

    // 评价会话
    rateSession: async (sessionId, rating, comment) => {
        try {
            const response = await apiClient.put(`${BASE_URL}/session/rate/${sessionId}`, null, {
                params: { rating, comment }
            });
            return response.data;
        } catch (error) {
            console.error('评价会话失败:', error);
            throw error;
        }
    },

    // 健康检查
    healthCheck: async () => {
        try {
            const response = await apiClient.get(`${BASE_URL}/health`);
            return response.data;
        } catch (error) {
            console.error('健康检查失败:', error);
            throw error;
        }
    }
};

export default customerServiceApi; 