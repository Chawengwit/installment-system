import { Router } from 'express';
import { query as dbQuery } from '../db/index.js';

const router = Router();

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const result = await dbQuery('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    const { name, price } = req.body;

    // ✅ This is the validation part added
    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    try {
        const result = await dbQuery(
            'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
            [name, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

export default router;