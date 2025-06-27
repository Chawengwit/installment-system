const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    const { name, price } = req.body;
    try {
        const result = await db.query(
        'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
        [name, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

module.exports = router;
