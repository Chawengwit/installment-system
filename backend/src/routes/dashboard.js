import { Router } from 'express';
import { pool } from '../db/index.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        // Today Due Date Installments
        const todayDueDateResult = await pool.query(`
            SELECT COUNT(DISTINCT i.id)
            FROM installments i
            JOIN installment_payments ip ON i.id = ip.installment_id
            WHERE ip.is_paid = false AND ip.due_date = CURRENT_DATE;
        `);
        const todayDueDateCount = parseInt(todayDueDateResult.rows[0].count, 10);

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

        // Upcoming Payments
        let upcomingQuery = `
            SELECT SUM(amount) as upcoming_total
            FROM installment_payments
            WHERE is_paid = false`;
        const upcomingParams = [];

        if (startDate && endDate) {
            upcomingQuery += ` AND due_date BETWEEN $1 AND $2`;
            upcomingParams.push(startDate, endDate);
        }

        const upcomingResult = await pool.query(upcomingQuery, upcomingParams);
        const cashFlow = parseFloat(upcomingResult.rows[0].upcoming_total || 0);

        res.json({
            todayDueDateCount,
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