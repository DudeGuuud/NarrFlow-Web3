import { Request, Response } from 'express';
import { getCurrentBook as getBlockchainCurrentBook } from '../services/blockchainService.js';
import { Book } from '../models/types.js';

// 获取所有书籍
export async function getAllBooks(req: Request, res: Response): Promise<void> {
  try {
    // 从区块链获取所有书籍
    const books = await getBlockchainCurrentBook(true) as Book[];
    res.json(books || []);
  } catch (error) {
    console.error('Error getting all books:', error);
    res.status(500).json({
      error: 'Failed to get books',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 获取当前进行中的书籍
export async function getCurrentBook(req: Request, res: Response): Promise<void> {
  try {
    // 从区块链获取当前书籍
    const book = await getBlockchainCurrentBook() as Book;

    if (!book) {
      res.status(404).json({ error: 'No active book found' });
      return;
    }

    res.json(book);
  } catch (error) {
    console.error('Error getting current book:', error);
    res.status(500).json({
      error: 'Failed to get current book',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 获取指定索引的书籍
export async function getBookByIndex(req: Request, res: Response): Promise<void> {
  try {
    const { index } = req.params;

    if (!index || isNaN(Number(index))) {
      res.status(400).json({ error: 'Invalid book index' });
      return;
    }

    // 从区块链获取所有书籍
    const books = await getBlockchainCurrentBook(true) as Book[];

    if (!books || books.length === 0) {
      res.status(404).json({ error: 'No books found' });
      return;
    }

    // 查找指定索引的书籍
    const book = books.find(b => Number(b.index) === Number(index));

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.json(book);
  } catch (error) {
    console.error('Error getting book by index:', error);
    res.status(500).json({
      error: 'Failed to get book',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
