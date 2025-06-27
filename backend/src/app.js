require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');

const productRoutes = require('./routes/products');

app.use(cors());
app.use(express.json());

//example api
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/products', productRoutes);

module.exports = app;