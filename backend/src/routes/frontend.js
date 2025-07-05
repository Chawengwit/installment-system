const express = require('express');
const path = require('path');
const router = express.Router();

const pathToFrontend = path.join(__dirname, '../../frontend');

// Serve the main application shell for all frontend routes
router.get([
    '/',
    '/dashboard',
    '/customers',
    '/credit-cards',
    '/installments',
    '/installments-create'
], (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/index.html'));
});

module.exports = router;