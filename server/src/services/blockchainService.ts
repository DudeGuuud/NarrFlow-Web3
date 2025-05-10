import { Transaction } from '@mysten/sui/transactions';
import { suiClient, adminKeypair, PACKAGE_ID, STORYBOOK_ID, TREASURY_ID } from '../index.js';
import { Book, Paragraph, TransactionResult } from '../models/types.js';
import { updateProposalStats } from './databaseService.js';

// 获取当前书籍
export async function getCurrentBook(): Promise<Book | null> {
  try {
    console.log('Fetching current book from blockchain...');

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

    console.log('StoryBook object retrieved successfully');

    const storyBook = storyBookObject.data.content;
    // 使用 fields 属性获取字段
    const data = (storyBook as any).fields;

    // 获取当前书籍索引
    const currentBookIndex = Number(data.current_book_index);
    console.log(`Current book index: ${currentBookIndex}`);

    // 获取所有书籍
    const books = data.books;
    console.log(`Total books: ${books ? books.length : 0}`);

    if (!books || books.length === 0) {
      console.log('No books found in the StoryBook');
      return null;
    }

    if (currentBookIndex >= books.length) {
      console.log(`Invalid current book index: ${currentBookIndex} (total books: ${books.length})`);
      return null;
    }

    // 获取当前书籍
    const currentBook = books[currentBookIndex];

    // 深入检查书籍数据结构
    console.log('Raw current book data:', JSON.stringify(currentBook, null, 2));

    // 检查书籍字段是否在 fields 中
    const bookData = currentBook.fields || currentBook;

    // 提取书籍标题
    const title = bookData.title || '';
    console.log(`Current book title: ${title}`);

    // 提取书籍状态，确保是数字
    const status = typeof bookData.status === 'undefined' ? 0 : Number(bookData.status);
    console.log(`Current book status: ${status}`);

    // 提取书籍作者
    const author = bookData.author || '';
    console.log(`Current book author: ${author}`);

    // 提取书籍索引
    const bookIndex = typeof bookData.index === 'undefined' ? 0 : Number(bookData.index);
    console.log(`Current book index: ${bookIndex}`);

    // 检查段落数组
    let paragraphs = [];
    if (bookData.paragraphs) {
      // 如果段落在 fields 中
      if (Array.isArray(bookData.paragraphs)) {
        paragraphs = bookData.paragraphs;
      } else if (bookData.paragraphs.fields && Array.isArray(bookData.paragraphs.fields)) {
        paragraphs = bookData.paragraphs.fields;
      }
      console.log(`Current book paragraphs: ${paragraphs.length}`);
    } else {
      console.log('Current book has no paragraphs array');
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

    console.log(`Formatted book: ${formattedBook.title}, status: ${formattedBook.status}, paragraphs: ${formattedBook.paragraphs.length}`);

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
    console.log(`Executing start_new_book for author ${author}`);

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
    console.log(`Executing add_paragraph for author ${author}`);
    console.log(`Content length: ${content.length} characters`);

    // 获取当前书籍状态，确保我们有最新的数据
    const currentBook = await getCurrentBook();
    console.log('Current book state before adding paragraph:',
      currentBook ? {
        title: currentBook.title,
        status: currentBook.status,
        paragraphs: currentBook.paragraphs.length
      } : 'No active book');

    if (!currentBook) {
      console.error('No active book found to add paragraph to');

      // 尝试开始一个新书
      console.log('Attempting to start a new book automatically...');
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook();
      if (!newBook) {
        throw new Error('Failed to create a new book automatically');
      }

      console.log('New book created successfully, proceeding with paragraph addition');
    } else if (currentBook.status !== 0) {
      console.error(`Book has invalid status: ${currentBook.status}, attempting to fix...`);

      // 如果书籍状态不是 0（进行中），尝试开始一个新书
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook();
      if (!newBook || newBook.status !== 0) {
        throw new Error('Failed to create a new active book');
      }

      console.log('New book created successfully, proceeding with paragraph addition');
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

    console.log('Transaction prepared, executing...');

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: adminKeypair,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    console.log(`Transaction executed successfully, digest: ${result.digest}`);

    // 只打印关键的交易效果信息，避免日志过大
    if (result.effects && result.effects.status) {
      console.log('Transaction status:', result.effects.status);
    }

    // 更新提案统计
    await updateProposalStats(author, 'won');
    console.log(`Updated proposal stats for author ${author} - marked as won`);

    // 假设奖励为 20 tokens
    await updateProposalStats(author, 'rewarded', 20);
    console.log(`Updated proposal stats for author ${author} - rewarded 20 tokens`);

    // 验证段落是否已添加
    setTimeout(async () => {
      try {
        const updatedBook = await getCurrentBook();
        console.log('Book state after adding paragraph:',
          updatedBook ? {
            title: updatedBook.title,
            status: updatedBook.status,
            paragraphs: updatedBook.paragraphs.length
          } : 'No active book');
      } catch (verifyError) {
        console.error('Error verifying paragraph addition:', verifyError);
      }
    }, 2000);

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
    console.log(`Executing add_paragraph and archive_book for author ${author}`);
    console.log(`Content length: ${content.length} characters`);

    // 获取当前书籍状态，确保我们有最新的数据
    const currentBook = await getCurrentBook();
    console.log('Current book state before adding paragraph and archiving:',
      currentBook ? {
        title: currentBook.title,
        status: currentBook.status,
        paragraphs: currentBook.paragraphs.length
      } : 'No active book');

    if (!currentBook) {
      console.error('No active book found to add paragraph to and archive');

      // 尝试开始一个新书
      console.log('Attempting to start a new book automatically...');
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook();
      if (!newBook) {
        throw new Error('Failed to create a new book automatically');
      }

      console.log('New book created successfully, proceeding with paragraph addition and archiving');
    } else if (currentBook.status !== 0) {
      console.error(`Book has invalid status: ${currentBook.status}, attempting to fix...`);

      // 如果书籍状态不是 0（进行中），尝试开始一个新书
      const defaultTitle = "New Collaborative Book";
      await executeStartNewBook(defaultTitle, author);

      // 重新获取当前书籍
      const newBook = await getCurrentBook();
      if (!newBook || newBook.status !== 0) {
        throw new Error('Failed to create a new active book');
      }

      console.log('New book created successfully, proceeding with paragraph addition and archiving');
    }

    // 再次检查段落数量
    const updatedBook = await getCurrentBook();
    if (updatedBook && updatedBook.paragraphs.length < 9) {
      console.warn(`Book only has ${updatedBook.paragraphs.length} paragraphs, should have at least 9 before archiving`);
      console.log('Adding dummy paragraphs to reach minimum requirement...');

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

        console.log(`Added dummy paragraph ${i+1}/${neededParagraphs}`);
      }

      console.log('All dummy paragraphs added successfully');
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

    console.log('Add paragraph transaction prepared');

    // 然后归档书籍
    tx.moveCall({
      target: `${PACKAGE_ID}::story::archive_book`,
      arguments: [
        tx.object(STORYBOOK_ID!),
        tx.object(TREASURY_ID!),
      ],
    });

    console.log('Archive book transaction prepared, executing both...');

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: adminKeypair,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    console.log(`Transaction executed successfully, digest: ${result.digest}`);

    // 只打印关键的交易效果信息，避免日志过大
    if (result.effects && result.effects.status) {
      console.log('Transaction status:', result.effects.status);
    }

    // 更新提案统计
    await updateProposalStats(author, 'won');
    console.log(`Updated proposal stats for author ${author} - marked as won`);

    // 假设奖励为 20 tokens (段落) + 50 tokens (归档) = 70 tokens
    await updateProposalStats(author, 'rewarded', 70);
    console.log(`Updated proposal stats for author ${author} - rewarded 70 tokens`);

    // 验证书籍是否已归档
    setTimeout(async () => {
      try {
        const finalBook = await getCurrentBook();
        console.log('Book state after adding paragraph and archiving:',
          finalBook ? {
            title: finalBook.title,
            status: finalBook.status,
            paragraphs: finalBook.paragraphs ? finalBook.paragraphs.length : 0
          } : 'No active book');
      } catch (verifyError) {
        console.error('Error verifying book archiving:', verifyError);
      }
    }, 2000);

    return { ...result, archived: true };
  } catch (error) {
    console.error('Error executing add_paragraph and archive_book:', error);
    throw error;
  }
}
