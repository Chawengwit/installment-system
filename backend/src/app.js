require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const frontendRoutes = require('./routes/frontend');

const apiRoutes = require('./routes/api');

// Middleware
app.use(cors());
app.use(express.json());

// Correct frontend path
const pathToFrontend = path.join(__dirname, '../frontend');

app.use(express.static(path.join(pathToFrontend, 'public')));
app.use('/js', express.static(path.join(pathToFrontend, 'js')));
app.use('/dist', express.static(path.join(pathToFrontend, 'dist')));

// Frontend routes
app.use('/', frontendRoutes);

// API routes
app.use('/api', apiRoutes);

module.exports = app;
