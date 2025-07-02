const express = require('express');
const router = express.Router();
const productRoutes = require('./products');

router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

router.use('/products', productRoutes);

module.exports = router;
