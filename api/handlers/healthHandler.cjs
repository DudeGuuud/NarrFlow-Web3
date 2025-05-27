const { PACKAGE_ID, STORYBOOK_ID, TREASURY_ID, VOTING_COUNTDOWN_SECONDS, VOTE_THRESHOLD, adminKeypair } = require('../index.cjs');

async function healthApi(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const networkType = process.env.SUI_NETWORK || 'testnet';

    res.json({
        status: 'ok',
        message: 'NarrFlow API is running',
        timestamp: new Date().toISOString(),
        config: {
            packageId: PACKAGE_ID,
            storyBookId: STORYBOOK_ID,
            treasuryId: TREASURY_ID,
            votingCountdown: VOTING_COUNTDOWN_SECONDS,
            voteThreshold: VOTE_THRESHOLD,
            adminAddress: adminKeypair.toSuiAddress(),
            network: networkType
        }
    });
}

module.exports = { healthApi };
