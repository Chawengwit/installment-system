require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const productRoutes = require('./routes/products');

// Middleware
app.use(cors());
app.use(express.json());

// Correct frontend path
const pathToFrontend = path.join(__dirname, '../frontend');

app.use(express.static(path.join(pathToFrontend, 'public')));
app.use('/js', express.static(path.join(pathToFrontend, 'js')));
app.use('/dist', express.static(path.join(pathToFrontend, 'dist')));

// Frontend route
app.get('/', (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/index.html'));
});

app.get('/customers', (req, res) => {
    res.sendFile(path.join(pathToFrontend, '/public/customers.html'));
});

// API routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});
app.use('/api/products', productRoutes);

module.exports = app;
