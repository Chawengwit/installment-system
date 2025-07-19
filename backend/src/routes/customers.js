import { Router } from 'express';
import { query } from '../db/index.js';
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

// Helper function to check for duplicate phone or ID card number
const checkDuplicateCustomer = async (phone, idCardNumber, customerId = null) => {
    let sqlQuery = 'SELECT id FROM customers WHERE (phone = $1 OR id_card_number = $2)';
    const params = [phone, idCardNumber];

    if (customerId) {
        sqlQuery += ' AND id != $3';
        params.push(customerId);
    }

    const result = await query(sqlQuery, params);
    return result.rows.length > 0;
};

// GET /api/customers
router.get('/', async (req, res) => {
    const { search, sortBy, sortOrder, limit, offset } = req.query;

    let customerQuery = 'SELECT * FROM customers';
    let countQuery = 'SELECT COUNT(*) FROM customers';
    const queryParams = [];
    const countParams = [];

    if (search) {
        customerQuery += ' WHERE name ILIKE $1 OR phone ILIKE $1 OR id_card_number ILIKE $1 OR nickname ILIKE $1';
        countQuery += ' WHERE name ILIKE $1 OR phone ILIKE $1 OR id_card_number ILIKE $1 OR nickname ILIKE $1';
        queryParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
    }

    const validSortBy = ['name', 'created_at', 'active_at', 'outstanding_debt'];
    const orderBy = validSortBy.includes(sortBy) ? sortBy : 'created_at';

    const validSortOrder = ['ASC', 'DESC'];
    const order = validSortOrder.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Only add ORDER BY for columns that exist in the database
    if (orderBy === 'name' || orderBy === 'created_at') {
        customerQuery += ` ORDER BY ${orderBy} ${order}`;
    }

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
        const customersResult = await query(customerQuery, queryParams);
        const countResult = await query(countQuery, countParams);
        const totalCustomers = parseInt(countResult.rows[0].count, 10);

        let customers = await Promise.all(customersResult.rows.map(async customer => {
            if (customer.id_card_image) {
                const imagePath = join(__dirname, '..', '..', 'public', customer.id_card_image);
                const exists = await fileExists(imagePath);
                if (!exists) {
                    customer.id_card_image = null; // Set to null if file doesn't exist
                }
            }
            if (customer.social_media) {
                customer.line_id = customer.social_media.line_id;
                customer.facebook = customer.social_media.facebook;
            }

            const installmentQuery = await query('SELECT COUNT(*) FROM installments WHERE customer_id = $1 AND status = $2', [customer.id, 'active']);
            customer.active_plans_count = parseInt(installmentQuery.rows[0].count, 10);

            const outstandingDebtQuery = await query(
                `SELECT SUM(ip.amount) as total_debt
                FROM installment_payments ip
                JOIN installments i ON ip.installment_id = i.id
                WHERE i.customer_id = $1 AND ip.is_paid = false`,
                [customer.id]
            );
            customer.outstanding_debt = parseFloat(outstandingDebtQuery.rows[0].total_debt) || 0;

            return customer;
        }));

        if (sortBy === 'active_at') {
            customers.sort((a, b) => {
                if (order === 'ASC') {
                    return a.active_plans_count - b.active_plans_count;
                } else {
                    return b.active_plans_count - a.active_plans_count;
                }
            });
        } else if (sortBy === 'outstanding_debt') {
            customers.sort((a, b) => {
                if (order === 'ASC') {
                    return a.outstanding_debt - b.outstanding_debt;
                } else {
                    return b.outstanding_debt - a.outstanding_debt;
                }
            });
        }

        res.json({ customers, totalCustomers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// POST /api/customers
router.post('/', upload.single('idCard'), async (req, res) => {
    const { name, phone, address, id_card_number, nickname, line_id, facebook } = req.body;
    const id_card_image = (req.file && req.file.path) ? '/uploads/' + basename(req.file.path) : null;

    if (!name || !id_card_number) {
        return res.status(400).json({ error: 'Name, and ID card number are required' });
    }

    try {
        const isDuplicate = await checkDuplicateCustomer(phone, id_card_number);
        if (isDuplicate) {
            return res.status(409).json({ error: 'Customer with this phone or ID card number already exists.' });
        }

        const social_media = { line_id, facebook };

        const result = await query(
            'INSERT INTO customers (name, phone, address, id_card_image, id_card_number, nickname, social_media) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, phone || null, address || null, id_card_image, id_card_number, nickname || null, social_media]
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
        const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);

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
        if (customer.social_media) {
            customer.line_id = customer.social_media.line_id;
            customer.facebook = customer.social_media.facebook;
        }
        res.json(customer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// GET /api/customers/:id/installments
router.get('/:id/installments', async (req, res) => {
    const { id } = req.params;

    try {
        const installmentsResult = await query(
            `SELECT
                i.id AS installment_id,
                i.total_amount,
                i.term_months,
                i.status,
                p.name AS product_name,
                COUNT(ip.id) FILTER (WHERE ip.is_paid = true) AS paid_terms,
                SUM(ip.amount) FILTER (WHERE ip.is_paid = false) AS outstanding_debt
            FROM
                installments i
            JOIN
                products p ON i.product_id = p.id
            LEFT JOIN
                installment_payments ip ON i.id = ip.installment_id
            WHERE
                i.customer_id = $1
            GROUP BY
                i.id, p.name
            ORDER BY
                i.created_at DESC`,
            [id]
        );
        res.json(installmentsResult.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch customer installments' });
    }
});

// PUT /api/customers/:id
router.put('/:id', upload.single('idCard'), async (req, res) => {
    const { id } = req.params;
    const { name, phone, address, id_card_number, nickname, line_id, facebook } = req.body;
    let id_card_image;

    try {
        // Check if there is a new file upload
        if (req.file) {
            id_card_image = '/uploads/' + basename(req.file.path);
        } else {
            // If no new file, keep the existing one
            const currentCustomer = await query('SELECT id_card_image FROM customers WHERE id = $1', [id]);
            if (currentCustomer.rows.length > 0) {
                id_card_image = currentCustomer.rows[0].id_card_image;
            }
        }

        const isDuplicate = await checkDuplicateCustomer(phone, id_card_number, parseInt(id, 10));
        if (isDuplicate) {
            return res.status(409).json({ error: 'Customer with this phone or ID card number already exists.' });
        }

        const social_media = { line_id, facebook };

        const result = await query(
            'UPDATE customers SET name = $1, phone = $2, address = $3, id_card_image = $4, id_card_number = $5, nickname = $6, social_media = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
            [name, phone || null, address || null, id_card_image, id_card_number, nickname || null, social_media, id]
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
