import { Router } from 'express';
import { query as dbQuery } from '../db/index.js';
import multer from 'multer';
import { basename, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Helper function to check if a file exists
const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch (e) {
        return false;
    }
};

// GET /api/customers
router.get('/', async (req, res) => {
    const { search, sortBy, sortOrder, limit, offset } = req.query;

    let customerQuery = 'SELECT * FROM customers';
    let countQuery = 'SELECT COUNT(*) FROM customers';
    const queryParams = [];
    const countParams = [];

    if (search) {
        customerQuery += ' WHERE name ILIKE $1 OR phone ILIKE $1';
        countQuery += ' WHERE name ILIKE $1 OR phone ILIKE $1';
        queryParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
    }

    const validSortBy = ['name', 'created_at'];
    const orderBy = validSortBy.includes(sortBy) ? sortBy : 'created_at';

    const validSortOrder = ['ASC', 'DESC'];
    const order = validSortOrder.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    customerQuery += ` ORDER BY ${orderBy} ${order}`;

    // Add limit and offset for pagination
    if (limit) {
        customerQuery += ` LIMIT $${queryParams.length + 1}`;
        queryParams.push(limit);
    }
    if (offset) {
        customerQuery += ` OFFSET $${queryParams.length + 1}`;
        queryParams.push(offset);
    }

    try {
        const customersResult = await dbQuery(customerQuery, queryParams);
        const countResult = await dbQuery(countQuery, countParams);
        const totalCustomers = parseInt(countResult.rows[0].count, 10);

        const customers = await Promise.all(customersResult.rows.map(async customer => {
            if (customer.id_card_image) {
                const imagePath = join(__dirname, '..', '..', 'public', customer.id_card_image);
                const exists = await fileExists(imagePath);
                if (!exists) {
                    customer.id_card_image = null; // Set to null if file doesn't exist
                }
            }
            return customer;
        }));
        res.json({ customers, totalCustomers });
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
    if (!name || !phone) {
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

        const customer = result.rows[0];
        if (customer.id_card_image) {
            const imagePath = join(__dirname, '..', '..', 'public', customer.id_card_image);
            const exists = await fileExists(imagePath);
            if (!exists) {
                customer.id_card_image = null; // Set to null if file doesn't exist
            }
        }
        res.json(customer);
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
