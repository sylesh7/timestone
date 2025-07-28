// Debug endpoint to check environment variables on the server
import express from 'express';
import TimeCapsuleService from '../services/timeCapsuleService.js';
import PinataService from '../services/pinataService.js';

const router = express.Router();
const timeCapsuleService = new TimeCapsuleService();
const pinataService = new PinataService();

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

// Debug endpoint to check capsules in memory
router.get('/capsules', (req, res) => {
  try {
    const capsules = Array.from(timeCapsuleService.capsules.entries()).map(([id, capsule]) => ({
      id,
      fileName: capsule.fileName,
      createdAt: capsule.metadata.createdAt,
      unlockTimestamp: capsule.metadata.unlockTimestamp,
      status: capsule.metadata.status,
      ipfsHash: capsule.ipfsHash,
      hasPrivateKey: !!capsule.privateKey
    }));

    res.json({
      success: true,
      capsuleCount: capsules.length,
      capsules,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check Pinata files
router.get('/pinata-files', async (req, res) => {
  try {
    const status = await pinataService.getStatus();
    let files = [];
    
    if (status.authenticated) {
      const pinnedFiles = await pinataService.listPinnedFiles({ limit: 20 });
      files = pinnedFiles.files;
    }

    res.json({
      success: true,
      pinataStatus: status,
      fileCount: files.length,
      files,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to test capsule recovery
router.get('/recover-capsule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recovered = await timeCapsuleService.recoverCapsuleFromIPFS(id);
    
    res.json({
      success: true,
      capsuleId: id,
      recovered: !!recovered,
      capsule: recovered,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
