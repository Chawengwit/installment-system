import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET all credit cards
router.get('/', async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    try {
        const { rows } = await query('SELECT * FROM credit_cards ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const total = await query('SELECT COUNT(*) FROM credit_cards');
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
