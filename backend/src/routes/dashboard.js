import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // Total Customers
        const customerResult = await pool.query('SELECT COUNT(*) FROM customers');
        const totalCustomers = parseInt(customerResult.rows[0].count, 10);

        // Overdue Installments
        const overdueResult = await pool.query(`
            SELECT COUNT(DISTINCT i.id)
            FROM installments i
            JOIN installment_payments ip ON i.id = ip.installment_id
            WHERE i.status = 'active' AND ip.is_paid = false AND ip.due_date < CURRENT_DATE;
        `);
        const overdueCount = parseInt(overdueResult.rows[0].count, 10);

        // Available Credit
        const creditResult = await pool.query('SELECT SUM(credit_limit - used_amount) as available_credit FROM credit_cards');
        const availableCredit = parseFloat(creditResult.rows[0].available_credit || 0);

        // Cash Flow (this month)
        const cashFlowResult = await pool.query(`
            SELECT SUM(paid_amount) as current_month_cash_flow
            FROM installment_payments
            WHERE is_paid = true AND DATE_TRUNC('month', paid_date) = DATE_TRUNC('month', CURRENT_DATE);
        `);
        const cashFlow = parseFloat(cashFlowResult.rows[0].current_month_cash_flow || 0);

        res.json({
            totalCustomers,
            overdueCount,
            availableCredit,
            cashFlow
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

export default router;