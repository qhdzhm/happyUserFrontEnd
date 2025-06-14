import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import CachedImage from '../../components/CachedImage/CachedImage';
import CacheManager from '../../components/CacheManager/CacheManager';
import { useImagePreload } from '../../hooks/useImageCache';
import { getAllDayTours, getAllGroupTours } from '../../utils/api';
import './TestCache.css';

const TestCache = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testUrls] = useState([
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/149c2355-ad43-4bce-808a-01b78b5e2cfe.jpg',
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/de43d750-d6ae-41a4-8124-adee979379ca.jpg',
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/ca67710b-96fe-4d54-94b6-b020ca63f487.jpg',
    'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/cf1c8436-d9ce-49d3-a935-7e14e5f5a478.jpg',
  ]);

  // 预加载测试
  const { isPreloading, preloadedCount, totalCount, startPreload } = useImagePreload(testUrls, {
    autoStart: false
  });

  // 添加CDN测试状态
  const [cdnTestResults, setCdnTestResults] = useState([]);
  const [testingCdn, setTestingCdn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取少量测试数据
        const [dayToursRes, groupToursRes] = await Promise.allSettled([
          getAllDayTours({ pageSize: 3 }),
          getAllGroupTours({ pageSize: 3 })
        ]);

        const allTours = [];
        
        if (dayToursRes.status === 'fulfilled' && dayToursRes.value?.data?.records) {
          allTours.push(...dayToursRes.value.data.records);
        }
        
        if (groupToursRes.status === 'fulfilled' && groupToursRes.value?.data?.records) {
          allTours.push(...groupToursRes.value.data.records);
        }

        setTours(allTours);
      } catch (error) {
        console.error('获取测试数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartPreload = () => {
    // 调用从Hook获取的startPreload函数
    startPreload();
  };

  // CDN连通性测试
  const testCdnConnectivity = async () => {
    setTestingCdn(true);
    const testUrls = [
      'http://img.htas.com.au/images/2025/06/13/cf1c8436-d9ce-49d3-a935-7e14e5f5a478.jpg',
      'https://img.htas.com.au/images/2025/06/13/cf1c8436-d9ce-49d3-a935-7e14e5f5a478.jpg',
      'https://hmlead22.oss-cn-beijing.aliyuncs.com/images/2025/06/13/cf1c8436-d9ce-49d3-a935-7e14e5f5a478.jpg'
    ];
    
    const results = [];
    
    for (const url of testUrls) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, { method: 'HEAD' });
        const endTime = Date.now();
        
        results.push({
          url,
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          responseTime: endTime - startTime,
          error: null
        });
      } catch (error) {
        results.push({
          url,
          status: 'error',
          statusCode: null,
          responseTime: null,
          error: error.message
        });
      }
    }
    
    setCdnTestResults(results);
    setTestingCdn(false);
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
          <p className="mt-2">加载测试数据中...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h1 className="mb-4">🧪 图片缓存测试页面</h1>
        </Col>
      </Row>

      {/* 缓存管理器 */}
      <Row className="mb-4">
        <Col>
          <CacheManager />
        </Col>
      </Row>

      {/* 测试图片 */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3>📸 测试图片</h3>
              <p className="mb-0">这些图片会自动转换为CDN地址并缓存</p>
            </Card.Header>
            <Card.Body>
              <Row>
                {testUrls.map((url, index) => (
                  <Col md={3} key={index} className="mb-3">
                    <div className="test-image-container">
                      <CachedImage
                        src={url}
                        alt={`测试图片 ${index + 1}`}
                        className="test-image"
                        showLoading={true}
                      />
                      <div className="test-image-info">
                        <small className="text-muted">
                          测试图片 {index + 1}
                        </small>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              
              <div className="preload-section mt-3">
                <Button 
                  variant="primary" 
                  onClick={handleStartPreload}
                  disabled={isPreloading}
                >
                  {isPreloading ? `预加载中... (${preloadedCount}/${totalCount})` : '🚀 开始预加载测试'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 实际数据测试 */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3>🏞️ 实际旅游数据测试</h3>
              <p className="mb-0">数据库中的真实图片，测试自动CDN转换</p>
            </Card.Header>
            <Card.Body>
              <Row>
                {tours.slice(0, 6).map((tour, index) => (
                  <Col md={4} key={tour.id || index} className="mb-3">
                    <div className="tour-test-card">
                      <div className="tour-image-container">
                        <CachedImage
                          src={tour.coverImage || tour.imageUrl || tour.image}
                          alt={tour.name || tour.title}
                          className="tour-test-image"
                          showLoading={true}
                        />
                      </div>
                      <div className="tour-info">
                        <h6>{tour.name || tour.title}</h6>
                        <small className="text-muted">
                          原始URL: {(tour.coverImage || tour.imageUrl || tour.image || '').substring(0, 50)}...
                        </small>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 测试说明 */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>📋 测试说明</h3>
            </Card.Header>
            <Card.Body>
              <div className="testing-instructions">
                <h5>🔍 如何测试缓存功能：</h5>
                <ol>
                  <li><strong>首次加载：</strong> 刷新页面，观察图片加载过程（会显示加载动画）</li>
                  <li><strong>缓存测试：</strong> 再次刷新页面，缓存的图片应该瞬间显示</li>
                  <li><strong>CDN转换：</strong> 打开浏览器开发者工具，查看Network面板，确认图片请求使用了CDN域名</li>
                  <li><strong>缓存管理：</strong> 使用上方的缓存管理器查看缓存状态</li>
                  <li><strong>清理测试：</strong> 点击"清理所有缓存"，然后刷新页面测试重新缓存</li>
                </ol>

                <h5 className="mt-4">🌐 CDN域名测试：</h5>
                <ul>
                  <li>旧OSS URL会自动转换为: <code>https://img.htas.com.au/...</code></li>
                  <li>新上传的图片直接使用CDN域名（需要后端重新部署）</li>
                  <li>图片缓存在IndexedDB中，7天自动过期</li>
                </ul>

                <h5 className="mt-4">⚡ 性能提升：</h5>
                <ul>
                  <li><strong>首次访问：</strong> CDN加速 + 自动缓存</li>
                  <li><strong>重复访问：</strong> 本地缓存，几乎瞬开</li>
                  <li><strong>内存缓存：</strong> 当前页面访问过的图片立即显示</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CDN连通性测试区域 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">CDN连通性测试</h2>
        <button
          onClick={testCdnConnectivity}
          disabled={testingCdn}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {testingCdn ? '测试中...' : '测试CDN连通性'}
        </button>
        
        {cdnTestResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">测试结果：</h3>
            {cdnTestResults.map((result, index) => (
              <div key={index} className="mb-2 p-3 border rounded">
                <div className="text-sm font-mono break-all mb-1">{result.url}</div>
                <div className={`text-sm ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  状态: {result.status} 
                  {result.statusCode && ` (${result.statusCode})`}
                  {result.responseTime && ` - 响应时间: ${result.responseTime}ms`}
                  {result.error && ` - 错误: ${result.error}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default TestCache; 