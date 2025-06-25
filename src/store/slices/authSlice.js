import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { login, register, getUserProfile, updateUserProfile, getAgentDiscountRate } from '../../utils/api';
import { STORAGE_KEYS } from '../../utils/constants';
import { verifyTokenValidity } from '../../utils/auth';

// 异步action：登录
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // 检查是否为微信登录
      const isWechatLogin = credentials.code && !credentials.username;
      
      // 检查是否为代理商登录
      const isAgentLogin = credentials.userType === 'agent';
      
      // 微信登录处理
      if (isWechatLogin) {
        const { wechatLogin } = require('../../services/wechatService');
        
        // 执行微信登录请求
        const response = await wechatLogin(credentials.code);
        
        // 检查是否获得有效响应
        if (!response || response.code !== 1) {
          const errorMsg = response?.msg || '微信登录失败，请稍后再试';
          console.error(`微信登录失败: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // 检查是否有token
        if (!response.data || !response.data.token) {
          console.error('微信登录失败: 未获取到有效登录信息');
          throw new Error('微信登录失败: 未获取到有效登录信息');
        }
        
        // 成功获取token
        const token = response.data.token;
        
        // 保存token到localStorage
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem('token', token);  // 同时用两个键保存，确保兼容性
        
        console.log(`微信登录成功: Token=${token.substring(0, 15)}...`);
        
        // 保存用户类型
        localStorage.setItem('userType', 'regular');
        if (response.data.username) {
          localStorage.setItem('username', response.data.username);
        }
        
        // 构建用户数据对象
        const userData = {
          token,
          id: response.data.id,
          username: response.data.username,
          name: response.data.name || response.data.wxNickname || '微信用户',
          userType: 'regular',
          role: 'user'
        };
        
        return {
          isAuthenticated: true,
          ...userData
        };
      }
      
      // 用户名密码登录处理 (原有代码保持不变)
      // 准备登录数据
      const loginData = {
        username: credentials.username,
        password: credentials.password
      };
      
      // 确定登录路径
      const loginPath = isAgentLogin ? '/api/agent/login' : '/api/user/login';
      
      // 执行登录请求
      console.log(`发起登录请求: 用户类型=${isAgentLogin ? 'agent' : 'regular'}, 用户名=${credentials.username}`);
      console.log(`登录请求路径: ${loginPath}`);
      console.log(`登录请求数据:`, loginData);
      
      const response = await login(loginData, loginPath);
      console.log(`登录响应收到:`, response);
      
      // 检查是否获得有效响应
      if (!response || response.code !== 1) {
        const errorMsg = response?.msg || '登录失败，请检查用户名和密码';
        console.error(`登录失败: ${errorMsg}`);
        
        // 为用户提供更详细的错误信息
        let userFriendlyMsg = errorMsg;
        if (errorMsg.includes('账号或密码错误') || errorMsg.includes('密码错误') || errorMsg.includes('登录失败')) {
          if (isAgentLogin) {
            userFriendlyMsg = '代理商账号或密码错误，请重新输入';
          } else {
            userFriendlyMsg = '用户名或密码错误，请重新输入';
          }
        } else if (errorMsg.includes('用户不存在') || errorMsg.includes('账号不存在')) {
          userFriendlyMsg = isAgentLogin ? 
            '代理商账号不存在，请检查输入或联系管理员' : 
            '用户名不存在，请检查输入或注册新账号';
        } else if (errorMsg.includes('账号已禁用') || errorMsg.includes('已冻结')) {
          userFriendlyMsg = '您的账号已被禁用，请联系客服处理';
        } else if (errorMsg.includes('服务器') || errorMsg.includes('超时') || errorMsg.includes('网络')) {
          userFriendlyMsg = '服务器连接异常，请稍后再试';
        }
        
        throw new Error(userFriendlyMsg);
      }
      
      // 检查是否有token
      if (!response.data || !response.data.token) {
        // 如果没有token但有其他成功指标
        const isSuccess = response && (
          response.code === 1 || 
          response.status === 'success' || 
          (response.data && response.data.id)
        );
        
        if (isSuccess) {
          // 创建伪token并保存到localStorage
          const pseudoToken = `dev_token_${Date.now()}`;
          localStorage.setItem(STORAGE_KEYS.TOKEN, pseudoToken);
          localStorage.setItem('userType', credentials.userType);
          localStorage.setItem('username', credentials.username);
          
          // 返回成功对象
          return {
            isAuthenticated: true,
            token: pseudoToken,
            user: {
              id: response.data?.id || 1001,
              username: credentials.username,
              name: response.data?.name || credentials.username,
              email: response.data?.email || `${credentials.username}@example.com`,
              userType: credentials.userType,
              role: isAgentLogin ? 'agent' : 'user'
            }
          };
        }
        
        console.error('登录失败: 无效的凭据');
        throw new Error('登录失败: 服务器未返回有效的登录信息');
      }
      
      // 成功获取token，处理不同格式的响应
      const token = response.data.token;
      
      // 保存token到localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem('token', token);  // 同时用两个键保存，确保兼容性
      
      console.log(`登录成功: 用户类型=${isAgentLogin ? 'agent' : 'regular'}, 用户名=${credentials.username}, Token=${token.substring(0, 15)}...`);
      
      // 确定实际用户类型（支持操作员）
      let actualUserType = response.data.userType || (isAgentLogin ? 'agent' : 'regular');
      
      // 保存用户类型
      localStorage.setItem('userType', actualUserType);
      localStorage.setItem('username', credentials.username);
      
      // 保存折扣率(如果存在)
      if (response.data.discountRate !== undefined && response.data.discountRate !== null) {
        localStorage.setItem('discountRate', response.data.discountRate.toString());
      }
      
      // 保存权限信息
      if (response.data.canSeeDiscount !== undefined && response.data.canSeeDiscount !== null) {
        localStorage.setItem('canSeeDiscount', response.data.canSeeDiscount.toString());
      }
      
      if (response.data.canSeeCredit !== undefined && response.data.canSeeCredit !== null) {
        localStorage.setItem('canSeeCredit', response.data.canSeeCredit.toString());
      }
      
      // 如果是代理商或操作员，从响应或token中提取代理商ID
      let agentId = null;
      if (response.data.agentId) {
        agentId = response.data.agentId;
      } else if (response.data.id && (actualUserType === 'agent' || actualUserType === 'agent_operator')) {
        agentId = response.data.id;
      } else {
        // 尝试从JWT中解析
        try {
          // 简单解析JWT的payload部分（不验证签名）
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          if (decoded.agentId) {
            agentId = decoded.agentId;
          } else if (decoded.id && (actualUserType === 'agent' || actualUserType === 'agent_operator')) {
            agentId = decoded.id;
          }
        } catch (e) {
          // JWT解析失败，忽略错误
        }
      }
      
      if (agentId && agentId !== null) {
        localStorage.setItem('agentId', agentId.toString());
      }
      
      // 保存操作员ID（如果是操作员）
      if (response.data.operatorId && response.data.operatorId !== null) {
        localStorage.setItem('operatorId', response.data.operatorId.toString());
      }
      
      // 构建用户数据对象
      const userData = {
        token,
        id: response.data.id,
        username: credentials.username,
        name: response.data.name || response.data.companyName || credentials.username,
        email: response.data.email || `${credentials.username}@example.com`,
        userType: actualUserType,
        role: actualUserType === 'agent_operator' ? 'agent_operator' : (isAgentLogin ? 'agent' : 'user'),
        agentId: response.data.agentId || null,
        operatorId: response.data.operatorId || null,
        discountRate: response.data.discountRate || null,
        canSeeDiscount: response.data.canSeeDiscount || false,
        canSeeCredit: response.data.canSeeCredit || false
      };
      
      return {
        isAuthenticated: true,
        ...userData
      };
    } catch (error) {
      // 记录完整的错误信息到控制台
      console.error('登录过程中出错:', error);
      
      // 返回更友好的错误信息给用户
      return rejectWithValue(error.message || '登录失败，请检查您的凭据');
    }
  }
);

// 异步action：注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // 调用注册API
      const { register } = require('../../services/userService');
      
      // 确保提供必要的默认值
      const registerData = {
        ...userData,
        // 如果注册表单没有提供这些字段，则使用默认值
        name: userData.name || userData.username, // 默认使用用户名作为姓名
        email: userData.email || null,
        phone: userData.phone || null
      };
      
      const response = await register(registerData);
      
      // 检查响应
      if (!response || response.code !== 1) {
        const errorMsg = response?.msg || '注册失败，请稍后再试';
        throw new Error(errorMsg);
      }
      
      // 检查token
      if (!response.data || !response.data.token) {
        throw new Error('注册成功但未能获取登录凭证，请尝试登录');
      }
      
      // 保存token到localStorage
      const token = response.data.token;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem('token', token);  // 同时用两个键保存，确保兼容性
      
      // 保存用户类型为普通用户
      localStorage.setItem('userType', 'regular');
      
      // 保存用户名
      if (response.data.username) {
        localStorage.setItem('username', response.data.username);
      }
      
      // 构建返回的用户数据
      const userResponse = {
        token,
        id: response.data.id,
        username: response.data.username,
        name: response.data.name || response.data.username,
        userType: 'regular',
        role: 'customer'
      };
      
      return {
        isAuthenticated: true,
        ...userResponse
      };
    } catch (error) {
      // 记录完整的错误信息到控制台
      console.error('注册过程中出错:', error);
      
      // 返回更友好的错误信息给用户
      return rejectWithValue(error.message || '注册失败，请检查您的输入');
    }
  }
);

// 异步action：获取用户信息
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserProfile();
      return {
        ...response,
        role: response.user_type || 'regular' // 确保角色信息
      };
    } catch (error) {
      return rejectWithValue(error.message || '获取用户信息失败');
    }
  }
);

// 异步action：更新用户信息
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await updateUserProfile(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '更新用户信息失败');
    }
  }
);

// 登出用户 - 修改为async thunk确保正确清理cookie
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('开始执行登出流程...');
      
      // 调用API logout清理所有数据
      const { logout: apiLogout } = require('../../utils/api');
      await apiLogout();
      
      console.log('登出流程完成');
      return true;
    } catch (error) {
      console.warn('API logout调用失败，但继续清理本地数据:', error);
      
      // 即使API调用失败，也执行基本的清理
      const keysToRemove = [
        'token', 'authentication', 'userToken', 'jwt',
        'userType', 'username', 'user', 'userId',
        'agentId', 'operatorId', 'discountRate',
        'canSeeDiscount', 'canSeeCredit'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return true; // 即使失败也返回成功，确保状态被清理
    }
  }
);

// 异步action：验证token有效性
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      // 导入认证工具函数
      const { shouldUseCookieAuth, isAuthenticated, getUserInfoFromCookie, syncUserInfoToLocalStorage } = require('../../utils/auth');
      
      const useCookieAuth = shouldUseCookieAuth();
      console.log('validateToken: Cookie认证模式:', useCookieAuth);
      
      if (useCookieAuth) {
        // Cookie认证模式：检查是否有用户信息Cookie
        const authenticated = isAuthenticated();
        
        if (authenticated) {
          // 同步用户信息到localStorage
          syncUserInfoToLocalStorage();
          
          // 从localStorage获取同步后的用户信息
          const username = localStorage.getItem('username');
          const userType = localStorage.getItem('userType');
          const agentId = localStorage.getItem('agentId');
          const operatorId = localStorage.getItem('operatorId');
          const discountRate = localStorage.getItem('discountRate');
          
          const userData = {
            isAuthenticated: true,
            username: username,
            userType: userType || 'regular',
            role: userType || 'regular',
            agentId: agentId ? parseInt(agentId, 10) : null,
            operatorId: operatorId ? parseInt(operatorId, 10) : null,
            discountRate: discountRate ? parseFloat(discountRate) : null
          };
          
          console.log('validateToken (Cookie模式) 恢复的用户数据:', userData);
          return userData;
        } else {
          console.log('validateToken (Cookie模式): 未检测到有效认证');
          return false;
        }
      } else {
        // localStorage Token模式
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('token');
        if (!token) {
          console.log('validateToken (Token模式): 未找到token');
          
          // 检查是否有残留的用户信息，如果有就清理
          const hasUserInfo = localStorage.getItem('username') || 
                             localStorage.getItem('userType') || 
                             localStorage.getItem('user') ||
                             localStorage.getItem('agentId') ||
                             localStorage.getItem('operatorId');
                             
          if (hasUserInfo) {
            console.log('发现残留的用户信息，清理所有数据');
            // 清除所有认证相关数据
            const keysToRemove = [
              'user', 'userType', 'username', 'agentId', 'operatorId', 
              'discountRate', 'canSeeDiscount', 'canSeeCredit'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // 清除所有聊天记录
            try {
              const chatKeysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('chatbot_messages_')) {
                  chatKeysToRemove.push(key);
                }
              }
              
              chatKeysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`已清除聊天记录: ${key}`);
              });
              
              console.log(`无token时总共清除了 ${chatKeysToRemove.length} 个聊天记录`);
            } catch (error) {
              console.error('清除聊天记录失败:', error);
            }
          }
          
          return false;
        }

        const { verifyTokenValidity } = require('../../utils/auth');
        const isValid = await verifyTokenValidity();
        
        if (!isValid) {
          console.log('validateToken (Token模式): token验证失败，清除认证信息');
          // 清除localStorage中的认证信息
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          localStorage.removeItem('username');
          localStorage.removeItem('agentId');
          localStorage.removeItem('operatorId');
          localStorage.removeItem('discountRate');
          localStorage.removeItem('canSeeDiscount');
          localStorage.removeItem('canSeeCredit');
          
          // 清除所有聊天记录
          try {
            const chatKeysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('chatbot_messages_')) {
                chatKeysToRemove.push(key);
              }
            }
            
            chatKeysToRemove.forEach(key => {
              localStorage.removeItem(key);
              console.log(`已清除聊天记录: ${key}`);
            });
            
            console.log(`token验证失败时总共清除了 ${chatKeysToRemove.length} 个聊天记录`);
          } catch (error) {
            console.error('清除聊天记录失败:', error);
          }
          
          return false;
        }

        // 如果token有效，从localStorage恢复用户信息
        const username = localStorage.getItem('username');
        const userType = localStorage.getItem('userType');
        const agentId = localStorage.getItem('agentId');
        const operatorId = localStorage.getItem('operatorId');
        const discountRate = localStorage.getItem('discountRate');
        
        // 尝试从token中解析更多信息
        let tokenData = {};
        try {
          const payload = token.split('.')[1];
          tokenData = JSON.parse(atob(payload));
          console.log('Token解析结果:', tokenData);
        } catch (e) {
          console.warn('Token解析失败，使用localStorage数据');
        }
        
        const userData = {
          isAuthenticated: true,
          token,
          username: username || tokenData.username,
          userType: userType || tokenData.userType || 'regular',
          role: userType || tokenData.userType || 'regular',
          agentId: agentId ? parseInt(agentId, 10) : (tokenData.agentId || null),
          operatorId: operatorId ? parseInt(operatorId, 10) : (tokenData.operatorId || null),
          discountRate: discountRate ? parseFloat(discountRate) : (tokenData.discountRate || null)
        };
        
        console.log('validateToken (Token模式) 恢复的用户数据:', userData);
        return userData;
      }
    } catch (error) {
      console.error('Token验证过程中出错:', error);
      return rejectWithValue('Token验证失败');
    }
  }
);

// 初始状态
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  userType: localStorage.getItem('userType') || null, // 添加userType作为顶级属性
  isAuthenticated: false, // 初始设为false，等待token验证
  loading: false,
  error: null,
  tokenValidated: false // 添加标记，表示是否已完成token验证
};

// 创建slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 设置认证状态
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.userType = action.payload.userType;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.error = null;
      state.tokenValidated = true;
    },
    // 登出（保持向后兼容，但建议使用logoutUser）
    logout: (state) => {
      // 建议：直接使用dispatch(logoutUser())而不是dispatch(logout())
      console.warn('建议使用logoutUser() async thunk而不是logout() action');
      
      // 立即清理Redux状态
      state.user = null;
      state.userType = null;
      state.isAuthenticated = false;
      state.error = null;
      state.tokenValidated = true;
      
      // 异步调用完整的logout函数来清理所有数据
      setTimeout(async () => {
        try {
          const { logout: apiLogout } = require('../../utils/api');
          await apiLogout();
          console.log('✓ 完整logout清理完成');
        } catch (error) {
          console.warn('API logout调用失败:', error);
          // 即使API调用失败，也执行基本的清理
          const keysToRemove = [
            'token', 'authentication', 'userToken', 'jwt',
            'userType', 'username', 'user', 'userId',
            'agentId', 'operatorId', 'discountRate',
            'canSeeDiscount', 'canSeeCredit'
          ];
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      }, 0);
      
      // 触发登出状态变化事件，通知其他组件
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('logoutStateChanged'));
        }
      }, 100);
    },
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    // 设置token验证状态
    setTokenValidated: (state) => {
      state.tokenValidated = true;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Token验证
      .addCase(validateToken.pending, (state) => {
        state.loading = true;
        state.tokenValidated = false;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false;
        state.tokenValidated = true;
        
        if (action.payload && action.payload.isAuthenticated) {
          state.user = action.payload;
          state.userType = action.payload.userType; // 设置userType到顶级
          state.isAuthenticated = true;
          console.log('Token验证成功，用户已认证');
        } else {
          state.user = null;
          state.userType = null;
          state.isAuthenticated = false;
          
          // Token验证失败时，清理localStorage中的用户信息
          localStorage.removeItem('user');
          localStorage.removeItem('username');
          localStorage.removeItem('userType');
          localStorage.removeItem('agentId');
          localStorage.removeItem('operatorId');
          localStorage.removeItem('discountRate');
          localStorage.removeItem('canSeeDiscount');
          localStorage.removeItem('canSeeCredit');
          localStorage.removeItem('token');
          localStorage.removeItem('authentication');
          
          console.log('Token验证失败或无效，用户已登出，localStorage已清理');
        }
      })
      .addCase(validateToken.rejected, (state, action) => {
        state.loading = false;
        state.tokenValidated = true;
        state.user = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        
        // Token验证失败时，清理localStorage中的用户信息
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        localStorage.removeItem('agentId');
        localStorage.removeItem('operatorId');
        localStorage.removeItem('discountRate');
        localStorage.removeItem('canSeeDiscount');
        localStorage.removeItem('canSeeCredit');
        localStorage.removeItem('token');
        localStorage.removeItem('authentication');
        
        console.log('Token验证失败:', action.payload, 'localStorage已清理');
        
        // 检查是否是受保护的页面才需要跳转
        const currentPath = window.location.pathname;
        const isProtectedPage = currentPath.startsWith('/booking') || 
                               currentPath.startsWith('/checkout') || 
                               currentPath.startsWith('/profile') || 
                               currentPath.startsWith('/orders') || 
                               currentPath.startsWith('/payment') || 
                               currentPath.startsWith('/agent-center') || 
                               currentPath.startsWith('/credit-transactions');
        
        // 只有在访问受保护页面且不是登录页面时才进行重定向
        if (isProtectedPage && currentPath !== '/login' && currentPath !== '/agent-login' && currentPath !== '/register') {
          // 导入toast进行通知
          setTimeout(() => {
            try {
              const { toast } = require('react-toastify');
              const userType = action.payload?.userType || 'regular';
              const isAgent = userType === 'agent' || userType === 'agent_operator';
              
              toast.warning(
                '您需要登录才能访问此页面',
                {
                  position: "top-center",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                }
              );
              
              // 2秒后跳转到登录页面
              setTimeout(() => {
                const currentPath = window.location.pathname;
                const isOnAgentPage = currentPath.startsWith('/agent') || 
                                      currentPath.includes('agent') ||
                                      window.location.href.includes('agent');
                                      
                if (isAgent || isOnAgentPage) {
                  console.log('🔄 需要Agent登录，重定向到agent登录页面');
                  window.location.href = '/agent-login';
                } else {
                  console.log('🔄 需要用户登录，重定向到登录页面');
                  window.location.href = '/login';
                }
              }, 2000);
            } catch (error) {
              // 如果toast加载失败，直接跳转
              console.warn('无法显示提示消息，直接跳转');
              const userType = localStorage.getItem('userType');
              const isAgent = userType === 'agent' || userType === 'agent_operator';
              const currentPath = window.location.pathname;
              const isOnAgentPage = currentPath.startsWith('/agent') || 
                                    currentPath.includes('agent') ||
                                    window.location.href.includes('agent');
                                    
              if (isAgent || isOnAgentPage) {
                console.log('🔄 需要Agent登录，直接重定向到agent登录页面');
                window.location.href = '/agent-login';
              } else {
                console.log('🔄 需要用户登录，直接重定向到登录页面');
                window.location.href = '/login';
              }
            }
          }, 1000);
        } else {
          console.log('ℹ️ 当前页面不需要登录验证，跳过自动重定向');
        }
      })
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.userType = action.payload.userType; // 设置userType到顶级
        state.isAuthenticated = true;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
        
        // 同步用户信息到localStorage（用于ChatBot等组件）
        try {
          const { syncUserInfoToLocalStorage } = require('../../utils/auth');
          syncUserInfoToLocalStorage();
        } catch (error) {
          console.warn('同步用户信息失败:', error);
        }
        
        // 保存用户类型
        if (action.payload.role || action.payload.userType) {
          const userRole = action.payload.role || action.payload.userType;
          localStorage.setItem('userType', userRole);
          
          // 保存权限信息
          if (action.payload.canSeeDiscount !== undefined) {
            localStorage.setItem('canSeeDiscount', action.payload.canSeeDiscount.toString());
          }
          
          if (action.payload.canSeeCredit !== undefined) {
            localStorage.setItem('canSeeCredit', action.payload.canSeeCredit.toString());
          }
          
          // 如果是代理商或操作员，保存相关信息
          if (userRole === 'agent' || userRole === 'agent_operator') {
            // 从不同可能的属性中获取折扣率
            let discountRate = null;
            
            // 直接检查响应对象中的折扣率字段
            if (action.payload.discountRate !== undefined && action.payload.discountRate !== null) {
              discountRate = action.payload.discountRate;
              console.log('从action.payload.discountRate中提取到代理商折扣率:', discountRate);
            } 
            // 检查嵌套对象中的折扣率
            else if (action.payload.user && action.payload.user.discountRate !== undefined) {
              discountRate = action.payload.user.discountRate;
              console.log('从action.payload.user.discountRate中提取到代理商折扣率:', discountRate);
            }
            
            // 如果找到折扣率，保存到localStorage
            if (discountRate !== null && discountRate !== undefined) {
              console.log('保存代理商折扣率到localStorage:', discountRate);
              localStorage.setItem('discountRate', discountRate.toString());
            } else {
              console.log('未找到代理商折扣率，将使用默认值，完整对象:', JSON.stringify(action.payload));
            }
            
            // 保存代理商ID
            if (action.payload.agentId) {
              localStorage.setItem('agentId', action.payload.agentId.toString());
            }
            
            // 保存操作员ID（如果是操作员）
            if (action.payload.operatorId) {
              localStorage.setItem('operatorId', action.payload.operatorId.toString());
            }
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        
        // 确保错误信息正确显示
        if (action.payload) {
          // 如果是通过rejectWithValue传递的错误
          state.error = action.payload;
        } else if (action.error && action.error.message) {
          // 如果是普通错误对象
          state.error = action.error.message;
        } else {
          // 默认错误信息
          state.error = '登录失败，请稍后再试';
        }
        
        console.error('登录失败:', state.error);
      })
      // 注册
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取用户信息
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新用户信息
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 登出用户
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = null;
        state.tokenValidated = true;
        
        // 完全清理localStorage中的用户信息
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        localStorage.removeItem('agentId');
        localStorage.removeItem('operatorId');
        localStorage.removeItem('discountRate');
        localStorage.removeItem('canSeeDiscount');
        localStorage.removeItem('canSeeCredit');
        localStorage.removeItem('token');
        localStorage.removeItem('authentication');
        
        console.log('用户已登出，localStorage已清理');
        
        // 触发登出状态变化事件，通知其他组件
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('logoutStateChanged'));
          }
        }, 100);
      })
      .addCase(logoutUser.rejected, (state) => {
        // 即使失败也清理状态
        state.loading = false;
        state.user = null;
        state.userType = null;
        state.isAuthenticated = false;
        state.error = null;
        state.tokenValidated = true;
        
        // 即使登出失败，也要清理localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        localStorage.removeItem('agentId');
        localStorage.removeItem('operatorId');
        localStorage.removeItem('discountRate');
        localStorage.removeItem('canSeeDiscount');
        localStorage.removeItem('canSeeCredit');
        localStorage.removeItem('token');
        localStorage.removeItem('authentication');
        
        console.log('登出失败但已清理本地状态，localStorage已清理');
        
        // 触发登出状态变化事件，通知其他组件
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('logoutStateChanged'));
          }
        }, 100);
      });
  }
});

// 导出actions
export const { logout, clearError, setAuth, setTokenValidated } = authSlice.actions;

// 导出reducer
export default authSlice.reducer; 