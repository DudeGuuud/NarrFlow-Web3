import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';
// TODO: 替换为你刚刚发布成功的 PACKAGE_ID 和 StoryBook 对象ID
const PACKAGE_ID = '0x62f042a49a52a3ee2cee387bdd19fb1a1843daf9c07c69d2f4eb56d4995ad19d';
const STORYBOOK_ID = '0x228ff952c4341e3f3de4bb3e4eb6de8f9e273a6839ad44d93c137446c47bce09';

// Walrus 官方 Testnet 节点
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') }); // 切换为 testnet

// 上传内容到 Walrus，返回 blobId
async function uploadToWalrus(content: Blob | string, epochs: number = 1): Promise<string> {
  const url = `${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`;
  const res = await fetch(url, {
    method: 'PUT',
    body: content,
  });
  if (!res.ok) throw new Error('Walrus 上传失败');
  const data = await res.json();

  if (data.newlyCreated) {
    return data.newlyCreated.blobObject.blobId;
  } else if (data.alreadyCertified) {
    return data.alreadyCertified.blobId;
  } else {
    throw new Error('Walrus 返回格式异常');
  }
}

// 从 Walrus 公共 Aggregator 下载 blob
async function downloadFromWalrus(blobId: string): Promise<Blob> {
  const url = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Walrus 下载失败');
  return await res.blob();
}

// 计算内容哈希（sha256，返回hex字符串）
async function calcContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 获取当前活跃书本及其段落
async function getCurrentBook() {
  const storyBookObj = await suiClient.getObject({ id: STORYBOOK_ID, options: { showContent: true } });
  const fields = (storyBookObj.data?.content as any)?.fields;
  const idx = fields?.current_book_index ?? 0;
  const books = fields?.books ?? [];
  const book = books[idx] ?? {};
  // 段落加上 index
  const paragraphs = (book.paragraphs ?? []).map((p: any, i: number) => ({
    ...p,
    index: i,
  }));
  return {
    title: book.title ?? '',
    status: book.status ?? 0,
    index: book.index ?? 0,
    paragraphs,
    archive_votes_threshold: book.archive_votes_threshold ?? 10,
    total_votes: book.total_votes ?? 0,
  };
}

export function useSuiStory() {
  const wallet = useWallet();

  // 1. 开启新书
  async function startNewBook(title: string) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_new_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure(new Uint8Array(Buffer.from(title, 'utf8'))),
        tx.pure(new Uint8Array(Buffer.from(wallet.account.address, 'utf8'))),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 2. 添加段落（先上传内容到 Walrus，链上只存 walrus_id）
  async function addParagraph(content: string | Blob) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    // 1. 上传内容到 Walrus，获得 walrus_id
    const walrusId = await uploadToWalrus(content);
    // 2. 把 walrus_id 存到 Sui 链上
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure(new Uint8Array(Buffer.from(walrusId, 'utf8'))), // 存储 walrus_id
        tx.pure(new Uint8Array(Buffer.from(wallet.account.address, 'utf8'))),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 3. 投票
  async function voteParagraph(paraIndex: number) {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::vote_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure(new Uint8Array([paraIndex])),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 4. 归档书本
  async function archiveBook() {
    if (!wallet.connected || !wallet.account?.address) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
      ],
    });
    return await wallet.signAndExecuteTransaction({ transaction: tx });
  }

  // 5. 查询所有书
  async function getAllBooks() {
    const storyBookObj = await suiClient.getObject({ id: STORYBOOK_ID, options: { showContent: true } });
    const fields = (storyBookObj.data?.content as any)?.fields;
    return fields?.books || [];
  }

  // 6. 查询某本书下所有段落
  async function getAllParagraphs(book: any) {
    return book.paragraphs || [];
  }

  return {
    startNewBook,
    addParagraph,
    voteParagraph,
    archiveBook,
    getAllBooks,
    getAllParagraphs,
    uploadToWalrus,
    downloadFromWalrus,
    calcContentHash,
    getCurrentBook,
  };
} 