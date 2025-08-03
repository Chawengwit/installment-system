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
            } else if (status === 'active') {
                whereClause += ` AND i.status = 'active'`;
            } else if (status === 'non-active') {
                whereClause += ` AND i.status = 'non-active'`;
            } else if (status === 'completed') {
                whereClause += ` AND i.status = 'completed'`;
            } 
        }

        console.log("STATUS >>> ",  status);

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
                c.phone as customer_phone,
                i.total_amount,
                i.monthly_payment,
                (SELECT SUM(ip.paid_amount) FROM installment_payments ip WHERE ip.installment_id = i.id) as total_paid_amount,
                i.status,
                i.created_at,
                i.term_months,
                (SELECT ip.due_date FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY ip.due_date ASC LIMIT 1) as next_due_date,
                (SELECT ip.term_number FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY ip.due_date ASC LIMIT 1) as next_due_date_term_number
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

// GET /api/installments/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const installmentQuery = `
            SELECT
                i.id,
                i.total_amount,
                i.monthly_payment,
                i.interest_rate,
                i.term_months,
                i.status,
                i.start_date,
                i.due_date,
                i.late_fee,
                c.id as customer_id,
                c.name as customer_name,
                c.phone as customer_phone,
                c.id_card_number as customer_id_card_number,
                c.nickname as customer_nickname,
                p.name as product_name,
                p.serial_number as product_serial_number,
                p.price as product_price,
                (p.price - i.total_amount) as down_payment,
                p.description as product_description,
                p.images as product_images,
                cc.card_name,
                cc.credit_limit
            FROM installments i
            JOIN customers c ON i.customer_id = c.id
            JOIN products p ON i.product_id = p.id
            JOIN credit_cards cc ON i.credit_card_id = cc.id
            WHERE i.id = $1
        `;
        const installmentResult = await pool.query(installmentQuery, [id]);

        if (installmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Installment plan not found' });
        }

        const installment = installmentResult.rows[0];

        const paymentsQuery = `
            SELECT term_number, due_date, amount, paid_amount, is_paid
            FROM installment_payments
            WHERE installment_id = $1
            ORDER BY term_number ASC
        `;
        const paymentsResult = await pool.query(paymentsQuery, [id]);
        installment.payment_schedule = paymentsResult.rows;

        // Fetch customer details
        const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [installment.customer_id]);
        const customer = customerResult.rows.length > 0 ? customerResult.rows[0] : null;

        res.json({ installment, customer });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch installment details' });
    }
});

router.put('/:id', upload.array('productImages', 5), async (req, res) => {
    const { id } = req.params;
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

    const downPayment = parseFloat(req.body.downPayment) || 0;
    const interestRate = parseFloat(req.body.interestRate) || 0;
    const lateFee = req.body.lateFee ? parseFloat(req.body.lateFee) : null;

    const productImages = req.files ? req.files.map(file => file.filename) : [];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const installment = await client.query('SELECT * FROM installments WHERE id = $1', [id]);

        // 1. Update Product
        const productResult = await client.query(
            'UPDATE products SET name = $1, serial_number = $2, price = $3, description = $4, images = $5, updated_at = NOW() WHERE id = $6 RETURNING id',
            [productName, productSerialNumber, productPrice, productDescription, JSON.stringify(productImages), installment.rows[0].product_id]
        );
        const productId = productResult.rows[0].id;

        // 2. Update Installment plan
        const totalAmount = parseFloat(productPrice) - downPayment;
        const monthlyPayment = (totalAmount * (1 + interestRate / 100)) / installmentMonths;

        await client.query(
            'UPDATE installments SET customer_id = $1, product_id = $2, credit_card_id = $3, due_date = $4, monthly_payment = $5, total_amount = $6, interest_rate = $7, term_months = $8, status = $9, late_fee = $10, updated_at = NOW() WHERE id = $11',
            [customerId, productId, creditCardId, paymentDueDate, monthlyPayment, totalAmount, interestRate, installmentMonths, 'non-active', lateFee, id]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Installment plan updated successfully', installmentId: id });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update installment plan' });
    } finally {
        client.release();
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

    console.log("productImages: ", productImages);

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
            'INSERT INTO installments (customer_id, product_id, credit_card_id, due_date, monthly_payment, total_amount, interest_rate, term_months, status, late_fee, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING id',
            [customerId, productId, creditCardId, paymentDueDate, monthlyPayment, totalAmount, interestRate, installmentMonths, 'non-active', lateFee]
        );
        const installmentId = installmentResult.rows[0].id;

        // Update credit card used_amount and installment_status
        await client.query(
            'UPDATE credit_cards SET used_amount = used_amount + $1, installment_status = TRUE, updated_at = NOW() WHERE id = $2',
            [totalAmount, creditCardId]
        );

        // Update customer installment_status
        await client.query(
            'UPDATE customers SET installment_status = TRUE, updated_at = NOW() WHERE id = $1',
            [customerId]
        );

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

router.put('/installment-payments/:id/mark-paid', async (req, res) => {
    const { id } = req.params;
    const { paid_amount, installment_id } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update the specific installment payment
        const updatePaymentQuery = `
            UPDATE installment_payments
            SET is_paid = TRUE, paid_date = NOW(), paid_amount = $1, updated_at = NOW()
            WHERE id = $2 RETURNING installment_id;
        `;
        const updatePaymentResult = await client.query(updatePaymentQuery, [paid_amount, id]);

        if (updatePaymentResult.rows.length === 0) {
            throw new Error('Installment payment not found.');
        }

        // 2. Update the used_amount on the associated credit card
        const updateCreditCardQuery = `
            UPDATE credit_cards
            SET used_amount = used_amount + $1, updated_at = NOW()
            WHERE id = (SELECT credit_card_id FROM installments WHERE id = $2);
        `;
        await client.query(updateCreditCardQuery, [paid_amount, installment_id]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Payment marked as paid successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to mark payment as paid' });
    } finally {
        client.release();
    }
});

export default router;