import { Router } from 'express';
import { query as dbQuery } from '../db/index.js';
import multer from 'multer';
import { basename, extname } from 'path';

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

// GET /api/customers
router.get('/', async (req, res) => {
    const { search, sortBy, sortOrder } = req.query;

    let query = 'SELECT * FROM customers';
    const queryParams = [];

    if (search) {
        query += ' WHERE name ILIKE $1 OR phone ILIKE $1';
        queryParams.push(`%${search}%`);
    }

    const validSortBy = ['name', 'created_at'];
    const orderBy = validSortBy.includes(sortBy) ? sortBy : 'created_at';

    const validSortOrder = ['ASC', 'DESC'];
    const order = validSortOrder.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${orderBy} ${order}`;

    try {
        const result = await dbQuery(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// POST /api/customers
router.post('/', upload.single('idCard'), async (req, res) => {
    const { name, phone, address } = req.body;
    const id_card_image = req.file ? '/uploads/' + basename(req.file.path) : null;

    // ✅ This is the validation part added
    if (!name || !phone || !address) {
        return res.status(400).json({ error: 'Some params are required' });
    }

    try {
        const result = await dbQuery(
            'INSERT INTO customers (name, phone, address, id_card_image) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, address, id_card_image]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await dbQuery('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await dbQuery('SELECT * FROM customers WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// PUT /api/customers/:id
router.put('/:id', upload.single('idCard'), async (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    let id_card_image;

    try {
        // Check if there is a new file upload
        if (req.file) {
            id_card_image = '/uploads/' + basename(req.file.path);
        } else {
            // If no new file, keep the existing one
            const currentCustomer = await dbQuery('SELECT id_card_image FROM customers WHERE id = $1', [id]);
            if (currentCustomer.rows.length > 0) {
                id_card_image = currentCustomer.rows[0].id_card_image;
            }
        }

        const result = await dbQuery(
            'UPDATE customers SET name = $1, phone = $2, address = $3, id_card_image = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, phone, address, id_card_image, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

export default router;
