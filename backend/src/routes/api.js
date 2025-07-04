const express = require('express');
const router = express.Router();
const productRoutes = require('./products');
const customertRoutes = require('./customers');


router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

router.use('/customers', customertRoutes);
router.use('/products', productRoutes);


module.exports = router;
