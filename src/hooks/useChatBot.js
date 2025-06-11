import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * 聊天机器人自定义Hook
 * @param {Object} config 配置参数
 * @param {number} config.userType 用户类型 1-普通客户 2-中介操作员
 * @param {number} config.userId 用户ID
 * @param {string} config.sessionId 会话ID
 */
export const useChatBot = ({ userType = 1, userId = null, sessionId = null }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    
    const sessionIdRef = useRef(sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef(null);

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 初始化欢迎消息
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: Date.now(),
                type: 'bot',
                content: '您好！欢迎来到Happy Tassie Travel，我是您的AI客服助手。请问有什么可以帮助您的吗？',
                timestamp: new Date()
            }]);
        }
    }, []);

    // 发送消息
    const sendMessage = async (messageContent) => {
        if (!messageContent.trim()) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: messageContent,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/chatbot/message', {
                sessionId: sessionIdRef.current,
                message: messageContent,
                userType,
                userId
            });

            if (response.data.code === 1) {
                const botResponse = {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: response.data.data.message,
                    timestamp: new Date(),
                    messageType: response.data.data.messageType,
                    orderData: response.data.data.orderData,
                    redirectUrl: response.data.data.redirectUrl
                };

                setMessages(prev => [...prev, botResponse]);
                return botResponse;
            } else {
                throw new Error(response.data.msg || '服务器响应错误');
            }

        } catch (error) {
            console.error('发送消息失败:', error);
            
            let errorMessage = '抱歉，服务暂时不可用，请稍后重试。';
            if (error.response?.data?.data?.errorCode === 'RATE_LIMIT') {
                errorMessage = '请求过于频繁，请稍后再试。';
            } else if (error.response?.data?.data?.errorCode === 'PERMISSION_DENIED') {
                errorMessage = '抱歉，您没有权限发送订单信息。';
            }

            const errorBotMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorMessage,
                timestamp: new Date(),
                isError: true
            };
            
            setMessages(prev => [...prev, errorBotMessage]);
            setError(error);
            throw error;
            
        } finally {
            setLoading(false);
        }
    };

    // 清空消息
    const clearMessages = () => {
        setMessages([{
            id: Date.now(),
            type: 'bot',
            content: '聊天记录已清空。有什么可以帮助您的吗？',
            timestamp: new Date()
        }]);
    };

    // 获取聊天历史
    const getChatHistory = async () => {
        try {
            const response = await axios.get(`/api/chatbot/session/${sessionIdRef.current}/history`);
            if (response.data.code === 1) {
                const history = response.data.data.map(msg => ({
                    id: msg.id,
                    type: msg.userMessage ? 'user' : 'bot',
                    content: msg.userMessage || msg.botResponse,
                    timestamp: new Date(msg.createTime),
                    messageType: msg.messageType,
                    extractedData: msg.extractedData
                }));
                setMessages(history);
            }
        } catch (error) {
            console.error('获取聊天历史失败:', error);
        }
    };

    // 连接状态检查
    const checkConnection = async () => {
        try {
            const response = await axios.get('/api/chatbot/health');
            setConnected(response.data.code === 1);
        } catch (error) {
            setConnected(false);
        }
    };

    // 初始化时检查连接状态
    useEffect(() => {
        checkConnection();
    }, []);

    return {
        messages,
        loading,
        connected,
        error,
        sessionId: sessionIdRef.current,
        messagesEndRef,
        sendMessage,
        clearMessages,
        getChatHistory,
        scrollToBottom,
        checkConnection
    };
};

export default useChatBot; 