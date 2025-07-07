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

// Define paths
const pathToBackendPublic = path.join(__dirname, '..', 'public');
const pathToFrontend = path.join(__dirname, '..', 'frontend');
const pathToFrontendPublic = path.join(pathToFrontend, 'public');
const pathToFrontendJs = path.join(pathToFrontend, 'js');
const pathToFrontendDist = path.join(pathToFrontend, 'dist');

// Serve static files
app.use(express.static(pathToBackendPublic)); // For uploads
app.use(express.static(pathToFrontendPublic)); // For index.html, nav.html, and pages/*.html
app.use('/js', express.static(pathToFrontendJs));
app.use('/dist', express.static(pathToFrontendDist));

// Frontend routes
app.use('/', frontendRoutes);

// API routes
app.use('/api', apiRoutes);

module.exports = app;
