const { supabase, logger } = require('../index.cjs');

// 简化的投票检查函数
async function checkVotingSessions() {
    logger('info', 'Checking voting sessions (simplified version)');
    // 这里可以添加实际的投票检查逻辑
    return { success: true, message: 'Voting sessions checked' };
}

async function cronApi(req, res, path) {
    try {
        if (path === 'cron/check-voting-sessions') {
            // GET /api/v1/cron/check-voting-sessions
            if (req.method !== 'GET') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            logger('debug', 'Running scheduled check for expired voting sessions');
            await checkVotingSessions();
            res.json({ success: true, message: 'Voting sessions checked successfully' });

        } else if (path === 'cron/cleanup-old-sessions') {
            // GET /api/v1/cron/cleanup-old-sessions
            if (req.method !== 'GET') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            logger('info', 'Running scheduled cleanup of old voting sessions');

            const { data, error } = await supabase
                .from('voting_sessions')
                .select('id')
                .not('status', 'eq', 'active')
                .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) {
                logger('error', 'Error fetching old voting sessions:', error);
                return res.status(500).json({ error: 'Failed to fetch old voting sessions' });
            }

            if (data && data.length > 0) {
                logger('info', `Found ${data.length} old voting sessions to clean up`);

                const { error: deleteError } = await supabase
                    .from('voting_sessions')
                    .delete()
                    .in('id', data.map(session => session.id));

                if (deleteError) {
                    logger('error', 'Error deleting old voting sessions:', deleteError);
                    return res.status(500).json({ error: 'Failed to delete old voting sessions' });
                } else {
                    logger('info', `Successfully cleaned up ${data.length} old voting sessions`);
                    res.json({ success: true, cleaned: data.length });
                }
            } else {
                logger('debug', 'No old voting sessions to clean up');
                res.json({ success: true, cleaned: 0 });
            }

        } else if (path === 'trigger/check-voting') {
            // GET/POST /api/v1/trigger/check-voting
            if (req.method !== 'GET' && req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            // 简单的安全检查
            const authToken = req.headers.authorization || req.query.token;
            const expectedToken = process.env.CRON_AUTH_TOKEN;

            if (expectedToken && authToken !== `Bearer ${expectedToken}` && authToken !== expectedToken) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            logger('info', 'Manual trigger: Checking voting sessions');
            await checkVotingSessions();

            res.json({
                success: true,
                message: 'Voting sessions checked successfully',
                timestamp: new Date().toISOString()
            });

        } else {
            res.status(404).json({ error: 'Cron endpoint not found' });
        }
    } catch (error) {
        logger('error', 'Error in cron API:', error);
        res.status(500).json({
            error: 'Failed to process cron request',
            details: error.message || 'Unknown error'
        });
    }
}

module.exports = { cronApi };
