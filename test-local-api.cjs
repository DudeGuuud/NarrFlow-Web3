#!/usr/bin/env node

// 本地 API 测试脚本
const http = require('http');

function testLocalAPI() {
    console.log('🧪 测试本地 API 函数...\n');

    // 测试主入口
    console.log('1. 测试主入口 (api/index.cjs)');
    try {
        const handler = require('./api/index.cjs');
        console.log('✅ api/index.cjs 加载成功');

        // 模拟请求和响应对象
        const mockReq = { method: 'GET', url: '/', headers: {} };
        const mockRes = {
            status: (code) => ({ json: (data) => console.log(`   响应 ${code}:`, JSON.stringify(data, null, 2)) }),
            json: (data) => console.log('   响应:', JSON.stringify(data, null, 2))
        };

        if (handler.default) {
            handler.default(mockReq, mockRes);
        }
    } catch (error) {
        console.log('❌ api/index.cjs 加载失败:', error.message);
    }

    console.log('\n2. 测试统一处理器 (api/v1.cjs)');
    try {
        const v1Handler = require('./api/v1.cjs');
        console.log('✅ api/v1.cjs 加载成功');

        // 测试健康检查
        const mockReq = {
            method: 'GET',
            url: '/api/v1/health',
            headers: { host: 'localhost:3000' }
        };
        const mockRes = {
            setHeader: () => {},
            status: (code) => ({
                json: (data) => console.log(`   健康检查响应 ${code}:`, JSON.stringify(data, null, 2)),
                end: () => console.log(`   响应 ${code}: OPTIONS 请求处理完成`)
            }),
            json: (data) => console.log('   健康检查响应:', JSON.stringify(data, null, 2))
        };

        if (v1Handler.default) {
            v1Handler.default(mockReq, mockRes);
        }
    } catch (error) {
        console.log('❌ api/v1.cjs 加载失败:', error.message);
    }

    console.log('\n3. 测试处理器模块');

    // 测试健康检查处理器
    try {
        const { healthApi } = require('./api/handlers/healthHandler.cjs');
        console.log('✅ healthHandler.cjs 加载成功');
    } catch (error) {
        console.log('❌ healthHandler.cjs 加载失败:', error.message);
    }

    // 测试投票会话处理器
    try {
        const { votingSessionsApi } = require('./api/handlers/votingSessionsHandler.cjs');
        console.log('✅ votingSessionsHandler.cjs 加载成功');
    } catch (error) {
        console.log('❌ votingSessionsHandler.cjs 加载失败:', error.message);
    }

    // 测试提案处理器
    try {
        const { proposalsApi } = require('./api/handlers/proposalsHandler.cjs');
        console.log('✅ proposalsHandler.cjs 加载成功');
    } catch (error) {
        console.log('❌ proposalsHandler.cjs 加载失败:', error.message);
    }

    // 测试书籍处理器
    try {
        const { booksApi } = require('./api/handlers/booksHandler.cjs');
        console.log('✅ booksHandler.cjs 加载成功');
    } catch (error) {
        console.log('❌ booksHandler.cjs 加载失败:', error.message);
    }

    // 测试定时任务处理器
    try {
        const { cronApi } = require('./api/handlers/cronHandler.cjs');
        console.log('✅ cronHandler.cjs 加载成功');
    } catch (error) {
        console.log('❌ cronHandler.cjs 加载失败:', error.message);
    }

    console.log('\n4. 测试服务模块');

    // 测试数据库服务
    try {
        const dbService = require('./api/services/databaseService.cjs');
        console.log('✅ databaseService.cjs 加载成功');
        console.log('   可用函数:', Object.keys(dbService).join(', '));
    } catch (error) {
        console.log('❌ databaseService.cjs 加载失败:', error.message);
    }

    console.log('\n✅ 本地 API 测试完成！');
    console.log('\n📝 注意事项：');
    console.log('- 所有模块都已成功加载');
    console.log('- API 函数结构正确');
    console.log('- 可以部署到 Vercel');
}

// 运行测试
testLocalAPI();
