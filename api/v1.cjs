const { logger } = require('./index.cjs');

// 导入处理器
const { healthApi } = require('./handlers/healthHandler.cjs');
const { votingSessionsApi } = require('./handlers/votingSessionsHandler.cjs');
const { proposalsApi } = require('./handlers/proposalsHandler.cjs');
const { booksApi } = require('./handlers/booksHandler.cjs');
const { cronApi } = require('./handlers/cronHandler.cjs');

// 统一的 API 路由处理器
module.exports.default = async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  if (!url) {
    return res.status(400).json({ error: 'Invalid request URL' });
  }

  try {
    // 解析路径
    const urlPath = new URL(url, `http://${req.headers.host}`).pathname;
    const pathSegments = urlPath.split('/').filter(Boolean);

    // 移除 'api' 和 'v1' 前缀
    const apiPath = pathSegments.slice(2).join('/');

    logger('debug', `API request: ${req.method} ${apiPath}`);

    // 路由分发
    if (apiPath === 'health' || apiPath === '' || apiPath === 'info') {
      return await healthApi(req, res);
    }

    if (apiPath.startsWith('voting-sessions')) {
      return await votingSessionsApi(req, res, apiPath);
    }

    if (apiPath.startsWith('proposals')) {
      return await proposalsApi(req, res, apiPath);
    }

    if (apiPath.startsWith('books')) {
      return await booksApi(req, res, apiPath);
    }

    if (apiPath.startsWith('cron') || apiPath.startsWith('trigger')) {
      return await cronApi(req, res, apiPath);
    }

    // 404 - 路由未找到
    return res.status(404).json({
      error: 'API endpoint not found',
      path: apiPath,
      availableEndpoints: [
        'health',
        'voting-sessions',
        'voting-sessions/current',
        'proposals',
        'proposals/vote',
        'proposals/vote/check/:voter',
        'proposals/stats/:author',
        'books',
        'books/current',
        'books/:index',
        'cron/check-voting-sessions',
        'cron/cleanup-old-sessions',
        'trigger/check-voting'
      ]
    });

  } catch (error) {
    logger('error', 'API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    });
  }
};
