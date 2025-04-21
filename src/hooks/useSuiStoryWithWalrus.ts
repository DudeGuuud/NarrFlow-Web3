import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet } from '@suiet/wallet-kit';
// TODO: 替换为你刚刚发布成功的 PACKAGE_ID 和 StoryBook 对象ID
const PACKAGE_ID = '0x2c55c7dbbd7856f27b86f07c1e8194460d2a1695464b85a66231472186fc80a1';
const STORYBOOK_ID = '<your_storybook_object_id>';

const suiClient = new SuiClient({ url: 'http://127.0.0.1:9000' }); // 本地链

// 上传内容到 Walrus，返回 walrus_id
async function uploadToWalrus(content: Blob | string): Promise<string> {
  const formData = new FormData();
  formData.append('file', content);
  const res = await fetch('http://127.0.0.1:8080/api/v1/blobs', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Walrus 上传失败');
  const data = await res.json();
  return data.id;
}

// 下载内容
async function downloadFromWalrus(walrusId: string): Promise<Blob> {
  const url = `http://127.0.0.1:8080/api/v1/blobs/${walrusId.replace('walrus://', '')}`;
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

export function useSuiStory() {
  const { signAndExecuteTransactionBlock, account } = useWallet();

  // 1. 开启新书
  async function startNewBook(title: string) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_new_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure(new Uint8Array(Buffer.from(title, 'utf8'))),
        tx.pure(new Uint8Array(Buffer.from(account.address, 'utf8'))),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 2. 添加段落
  async function addParagraph(content: string) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure(new Uint8Array(Buffer.from(content, 'utf8'))),
        tx.pure(new Uint8Array(Buffer.from(account.address, 'utf8'))),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 3. 投票
  async function voteParagraph(paraIndex: number) {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::vote_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure(new Uint8Array([paraIndex])),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 4. 归档书本
  async function archiveBook() {
    if (!account) throw new Error('请先连接钱包');
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
      ],
    });
    return await signAndExecuteTransactionBlock({ transactionBlock: tx });
  }

  // 5. 查询所有书
  async function getAllBooks() {
    const storyBookObj = await suiClient.getObject({ id: STORYBOOK_ID, options: { showContent: true } });
    // 兼容 SuiParsedData 类型
    const fields = (storyBookObj.data?.content as any)?.fields;
    return fields?.books || [];
  }

  // 6. 查询某本书下所有段落
  async function getAllParagraphs(book: any) {
    // book 为 getAllBooks 返回的单本书对象
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
  };
} 