import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import frontendRoutes from './routes/frontend.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define paths
const pathToBackendPublic = join(__dirname, '..', 'public');
const pathToFrontend = join(__dirname, '..', 'frontend');
const pathToFrontendPublic = join(pathToFrontend, 'public');
const pathToFrontendJs = join(pathToFrontend, 'js');
const pathToFrontendDist = join(pathToFrontend, 'dist');

// Serve static files
app.use(express.static(pathToBackendPublic)); // For uploads
app.use(express.static(pathToFrontendPublic)); // For index.html, nav.html, and pages/*.html
app.use('/js', express.static(pathToFrontendJs));
app.use('/dist', express.static(pathToFrontendDist));

// Frontend routes
app.use('/', frontendRoutes);

// API routes
app.use('/api', apiRoutes);

export default app;