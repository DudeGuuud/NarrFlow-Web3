const { getActiveVotingSession } = require('../services/databaseService.cjs');

// 简化的投票会话获取函数
async function getOrCreateActiveVotingSession() {
    // 检查是否有活跃的投票会话
    const activeSession = await getActiveVotingSession();
    if (activeSession) {
        return activeSession;
    }

    // 如果没有活跃的会话，创建一个模拟会话
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 300); // 5分钟

    return {
        id: 'mock-session',
        type: 'title',
        status: 'active',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

async function votingSessionsApi(req, res, path) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (path === 'voting-sessions' || path === 'voting-sessions/') {
            // GET /api/v1/voting-sessions
            const session = await getActiveVotingSession();
            res.json(session ? [session] : []);
        } else if (path === 'voting-sessions/current') {
            // GET /api/v1/voting-sessions/current
            const session = await getOrCreateActiveVotingSession();
            res.json(session);
        } else {
            res.status(404).json({ error: 'Voting sessions endpoint not found' });
        }
    } catch (error) {
        console.error('Error in voting sessions API:', error);
        res.status(500).json({
            error: 'Failed to process voting sessions request',
            details: error.message || 'Unknown error'
        });
    }
}

module.exports = { votingSessionsApi };
