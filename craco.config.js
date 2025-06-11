const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 添加 Node.js 核心模块的 polyfill
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        util: require.resolve('util/'),
        zlib: require.resolve('browserify-zlib'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url/'),
        crypto: require.resolve('crypto-browserify'),
        assert: require.resolve('assert/'),
        process: require.resolve('process/browser.js'),
        buffer: require.resolve('buffer/')
      };

      // 添加 process 和 Buffer polyfill
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer']
        })
      );

      return webpackConfig;
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  }
}; 