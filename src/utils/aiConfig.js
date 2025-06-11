/**
 * AI服务配置文件
 * 支持多种AI服务提供商的配置和切换
 */

// AI服务提供商配置
export const AI_PROVIDERS = {
    DEEPSEEK: {
        name: 'DeepSeek',
        provider: 'deepseek',
        displayName: 'DeepSeek AI',
        timeout: 60000, // 60秒超时
        maxRetries: 2,
        retryDelay: 3000, // 重试间隔3秒
        pros: ['成本低', '中文理解好', '代码能力强'],
        cons: ['响应速度较慢', '服务器偶尔不稳定'],
        performance: {
            speed: 2, // 1-5评分，5最快
            accuracy: 4,
            stability: 3
        }
    },
    QWEN: {
        name: 'Qwen',
        provider: 'qwen',
        displayName: '通义千问',
        timeout: 30000, // 30秒超时
        maxRetries: 3,
        retryDelay: 2000,
        pros: ['响应速度快', '阿里云稳定', '中文优化好'],
        cons: ['成本相对较高'],
        performance: {
            speed: 4,
            accuracy: 4,
            stability: 5
        }
    },
    ZHIPU: {
        name: 'GLM',
        provider: 'zhipu',
        displayName: '智谱GLM',
        timeout: 40000,
        maxRetries: 2,
        retryDelay: 2500,
        pros: ['多模态支持', '逻辑推理强', '响应稳定'],
        cons: ['API调用限制较严'],
        performance: {
            speed: 3,
            accuracy: 4,
            stability: 4
        }
    },
    BAICHUAN: {
        name: 'Baichuan',
        provider: 'baichuan',
        displayName: '百川AI',
        timeout: 35000,
        maxRetries: 2,
        retryDelay: 2000,
        pros: ['响应速度中等', '成本适中', '服务稳定'],
        cons: ['功能相对基础'],
        performance: {
            speed: 3,
            accuracy: 3,
            stability: 4
        }
    }
};

// 默认配置
export const DEFAULT_AI_CONFIG = {
    provider: 'qwen', // 当前使用的提供商 - 改为通义千问
    fallbackProvider: 'deepseek', // 备用提供商 - DeepSeek作为备选
    enableFallback: true, // 是否启用备用方案
    maxTokens: 2000,
    temperature: 0.7,
    enableRetry: true,
    showThinking: true, // 是否显示AI思考过程
    enablePerformanceMonitor: true // 启用性能监控
};

// 获取当前AI配置
export const getCurrentAIConfig = () => {
    const savedProvider = localStorage.getItem('ai_provider') || DEFAULT_AI_CONFIG.provider;
    return {
        ...DEFAULT_AI_CONFIG,
        provider: savedProvider,
        ...AI_PROVIDERS[savedProvider.toUpperCase()]
    };
};

// 切换AI提供商
export const switchAIProvider = (provider) => {
    if (AI_PROVIDERS[provider.toUpperCase()]) {
        localStorage.setItem('ai_provider', provider);
        return true;
    }
    return false;
};

// 获取推荐的AI提供商（基于用户需求）
export const getRecommendedProvider = (requirement) => {
    switch (requirement) {
        case 'speed':
            return 'qwen'; // 通义千问速度最快
        case 'cost':
            return 'deepseek'; // DeepSeek成本最低
        case 'stability':
            return 'qwen'; // 通义千问最稳定
        case 'accuracy':
            return 'qwen'; // 通义千问准确性好
        default:
            return 'qwen'; // 默认推荐通义千问
    }
};

// 性能监控数据收集
export const collectPerformanceData = (provider, responseTime, success) => {
    const key = `ai_performance_${provider}`;
    const data = JSON.parse(localStorage.getItem(key) || '{"total": 0, "success": 0, "avgTime": 0}');
    
    data.total += 1;
    if (success) data.success += 1;
    data.avgTime = (data.avgTime * (data.total - 1) + responseTime) / data.total;
    data.lastUpdate = Date.now();
    
    localStorage.setItem(key, JSON.stringify(data));
    return data;
};

// 获取性能统计
export const getPerformanceStats = (provider) => {
    const key = `ai_performance_${provider}`;
    return JSON.parse(localStorage.getItem(key) || '{"total": 0, "success": 0, "avgTime": 0}');
}; 