const https = require('https');
const http = require('http');

// 测试配置
const testConfigs = [
    {
        name: "直接访问后端 (localhost:8080)",
        protocol: http,
        hostname: 'localhost',
        port: 8080,
        path: '/agent/login',
        origin: null // 不设置Origin头
    },
    {
        name: "通过nginx代理 (www.htas.com.au)",
        protocol: https,
        hostname: 'www.htas.com.au',
        port: 443,
        path: '/agent/login',
        origin: 'https://www.htas.com.au'
    },
    {
        name: "通过nginx代理 (带api前缀)",
        protocol: https,
        hostname: 'www.htas.com.au',
        port: 443,
        path: '/api/agent/login',
        origin: 'https://www.htas.com.au'
    },
    {
        name: "本地开发环境模拟",
        protocol: http,
        hostname: 'localhost',
        port: 8080,
        path: '/agent/login',
        origin: 'http://localhost:3000'
    }
];

// 测试数据
const loginData = {
    username: 'agent001',
    password: 'password123'
};

// 执行HTTP请求的函数
function makeRequest(config, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: config.hostname,
            port: config.port,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            // 忽略SSL证书错误（仅用于测试）
            rejectUnauthorized: false
        };

        // 添加Origin头（如果指定）
        if (config.origin) {
            options.headers['Origin'] = config.origin;
        }

        console.log(`\n=== 测试: ${config.name} ===`);
        console.log(`请求URL: ${config.protocol === https ? 'https' : 'http'}://${config.hostname}:${config.port}${config.path}`);
        console.log(`Origin头: ${config.origin || '未设置'}`);
        console.log(`请求数据: ${postData}`);

        const req = config.protocol.request(options, (res) => {
            let responseData = '';
            
            console.log(`响应状态: ${res.statusCode} ${res.statusMessage}`);
            console.log('响应头:');
            Object.keys(res.headers).forEach(key => {
                if (key.toLowerCase().includes('cors') || 
                    key.toLowerCase().includes('access-control') ||
                    key.toLowerCase() === 'content-type') {
                    console.log(`  ${key}: ${res.headers[key]}`);
                }
            });

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log(`响应内容: ${responseData}`);
                
                const result = {
                    config: config.name,
                    status: res.statusCode,
                    headers: res.headers,
                    data: responseData,
                    success: res.statusCode < 400
                };
                
                resolve(result);
            });
        });

        req.on('error', (error) => {
            console.log(`请求错误: ${error.message}`);
            reject({
                config: config.name,
                error: error.message,
                success: false
            });
        });

        req.on('timeout', () => {
            console.log('请求超时');
            req.destroy();
            reject({
                config: config.name,
                error: '请求超时',
                success: false
            });
        });

        // 设置超时
        req.setTimeout(10000);
        
        // 发送数据
        req.write(postData);
        req.end();
    });
}

// 测试OPTIONS预检请求
function testOptionsRequest(config) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: config.hostname,
            port: config.port,
            path: config.path,
            method: 'OPTIONS',
            headers: {
                'Origin': config.origin || 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            },
            rejectUnauthorized: false
        };

        console.log(`\n=== OPTIONS预检测试: ${config.name} ===`);
        
        const req = config.protocol.request(options, (res) => {
            console.log(`OPTIONS响应状态: ${res.statusCode}`);
            console.log('CORS相关响应头:');
            Object.keys(res.headers).forEach(key => {
                if (key.toLowerCase().includes('access-control')) {
                    console.log(`  ${key}: ${res.headers[key]}`);
                }
            });
            
            resolve({
                config: config.name,
                status: res.statusCode,
                corsHeaders: Object.keys(res.headers)
                    .filter(key => key.toLowerCase().includes('access-control'))
                    .reduce((obj, key) => {
                        obj[key] = res.headers[key];
                        return obj;
                    }, {}),
                success: res.statusCode < 300
            });
        });

        req.on('error', (error) => {
            console.log(`OPTIONS请求错误: ${error.message}`);
            reject({
                config: config.name,
                error: error.message,
                success: false
            });
        });

        req.setTimeout(5000);
        req.end();
    });
}

// 主测试函数
async function runTests() {
    console.log('开始CORS白名单和登录功能测试...\n');
    console.log('测试时间:', new Date().toLocaleString());
    
    const results = [];
    
    // 首先测试OPTIONS预检请求
    console.log('\n🔍 第一阶段: 测试OPTIONS预检请求');
    for (const config of testConfigs) {
        if (config.origin) { // 只有设置了Origin的才需要测试OPTIONS
            try {
                const result = await testOptionsRequest(config);
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
            } catch (error) {
                results.push(error);
            }
        }
    }
    
    // 然后测试实际的POST请求
    console.log('\n🔍 第二阶段: 测试实际登录请求');
    for (const config of testConfigs) {
        try {
            const result = await makeRequest(config, loginData);
            results.push(result);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        } catch (error) {
            results.push(error);
        }
    }
    
    // 汇总结果
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功: ${successful.length} 个测试`);
    console.log(`❌ 失败: ${failed.length} 个测试`);
    
    if (successful.length > 0) {
        console.log('\n✅ 成功的测试:');
        successful.forEach(result => {
            console.log(`  - ${result.config}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ 失败的测试:');
        failed.forEach(result => {
            console.log(`  - ${result.config}: ${result.error || `状态码 ${result.status}`}`);
        });
    }
    
    // CORS配置分析
    console.log('\n🔍 CORS配置分析:');
    const corsResults = results.filter(r => r.corsHeaders || (r.headers && Object.keys(r.headers).some(k => k.toLowerCase().includes('access-control'))));
    if (corsResults.length > 0) {
        corsResults.forEach(result => {
            console.log(`\n${result.config}:`);
            const headers = result.corsHeaders || result.headers;
            Object.keys(headers).forEach(key => {
                if (key.toLowerCase().includes('access-control')) {
                    console.log(`  ${key}: ${headers[key]}`);
                }
            });
        });
    }
    
    console.log('\n测试完成!');
}

// 运行测试
runTests().catch(console.error); 