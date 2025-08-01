import { Router } from 'express';
import creditCardRoutes from './credit-cards.js';
import customerRoutes from './customers.js';
import installmentRoutes from './installments.js';
import productRoutes from './products.js';
import dashboardRouter from './dashboard.js';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/credit-cards', creditCardRoutes);
router.use('/installments', installmentRoutes);
router.use('/dashboard', dashboardRouter);

export default router;