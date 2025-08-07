import { Router } from 'express';
import creditCardRoutes from './credit-cards.js';
import customerRoutes from './customers.js';
import installmentRoutes from './installments.js';
import productRoutes from './products.js';
import dashboardRouter from './dashboard.js';
import installmentPaymentRouter from './installment-payment.js';

const router = Router();

router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/credit-cards', creditCardRoutes);
router.use('/installments', installmentRoutes);
router.use('/dashboard', dashboardRouter);
router.use('/installment-payment', installmentPaymentRouter);

export default router;