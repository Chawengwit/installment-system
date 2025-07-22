import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET all credit cards
router.get('/', async (req, res) => {
    const { limit = 10, offset = 0, installment_status, search } = req.query;

    let baseQuery = 'FROM credit_cards';
    let whereClause = '';
    const filters = [];
    const queryParams = [];
    let paramIndex = 1;

    if (installment_status !== undefined) {
        filters.push(`installment_status = $${paramIndex}`);
        queryParams.push(installment_status === 'true');
        paramIndex++;
    }

    if (search) {
        filters.push(`card_name ILIKE $${paramIndex}`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    if (filters.length > 0) {
        whereClause = ' WHERE ' + filters.join(' AND ');
    }

    const creditCardQuery = `
        SELECT * ${baseQuery}
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit);
    queryParams.push(offset);

    const countQuery = `
        SELECT COUNT(*) ${baseQuery}
        ${whereClause}
    `;

    const countParams = queryParams.slice(0, filters.length);

    try {
        const { rows } = await query(creditCardQuery, queryParams);
        const total = await query(countQuery, countParams);
        res.json({ credit_cards: rows, total: total.rows[0].count });
    } catch (error) {
        console.error('Error fetching credit cards:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET a single credit card by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await query('SELECT * FROM credit_cards WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Credit card not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error fetching credit card ${id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new credit card
router.post('/', async (req, res) => {
    const { card_name, credit_limit } = req.body;
    if (!card_name || !credit_limit) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows } = await query(
            'INSERT INTO credit_cards (card_name, credit_limit) VALUES ($1, $2) RETURNING *',
            [card_name, credit_limit]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating credit card:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT (update) a credit card by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, credit_limit } = req.body;

    if (!card_name || !credit_limit) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows } = await query(
            'UPDATE credit_cards SET card_name = $1, credit_limit = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [card_name, credit_limit, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Credit card not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating credit card ${id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/installments', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await query(`
            SELECT 
                i.id, 
                i.status, 
                i.total_amount, 
                i.term_months,
                (SELECT COUNT(*) FROM installment_payments WHERE installment_id = i.id AND is_paid = true) as paid_terms, 
                p.name as product_name, 
                c.name as customer_name,
                (SELECT SUM(amount) FROM installment_payments WHERE installment_id = i.id AND is_paid = false) as outstanding_debt
            FROM installments i
            JOIN products p ON i.product_id = p.id
            JOIN customers c ON i.customer_id = c.id
            WHERE i.credit_card_id = $1
            ORDER BY i.created_at DESC
        `, [id]);
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching installments for credit card ${id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a credit card by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await query('SELECT installment_status FROM credit_cards WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Credit card not found' });
        }

        if (rows[0].installment_status) {
            return res.status(409).json({ error: 'Cannot delete a credit card that is currently in use.' });
        }

        const result = await query('DELETE FROM credit_cards WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Credit card not found' });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error(`Error deleting credit card ${id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
