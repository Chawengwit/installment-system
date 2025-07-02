const express = require('express');
const path = require('path');
const router = express.Router();

const pathToFrontend = path.join(__dirname, '../../frontend');

router.get('/', (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/index.html'));
});

router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/dashboard.html'));
});

router.get('/customers', (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/customers.html'));
});

router.get('/credit-cards', (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/credit-cards.html'));
});

module.exports = router;
