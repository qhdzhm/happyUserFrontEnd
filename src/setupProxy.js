const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * 设置API代理
 * 将前端的/api请求转发到后端服务器
 * 
 * 在开发环境中，前端运行在localhost:3000
 * 后端运行在localhost:8080
 */
module.exports = function(app) {
  // 创建统一的代理配置
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8080', // 后端服务器地址
    changeOrigin: true,
    pathRewrite: {
      '^/api': '' // 移除API路径前缀
    },
    // 日志记录
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.path}`);
    }
  });

  // 拦截所有API请求并代理到后端
  app.use('/api', apiProxy);
}; 