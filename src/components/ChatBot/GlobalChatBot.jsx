import React, { useState, useEffect } from 'react';
import ChatBot from './ChatBot';

const GlobalChatBot = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [userType, setUserType] = useState(1); // 默认普通用户

    useEffect(() => {
        // 从localStorage或其他地方获取用户信息
        const getUserInfo = () => {
            try {
                // 尝试多种方式获取用户信息
                let user = null;
                let userId = null;
                
                // 方式1: 从localStorage获取user对象
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    user = JSON.parse(userStr);
                    userId = user.id || user.userId || user.customerId;
                }
                
                // 方式2: 如果没有user对象，尝试获取单独存储的用户ID
                if (!userId) {
                    userId = localStorage.getItem('userId') || 
                             localStorage.getItem('customerId') ||
                             localStorage.getItem('agentId');
                }
                
                // 方式3: 如果还没有用户ID，生成临时ID
                if (!userId) {
                    userId = 'temp_' + Date.now();
                }
                
                if (user || userId) {
                    setUserInfo({ ...user, id: userId });
                    
                    // 判断用户类型 - 区分三种类型
                    const userTypeFromStorage = localStorage.getItem('userType');
                    
                
                    
                    let computedUserType = 1; // 默认普通用户
                    
                    // 判断用户类型优先级：userType > role > token
                    if (userTypeFromStorage === 'agent' || user?.role === 'agent') {
                        // 中介主号（代理商）
                        computedUserType = 3;
                        console.log('判断为中介主号（代理商）');
                    } else if (userTypeFromStorage === 'agent_operator' || 
                               userTypeFromStorage === 'operator' ||
                               user?.role === 'agent_operator' ||
                               user?.role === 'operator' ||
                               user?.userType === 'agent_operator' ||
                               user?.type === 'agent_operator') {
                        // 操作员
                        computedUserType = 2;
                
                    } else {
                        // 普通用户
                        computedUserType = 1;
                        console.log('判断为普通用户');
                    }
                    
                    setUserType(computedUserType);
                } else {
                    // 未登录用户，使用默认设置，但仍可以使用AI聊天
                    console.log('未检测到用户登录信息，使用访客模式');
                    setUserType(1);
                    setUserInfo({ id: 'guest_' + Date.now() });
                }
            } catch (error) {
                console.error('解析用户信息失败:', error);
                setUserType(1);
                setUserInfo({ id: 'error_' + Date.now() });
            }
        };

        getUserInfo();

        // 监听用户登录状态变化
        const handleStorageChange = (e) => {
            if (e.key === 'user' || e.key === 'agent-token' || e.key === 'token' || e.key === 'userType') {
                console.log('检测到用户状态变化，重新获取用户信息');
                getUserInfo();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return (
        <ChatBot 
            userType={userType}
            userId={userInfo?.id || null}
        />
    );
};

export default GlobalChatBot; 