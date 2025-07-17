import { Router } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const pathToFrontend = join(__dirname, '../../frontend');

// Serve the main application shell for all frontend routes
router.get([
    '/',
    '/dashboard',
    '/customers',
    '/credit-cards',
    '/installments-create'
], (req, res) => {
    res.sendFile(join(pathToFrontend, '/public/index.html'));
});

export default router;
