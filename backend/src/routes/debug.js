// Debug endpoint to check environment variables on the server
import express from 'express';

const router = express.Router();

// Debug endpoint to check environment variables
router.get('/debug', (req, res) => {
  res.json({
    environmentCheck: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      PINATA_API_KEY: process.env.PINATA_API_KEY ? 'PRESENT' : 'MISSING',
      PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY ? 'PRESENT' : 'MISSING',
      PINATA_JWT: process.env.PINATA_JWT ? 'PRESENT' : 'MISSING',
      CORS_ORIGIN: process.env.CORS_ORIGIN
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
