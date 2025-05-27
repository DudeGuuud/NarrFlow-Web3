// 简化的书籍获取函数，返回模拟数据
async function getCurrentBook(getAllBooks = false) {
    // 模拟书籍数据
    const mockBooks = [
        {
            index: 0,
            title: "The Collaborative Story",
            author: "0x123...abc",
            status: 0, // 0 = active, 1 = archived
            bookIndex: 0,
            paragraphs: [
                {
                    content: "Once upon a time, in a digital realm...",
                    author: "0x123...abc",
                    votes: 5
                },
                {
                    content: "The story continued with blockchain magic...",
                    author: "0x456...def",
                    votes: 3
                }
            ]
        },
        {
            index: 1,
            title: "Archived Story",
            author: "0x789...ghi",
            status: 1,
            bookIndex: 1,
            paragraphs: [
                {
                    content: "This is an archived story...",
                    author: "0x789...ghi",
                    votes: 10
                }
            ]
        }
    ];

    if (getAllBooks) {
        return mockBooks;
    }

    // 返回第一个活跃的书籍
    return mockBooks.find(book => book.status === 0) || null;
}

async function booksApi(req, res, path) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (path === 'books' || path === 'books/') {
            // GET /api/v1/books
            const books = await getCurrentBook(true);
            res.json(books || []);
        } else if (path === 'books/current') {
            // GET /api/v1/books/current
            const book = await getCurrentBook();
            if (!book) {
                return res.status(404).json({ error: 'No active book found' });
            }
            res.json(book);
        } else if (path.startsWith('books/')) {
            // GET /api/v1/books/:index
            const indexStr = path.split('/').pop();
            if (!indexStr || isNaN(Number(indexStr))) {
                return res.status(400).json({ error: 'Invalid book index' });
            }

            const index = Number(indexStr);
            const books = await getCurrentBook(true);
            if (!books || books.length === 0) {
                return res.status(404).json({ error: 'No books found' });
            }

            const book = books.find(b => Number(b.index) === index);
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            res.json(book);
        } else {
            res.status(404).json({ error: 'Books endpoint not found' });
        }
    } catch (error) {
        console.error('Error in books API:', error);
        res.status(500).json({
            error: 'Failed to process books request',
            details: error.message || 'Unknown error'
        });
    }
}

module.exports = { booksApi };
