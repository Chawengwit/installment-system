import { Router } from 'express';
import { pool } from '../db/index.js';
import multer from 'multer';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname) //Appending extension
    }
});

const upload = multer({ storage: storage });

router.put('/:id/mark-paid', upload.single('slip_image'), async (req, res, next) => {
    const { id } = req.params;
    const { paid_amount, installment_id } = req.body;

    console.log("AAAAA");

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update the specific installment payment
        const updatePaymentQuery = `
            UPDATE installment_payments
            SET is_paid = TRUE, paid_date = NOW(), paid_amount = $1, updated_at = NOW() ${req.file ? `, slip_image = '${req.file.filename}'` : ''}
            WHERE id = $2 RETURNING installment_id;
        `;
        const updatePaymentResult = await client.query(updatePaymentQuery, [paid_amount, id]);

        if (updatePaymentResult.rows.length === 0) {
            throw new Error('Installment payment not found.');
        }

        // 2. Get installment details to calculate the principal amount for this payment
        const installmentDetailsQuery = `
            SELECT
                i.credit_card_id,
                i.product_id,
                i.term_months,
                p.price as product_price
            FROM installments i
            JOIN products p ON i.product_id = p.id
            WHERE i.id = $1;
        `;
        const installmentDetailsResult = await client.query(installmentDetailsQuery, [installment_id]);

        if (installmentDetailsResult.rows.length === 0) {
            throw new Error('Installment details not found for the given installment_id.');
        }

        const { credit_card_id, product_price, term_months } = installmentDetailsResult.rows[0];
        const principalAmountPerPayment = parseFloat(product_price) / parseInt(term_months, 10);

        // 3. Update the used_amount on the associated credit card
        const updateCreditCardQuery = `
            UPDATE credit_cards
            SET used_amount = used_amount - $1, updated_at = NOW()
            WHERE id = $2;
        `;
        await client.query(updateCreditCardQuery, [principalAmountPerPayment, credit_card_id]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Payment marked as paid successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        next(err); // Pass database errors to the centralized error handler
    } finally {
        client.release();
    }
});

export default router;
