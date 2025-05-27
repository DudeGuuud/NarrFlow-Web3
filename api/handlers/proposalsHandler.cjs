const {
    getProposalsByType,
    createProposal,
    getProposalById,
    getVoteByVoter,
    createVote,
    updateProposalVotes,
    getProposalStats
} = require('../services/databaseService.cjs');

async function proposalsApi(req, res, path) {
    try {
        if (path === 'proposals' || path === 'proposals/') {
            // GET/POST /api/v1/proposals
            if (req.method === 'GET') {
                const type = req.query.type;
                if (type && type !== 'title' && type !== 'paragraph') {
                    return res.status(400).json({ error: 'Invalid proposal type' });
                }

                if (type) {
                    const proposals = await getProposalsByType(type);
                    res.json(proposals);
                } else {
                    const titleProposals = await getProposalsByType('title');
                    const paragraphProposals = await getProposalsByType('paragraph');
                    res.json([...titleProposals, ...paragraphProposals]);
                }
            } else if (req.method === 'POST') {
                const { content, author, type } = req.body;
                if (!content || !author || !type) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                if (type !== 'title' && type !== 'paragraph') {
                    return res.status(400).json({ error: 'Invalid proposal type' });
                }

                const proposal = await createProposal(content, author, type);
                res.status(201).json(proposal);
            } else {
                res.status(405).json({ error: 'Method not allowed' });
            }
        } else if (path === 'proposals/vote') {
            // POST /api/v1/proposals/vote
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            const { proposal_id, voter } = req.body;
            if (!proposal_id || !voter) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // 检查提案是否存在
            const proposal = await getProposalById(proposal_id);
            if (!proposal) {
                return res.status(404).json({ error: 'Proposal not found' });
            }

            // 检查用户是否已经投票
            const existingVote = await getVoteByVoter(voter);
            if (existingVote) {
                return res.status(400).json({ error: 'User has already voted' });
            }

            // 创建投票
            await createVote(proposal_id, voter);

            // 更新提案票数
            const newVotes = proposal.votes + 1;
            await updateProposalVotes(proposal_id, newVotes);

            res.json({ success: true, votes: newVotes });
        } else if (path.startsWith('proposals/vote/check/')) {
            // GET /api/v1/proposals/vote/check/:voter
            if (req.method !== 'GET') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            const voter = path.split('/').pop();
            if (!voter) {
                return res.status(400).json({ error: 'Missing voter parameter' });
            }

            const normalizedVoter = voter.toLowerCase();
            const vote = await getVoteByVoter(normalizedVoter);
            if (vote) {
                res.json({ proposal_id: vote.proposal_id });
            } else {
                res.json({});
            }
        } else if (path.startsWith('proposals/stats/')) {
            // GET /api/v1/proposals/stats/:author
            if (req.method !== 'GET') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            const author = path.split('/').pop();
            if (!author) {
                return res.status(400).json({ error: 'Missing author parameter' });
            }

            const stats = await getProposalStats(author);
            if (!stats) {
                return res.status(404).json({ error: 'No statistics found for this author' });
            }

            res.json(stats);
        } else {
            res.status(404).json({ error: 'Proposals endpoint not found' });
        }
    } catch (error) {
        console.error('Error in proposals API:', error);
        res.status(500).json({
            error: 'Failed to process proposals request',
            details: error.message || 'Unknown error'
        });
    }
}

module.exports = { proposalsApi };
