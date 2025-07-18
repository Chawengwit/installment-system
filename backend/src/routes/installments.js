import { Router } from 'express';
import { pool } from '../db/index.js';
import multer from 'multer';
import { extname } from 'path';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + extname(file.originalname)) //Appending extension
    }
});

const upload = multer({ storage: storage });

// GET /api/installments
router.get('/', async (req, res) => {
    const { search = '', status = 'all', limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    try {
        let whereClause = 'WHERE 1 = 1';
        const params = [];

        if (search) {
            whereClause += ` AND (c.name ILIKE $${params.length + 1} OR p.name ILIKE $${params.length + 1} OR p.serial_number ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        if (status !== 'all') {
            if (status === 'today_duedate') {
                whereClause += ` AND (SELECT ip.due_date FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY ip.due_date ASC LIMIT 1) = CURRENT_DATE`;
            } else if (status === 'over_due') {
                whereClause += ` AND (SELECT ip.due_date FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY ip.due_date ASC LIMIT 1) < CURRENT_DATE AND i.status = 'active'`;
            } 
        }

        const countResult = await pool.query(`
            SELECT COUNT(i.id) 
            FROM installments i
            JOIN customers c ON i.customer_id = c.id
            JOIN products p ON i.product_id = p.id
            ${whereClause}
        `, params);

        const totalInstallments = parseInt(countResult.rows[0].count, 10);

        const query = `
            SELECT 
                i.id,
                p.name as product_name,
                p.serial_number,
                c.name as customer_name,
                i.total_amount,
                i.status,
                i.created_at,
                (SELECT ip.due_date FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY ip.due_date ASC LIMIT 1) as next_due_date
            FROM installments i
            JOIN customers c ON i.customer_id = c.id
            JOIN products p ON i.product_id = p.id
            ${whereClause}
            ORDER BY i.created_at ${sortOrder}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({ installments: result.rows, totalInstallments });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch installment plans' });
    }
});


// POST /api/installments
router.post('/', upload.array('productImages'), async (req, res) => {
    const {
        productName,
        productSerialNumber,
        productPrice,
        productDescription,
        installmentMonths,
        paymentDueDate,
        customerId,
        creditCardId
    } = req.body;

    // Sanitize optional numeric inputs
    const downPayment = parseFloat(req.body.downPayment) || 0;
    const interestRate = parseFloat(req.body.interestRate) || 0;
    const lateFee = req.body.lateFee ? parseFloat(req.body.lateFee) : null; // Use null for empty string to allow DB default

    const productImages = req.files ? req.files.map(file => file.filename) : [];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create new Product
        const productResult = await client.query(
            'INSERT INTO products (name, serial_number, price, description, images) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [productName, productSerialNumber, productPrice, productDescription, JSON.stringify(productImages)]
        );
        const productId = productResult.rows[0].id;

        // 2. Create new Installment plan
        const totalAmount = parseFloat(productPrice) - downPayment;
        const monthlyPayment = (totalAmount * (1 + interestRate / 100)) / installmentMonths;

        const installmentResult = await client.query(
            'INSERT INTO installments (customer_id, product_id, credit_card_id, due_date, monthly_payment, total_amount, interest_rate, term_months, status, late_fee, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING id, start_date',
            [customerId, productId, creditCardId, paymentDueDate, monthlyPayment, totalAmount, interestRate, installmentMonths, 'active', lateFee]
        );
        const installmentId = installmentResult.rows[0].id;
        const startDate = new Date(installmentResult.rows[0].start_date);

        // 3. Create installment payments
        const paymentDay = parseInt(paymentDueDate, 10);

        for (let i = 1; i <= installmentMonths; i++) {
            const actualDueDate = new Date(startDate);
            actualDueDate.setMonth(actualDueDate.getMonth() + i);
            actualDueDate.setDate(paymentDay);

            await client.query(
                'INSERT INTO installment_payments (installment_id, term_number, due_date, amount, is_paid, notification_sent) VALUES ($1, $2, $3, $4, $5, $6)',
                [installmentId, i, actualDueDate, monthlyPayment, false, false]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Installment plan created successfully', installmentId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create installment plan' });
    } finally {
        client.release();
    }
});

export default router;