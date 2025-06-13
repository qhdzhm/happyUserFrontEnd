import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Input, Button, Avatar, Spin, message, Tooltip, Badge, Rate } from 'antd';
import { 
    MessageOutlined, 
    SendOutlined, 
    RobotOutlined, 
    UserOutlined,
    CloseOutlined,
    MinusOutlined,
    CustomerServiceOutlined,
    DisconnectOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoginOutlined,
    SettingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import customerServiceApi from '../../services/customerServiceApi';
import websocketService from '../../services/websocketService';
import AISettings from './AISettings';
import { getCurrentAIConfig, collectPerformanceData } from '../../utils/aiConfig';
import './ChatBot.css';

const ChatBot = ({ userType = 1, userId = null }) => {
    const [visible, setVisible] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    
    // 客服相关状态
    const [serviceMode, setServiceMode] = useState('ai'); // 'ai' | 'transferring' | 'human'
    const [serviceSession, setServiceSession] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [serviceStatus, setServiceStatus] = useState(''); // 客服状态描述
    const [showRating, setShowRating] = useState(false);
    
    // 登录状态
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    
    // 添加防抖和重试相关状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastSubmitTimeRef = useRef(0);
    const submitTimeoutRef = useRef(null);
    
    // AI设置相关状态
    const [showAISettings, setShowAISettings] = useState(false);
    const [currentAIProvider, setCurrentAIProvider] = useState('qwen'); // 默认为通义千问
    
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    
    // 添加防抖和缓存机制
    const lastLoginCheckRef = useRef(null);
    const loginCheckTimeoutRef = useRef(null);
    const lastUserIdRef = useRef(null); // 用于检测用户切换
    const lastIsLoggedInRef = useRef(null); // 用于检测登录状态切换
    
    // 聊天记录存储key
    const getChatStorageKey = () => {
        const currentUser = userInfo?.agentId || userInfo?.operatorId || userInfo?.username || 'guest';
        return `chatbot_messages_${currentUser}`;
    };
    
    // 保存聊天记录到localStorage
    const saveChatHistory = (messagesToSave) => {
        try {
            const storageKey = getChatStorageKey();
            
            // 只保存安全的用户信息，不包含敏感数据
            const safeUserInfo = userInfo ? {
                id: userInfo.id,
                username: userInfo.username,
                name: userInfo.name,
                userType: userInfo.userType,
                role: userInfo.role,
                isAuthenticated: userInfo.isAuthenticated
                // 不包含token、discountRate、agentId、operatorId等敏感信息
            } : null;
            
            const chatData = {
                messages: messagesToSave,
                timestamp: Date.now(),
                sessionId: sessionId,
                userInfo: safeUserInfo
            };
            localStorage.setItem(storageKey, JSON.stringify(chatData));
        } catch (error) {
            console.error('保存聊天记录失败:', error);
        }
    };
    
    // 从localStorage加载聊天记录
    const loadChatHistory = () => {
        try {
            const storageKey = getChatStorageKey();
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const chatData = JSON.parse(savedData);
                // 检查是否是最近的聊天记录（24小时内）
                const isRecent = Date.now() - chatData.timestamp < 24 * 60 * 60 * 1000;
                if (isRecent && chatData.messages && chatData.messages.length > 0) {
                    setMessages(chatData.messages);
                    return true;
                }
            }
        } catch (error) {
            console.error('加载聊天记录失败:', error);
        }
        return false;
    };
    
    // 检测登录状态 - 添加防抖和缓存
    const checkLoginStatus = () => {
        // 防抖：如果上次检查时间少于5秒，跳过检查
        const now = Date.now();
        if (lastLoginCheckRef.current && now - lastLoginCheckRef.current < 5000) {
            return;
        }
        lastLoginCheckRef.current = now;
        
        try {
            // 导入认证工具函数
            const { 
                isAuthenticated, 
                getUserInfoFromCookie, 
                shouldUseCookieAuth,
                getUserType,
                getUserDisplayName,
                syncUserInfoToLocalStorage
            } = require('../../utils/auth');
            
            // 先尝试同步用户信息
            syncUserInfoToLocalStorage();
            
            // 检查是否已认证（支持Cookie和localStorage两种模式）
            const authenticated = isAuthenticated();
            
            console.log('ChatBot登录状态检查:', {
                authenticated,
                useCookieAuth: shouldUseCookieAuth(),
                userType: getUserType(),
                hasUserInfo: !!getUserInfoFromCookie(),
                localStorageUser: !!localStorage.getItem('user')
            });
            
            if (authenticated) {
                const wasLoggedIn = isLoggedIn;
                setIsLoggedIn(true);
                
                // 获取用户信息（优先从Cookie，回退到localStorage）
                let userInfo = getUserInfoFromCookie();
                
                // 如果Cookie中没有用户信息，从localStorage构建
                if (!userInfo) {
                    const user = localStorage.getItem('user');
                    const userType = localStorage.getItem('userType');
                    const username = localStorage.getItem('username');
                    const agentId = localStorage.getItem('agentId');
                    const operatorId = localStorage.getItem('operatorId');
                    
                    if (user) {
                        try {
                            userInfo = JSON.parse(user);
                        } catch (e) {
                            console.warn('解析localStorage用户信息失败:', e);
                        }
                    }
                    
                    // 如果还是没有用户信息，使用基本信息构建
                    if (!userInfo && (username || userType)) {
                        userInfo = {
                            username: username || 'user',
                            userType: userType || 'regular',
                            agentId: agentId ? parseInt(agentId, 10) : null,
                            operatorId: operatorId ? parseInt(operatorId, 10) : null,
                            name: getUserDisplayName(),
                            isAuthenticated: true
                        };
                    }
                }
                
                // 确保用户信息包含必要字段
                if (userInfo) {
                    userInfo.isAuthenticated = true;
                    userInfo.name = userInfo.name || userInfo.username || getUserDisplayName();
                    userInfo.userType = userInfo.userType || getUserType();
                }
                
                setUserInfo(userInfo);
                console.log('ChatBot检测到用户已登录:', userInfo);
                
                // 如果是新登录（之前未登录），加载聊天记录
                if (!wasLoggedIn && userInfo) {
                    loadChatHistory();
                }
            } else {
                console.log('ChatBot检测到用户未登录');
                setIsLoggedIn(false);
                setUserInfo(null);
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
            setIsLoggedIn(false);
            setUserInfo(null);
        }
    };
    
    // 检测是否为旅游服务信息
    const isTravelServiceMessage = (content) => {
        const serviceKeywords = [
            '塔州', '塔斯马尼亚', '跟团', '三日游', '参团日期', '接送地点', 
            '返程地点', '服务车型', '跟团人数', '客户信息', '行李数', 
            '房型', '酒店级别', '行程安排', '布鲁尼岛', '萨拉曼卡', 
            '惠灵顿山', '塔斯曼半岛', '极光', '黄油饼干', '皇冠酒店',
            '大床房', '生蚝场', '芝士工厂', '冒险湾', '里奇蒙',
            '啤酒厂', '半岛巡游', '送机', '接机', 'crowne plaza',
            '皇冠假日', '酒店', '住宿', '游览', '景点', '旅游',
            '预订', '订单', '行程', '导游', '团队'
        ];
        
        const infoPatterns = [
            /\d{1,2}月\d{1,2}日/, // 日期格式：6月3日
            /EJ\d+|ED\d+/, // 护照号格式
            /1[3-9]\d{9}/, // 手机号格式
            /\d+人/, // 人数格式：2人
            /第[一二三四五六七八九十]+天/, // 行程天数
            /\d+\.\d+号/, // 日期格式：6.2号
            /\d+:\d+/, // 时间格式
            /\d+h/, // 时长格式：3h
        ];
        
        // 检查关键词匹配数量
        const matchedKeywords = serviceKeywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // 检查信息模式匹配数量
        const matchedPatterns = infoPatterns.filter(pattern => 
            pattern.test(content)
        );
        
        // 检查内容长度（旅游信息通常比较长）
        const isLongContent = content.length > 50;
        
        // 检查是否包含多行信息（用换行符分割）
        const hasMultipleLines = content.split('\n').length > 3;
        
        // 综合判断：至少3个关键词 + 至少1个信息模式 + (长内容或多行)
        return (matchedKeywords.length >= 3 && matchedPatterns.length >= 1) ||
               (matchedKeywords.length >= 5) ||
               (matchedKeywords.length >= 2 && hasMultipleLines && isLongContent);
    };
    
    // 生成登录提醒消息
    const generateLoginReminder = (isAgentLogin = false) => {
        return {
            id: Date.now(),
            type: 'bot',
            content: '感谢您提供详细的旅游服务信息！为了更好地为您服务和保存您的订单信息，请先登录您的账户。',
            timestamp: new Date(),
            isLoginReminder: true,
            showLoginButton: true,
            isAgentLogin: isAgentLogin // 标识是否需要跳转到代理商登录
        };
    };
    
    // 滚动到底部
    const scrollToBottom = () => {
        // 使用setTimeout确保DOM完全渲染后再滚动
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ 
                    behavior: "smooth",
                    block: "end",
                    inline: "nearest"
                });
            }
        }, 100);
    };
    
    // 强制滚动到底部
    const forceScrollToBottom = () => {
        // 使用setTimeout确保DOM完全渲染后再滚动
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ 
                    behavior: "auto",
                    block: "end",
                    inline: "nearest"
                });
            }
        }, 50);
    };
    
    // 当messages变化时保存到localStorage
    useEffect(() => {
        if (messages.length > 0) {
            saveChatHistory(messages);
        }
    }, [messages, userInfo]);
    
    // 当用户信息变化时，加载对应的聊天记录
    useEffect(() => {
        if (userInfo && isLoggedIn) {
            // 如果当前没有消息，尝试加载历史记录
            if (messages.length === 0) {
                const loaded = loadChatHistory();
                if (!loaded) {
                    // 如果没有历史记录，显示欢迎消息
                    setMessages([{
                        id: Date.now(),
                        type: 'bot',
                        content: `您好${userInfo?.name ? '，' + userInfo.name : ''}！我是您的AI旅游助手，有什么可以帮助您的吗？`,
                        timestamp: new Date()
                    }]);
                }
            }
        }
    }, [userInfo, isLoggedIn]);
    
    // 初始化欢迎消息和加载聊天记录
    useEffect(() => {
        if (visible && messages.length === 0) {
            // 先尝试加载聊天记录
            const hasHistory = loadChatHistory();
            
            // 如果没有历史记录，显示欢迎消息
            if (!hasHistory) {
                const welcomeMessage = isLoggedIn ? 
                    `您好${userInfo?.name ? '，' + userInfo.name : ''}！欢迎来到Happy Tassie Travel，我是您的AI客服助手。请问有什么可以帮助您的吗？` :
                    '您好！欢迎来到Happy Tassie Travel，我是您的AI客服助手。请问有什么可以帮助您的吗？';
                    
                setMessages([{
                    id: Date.now(),
                    type: 'bot',
                    content: welcomeMessage,
                    timestamp: new Date()
                }]);
            }
        }
    }, [visible, isLoggedIn, userInfo]);

    // WebSocket消息监听
    useEffect(() => {
        const handleMessage = (data) => {
            console.log('收到WebSocket消息:', data);
            
            if (data.type === 'service_message') {
                const newMessage = {
                    id: data.id || Date.now(),
                    type: data.senderType === 2 ? 'service' : 'user',
                    content: data.content,
                    timestamp: new Date(data.createTime || Date.now()),
                    messageId: data.id
                };
                setMessages(prev => [...prev, newMessage]);
                
                // 如果收到客服消息，说明会话已经被接受，更新状态为人工服务
                if (data.senderType === 2 && serviceMode === 'transferring') {
                    setServiceMode('human');
                    setServiceStatus('人工客服为您服务');
                    
                    // 添加系统消息通知
                    const statusMessage = {
                        id: Date.now() + 1,
                        type: 'system',
                        content: '客服已接入，为您服务',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, statusMessage]);
                }
                
                // 如果窗口未打开，增加未读计数
                if (!visible) {
                    setUnreadCount(prev => prev + 1);
                }
            } else if (data.type === 'message') {
                // 处理客服发送的消息
                if (data.senderType === 2) { // 客服消息
                    const newMessage = {
                        id: Date.now(),
                        type: 'service',
                        content: data.content,
                        timestamp: new Date(),
                        sessionId: data.sessionId
                    };
                    setMessages(prev => [...prev, newMessage]);
                    
                    // 如果收到客服消息，说明会话已经被接受，更新状态为人工服务
                    if (serviceMode === 'transferring') {
                        setServiceMode('human');
                        setServiceStatus('人工客服为您服务');
                        
                        // 添加系统消息通知
                        const statusMessage = {
                            id: Date.now() + 1,
                            type: 'system',
                            content: '客服已接入，为您服务',
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, statusMessage]);
                    }
                    
                    // 如果窗口未打开，增加未读计数
                    if (!visible) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            } else if (data.type === 'status_change') {
                // 处理会话状态变化
                console.log('会话状态变化:', data);
                updateSessionStatus(data.status);
                
                // 如果状态变为服务中，添加系统消息
                if (data.status === 1) {
                    const statusMessage = {
                        id: Date.now(),
                        type: 'system',
                        content: data.message || '客服已接入，为您服务',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, statusMessage]);
                }
            } else if (data.type === 'session_status') {
                updateSessionStatus(data.status);
            }
        };

        const handleConnected = () => {
            console.log('实时消息连接已建立');
        };

        const handleDisconnected = () => {
            console.log('实时消息连接已断开');
        };

        websocketService.on('message', handleMessage);
        websocketService.on('connected', handleConnected);
        websocketService.on('disconnected', handleDisconnected);

        return () => {
            websocketService.off('message', handleMessage);
            websocketService.off('connected', handleConnected);
            websocketService.off('disconnected', handleDisconnected);
        };
    }, [visible, serviceMode]);

    // 定期检查会话状态（当处于转人工状态时）
    useEffect(() => {
        let intervalId;
        
        if (serviceMode === 'transferring' && serviceSession) {
            intervalId = setInterval(async () => {
                try {
                    // 检查当前用户的活跃会话状态
                    const response = await customerServiceApi.getActiveSession();
                    if (response.code === 1 && response.data) {
                        const session = response.data;
                        console.log('检查到会话状态:', session.sessionStatus);
                        
                        // 如果会话状态变为进行中，更新UI
                        if (session.sessionStatus === 1) {
                            setServiceMode('human');
                            setServiceStatus('人工客服为您服务');
                            
                            // 添加系统消息
                            const statusMessage = {
                                id: Date.now(),
                                type: 'system',
                                content: '客服已接入，为您服务',
                                timestamp: new Date()
                            };
                            setMessages(prev => [...prev, statusMessage]);
                            
                            // 停止检查
                            clearInterval(intervalId);
                        }
                    }
                } catch (error) {
                    console.error('检查会话状态失败:', error);
                }
            }, 2000); // 每2秒检查一次
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [serviceMode, serviceSession]);

    // 打开聊天窗口时清除未读计数
    useEffect(() => {
        if (visible) {
            setUnreadCount(0);
        }
    }, [visible]);
    
    // 发送AI消息
    const sendAIMessage = async (content) => {
        // 检查是否为未登录用户发送旅游服务信息
        if (!isLoggedIn && isTravelServiceMessage(content)) {
            // 显示登录提醒，标识为代理商登录
            const loginReminderMessage = generateLoginReminder(true);
            setMessages(prev => [...prev, loginReminderMessage]);
            return;
        }
        
        setLoading(true);
        
        // 添加用户体验优化 - 显示AI正在思考的消息
        const thinkingMessage = {
            id: Date.now() + 0.5,
            type: 'bot',
            content: '🤔 正在为您智能分析，请稍候...',
            timestamp: new Date(),
            isThinking: true
        };
        setMessages(prev => [...prev, thinkingMessage]);
        
        try {
            // 配置更长的超时时间，针对通义千问优化
            const response = await axios.post('/api/chatbot/message', {
                sessionId,
                message: content,
                userType,
                userId
            }, {
                timeout: 30000, // 通义千问响应更快，可以设为30秒
                headers: {
                    'X-Request-Priority': 'high', // 标记为高优先级请求
                    'X-AI-Provider': 'qwen',   // 标识AI提供商为通义千问
                    'X-Current-Page': window.location.pathname, // 当前页面路径
                    'X-Current-URL': window.location.href // 完整当前URL
                }
            });
            
            // 移除"正在思考"的消息
            setMessages(prev => prev.filter(msg => !msg.isThinking));
            
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
                
                setMessages(prev => {
                    const newMessages = [...prev, botResponse];
                    // 自动保存聊天记录
                    saveChatHistory(newMessages);
                    return newMessages;
                });
                
                // 如果是订单信息，显示跳转按钮并自动跳转
                if (botResponse.messageType === 2 && botResponse.redirectUrl) {
                    const currentPath = window.location.pathname;
                    const isAlreadyOnBookingPage = currentPath === '/booking' || currentPath.includes('/booking');
                    
                    // 检查用户类型，决定跳转到正确的页面
                    const userType = localStorage.getItem('userType');
                    const isAgent = userType === 'agent' || userType === 'agent_operator';
                    
                    let finalUrl = botResponse.redirectUrl;
                    
                    // 如果是中介用户且URL包含产品信息，转换为中介专用URL
                    if (isAgent && finalUrl.includes('/booking') && (finalUrl.includes('productId=') || finalUrl.includes('tourId='))) {
                        try {
                            const url = new URL(finalUrl, window.location.origin);
                            const params = url.searchParams;
                            const productId = params.get('productId') || params.get('tourId');
                            const tourType = params.get('tourType') || params.get('productType') || params.get('type');
                            
                            if (productId && tourType) {
                                // 转换产品类型格式
                                let pathType = 'day-tours';
                                if (tourType === 'group_tour' || tourType === 'group' || tourType === '跟团游') {
                                    pathType = 'group-tours';
                                }
                                
                                // 构建中介专用URL
                                finalUrl = `/agent-booking/${pathType}/${productId}?${params.toString()}`;
                                console.log('🔄 中介用户，转换URL:', finalUrl);
                            }
                        } catch (e) {
                            console.warn('URL转换失败，使用原始URL');
                        }
                    }
                    
                    if (isAlreadyOnBookingPage) {
                        // 如果已经在订单页面，显示提示并强制刷新页面以应用新参数
                        message.success('订单信息解析完成！页面将更新以显示新的订单信息');
                        setTimeout(() => {
                            // 强制刷新页面到新的URL
                            window.location.href = finalUrl;
                        }, 1500);
                    } else {
                        // 如果不在订单页面，正常跳转，但保持聊天窗口状态
                        message.success('订单信息解析完成！2秒后自动跳转到订单页面，聊天记录将保留');
                        setTimeout(() => {
                            if (finalUrl.startsWith('/agent-booking/')) {
                                // 使用window.location.href确保URL正确解析
                                window.location.href = finalUrl;
                            } else {
                                navigate(finalUrl);
                            }
                            // 不关闭聊天窗口，让用户可以继续查看聊天记录
                            // setVisible(false);
                        }, 2000);
                    }
                }
            } else {
                throw new Error(response.data.msg || '服务器响应错误');
            }
            
        } catch (error) {
            console.error('发送AI消息失败:', error);
            
            // 移除"正在思考"的消息
            setMessages(prev => prev.filter(msg => !msg.isThinking));
            
            let errorMessage = '抱歉，AI服务响应较慢，请稍后重试。';
            let showRetryButton = false;
            
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage = '⏰ AI响应超时，这可能是网络问题。您可以：\n1. 点击下方重试按钮\n2. 简化您的问题重新提问\n3. 转接人工客服获得帮助';
                showRetryButton = true;
            } else if (error.response?.data?.data?.errorCode === 'RATE_LIMIT') {
                errorMessage = '请求过于频繁，请稍后再试。';
            } else if (error.response?.data?.data?.errorCode === 'PERMISSION_DENIED') {
                errorMessage = '抱歉，您没有权限发送订单信息。';
            }
            
            const errorBotMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorMessage,
                timestamp: new Date(),
                isError: true,
                showRetryButton,
                retryContent: content // 保存原始内容用于重试
            };
            setMessages(prev => [...prev, errorBotMessage]);
        } finally {
            setLoading(false);
        }
    };

    // 发送人工客服消息
    const sendServiceMessage = async (content) => {
        if (!serviceSession) return;
        
        setLoading(true);
        
        try {
            const response = await customerServiceApi.sendMessage({
                sessionId: serviceSession.id,
                content: content,
                messageType: 1
            });
            
            if (response.code === 1) {
                // 消息已通过WebSocket接收，这里不需要手动添加
                console.log('消息发送成功');
            } else {
                throw new Error(response.msg || '发送消息失败');
            }
            
        } catch (error) {
            console.error('发送人工客服消息失败:', error);
            message.error('发送消息失败，请重试');
        } finally {
            setLoading(false);
        }
    };
    
    // 发送消息（统一入口）
    const sendMessage = async () => {
        if (!inputValue.trim()) return;
        
        // 防抖检查 - 防止快速连续提交
        const now = Date.now();
        if (now - lastSubmitTimeRef.current < 2000) { // 2秒内不允许重复提交
            message.warning('请不要频繁发送消息，请稍等片刻再试');
            return;
        }
        
        // 检查是否正在提交
        if (isSubmitting || loading) {
            message.warning('消息正在处理中，请稍候...');
            return;
        }
        
        setIsSubmitting(true);
        lastSubmitTimeRef.current = now;
        
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };
        
        setMessages(prev => {
            const newMessages = [...prev, userMessage];
            // 自动保存聊天记录
            saveChatHistory(newMessages);
            return newMessages;
        });
        const messageContent = inputValue;
        setInputValue('');
        
        // 立即滚动到底部显示用户发送的消息
        setTimeout(() => forceScrollToBottom(), 50);
        
        try {
            if (serviceMode === 'ai') {
                await sendAIMessage(messageContent);
            } else if (serviceMode === 'human') {
                await sendServiceMessage(messageContent);
            }
        } catch (error) {
            console.error('发送消息失败:', error);
        } finally {
            setIsSubmitting(false);
            // 发送完成后再次滚动，确保bot回复也能看到
            setTimeout(() => forceScrollToBottom(), 300);
        }
    };
    
    // 重试发送消息
    const retryMessage = async (content) => {
        if (isSubmitting || loading) {
            message.warning('请等待当前消息处理完成');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await sendAIMessage(content);
        } catch (error) {
            console.error('重试发送失败:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 处理登录按钮点击
    const handleLoginClick = (message = null) => {
        setVisible(false); // 关闭聊天窗口
        
        // 如果是代理商登录，跳转到代理商登录页面
        if (message && message.isAgentLogin) {
            navigate('/agent-login'); 
        } else {
            navigate('/login'); // 跳转到普通登录页面
        }
    };

    // 转人工客服
    const transferToHuman = async () => {
        if (!isLoggedIn) {
            const loginReminderMessage = {
                id: Date.now(),
                type: 'bot',
                content: '转接人工客服需要先登录账户，请先登录后再试。',
                timestamp: new Date(),
                isLoginReminder: true,
                showLoginButton: true,
                isAgentLogin: false // 转人工服务可以是普通用户
            };
            setMessages(prev => [...prev, loginReminderMessage]);
            return;
        }
        
        setServiceMode('transferring');
        setServiceStatus('正在为您转接人工客服...');
        
        try {
            const response = await customerServiceApi.transferToService({
                sessionType: 2, // AI转人工
                subject: 'AI转人工咨询',
                aiContextId: sessionId
            });
            
            if (response.code === 1) {
                const session = response.data;
                setServiceSession(session);
                
                // 建立WebSocket连接
                if (userId) {
                    websocketService.connect(userId, session.id);
                }
                
                // 添加转人工消息
                const transferMessage = {
                    id: Date.now(),
                    type: 'system',
                    content: '正在为您转接人工客服，请稍候...',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, transferMessage]);
                
                // 根据会话状态更新UI
                updateSessionStatus(session.sessionStatus);
                
            } else {
                throw new Error(response.msg || '转人工失败');
            }
            
        } catch (error) {
            console.error('转人工失败:', error);
            message.error('转人工失败，请重试');
            setServiceMode('ai');
            setServiceStatus('');
        }
    };

    // 更新会话状态
    const updateSessionStatus = (status) => {
        switch (status) {
            case 0: // 等待分配
                setServiceMode('transferring');
                setServiceStatus('正在等待客服接入...');
                break;
            case 1: // 服务中
                setServiceMode('human');
                setServiceStatus('人工客服为您服务');
                break;
            case 2: // 用户结束
            case 3: // 客服结束
                setServiceMode('ai');
                setServiceStatus('');
                setShowRating(true);
                websocketService.disconnect();
                break;
            case 4: // 系统超时结束
                setServiceMode('ai');
                setServiceStatus('');
                message.warning('会话已超时结束');
                websocketService.disconnect();
                break;
            default:
                break;
        }
    };

    // 结束人工客服
    const endServiceSession = async () => {
        if (!serviceSession) return;
        
        try {
            await customerServiceApi.endSession(serviceSession.id);
            setServiceMode('ai');
            setServiceStatus('');
            setShowRating(true);
            websocketService.disconnect();
            
            const endMessage = {
                id: Date.now(),
                type: 'system',
                content: '会话已结束，感谢您的使用！',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, endMessage]);
            
        } catch (error) {
            console.error('结束会话失败:', error);
            message.error('结束会话失败');
        }
    };

    // 评价服务
    const rateService = async (rating, comment = '') => {
        if (!serviceSession) return;
        
        try {
            await customerServiceApi.rateSession(serviceSession.id, rating, comment);
            message.success('感谢您的评价！');
            setShowRating(false);
        } catch (error) {
            console.error('评价失败:', error);
            message.error('评价失败，请重试');
        }
    };
    
    // 键盘事件
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    // 优化点击处理函数，防止重渲染
    const handleFloatBtnClick = useCallback(() => {
        setVisible(true);
        setUnreadCount(0);
        // 打开聊天窗口时自动滚动到底部
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    }, []);
    
    // 清空聊天记录（内部方法）
    const clearChatHistory = () => {
        setMessages([]);
        setServiceMode('ai');
        setServiceSession(null);
        setServiceStatus('');
        setUnreadCount(0);
        setShowRating(false);
        // 断开WebSocket连接
        websocketService.disconnect();
        
        // 清除localStorage中的所有聊天记录
        try {
            // 获取所有以 chatbot_messages_ 开头的键
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chatbot_messages_')) {
                    keysToRemove.push(key);
                }
            }
            
            // 删除所有聊天记录
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`已清除聊天记录: ${key}`);
            });
            
            console.log(`总共清除了 ${keysToRemove.length} 个聊天记录`);
            
        } catch (error) {
            console.error('清除聊天记录失败:', error);
        }
        
        console.log('已清除聊天记录');
    };
    
    // 检测用户切换 - 修改为只在真正用户切换时清除记录
    const checkUserSwitch = () => {
        const currentUserId = userInfo?.agentId || userInfo?.operatorId || userInfo?.username || null;
        const currentIsLoggedIn = isLoggedIn;
        
        // 只有在检测到不同用户登录时才清除聊天记录
        if (lastUserIdRef.current !== null && 
            lastUserIdRef.current !== currentUserId && 
            currentUserId !== null && 
            lastUserIdRef.current !== 'guest') {
            console.log('检测到用户切换:', { 
                from: lastUserIdRef.current, 
                to: currentUserId 
            });
            clearChatHistory();
        }
        
        // 只有在从登录状态变为登出状态时才清除记录，登录时不清除
        if (lastIsLoggedInRef.current !== null && 
            lastIsLoggedInRef.current === true && 
            currentIsLoggedIn === false) {
            console.log('检测到用户登出，清除聊天记录');
            clearChatHistory();
        }
        
        // 更新最后的用户ID和登录状态
        lastUserIdRef.current = currentUserId;
        lastIsLoggedInRef.current = currentIsLoggedIn;
    };

    // 初始化时检查登录状态并加载聊天记录
    useEffect(() => {
        checkLoginStatus();
        
        // 监听localStorage变化（只能监听其他tab的变化）
        const handleStorageChange = (e) => {
            // 只在相关的key变化时才重新检查
            if (e.key === 'token' || e.key === 'user' || e.key === 'username' || 
                e.key === 'userType' || e.key === 'agentId' || e.key === 'operatorId') {
                console.log('监听到登录相关localStorage变化:', e.key);
                setTimeout(checkLoginStatus, 100); // 延迟确保数据已更新
            }
        };
        
        // 添加自定义事件监听，用于同tab内的登录状态变化通知
        const handleLoginStateChange = () => {
            console.log('监听到登录状态变化事件');
            setTimeout(() => {
                checkLoginStatus();
            }, 100); // 延迟100ms确保localStorage已更新
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('loginStateChanged', handleLoginStateChange);
        window.addEventListener('logoutStateChanged', handleLoginStateChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('loginStateChanged', handleLoginStateChange);
            window.removeEventListener('logoutStateChanged', handleLoginStateChange);
        };
    }, []);

    // 监听用户信息变化，检测用户切换
    useEffect(() => {
        checkUserSwitch();
    }, [userInfo, isLoggedIn]);
    
    // 当消息变化时滚动到底部
    useEffect(() => {
        if (messages.length > 0) {
            forceScrollToBottom();
        }
    }, [messages]);

    // 清空聊天记录（公开方法）
    const clearMessages = () => {
        // 清空当前显示的消息
        const welcomeMessage = {
            id: Date.now(),
            type: 'bot',
            content: isLoggedIn ? 
                `您好${userInfo?.name ? '，' + userInfo.name : ''}！聊天记录已清空。有什么可以帮助您的吗？` :
                '您好！聊天记录已清空。有什么可以帮助您的吗？',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        // 清除localStorage中的所有聊天记录
        try {
            // 获取所有以 chatbot_messages_ 开头的键
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chatbot_messages_')) {
                    keysToRemove.push(key);
                }
            }
            
            // 删除所有聊天记录
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`已清除聊天记录: ${key}`);
            });
            
            console.log(`总共清除了 ${keysToRemove.length} 个聊天记录`);
            
            // 保存新的欢迎消息
            saveChatHistory([welcomeMessage]);
            
        } catch (error) {
            console.error('清除聊天记录失败:', error);
        }
    };
    
    // 格式化时间
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 获取状态图标
    const getStatusIcon = () => {
        switch (serviceMode) {
            case 'ai':
                return <RobotOutlined />;
            case 'transferring':
                return <ClockCircleOutlined spin />;
            case 'human':
                return <CustomerServiceOutlined />;
            default:
                return <RobotOutlined />;
        }
    };

    // 获取状态颜色
    const getStatusColor = () => {
        switch (serviceMode) {
            case 'ai':
                return '#52c41a';
            case 'transferring':
                return '#faad14';
            case 'human':
                return '#1890ff';
            default:
                return '#52c41a';
        }
    };
    
    // 初始化时检查连接状态
    useEffect(() => {
        // 初始化AI配置
        const aiConfig = getCurrentAIConfig();
        setCurrentAIProvider(aiConfig.provider);
    }, []);
    
    // 点击外部关闭聊天窗口
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (visible && !event.target.closest('.chatbot-window') && !event.target.closest('.chatbot-float-container')) {
                setVisible(false);
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible]);
    
    // 处理AI提供商变更
    const handleAIProviderChange = (newProvider) => {
        setCurrentAIProvider(newProvider);
        
        // 显示切换成功消息
        const providerNames = {
            'deepseek': 'DeepSeek AI',
            'qwen': '通义千问',
            'zhipu': '智谱GLM',
            'baichuan': '百川AI'
        };
        
        const switchMessage = {
            id: Date.now(),
            type: 'system',
            content: `已切换到 ${providerNames[newProvider]} 服务。新的AI服务将在下次对话时生效。`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, switchMessage]);
        
        message.success(`已切换到 ${providerNames[newProvider]} 服务`);
    };
    
    return (
        <>
            {/* 悬浮按钮 */}
            <div className={`chatbot-float-container ${visible ? 'chatbot-hidden' : ''}`}>
                <Tooltip title="AI客服助手" placement="left">
                    <div 
                        className="chatbot-float-btn"
                        onClick={handleFloatBtnClick}
                    >
                        <MessageOutlined className="chatbot-float-icon" />
                        {unreadCount > 0 && (
                            <span className="chatbot-badge">{unreadCount}</span>
                        )}
                    </div>
                </Tooltip>
            </div>
            
            {/* 聊天窗口 */}
            {visible && (
                <div className={`chatbot-window ${minimized ? 'chatbot-minimized' : ''}`}>
                    {/* 聊天窗口标题栏 */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <Avatar 
                                icon={getStatusIcon()} 
                                size="small"
                                style={{ backgroundColor: getStatusColor() }}
                            />
                            <span className="chatbot-title">
                                {serviceMode === 'human' ? '人工客服' : 
                                 serviceMode === 'transferring' ? '转接中' : 'AI客服助手'}
                            </span>
                            <span className="chatbot-status">
                                {serviceStatus || '在线'}
                            </span>
                        </div>
                        <div className="chatbot-header-actions">
                            {serviceMode === 'ai' && (
                                <Button 
                                    type="text" 
                                    size="small"
                                    icon={<SettingOutlined />}
                                    onClick={() => setShowAISettings(true)}
                                    className="chatbot-action-btn"
                                    title="AI设置"
                                />
                            )}
                            {serviceMode === 'human' && (
                                <Button 
                                    type="text" 
                                    size="small"
                                    icon={<DisconnectOutlined />}
                                    onClick={endServiceSession}
                                    className="chatbot-action-btn"
                                    title="结束会话"
                                />
                            )}
                            <Button 
                                type="text" 
                                size="small"
                                icon={<MinusOutlined />}
                                onClick={() => setMinimized(!minimized)}
                                className="chatbot-action-btn"
                            />
                            <Button 
                                type="text" 
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => setVisible(false)}
                                className="chatbot-action-btn"
                            />
                        </div>
                    </div>
                    
                    {!minimized && (
                        <>
                            {/* 消息区域 */}
                            <div className="chatbot-messages">
                                {messages.map(message => (
                                    <div 
                                        key={message.id} 
                                        className={`chatbot-message ${
                                            message.type === 'user' ? 'chatbot-message-user' : 
                                            message.type === 'service' ? 'chatbot-message-service' :
                                            message.type === 'system' ? 'chatbot-message-system' :
                                            'chatbot-message-bot'
                                        }`}
                                    >
                                        <div className="chatbot-message-avatar">
                                            <Avatar 
                                                icon={
                                                    message.type === 'user' ? <UserOutlined /> : 
                                                    message.type === 'service' ? <CustomerServiceOutlined /> :
                                                    message.type === 'system' ? <ExclamationCircleOutlined /> :
                                                    <RobotOutlined />
                                                }
                                                size="small"
                                                style={{ 
                                                    backgroundColor: 
                                                        message.type === 'user' ? '#1890ff' : 
                                                        message.type === 'service' ? '#722ed1' :
                                                        message.type === 'system' ? '#faad14' :
                                                        '#52c41a'
                                                }}
                                            />
                                        </div>
                                        <div className="chatbot-message-content">
                                            <div className={`chatbot-message-bubble ${message.isError ? 'chatbot-message-error' : ''}`}>
                                                <div className="chatbot-message-text">
                                                    {message.content}
                                                </div>
                                                
                                                {/* 登录提醒按钮 */}
                                                {message.isLoginReminder && message.showLoginButton && (
                                                    <div className="chatbot-login-action">
                                                        <Button 
                                                            type="primary" 
                                                            icon={<LoginOutlined />}
                                                            onClick={() => handleLoginClick(message)}
                                                            className="chatbot-login-btn"
                                                            style={{ marginTop: 12 }}
                                                        >
                                                            立即登录
                                                        </Button>
                                                        <div style={{ 
                                                            fontSize: '12px', 
                                                            color: '#8c8c8c', 
                                                            marginTop: 8,
                                                            textAlign: 'center'
                                                        }}>
                                                            {message.isAgentLogin ? 
                                                                '代理商登录后可处理订单信息' : 
                                                                '登录后可享受更完整的服务体验'
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* 订单跳转按钮 */}
                                                {message.messageType === 2 && message.redirectUrl && (
                                                    <div className="chatbot-order-action">
                                                        <Button 
                                                            type="primary" 
                                                            size="small"
                                                            onClick={() => {
                                                                navigate(message.redirectUrl);
                                                                setVisible(false);
                                                            }}
                                                            style={{ marginTop: 8 }}
                                                        >
                                                            立即查看订单
                                                        </Button>
                                                    </div>
                                                )}
                                                
                                                {/* 订单查询结果按钮 */}
                                                {message.messageType === 2 && message.orderData && (
                                                    <div className="chatbot-order-actions">
                                                        {(() => {
                                                            try {
                                                                const orderInfo = JSON.parse(message.orderData);
                                                                if (orderInfo.orderActions && Array.isArray(orderInfo.orderActions)) {
                                                                    return orderInfo.orderActions.map((order, index) => (
                                                                        <div key={order.bookingId || index} className="chatbot-order-item">
                                                                            <div className="chatbot-order-info">
                                                                                <span className="chatbot-order-number">
                                                                                    {order.orderNumber}
                                                                                </span>
                                                                                <span className="chatbot-order-contact">
                                                                                    {order.contactPerson}
                                                                                </span>
                                                                            </div>
                                                                            <Button 
                                                                                type="primary" 
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    if (order.editUrl) {
                                                                                        // 从完整URL中提取路径部分
                                                                                        const url = new URL(order.editUrl);
                                                                                        const path = url.pathname;
                                                                                        navigate(path);
                                                                                        setVisible(false);
                                                                                    }
                                                                                }}
                                                                                style={{ marginLeft: 8 }}
                                                                            >
                                                                                查看订单
                                                                            </Button>
                                                                        </div>
                                                                    ));
                                                                }
                                                            } catch (e) {
                                                                console.error('解析订单数据失败:', e);
                                                                return null;
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="chatbot-message-time">
                                                {formatTime(message.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {loading && (
                                    <div className="chatbot-message chatbot-message-bot">
                                        <div className="chatbot-message-avatar">
                                            <Avatar 
                                                icon={serviceMode === 'human' ? <CustomerServiceOutlined /> : <RobotOutlined />}
                                                size="small"
                                                style={{ backgroundColor: serviceMode === 'human' ? '#722ed1' : '#52c41a' }}
                                            />
                                        </div>
                                        <div className="chatbot-message-content">
                                            <div className="chatbot-message-bubble">
                                                <div className="chatbot-typing-indicator">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                                <span style={{ marginLeft: 8, fontSize: '12px', color: '#a0aec0' }}>
                                                    {serviceMode === 'human' ? '客服正在输入...' : 'AI正在思考中...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            {/* 输入区域 */}
                            <div className="chatbot-input">
                                <div className="chatbot-input-wrapper">
                                    <Input.TextArea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={
                                            serviceMode === 'human' ? "请输入您要发送给客服的消息..." :
                                            serviceMode === 'transferring' ? "正在转接客服，请稍候..." :
                                            userType === 2 ? "请输入消息或发送订单信息..." : "请输入您的问题..."
                                        }
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        disabled={loading || serviceMode === 'transferring'}
                                        className="chatbot-textarea"
                                    />
                                    <Button 
                                        type="primary" 
                                        icon={<SendOutlined />}
                                        onClick={sendMessage}
                                        loading={loading}
                                        disabled={!inputValue.trim() || serviceMode === 'transferring'}
                                        className="chatbot-send-btn"
                                    />
                                </div>
                                
                                {/* 快速操作 */}
                                <div className="chatbot-quick-actions">
                                    <Button 
                                        type="text" 
                                        size="small"
                                        onClick={clearMessages}
                                    >
                                        清空记录
                                    </Button>
                                    
                                    {serviceMode === 'ai' && (
                                        <Button 
                                            type="text" 
                                            size="small"
                                            icon={<CustomerServiceOutlined />}
                                            onClick={transferToHuman}
                                            className="chatbot-transfer-btn"
                                        >
                                            转人工
                                        </Button>
                                    )}
                                    
                                    {userType === 2 && (
                                        <span className="chatbot-user-type">中介模式</span>
                                    )}
                                </div>
                            </div>

                            {/* 服务评价模态框 */}
                            <Modal
                                title="服务评价"
                                open={showRating}
                                onCancel={() => setShowRating(false)}
                                footer={null}
                                width={400}
                            >
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <p>请为本次服务打分：</p>
                                    <Rate 
                                        allowHalf 
                                        defaultValue={5}
                                        onChange={(rating) => rateService(rating)}
                                        style={{ fontSize: '24px', color: '#faad14' }}
                                    />
                                    <p style={{ marginTop: 16, color: '#666' }}>
                                        感谢您的使用！
                                    </p>
                                </div>
                            </Modal>
                        </>
                    )}
                </div>
            )}
            
            {/* AI设置模态框 */}
            <AISettings
                visible={showAISettings}
                onClose={() => setShowAISettings(false)}
                onProviderChange={handleAIProviderChange}
            />
        </>
    );
};

export default ChatBot; 