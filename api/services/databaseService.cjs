const { supabase, logger } = require('../index.cjs');

// 投票会话相关操作
async function getActiveVotingSession() {
    const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        throw error;
    }
    return data;
}

async function createVotingSession(type, expiresAt) {
    const { data, error } = await supabase
        .from('voting_sessions')
        .insert({
            type,
            status: 'active',
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
}

async function updateVotingSessionStatus(sessionId, status, notes) {
    const { error } = await supabase
        .from('voting_sessions')
        .update({
            status,
            notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    if (error) {
        throw error;
    }
}

// 提案相关操作
async function getProposalsByType(type) {
    const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('type', type)
        .order('votes', { ascending: false });

    if (error) {
        throw error;
    }
    return data;
}

async function getProposalById(id) {
    const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw error;
    }
    return data;
}

async function createProposal(content, author, type) {
    logger('info', `Creating new proposal: type=${type}, author=${author}, content=${content.substring(0, 30)}...`);

    const normalizedAuthor = author.toLowerCase();

    const { data, error } = await supabase
        .from('proposals')
        .insert({
            content,
            author: normalizedAuthor,
            type,
            votes: 0,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        logger('error', 'Error creating proposal:', error);
        throw error;
    }

    logger('debug', `Proposal created successfully with ID: ${data.id}`);

    try {
        await updateProposalStats(normalizedAuthor, 'submitted');
        logger('debug', `Updated proposal stats for author: ${normalizedAuthor}`);
    } catch (statsError) {
        logger('error', 'Error updating proposal stats:', statsError);
    }

    return data;
}

async function updateProposalVotes(id, votes) {
    const { error } = await supabase
        .from('proposals')
        .update({ votes })
        .eq('id', id);

    if (error) {
        throw error;
    }
}

// 投票相关操作
async function getVoteByVoter(voter) {
    logger('debug', `Getting vote for voter: ${voter}`);

    const normalizedVoter = voter.toLowerCase();

    const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter', normalizedVoter);

    if (error) {
        logger('error', 'Error getting vote by voter:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        logger('debug', `No vote found for voter: ${normalizedVoter}`);
        return null;
    }

    logger('debug', `Found vote for voter ${normalizedVoter}:`, data[0]);
    return data[0];
}

async function createVote(proposalId, voter) {
    logger('info', `Creating new vote: proposalId=${proposalId}, voter=${voter}`);

    const normalizedVoter = voter.toLowerCase();

    const { data, error } = await supabase
        .from('votes')
        .insert({
            proposal_id: proposalId,
            voter: normalizedVoter,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        logger('error', 'Error creating vote:', error);
        throw error;
    }

    logger('debug', `Vote created successfully with ID: ${data.id}`);

    try {
        const proposal = await getProposalById(proposalId);
        if (proposal) {
            logger('debug', `Updating vote count for proposal: ${proposalId}`);
            await updateProposalVotes(proposalId, proposal.votes + 1);
            await updateProposalStats(proposal.author, 'voted');
            logger('debug', `Updated proposal stats for author: ${proposal.author}`);
        }
    } catch (statsError) {
        logger('error', 'Error updating proposal stats after vote:', statsError);
    }

    return data;
}

// 清理提案和投票
async function clearProposalsAndVotes() {
    logger('info', 'Clearing all votes and proposals from database');

    try {
        const { error: votesError } = await supabase
            .from('votes')
            .delete()
            .not('id', 'is', null);

        if (votesError) {
            logger('error', 'Error deleting votes:', votesError);
            throw votesError;
        }
        logger('debug', 'All votes deleted successfully');

        const { error: proposalsError } = await supabase
            .from('proposals')
            .delete()
            .not('id', 'is', null);

        if (proposalsError) {
            logger('error', 'Error deleting proposals:', proposalsError);
            throw proposalsError;
        }
        logger('debug', 'All proposals deleted successfully');

    } catch (error) {
        logger('error', 'Error in clearProposalsAndVotes:', error);
        throw error;
    }
}

// 提案统计相关操作
async function getProposalStats(author) {
    const { data, error } = await supabase
        .from('proposal_stats')
        .select('*')
        .eq('author', author)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null;
        }
        throw error;
    }
    return data;
}

async function updateProposalStats(author, action, tokenAmount) {
    let stats = await getProposalStats(author);

    if (!stats) {
        const { data, error } = await supabase
            .from('proposal_stats')
            .insert({
                author,
                proposals_submitted: 0,
                proposals_won: 0,
                votes_received: 0,
                tokens_earned: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }
        stats = data;
    }

    const updates = {
        updated_at: new Date().toISOString()
    };

    switch (action) {
        case 'submitted':
            updates.proposals_submitted = (stats.proposals_submitted || 0) + 1;
            break;
        case 'voted':
            updates.votes_received = (stats.votes_received || 0) + 1;
            break;
        case 'won':
            updates.proposals_won = (stats.proposals_won || 0) + 1;
            break;
        case 'rewarded':
            if (tokenAmount) {
                updates.tokens_earned = (stats.tokens_earned || 0) + tokenAmount;
            }
            break;
    }

    const { error } = await supabase
        .from('proposal_stats')
        .update(updates)
        .eq('author', author);

    if (error) {
        throw error;
    }
}

module.exports = {
    getActiveVotingSession,
    createVotingSession,
    updateVotingSessionStatus,
    getProposalsByType,
    getProposalById,
    createProposal,
    updateProposalVotes,
    getVoteByVoter,
    createVote,
    clearProposalsAndVotes,
    getProposalStats,
    updateProposalStats
};
