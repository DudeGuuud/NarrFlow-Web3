import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';
// TODO: 将 <packageId> 替换为你刚刚发布成功的 TOKEN 合约包ID
const PACKAGE_ID = '0x85fc09b3d2b0c6085f1cac597dcac02f713e0b2b7e80609594eae3051810afe2';

const suiClient = new SuiClient({ url: 'http://127.0.0.1:9000' }); // 本地链

export function useSuiStory() {
  const { signAndExecuteTransactionBlock, account } = useWallet();

  // 1. 创建故事
  async function createStory(title: string, contentHash: string, walrusId: string) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::create_story`,
      arguments: [
        tx.pure(title),
        tx.pure(contentHash),
        tx.pure(walrusId),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 2. 添加段落
  async function addParagraph(storyId: string, contentHash: string, walrusId: string) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(storyId),
        tx.pure(contentHash),
        tx.pure(walrusId),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 3. 开始投票
  async function startVoting(
    storyId: string,
    proposalsHash: string[],
    proposalsWalrusId: string[],
    votingDuration: number
  ) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_voting`,
      arguments: [
        tx.object(storyId),
        tx.pure(proposalsHash),
        tx.pure(proposalsWalrusId),
        tx.pure(votingDuration),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 4. 投票
  async function castVote(storyId: string, proposalIndex: number) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::cast_vote`,
      arguments: [
        tx.object(storyId),
        tx.pure(proposalIndex),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 5. 完成故事
  async function completeStory(storyId: string) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::complete_story`,
      arguments: [
        tx.object(storyId),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 6. 查询故事（链上只读）
  async function getStory(storyId: string) {
    return await suiClient.getObject({ id: storyId, options: { showContent: true } });
  }

  // 7. 查询相关事件
  async function getEvents(eventType: string, cursor?: string, limit = 20) {
    return await suiClient.queryEvents({
      query: { MoveEventType: eventType },
      cursor: cursor ?? null,
      limit,
    });
  }

  return {
    createStory,
    addParagraph,
    startVoting,
    castVote,
    completeStory,
    getStory,
    getEvents,
  };
} 