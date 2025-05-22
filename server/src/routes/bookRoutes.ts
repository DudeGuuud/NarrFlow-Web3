import express from 'express';
import { getAllBooks, getCurrentBook, getBookByIndex } from '../controllers/bookController.js';

export const bookRoutes: express.Router = express.Router();

// 获取所有书籍
bookRoutes.get('/', getAllBooks);

// 获取当前进行中的书籍
bookRoutes.get('/current', getCurrentBook);

// 获取指定索引的书籍
bookRoutes.get('/:index', getBookByIndex);
