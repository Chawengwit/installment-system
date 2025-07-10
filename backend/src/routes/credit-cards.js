import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET all credit cards
router.get('/', async (req, res) => {
    const { limit = 10, offset = 0, installment_status } = req.query;

    console.log("## AA", limit, offset, installment_status);

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

    if (filters.length > 0) {
        whereClause = ' WHERE ' + filters.join(' AND ');
    }

    const creditCardQuery = `
        SELECT * ${baseQuery}
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    console.log("## Query: ", creditCardQuery);

    queryParams.push(limit);
    queryParams.push(offset);

    const countQuery = `
        SELECT COUNT(*) ${baseQuery}
        ${whereClause}
    `;

    const countParams = queryParams.slice(0, filters.length); // ส่งเฉพาะพารามิเตอร์ของ WHERE

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
    const { card_name, card_number, credit_limit } = req.body;
    if (!card_name || !card_number || !credit_limit) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const existingCard = await query('SELECT id FROM credit_cards WHERE card_number = $1', [card_number]);
        if (existingCard.rows.length > 0) {
            return res.status(409).json({ error: 'Credit card number already exists' });
        }
        const { rows } = await query(
            'INSERT INTO credit_cards (card_name, card_number, credit_limit) VALUES ($1, $2, $3) RETURNING *',
            [card_name, card_number, credit_limit]
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
    const { card_name, card_number, credit_limit } = req.body;

    if (!card_name || !card_number || !credit_limit) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const existingCard = await query('SELECT id FROM credit_cards WHERE card_number = $1 AND id != $2', [card_number, id]);
        if (existingCard.rows.length > 0) {
            return res.status(409).json({ error: 'Credit card number already exists' });
        }
        const { rows } = await query(
            'UPDATE credit_cards SET card_name = $1, card_number = $2, credit_limit = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [card_name, card_number, credit_limit, id]
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

// DELETE a credit card by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
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
