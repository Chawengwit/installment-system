const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST /api/customers
router.post('/', upload.single('idCard'), async (req, res) => {
    const { name, phone, address } = req.body;
    const id_card_image = req.file ? '/uploads/' + path.basename(req.file.path) : null;

    // ✅ This is the validation part added
    if (!name || !phone || !address) {
        return res.status(400).json({ error: 'Some params are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO customers (name, phone, address, id_card_image) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, address, id_card_image]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

module.exports = router;