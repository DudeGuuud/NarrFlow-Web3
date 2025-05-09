import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { compressToBase64, decompressFromBase64 } from 'lz-string';

// 环境变量
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;
const STORYBOOK_ID = import.meta.env.VITE_STORYBOOK_ID;
const TREASURY_ID = import.meta.env.VITE_TREASURY_ID;

// 创建 SUI 客户端
const suiClient = new SuiClient({ url: getFullnodeUrl(import.meta.env.VITE_SUI_NETWORK) });

// 类型定义
interface BookType {
  id: string;
  index: number;
  title: string;
  author: string;
  status: number;
  paragraphs: ParagraphType[];
}

interface ParagraphType {
  id: string;
  index: number;
  content: string;
  author: string;
  votes: number;
  walrus_id?: string;
}

// 辅助函数 - 解包对象
function unpack(obj: any): any {
  if (obj && typeof obj === 'object') {
    if (obj.fields) {
      return unpack(obj.fields);
    }
    if (Array.isArray(obj)) {
      return obj.map(unpack);
    }
    const result: Record<string, any> = {};
    for (const key in obj) {
      result[key] = unpack(obj[key]);
    }
    return result;
  }
  return obj;
}

// 辅助函数 - 解包段落
function unpackParagraphs(paragraphs: any[]): any[] {
  return paragraphs.map(unpack);
}

// 辅助函数 - 获取段落内容
async function getParagraphContent(paragraph: any): Promise<string> {
  if (paragraph.content) {
    try {
      return decompressFromBase64(paragraph.content) || paragraph.content;
    } catch (e) {
      console.error('解压段落内容失败:', e);
      return paragraph.content;
    }
  }
  return '';
}

// 辅助函数 - 计算内容哈希
function calcContentHash(content: string): string {
  // 简单哈希实现，实际项目中可能需要更复杂的哈希算法
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export function useSuiStory() {
  // 使用 dapp-kit 的钩子获取当前账户
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // 检查钱包连接状态
  const checkWalletConnection = () => {
    if (!currentAccount) {
      console.error('钱包未连接');
      throw new Error('请先连接钱包');
    }
    return currentAccount.address;
  };

  // 1. 开启新书
  async function startNewBook(title: string) {
    console.log('开始创建新书:', title);
    const address = checkWalletConnection();
    
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_new_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(title),
        tx.pure.address(address),
        tx.object(TREASURY_ID),
      ],
    });
    
    console.log('准备签名交易...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    console.log('新书创建成功，交易摘要:', result.digest);
    return result;
  }

  // 2. 添加段落（直接压缩明文内容上链）
  async function addParagraph(content: string) {
    console.log('开始添加段落');
    const address = checkWalletConnection();
    
    const compressed = compressToBase64(content);
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(compressed),
        tx.pure.address(address),
        tx.object(TREASURY_ID),
      ],
    });
    
    console.log('准备签名交易...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    console.log('段落添加成功，交易摘要:', result.digest);
    return result;
  }

  // 3. 投票
  async function voteParagraph(paraIndex: number) {
    console.log('开始投票，段落索引:', paraIndex);
    checkWalletConnection();
    
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::vote_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.u64(paraIndex),
      ],
    });
    
    console.log('准备签名交易...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    console.log('投票成功，交易摘要:', result.digest);
    return result;
  }

  // 4. 归档书本
  async function archiveBook() {
    console.log('开始归档书本');
    checkWalletConnection();
    
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.object(TREASURY_ID),
      ],
    });
    
    console.log('准备签名交易...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    console.log('书本归档成功，交易摘要:', result.digest);
    return result;
  }

  // 5. 查询所有书（已解包，段落也解包）
  async function getAllBooks() {
    console.log('获取所有书本');
    const storyBookObj = await suiClient.getObject({ id: STORYBOOK_ID, options: { showContent: true } });
    const fields = (storyBookObj.data?.content as any)?.fields;
    const books = (fields?.books || []).map(unpack);
    books.forEach((book: Record<string, any>) => {
      book.paragraphs = unpackParagraphs(book.paragraphs);
    });
    console.log('获取到书本数量:', books.length);
    return books as BookType[];
  }

  // 6. 查询某本书下所有段落（已解包）
  async function getAllParagraphs(book: { paragraphs: unknown[] }) {
    return unpackParagraphs(book.paragraphs);
  }

  // 7. 通过 index 获取书本
  async function getBookByIndex(index: number) {
    console.log('通过索引获取书本:', index);
    const books = await getAllBooks();
    return books.find((b: { index: number | string }) => Number(b.index) === Number(index));
  }

  // 8. 获取段落内容（通过 walrus_id 下载）
  async function getAllParagraphContents(book: { paragraphs: unknown[] }) {
    const paras = await getAllParagraphs(book);
    return Promise.all(paras.map(p => getParagraphContent(p)));
  }

  // 9. 获取当前正在进行中的书
  async function getCurrentBook() {
    console.log('获取当前进行中的书本');
    const books = await getAllBooks();
    // 状态为0表示进行中
    return books.find((b: { status: number }) => b.status === 0);
  }

  // 10. 添加段落并归档（合并为一个链上交易）
  async function addParagraphAndArchive(content: string) {
    console.log('添加段落并归档');
    const address = checkWalletConnection();
    
    const compressed = compressToBase64(content);
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.pure.string(compressed),
        tx.pure.address(address),
        tx.object(TREASURY_ID),
      ],
    });
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID),
        tx.object(TREASURY_ID),
      ],
    });
    
    console.log('准备签名交易...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    console.log('添加段落并归档成功，交易摘要:', result.digest);
    return result;
  }

  // 11. 用 index 查找，用 id 调用奖励
  async function rewardForBookIndex(index: number) {
    console.log('为书本索引发放奖励:', index);
    const books = await getAllBooks();
    const book = books.find(b => b.index === index);
    if (!book) {
      console.error('未找到书本');
      throw new Error('Book not found');
    }
    
    // 这里用 book.id 作为 story_id
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::token::reward_start_new_book`,
      arguments: [
        tx.object(TREASURY_ID),
        tx.object(book.id),
      ],
    });
    
    console.log('准备签名交易...');
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });
    console.log('奖励发放成功，交易摘要:', result.digest);
    return result;
  }

  return {
    startNewBook,
    addParagraph,
    addParagraphAndArchive,
    voteParagraph,
    archiveBook,
    getAllBooks,
    getAllParagraphs,
    getBookByIndex,
    getAllParagraphContents,
    calcContentHash,
    getCurrentBook,
    rewardForBookIndex,
  };
}
