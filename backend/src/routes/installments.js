import { Router } from 'express';
import { pool } from '../db/index.js';
import multer from 'multer';
import { extname } from 'path';

const router = Router();

const upload = multer(); // Using memory storage for simplicity, as we are not saving the files in this route

// POST /api/installments
router.post('/', upload.array('productImages'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            productName,
            productSerialNumber,
            productPrice,
            productDescription,
            downPayment,
            installmentMonths,
            interestRate,
            paymentDueDate,
            lateFee,
            customerId,
            creditCardId
        } = req.body;

        const productImages = req.files ? req.files.map(file => '/uploads/' + file.filename) : [];

        // 1. Create Product
        const productResult = await client.query(
            'INSERT INTO products (name, serial_number, price, description, images) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [productName, productSerialNumber, productPrice, productDescription, JSON.stringify(productImages)]
        );
        const productId = productResult.rows[0].id;

        // 2. Create Installment Plan
        const totalAmount = parseFloat(productPrice) - parseFloat(downPayment);
        const installmentResult = await client.query(
            'INSERT INTO installments (customer_id, product_id, credit_card_id, start_date, total_amount, interest_rate, term_months, late_fee) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7) RETURNING id, start_date',
            [customerId, productId, creditCardId, totalAmount, interestRate, installmentMonths, lateFee]
        );
        const installmentId = installmentResult.rows[0].id;
        const startDate = new Date(installmentResult.rows[0].start_date);

        // 3. Create Installment Payments
        const monthlyPayment = (totalAmount * (1 + interestRate / 100)) / installmentMonths;
        for (let i = 1; i <= installmentMonths; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(paymentDueDate);

            await client.query(
                'INSERT INTO installment_payments (installment_id, term_number, due_date, amount) VALUES ($1, $2, $3, $4)',
                [installmentId, i, dueDate, monthlyPayment]
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