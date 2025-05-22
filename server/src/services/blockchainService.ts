import { Transaction } from '@mysten/sui/transactions';
import { suiClient, adminKeypair, PACKAGE_ID, STORYBOOK_ID, TREASURY_ID } from '../index.js';
import { Book, Paragraph, TransactionResult } from '../models/types.js';
import { updateProposalStats } from './databaseService.js';

// 获取当前书籍或所有书籍
export async function getCurrentBook(getAllBooks: boolean = false): Promise<Book | Book[] | null> {
  try {
    // 获取 StoryBook 对象
    const storyBookObject = await suiClient.getObject({
      id: STORYBOOK_ID!,
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true,
      },
    });

    if (!storyBookObject || !storyBookObject.data || !storyBookObject.data.content) {
      console.error('StoryBook object not found or has no content');
      throw new Error('StoryBook object not found or has no content');
    }

    const storyBook = storyBookObject.data.content;
    // 使用 fields 属性获取字段
    const data = (storyBook as any).fields;

    // 获取当前书籍索引
    const currentBookIndex = Number(data.current_book_index);

    // 获取所有书籍
    const books = data.books;

    // 如果请求所有书籍，则处理所有书籍
    if (getAllBooks) {
      if (!books || books.length === 0) {
        return [];
      }

      // 处理所有书籍
      return books.map((book: any, index: number) => {
        const bookData = book.fields || book;

        // 提取书籍信息
        const title = bookData.title || '';
        const author = bookData.author || '';
        const status = typeof bookData.status === 'undefined' ? 0 : Number(bookData.status);
        const bookIndex = typeof bookData.index === 'undefined' ? 0 : Number(bookData.index);

        // 处理段落
        let paragraphs = [];
        if (bookData.paragraphs) {
          if (Array.isArray(bookData.paragraphs)) {
            paragraphs = bookData.paragraphs;
          } else if (bookData.paragraphs.fields && Array.isArray(bookData.paragraphs.fields)) {
            paragraphs = bookData.paragraphs.fields;
          }
        }

        // 返回格式化的书籍
        return {
          index,
          title,
          author,
          status,
          bookIndex,
          paragraphs: Array.isArray(paragraphs)
            ? paragraphs.map((p: any) => {
                const paraData = p.fields || p;
                return {
                  content: paraData.content || '',
                  author: paraData.author || '',
                  votes: typeof paraData.votes === 'undefined' ? 0 : Number(paraData.votes)
                };
              })
            : []
        };
      });
    }

    // 处理单本书籍的情况
    if (!books || books.length === 0) {
      return null;
    }

    if (currentBookIndex >= books.length) {
      return null;
    }

    // 获取当前书籍
    const currentBook = books[currentBookIndex];

    // 检查书籍字段是否在 fields 中
    const bookData = currentBook.fields || currentBook;

    // 提取书籍标题
    const title = bookData.title || '';

    // 提取书籍状态，确保是数字
    const status = typeof bookData.status === 'undefined' ? 0 : Number(bookData.status);

    // 提取书籍作者
    const author = bookData.author || '';

    // 提取书籍索引
    const bookIndex = typeof bookData.index === 'undefined' ? 0 : Number(bookData.index);

    // 检查段落数组
    let paragraphs = [];
    if (bookData.paragraphs) {
      // 如果段落在 fields 中
      if (Array.isArray(bookData.paragraphs)) {
        paragraphs = bookData.paragraphs;
      } else if (bookData.paragraphs.fields && Array.isArray(bookData.paragraphs.fields)) {
        paragraphs = bookData.paragraphs.fields;
      }
    }

    // 格式化书籍数据
    const formattedBook: Book = {
      index: currentBookIndex,
      title: title,
      author: author,
      status: status,
      bookIndex: bookIndex,
      paragraphs: Array.isArray(paragraphs)
        ? paragraphs.map((p: any) => {
            const paraData = p.fields || p;
            return {
              content: paraData.content || '',
              author: paraData.author || '',
              votes: typeof paraData.votes === 'undefined' ? 0 : Number(paraData.votes)
            };
          })
        : []
    };



    return formattedBook;
  } catch (error) {
    console.error('Error getting current book:', error);
    return null;
  }
}

// 开始新书
export async function executeStartNewBook(
  title: string,
  author: string
): Promise<TransactionResult> {
  try {


    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::story::start_new_book`,
      arguments: [
        tx.object(STORYBOOK_ID!),
        tx.pure.string(title),
        tx.pure.address(author),
        tx.object(TREASURY_ID!),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: adminKeypair,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    // 更新提案统计
    await updateProposalStats(author, 'won');

    // 假设奖励为 100 tokens
    await updateProposalStats(author, 'rewarded', 100);

    return result;
  } catch (error) {
    console.error('Error executing start_new_book:', error);
    throw error;
  }
}

// 添加段落
export async function executeAddParagraph(
  content: string,
  author: string
): Promise<TransactionResult> {
  try {
    // 获取当前书籍状态，确保我们有最新的数据
    const currentBook = await getCurrentBook() as Book;

    if (!currentBook) {
      console.error('No active book found to add paragraph to');

      // 尝试开始一个新书
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook();
      if (!newBook) {
        throw new Error('Failed to create a new book automatically');
      }
    } else if (currentBook.status !== 0) {
      // 如果书籍状态不是 0（进行中），尝试开始一个新书
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook() as Book;
      if (!newBook || newBook.status !== 0) {
        throw new Error('Failed to create a new active book');
      }
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID!),
        tx.pure.string(content),
        tx.pure.address(author),
        tx.object(TREASURY_ID!),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: adminKeypair,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    // 更新提案统计
    await updateProposalStats(author, 'won');

    // 假设奖励为 20 tokens
    await updateProposalStats(author, 'rewarded', 20);

    return result;
  } catch (error) {
    console.error('Error executing add_paragraph:', error);
    throw error;
  }
}

// 添加段落并归档
export async function executeAddParagraphAndArchive(
  content: string,
  author: string
): Promise<TransactionResult> {
  try {
    // 获取当前书籍状态，确保我们有最新的数据
    const currentBook = await getCurrentBook() as Book;

    if (!currentBook) {
      console.error('No active book found to add paragraph to and archive');

      // 尝试开始一个新书
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook() as Book;
      if (!newBook) {
        throw new Error('Failed to create a new book automatically');
      }
    } else if (currentBook.status !== 0) {
      // 如果书籍状态不是 0（进行中），尝试开始一个新书
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook() as Book;
      if (!newBook || newBook.status !== 0) {
        throw new Error('Failed to create a new active book');
      }
    }

    // 再次检查段落数量
    const updatedBook = await getCurrentBook() as Book;
    if (updatedBook && updatedBook.paragraphs.length < 9) {
      // 添加足够的段落以达到最低要求
      const neededParagraphs = 9 - updatedBook.paragraphs.length;
      for (let i = 0; i < neededParagraphs; i++) {
        const dummyContent = `Placeholder paragraph ${i+1}`;

        // 使用单独的交易添加每个段落
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::story::add_paragraph`,
          arguments: [
            tx.object(STORYBOOK_ID!),
            tx.pure.string(dummyContent),
            tx.pure.address(author),
            tx.object(TREASURY_ID!),
          ],
        });

        await suiClient.signAndExecuteTransaction({
          transaction: tx,
          signer: adminKeypair,
          options: {
            showEffects: true,
            showEvents: true,
          },
        });
      }
    }

    const tx = new Transaction();

    // 先添加段落
    tx.moveCall({
      target: `${PACKAGE_ID}::story::add_paragraph`,
      arguments: [
        tx.object(STORYBOOK_ID!),
        tx.pure.string(content),
        tx.pure.address(author),
        tx.object(TREASURY_ID!),
      ],
    });

    // 然后归档书籍
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID!),
        tx.object(TREASURY_ID!),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: adminKeypair,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    // 更新提案统计
    await updateProposalStats(author, 'won');

    // 假设奖励为 20 tokens (段落) + 50 tokens (归档) = 70 tokens
    await updateProposalStats(author, 'rewarded', 70);

    return { ...result, archived: true };
  } catch (error) {
    console.error('Error executing add_paragraph and archive_book:', error);
    throw error;
  }
}
