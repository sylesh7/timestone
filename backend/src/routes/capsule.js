import express from 'express';
import multer from 'multer';
import TimeCapsuleService from '../services/timeCapsuleService.js';

const router = express.Router();
const timeCapsuleService = new TimeCapsuleService();

// Configure multer for file uploads with multimedia support
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos and large files
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

/**
 * Create a new time capsule with multimedia support
 * POST /api/capsule/create
 * Body: multipart/form-data with file and metadata
 * Supports: Videos, Audio, Images, Documents, and any file type
 */
router.post('/create', upload.single('file'), async (req, res) => {
  try {
    const {
      unlockTimestamp,
      recipientAddress,
      creatorAddress,
      message
    } = req.body;

    // Validate required fields
    if (!unlockTimestamp || !recipientAddress || !creatorAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: unlockTimestamp, recipientAddress, creatorAddress'
      });
    }

    // Validate unlock timestamp is in the future
    const unlockTime = new Date(unlockTimestamp);
    if (unlockTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Unlock timestamp must be in the future'
      });
    }

    // Get file data
    const fileBuffer = req.file ? req.file.buffer : Buffer.from(message || '', 'utf8');
    const fileName = req.file ? req.file.originalname : 'message.txt';
    const fileType = req.file ? req.file.mimetype : 'text/plain';

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No file or message content provided'
      });
    }

    // Create time capsule
    const result = await timeCapsuleService.createTimeCapsule({
      fileBuffer,
      fileName,
      fileType,
      unlockTimestamp,
      recipientAddress,
      creatorAddress,
      message: message || ''
    });

    res.json({
      success: true,
      capsule: result.capsule,
      privateKey: result.privateKey,
      message: 'Time capsule created successfully. Save your private key securely!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get service statistics
 * GET /api/capsule/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const result = timeCapsuleService.getStats();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get capsule metadata
 * GET /api/capsule/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing capsule ID'
      });
    }

    const result = timeCapsuleService.getCapsuleMetadata(id);
    
    res.json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Unlock time capsule
 * POST /api/capsule/unlock
 * Body: { capsuleId: string, privateKey: string, requesterAddress: string }
 */
router.post('/unlock', async (req, res) => {
  try {
    const { capsuleId, privateKey, requesterAddress } = req.body;

    if (!capsuleId || !privateKey || !requesterAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: capsuleId, privateKey, requesterAddress'
      });
    }

    const result = await timeCapsuleService.unlockTimeCapsule(
      capsuleId,
      privateKey,
      requesterAddress
    );

    // Convert file buffer to base64 for JSON response
    const fileContent = result.content.fileBuffer.toString('base64');
    
    res.json({
      success: true,
      content: {
        fileContent,
        fileName: result.content.metadata.name,
        fileType: result.content.metadata.originalType || result.content.metadata.detectedType || 'application/octet-stream',
        fileSize: result.content.metadata.size || result.content.fileBuffer?.length || 0,
        message: result.content.message
      },
      capsuleInfo: result.capsuleInfo,
      message: 'Time capsule unlocked successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate private key for a capsule (before unlocking)
 * POST /api/capsule/validate-key
 * Body: { capsuleId: string, privateKey: string }
 */
router.post('/validate-key', async (req, res) => {
  try {
    const { capsuleId, privateKey } = req.body;

    if (!capsuleId || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: capsuleId, privateKey'
      });
    }

    // Get capsule metadata
    const capsuleResult = await timeCapsuleService.getCapsuleMetadata(capsuleId);
    
    if (!capsuleResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Capsule not found'
      });
    }

    // Try to validate the private key by checking if it matches the public key format
    // This is a basic validation - full validation happens during unlock
    try {
      const parsedPrivateKey = JSON.parse(privateKey);
      const isValidFormat = parsedPrivateKey.x25519 && parsedPrivateKey.rsa && parsedPrivateKey.algorithm;
      
      res.json({
        success: true,
        valid: isValidFormat,
        capsule: capsuleResult.capsule,
        canUnlock: capsuleResult.canUnlock,
        message: isValidFormat ? 'Private key format is valid' : 'Private key format is invalid'
      });
    } catch (parseError) {
      res.json({
        success: true,
        valid: false,
        message: 'Private key is not in valid JSON format'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get user's capsules
 * GET /api/capsule/user/:address
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing user address'
      });
    }

    const result = timeCapsuleService.getUserCapsules(address);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check if capsule can be unlocked (time-based check)
 * GET /api/capsule/:id/can-unlock
 */
router.get('/:id/can-unlock', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing capsule ID'
      });
    }

    const result = await timeCapsuleService.getCapsuleMetadata(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      capsuleId: id,
      canUnlock: result.canUnlock,
      unlockTimestamp: result.capsule.metadata.unlockTimestamp,
      currentTime: new Date().toISOString(),
      timeRemaining: result.canUnlock ? 0 : new Date(result.capsule.metadata.unlockTimestamp).getTime() - new Date().getTime()
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check if capsule can be unlocked
 * GET /api/capsule/:id/can-unlock
 */
router.get('/:id/can-unlock', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing capsule ID'
      });
    }

    const result = timeCapsuleService.getCapsuleMetadata(id);
    
    res.json({
      success: true,
      capsuleId: id,
      canUnlock: result.canUnlock,
      unlockTimestamp: result.capsule.metadata.unlockTimestamp,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
