const http = require('http');

// 测试数据
const loginData = {
    username: 'agent001',
    password: 'password123'
};

// 测试配置
const testConfigs = [
    {
        name: "本地后端 - 无Origin头",
        hostname: 'localhost',
        port: 8080,
        path: '/agent/login',
        origin: null
    },
    {
        name: "本地后端 - 模拟前端Origin",
        hostname: 'localhost',
        port: 8080,
        path: '/agent/login',
        origin: 'http://localhost:3000'
    },
    {
        name: "本地后端 - 模拟生产环境Origin",
        hostname: 'localhost',
        port: 8080,
        path: '/agent/login',
        origin: 'https://www.htas.com.au'
    }
];

// 执行HTTP请求
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
            }
        };

        // 添加Origin头（如果指定）
        if (config.origin) {
            options.headers['Origin'] = config.origin;
        }

        console.log(`\n=== 测试: ${config.name} ===`);
        console.log(`请求URL: http://${config.hostname}:${config.port}${config.path}`);
        console.log(`Origin头: ${config.origin || '未设置'}`);

        const req = http.request(options, (res) => {
            let responseData = '';
            
            console.log(`响应状态: ${res.statusCode} ${res.statusMessage}`);
            
            // 显示CORS相关的响应头
            console.log('CORS相关响应头:');
            Object.keys(res.headers).forEach(key => {
                if (key.toLowerCase().includes('access-control') || 
                    key.toLowerCase() === 'content-type') {
                    console.log(`  ${key}: ${res.headers[key]}`);
                }
            });

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log(`响应内容: ${responseData.substring(0, 200)}${responseData.length > 200 ? '...' : ''}`);
                
                resolve({
                    config: config.name,
                    status: res.statusCode,
                    headers: res.headers,
                    data: responseData,
                    success: res.statusCode < 400
                });
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

        req.setTimeout(5000);
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
                'Origin': config.origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        };

        console.log(`\n=== OPTIONS预检测试: ${config.name} ===`);
        
        const req = http.request(options, (res) => {
            console.log(`OPTIONS响应状态: ${res.statusCode}`);
            console.log('CORS预检响应头:');
            Object.keys(res.headers).forEach(key => {
                if (key.toLowerCase().includes('access-control')) {
                    console.log(`  ${key}: ${res.headers[key]}`);
                }
            });
            
            resolve({
                config: config.name,
                status: res.statusCode,
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

        req.setTimeout(3000);
        req.end();
    });
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始本地CORS白名单测试...\n');
    console.log('测试时间:', new Date().toLocaleString());
    console.log('确保后端服务器运行在 localhost:8080\n');
    
    const results = [];
    
    // 测试OPTIONS预检请求
    console.log('🔍 第一阶段: 测试OPTIONS预检请求');
    for (const config of testConfigs) {
        if (config.origin) { // 只有设置了Origin的才需要测试OPTIONS
            try {
                const result = await testOptionsRequest(config);
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                results.push(error);
            }
        }
    }
    
    // 测试实际的POST请求
    console.log('\n🔍 第二阶段: 测试实际登录请求');
    for (const config of testConfigs) {
        try {
            const result = await makeRequest(config, loginData);
            results.push(result);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            results.push(error);
        }
    }
    
    // 汇总结果
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(50));
    
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
    
    // 分析CORS配置
    console.log('\n🔍 CORS配置分析:');
    const corsAnalysis = results.filter(r => r.headers);
    if (corsAnalysis.length > 0) {
        corsAnalysis.forEach(result => {
            const corsHeaders = Object.keys(result.headers)
                .filter(key => key.toLowerCase().includes('access-control'));
            if (corsHeaders.length > 0) {
                console.log(`\n${result.config}:`);
                corsHeaders.forEach(key => {
                    console.log(`  ${key}: ${result.headers[key]}`);
                });
            }
        });
    }
    
    console.log('\n✨ 测试完成!');
    
    // 给出建议
    if (failed.length === 0) {
        console.log('\n🎉 所有测试都通过了！CORS白名单配置正常工作。');
    } else {
        console.log('\n⚠️  有测试失败，请检查：');
        console.log('1. 后端服务器是否在 localhost:8080 运行');
        console.log('2. Spring Boot的CORS配置是否正确');
        console.log('3. 代理商登录接口是否存在');
    }
}

// 运行测试
runTests().catch(console.error); 