import { Router } from 'express';
import productRoutes from './products.js';
import customerRoutes from './customers.js';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

router.use('/customers', customerRoutes);
router.use('/products', productRoutes);

export default router;