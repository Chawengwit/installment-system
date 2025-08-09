import { Router } from 'express';
import { pool } from '../db/index.js';
import multer from 'multer';
import { extname, join } from 'path';
import { promises as fs } from 'fs';

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
    const { search = '', status = 'all', limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC', startDate, endDate } = req.query;

    try {
        let whereClause = 'WHERE 1 = 1';
        const params = [];

        if (search) {
            whereClause += ` AND (c.name ILIKE $${params.length + 1} OR p.name ILIKE $${params.length + 1} OR p.serial_number ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        if (status !== 'all') {
            if (status === 'today_duedate') {
                whereClause += ` AND i.id IN (SELECT ip.installment_id FROM installment_payments ip WHERE ip.is_paid = false AND ip.due_date = CURRENT_DATE)`;
            } else if (status === 'over_due') {
                whereClause += ` AND i.status = 'active' AND i.id IN (SELECT ip.installment_id FROM installment_payments ip WHERE ip.is_paid = false AND ip.due_date < CURRENT_DATE)`;
            } else if (status === 'active') {
                whereClause += ` AND i.status = 'active'`;
            } else if (status === 'non-active') {
                whereClause += ` AND i.status = 'non-active'`;
            } else if (status === 'completed') {
                whereClause += ` AND i.status = 'completed'`;
            } 
        }

        if (startDate && endDate) {
            whereClause += ` AND i.created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
            params.push(startDate, endDate);
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
                c.phone as customer_phone,
                i.total_amount,
                i.monthly_payment,
                (SELECT SUM(ip.paid_amount) FROM installment_payments ip WHERE ip.installment_id = i.id) as total_paid_amount,
                i.status,
                i.created_at,
                i.term_months,
                (SELECT ip.due_date FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY CASE WHEN ip.due_date = CURRENT_DATE THEN 0 ELSE 1 END, ip.due_date ASC LIMIT 1) as next_due_date,
                (SELECT ip.term_number FROM installment_payments ip WHERE ip.installment_id = i.id AND ip.is_paid = false ORDER BY CASE WHEN ip.due_date = CURRENT_DATE THEN 0 ELSE 1 END, ip.due_date ASC LIMIT 1) as next_due_date_term_number
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
                i.customer_id,
                i.credit_card_id,
                i.total_amount,
                i.monthly_payment,
                i.interest_rate,
                i.term_months,
                i.status,
                i.start_date,
                i.due_date,
                i.late_fee,
                p.name as product_name,
                p.serial_number as product_serial_number,
                p.price as product_price,
                (p.price - i.total_amount) as down_payment,
                p.description as product_description,
                p.images as product_images
            FROM installments i
            JOIN products p ON i.product_id = p.id
            WHERE i.id = $1
        `;
        const installmentResult = await pool.query(installmentQuery, [id]);

        if (installmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Installment plan not found' });
        }

        const installment = installmentResult.rows[0];

        const paymentsQuery = `
            SELECT id, term_number, due_date, amount, paid_amount, is_paid
            FROM installment_payments
            WHERE installment_id = $1
            ORDER BY term_number ASC
        `;
        const paymentsResult = await pool.query(paymentsQuery, [id]);
        installment.payment_schedule = paymentsResult.rows;

        // Fetch customer details
        const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [installment.customer_id]);
        const customer = customerResult.rows.length > 0 ? customerResult.rows[0] : null;

        // Fetch credit card details
        const creditCardResult = await pool.query('SELECT * FROM credit_cards WHERE id = $1', [installment.credit_card_id]);
        const creditCard = creditCardResult.rows.length > 0 ? creditCardResult.rows[0] : null;

        // Fetch contract path
        const contractResult = await pool.query('SELECT contract_pdf FROM contracts WHERE installment_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
        installment.contract_path = contractResult.rows.length > 0 ? contractResult.rows[0].contract_pdf : null;

        res.json({ installment, customer, creditCard });

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

        // Get original installment data to access start_date
        const installmentResult = await client.query('SELECT * FROM installments WHERE id = $1', [id]);
        if (installmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Installment plan not found' });
        }
        const originalInstallment = installmentResult.rows[0];

        // 1. Update Product
        const productResult = await client.query(
            'UPDATE products SET name = $1, serial_number = $2, price = $3, description = $4, images = $5, updated_at = NOW() WHERE id = $6 RETURNING id',
            [productName, productSerialNumber, productPrice, productDescription, JSON.stringify(productImages), originalInstallment.product_id]
        );
        const productId = productResult.rows[0].id;

        // 2. Update Installment plan and set status to active
        const totalAmount = parseFloat(productPrice) - downPayment;
        const monthlyPayment = (totalAmount * (1 + interestRate / 100)) / installmentMonths;

        await client.query(
            'UPDATE installments SET customer_id = $1, product_id = $2, credit_card_id = $3, due_date = $4, monthly_payment = $5, total_amount = $6, interest_rate = $7, term_months = $8, status = $9, late_fee = $10, updated_at = NOW() WHERE id = $11',
            [customerId, productId, creditCardId, paymentDueDate, monthlyPayment, totalAmount, interestRate, installmentMonths, 'active', lateFee, id]
        );

        // 3. Delete old payment schedule
        await client.query('DELETE FROM installment_payments WHERE installment_id = $1', [id]);

        // 4. Create new payment schedule
        const startDate = new Date(originalInstallment.start_date);
        const paymentDay = parseInt(paymentDueDate, 10);

        for (let i = 1; i <= installmentMonths; i++) {
            const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, paymentDay);
            await client.query(
                'INSERT INTO installment_payments (installment_id, term_number, due_date, amount) VALUES ($1, $2, $3, $4)',
                [id, i, dueDate.toISOString().split('T')[0], monthlyPayment]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Installment plan updated and activated successfully', installmentId: id });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to update and activate installment plan' });
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Calculate total used amount for the credit card
        const totalUsedAmountResult = await client.query(
            `SELECT COALESCE(SUM(p.price), 0) AS total_used_amount
                FROM installments i
                JOIN products p ON i.product_id = p.id
                WHERE i.credit_card_id = $1`,
            [creditCardId]
        );
        const existingUsedAmount = parseFloat(totalUsedAmountResult.rows[0].total_used_amount);
        const newUsedAmount = existingUsedAmount + parseFloat(productPrice);

        // 2. Create new Product
        const productResult = await client.query(
            'INSERT INTO products (name, serial_number, price, description, images) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [productName, productSerialNumber, productPrice, productDescription, JSON.stringify(productImages)]
        );
        const productId = productResult.rows[0].id;

        // 3. Create new Installment plan
        const totalAmount = parseFloat(productPrice) - downPayment;
        const usedAmount = parseFloat(productPrice);
        const monthlyPayment = (totalAmount * (1 + interestRate / 100)) / installmentMonths;

        const installmentResult = await client.query(
            'INSERT INTO installments (customer_id, product_id, credit_card_id, due_date, monthly_payment, total_amount, interest_rate, term_months, status, late_fee, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING id',
            [customerId, productId, creditCardId, paymentDueDate, monthlyPayment, totalAmount, interestRate, installmentMonths, 'non-active', lateFee]
        );
        const installmentId = installmentResult.rows[0].id;

        // 4. Update credit card used_amount and installment_status
        await client.query(
            'UPDATE credit_cards SET used_amount = $1, installment_status = TRUE, updated_at = NOW() WHERE id = $2',
            [newUsedAmount, creditCardId]
        );

        // 5. Update customer installment_status
        await client.query(
            'UPDATE customers SET installment_status = TRUE, updated_at = NOW() WHERE id = $1',
            [customerId]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Installment plan created successfully', installmentId, customerId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create installment plan' });
    } finally {
        client.release();
    }
});

const contractDestination = 'public/contracts/';
const contractUpload = multer({ dest: contractDestination });

router.post('/:id/contract', contractUpload.single('contractPdf'), async (req, res) => {
    const { id: installmentId } = req.params;
    const { customerId } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ error: 'Contract file is missing.' });
    }
    const tempPath = req.file.path;

    if (!customerId) {
        await fs.unlink(tempPath);
        return res.status(400).json({ error: 'Missing customerId.' });
    }

    const newFilename = `contract-installment-${installmentId}-customer-${customerId}-${Date.now()}${extname(req.file.originalname)}`;
    const newPath = join(contractDestination, newFilename);

    try {
        // Rename the file from the temporary name to the desired name.
        await fs.rename(tempPath, newPath);

        await pool.query(
            'INSERT INTO contracts (customer_id, installment_id, contract_pdf) VALUES ($1, $2, $3)',
            [customerId, installmentId, newPath]
        );
        res.status(201).json({ message: 'Contract uploaded successfully', path: newPath });
    } catch (err) {
        // If anything fails after the file is uploaded, try to delete it.
        await fs.unlink(tempPath).catch(() => {}); // Clean up temp file if it still exists
        await fs.unlink(newPath).catch(() => {}); // Clean up renamed file if it was created
        console.error(err);
        res.status(500).json({ error: 'Failed to save contract information.' });
    }
});

export default router;
