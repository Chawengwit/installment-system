import { Router } from 'express';
import { query as dbQuery } from '../db/index.js';
import multer from 'multer';
import { extname } from 'path';

const router = Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const result = await dbQuery('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbQuery('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/products
router.post('/', upload.array('images'), async (req, res) => {
    const { name, price, serial_number, description } = req.body;

    if (!name || !price || !serial_number) {
        return res.status(400).json({ error: 'Name, price, and serial number are required' });
    }

    const images = req.files ? req.files.map(file => '/uploads/' + file.filename) : [];

    try {
        const result = await dbQuery(
            'INSERT INTO products (name, price, serial_number, description, images) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, price, serial_number, description || null, JSON.stringify(images)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /api/products/:id
router.put('/:id', upload.array('images'), async (req, res) => {
    const { id } = req.params;
    const { name, price, serial_number, description } = req.body;

    if (!name || !price || !serial_number) {
        return res.status(400).json({ error: 'Name, price, and serial number are required' });
    }

    const images = req.files ? req.files.map(file => '/uploads/' + file.filename) : [];

    try {
        const result = await dbQuery(
            'UPDATE products SET name = $1, price = $2, serial_number = $3, description = $4, images = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
            [name, price, serial_number, description || null, JSON.stringify(images), id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await dbQuery('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

export default router;
