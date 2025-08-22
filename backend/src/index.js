import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import encryptionRoutes from './routes/encryption.js';
import pinataRoutes from './routes/ipfs.js'; // Renamed but keeping same path for compatibility
import capsuleRoutes from './routes/capsule.js';
import debugRoutes from './routes/debug.js';
import emergencyRoutes from './routes/emergency.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'QNet Lite Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/encrypt', encryptionRoutes);
app.use('/api/pinata', pinataRoutes);
app.use('/api/capsule', capsuleRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/emergency', emergencyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QNet Lite Backend running on port ${PORT}`);
  console.log(`🔐 Post-Quantum Encryption: Kyber-768-Simulation`);
  console.log(`📁 File Storage: Pinata IPFS`);
  console.log(`🎬 Supported: Videos, Audio, Images, Documents & More`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
