import React, { useState, useEffect } from 'react';
import { Modal, Card, Radio, Button, Row, Col, Progress, Typography, Alert, Space, Tag } from 'antd';
import { 
    ThunderboltOutlined, 
    DollarOutlined, 
    SafetyOutlined, 
    AimOutlined,
    SettingOutlined 
} from '@ant-design/icons';
import { AI_PROVIDERS, getCurrentAIConfig, switchAIProvider, getPerformanceStats } from '../../utils/aiConfig';

const { Title, Text, Paragraph } = Typography;

const AISettings = ({ visible, onClose, onProviderChange }) => {
    const [currentProvider, setCurrentProvider] = useState('deepseek');
    const [performanceData, setPerformanceData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            const config = getCurrentAIConfig();
            setCurrentProvider(config.provider);
            loadPerformanceData();
        }
    }, [visible]);

    const loadPerformanceData = () => {
        const data = {};
        Object.keys(AI_PROVIDERS).forEach(provider => {
            data[provider] = getPerformanceStats(provider.toLowerCase());
        });
        setPerformanceData(data);
    };

    const handleProviderChange = (provider) => {
        setCurrentProvider(provider);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const success = switchAIProvider(currentProvider);
            if (success) {
                onProviderChange?.(currentProvider);
                onClose();
            }
        } catch (error) {
            console.error('切换AI提供商失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPerformanceColor = (score) => {
        if (score >= 4) return '#52c41a';
        if (score >= 3) return '#faad14';
        return '#ff4d4f';
    };

    const renderProviderCard = (providerKey, config) => {
        const isSelected = currentProvider === config.provider;
        const stats = performanceData[providerKey] || { total: 0, success: 0, avgTime: 0 };
        const successRate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;

        return (
            <Card
                key={providerKey}
                hoverable
                className={`provider-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleProviderChange(config.provider)}
                style={{
                    border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    backgroundColor: isSelected ? '#f6ffed' : 'white'
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0, color: isSelected ? '#1890ff' : 'inherit' }}>
                        {config.displayName}
                        {isSelected && <Tag color="blue" style={{ marginLeft: 8 }}>当前选择</Tag>}
                    </Title>
                </div>

                {/* 性能指标 */}
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <ThunderboltOutlined style={{ fontSize: 20, color: getPerformanceColor(config.performance.speed) }} />
                            <div>速度</div>
                            <Progress 
                                type="circle" 
                                size={40} 
                                percent={config.performance.speed * 20} 
                                strokeColor={getPerformanceColor(config.performance.speed)}
                                format={() => config.performance.speed}
                            />
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <AimOutlined style={{ fontSize: 20, color: getPerformanceColor(config.performance.accuracy) }} />
                            <div>准确性</div>
                            <Progress 
                                type="circle" 
                                size={40} 
                                percent={config.performance.accuracy * 20} 
                                strokeColor={getPerformanceColor(config.performance.accuracy)}
                                format={() => config.performance.accuracy}
                            />
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <SafetyOutlined style={{ fontSize: 20, color: getPerformanceColor(config.performance.stability) }} />
                            <div>稳定性</div>
                            <Progress 
                                type="circle" 
                                size={40} 
                                percent={config.performance.stability * 20} 
                                strokeColor={getPerformanceColor(config.performance.stability)}
                                format={() => config.performance.stability}
                            />
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <DollarOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                            <div>成本</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                {config.provider === 'deepseek' ? '低' : 
                                 config.provider === 'qwen' ? '中' : '中等'}
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* 优缺点 */}
                <div style={{ marginBottom: 12 }}>
                    <Text strong>优点：</Text>
                    <div>
                        {config.pros.map((pro, index) => (
                            <Tag key={index} color="green" style={{ margin: '2px' }}>{pro}</Tag>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <Text strong>缺点：</Text>
                    <div>
                        {config.cons.map((con, index) => (
                            <Tag key={index} color="orange" style={{ margin: '2px' }}>{con}</Tag>
                        ))}
                    </div>
                </div>

                {/* 使用统计 */}
                {stats.total > 0 && (
                    <div style={{ fontSize: 12, color: '#666' }}>
                        <div>使用次数: {stats.total}</div>
                        <div>成功率: {successRate.toFixed(1)}%</div>
                        <div>平均响应时间: {(stats.avgTime / 1000).toFixed(1)}秒</div>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <Modal
            title={
                <div>
                    <SettingOutlined style={{ marginRight: 8 }} />
                    AI服务设置
                </div>
            }
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    取消
                </Button>,
                <Button 
                    key="save" 
                    type="primary" 
                    loading={loading}
                    onClick={handleSave}
                >
                    保存设置
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Alert
                    message="AI服务选择建议"
                    description={
                        <div>
                            <div>• <strong>追求速度</strong>：推荐通义千问，响应最快</div>
                            <div>• <strong>控制成本</strong>：推荐DeepSeek，价格最低</div>
                            <div>• <strong>稳定性优先</strong>：推荐通义千问，阿里云服务稳定</div>
                            <div>• <strong>综合考虑</strong>：推荐通义千问，性能均衡</div>
                        </div>
                    }
                    type="info"
                    showIcon
                />
            </div>

            <Title level={4}>选择AI服务提供商：</Title>
            
            <Row gutter={[16, 16]}>
                {Object.entries(AI_PROVIDERS).map(([key, config]) => (
                    <Col span={12} key={key}>
                        {renderProviderCard(key, config)}
                    </Col>
                ))}
            </Row>

            {currentProvider !== 'deepseek' && (
                <Alert
                    style={{ marginTop: 16 }}
                    message="注意"
                    description={`切换到${AI_PROVIDERS[currentProvider.toUpperCase()]?.displayName}需要后端支持相应的API配置。请确保后端已经配置了相应的API密钥。`}
                    type="warning"
                    showIcon
                />
            )}
        </Modal>
    );
};

export default AISettings; 