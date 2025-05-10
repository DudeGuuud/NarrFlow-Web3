import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Sui client
const networkType = process.env.VITE_SUI_NETWORK || 'testnet';
const suiClient = new SuiClient({
  url: `https://fullnode.${networkType}.sui.io/`
});

// Constants from environment
const PACKAGE_ID = process.env.VITE_PACKAGE_ID;
const STORYBOOK_ID = process.env.VITE_STORYBOOK_ID;
const TREASURY_ID = process.env.VITE_TREASURY_ID;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const VOTING_COUNTDOWN_SECONDS = parseInt(process.env.VOTING_COUNTDOWN_SECONDS || '300'); // Default 5 minutes
const VOTE_THRESHOLD = parseInt(process.env.VOTE_THRESHOLD || '2'); // Default 2 votes

// Create admin keypair
let adminKeypair;
try {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('Admin private key not found in environment variables');
  }

  // Convert Bech32 private key to keypair
  const privateKeyBytes = Buffer.from(ADMIN_PRIVATE_KEY, 'base64');
  adminKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

  console.log('Admin wallet initialized successfully');
  console.log('Admin address:', adminKeypair.toSuiAddress());
} catch (error) {
  console.error('Failed to initialize admin wallet:', error);
  process.exit(1);
}

// Function to check for expired voting sessions and process winners
async function checkVotingSessions() {
  console.log('Checking for expired voting sessions...');

  try {
    // Get current timestamp
    const now = new Date();

    // Get active voting sessions that have expired
    const { data: votingSessions, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (error) {
      throw error;
    }

    if (!votingSessions || votingSessions.length === 0) {
      console.log('No expired voting sessions found');
      return;
    }

    console.log(`Found ${votingSessions.length} expired voting sessions`);

    // Process each expired session
    for (const session of votingSessions) {
      await processVotingSession(session);
    }
  } catch (error) {
    console.error('Error checking voting sessions:', error);
  }
}

// Function to process a voting session and execute the winning proposal
async function processVotingSession(session) {
  console.log(`Processing voting session ${session.id} of type ${session.type}`);

  try {
    // Get all proposals for this session
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('type', session.type)
      .order('votes', { ascending: false });

    if (error) {
      throw error;
    }

    if (!proposals || proposals.length === 0) {
      console.log('No proposals found for this session');
      await updateSessionStatus(session.id, 'completed', 'No proposals found');
      return;
    }

    // Get the winning proposal (highest votes)
    const winningProposal = proposals[0];

    if (winningProposal.votes < VOTE_THRESHOLD) {
      console.log(`Winning proposal has only ${winningProposal.votes} votes, below threshold of ${VOTE_THRESHOLD}`);
      await updateSessionStatus(session.id, 'failed', 'Not enough votes');
      return;
    }

    console.log(`Winning proposal: ${winningProposal.id} by ${winningProposal.author} with ${winningProposal.votes} votes`);

    // Execute the appropriate transaction based on session type
    let txResult;
    if (session.type === 'title') {
      txResult = await executeStartNewBook(winningProposal);
    } else if (session.type === 'paragraph') {
      // Check if we need to archive the book
      const currentBook = await getCurrentBook();
      if (currentBook && currentBook.paragraphs && currentBook.paragraphs.length >= 9) {
        // This will be the 10th paragraph, so we should archive after adding
        txResult = await executeAddParagraphAndArchive(winningProposal);
      } else {
        txResult = await executeAddParagraph(winningProposal);
      }
    }

    if (txResult && txResult.digest) {
      console.log(`Transaction executed successfully: ${txResult.digest}`);
      await updateSessionStatus(session.id, 'completed', `Transaction: ${txResult.digest}`);

      // Clear all proposals and votes after successful execution
      await clearProposalsAndVotes();

      // Start a new voting session if needed
      if (session.type === 'paragraph' && txResult.archived) {
        await startNewVotingSession('title');
      } else {
        await startNewVotingSession(session.type === 'title' ? 'paragraph' : 'title');
      }
    } else {
      console.error('Transaction failed');
      await updateSessionStatus(session.id, 'failed', 'Transaction failed');
    }
  } catch (error) {
    console.error('Error processing voting session:', error);
    await updateSessionStatus(session.id, 'failed', error.message);
  }
}

// Update voting session status
async function updateSessionStatus(sessionId, status, notes = null) {
  try {
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

    console.log(`Updated session ${sessionId} status to ${status}`);
  } catch (error) {
    console.error('Error updating session status:', error);
  }
}

// Start a new voting session
async function startNewVotingSession(type) {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + VOTING_COUNTDOWN_SECONDS);

    const { data, error } = await supabase
      .from('voting_sessions')
      .insert({
        type,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      throw error;
    }

    console.log(`Started new ${type} voting session, expires at ${expiresAt.toISOString()}`);
    return data[0];
  } catch (error) {
    console.error('Error starting new voting session:', error);
    return null;
  }
}

// Clear all proposals and votes
async function clearProposalsAndVotes() {
  try {
    // Delete all votes first (due to foreign key constraints)
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .not('id', 'is', null);

    if (votesError) {
      throw votesError;
    }

    // Then delete all proposals
    const { error: proposalsError } = await supabase
      .from('proposals')
      .delete()
      .not('id', 'is', null);

    if (proposalsError) {
      throw proposalsError;
    }

    console.log('Cleared all proposals and votes');
  } catch (error) {
    console.error('Error clearing proposals and votes:', error);
  }
}

// Get current book from the blockchain
async function getCurrentBook() {
  try {
    console.log('Fetching current book from blockchain...');

    // Get the StoryBook object
    const storyBookObject = await suiClient.getObject({
      id: STORYBOOK_ID,
      options: {
        showContent: true,
        showDisplay: true,
      },
    });

    if (!storyBookObject || !storyBookObject.data || !storyBookObject.data.content) {
      throw new Error('StoryBook object not found or has no content');
    }

    const storyBook = storyBookObject.data.content;
    const fields = storyBook.fields;

    // Get the current book index
    const currentBookIndex = Number(fields.current_book_index);

    // Get all books
    const books = fields.books;

    if (!books || books.length === 0 || currentBookIndex >= books.length) {
      console.log('No books found or invalid current book index');
      return null;
    }

    // Get the current book
    const currentBook = books[currentBookIndex];

    // Format the book data
    return {
      index: currentBookIndex,
      title: currentBook.fields.title,
      author: currentBook.fields.author,
      status: Number(currentBook.fields.status),
      bookIndex: Number(currentBook.fields.index),
      paragraphs: currentBook.fields.paragraphs.map(p => ({
        content: p.fields.content,
        author: p.fields.author,
        votes: Number(p.fields.votes)
      }))
    };
  } catch (error) {
    console.error('Error getting current book:', error);
    return null;
  }
}

// Execute start_new_book transaction
async function executeStartNewBook(proposal) {
  try {
    console.log(`Executing start_new_book for proposal ${proposal.id}`);

    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_new_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(proposal.content),
        tx.pure.address(proposal.author),
        tx.object(TREASURY_ID),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: adminKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Error executing start_new_book:', error);
    throw error;
  }
}

// Execute add_paragraph transaction
async function executeAddParagraph(proposal) {
  try {
    console.log(`Executing add_paragraph for proposal ${proposal.id}`);

    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(proposal.content),
        tx.pure.address(proposal.author),
        tx.object(TREASURY_ID),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: adminKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Error executing add_paragraph:', error);
    throw error;
  }
}

// Execute add_paragraph and then archive_book
async function executeAddParagraphAndArchive(proposal) {
  try {
    console.log(`Executing add_paragraph and archive_book for proposal ${proposal.id}`);

    const tx = new TransactionBlock();

    // First add the paragraph
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(proposal.content),
        tx.pure.address(proposal.author),
        tx.object(TREASURY_ID),
      ],
    });

    // Then archive the book
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.object(TREASURY_ID),
      ],
    });

    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: adminKeypair,
      transactionBlock: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    return { ...result, archived: true };
  } catch (error) {
    console.error('Error executing add_paragraph and archive_book:', error);
    throw error;
  }
}

// Schedule the cron job to run every minute
cron.schedule('* * * * *', checkVotingSessions);

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Check if we need to initialize a voting session
  initializeVotingSessions();
});

// Initialize voting sessions if none exist
async function initializeVotingSessions() {
  try {
    // Check if there are any active voting sessions
    const { data: sessions, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    if (!sessions || sessions.length === 0) {
      console.log('No active voting sessions found, initializing...');

      // Check if there's a current book
      const currentBook = await getCurrentBook();

      if (!currentBook || currentBook.status === 1) {
        // No current book or book is archived, start a title voting session
        await startNewVotingSession('title');
      } else {
        // Book exists and is active, start a paragraph voting session
        await startNewVotingSession('paragraph');
      }
    } else {
      console.log(`Found ${sessions.length} active voting sessions`);
    }
  } catch (error) {
    console.error('Error initializing voting sessions:', error);
  }
}
