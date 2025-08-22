import express from 'express';
import PinataService from '../services/pinataService.js';

const router = express.Router();
const pinataService = new PinataService();

/**
 * Upload data to Pinata IPFS
 * POST /api/pinata/upload
 * Body: { data: string|base64, filename?: string, metadata?: object }
 */
router.post('/upload', async (req, res) => {
  try {
    const { data, filename, metadata } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: data'
      });
    }

    // Convert data to buffer
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
    
    const result = await pinataService.uploadToPinata(
      dataBuffer, 
      filename || `upload_${Date.now()}.dat`,
      metadata || {}
    );
    
    res.json({
      success: true,
      pinata: result,
      message: 'Data uploaded to Pinata IPFS successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download data from Pinata IPFS
 * GET /api/pinata/download/:ipfsHash
 */
router.get('/download/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;

    if (!ipfsHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: ipfsHash'
      });
    }

    const data = await pinataService.downloadFromPinata(ipfsHash);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="download_${ipfsHash}.dat"`);
    res.send(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Pinata status
 * GET /api/pinata/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await pinataService.getStatus();
    
    res.json({
      success: true,
      pinata: status,
      message: 'Pinata status retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List pinned files on Pinata
 * GET /api/pinata/list
 */
router.get('/list', async (req, res) => {
  try {
    const { limit, offset, metadata } = req.query;
    
    const options = {
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0
    };
    
    if (metadata) {
      options.metadata = JSON.parse(metadata);
    }

    const result = await pinataService.listPinnedFiles(options);
    
    res.json({
      success: true,
      files: result,
      message: 'Pinned files retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Upload time capsule to Pinata IPFS
 * POST /api/pinata/capsule
 * Body: { capsuleData: object }
 */
router.post('/capsule', async (req, res) => {
  try {
    const { capsuleData } = req.body;

    if (!capsuleData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: capsuleData'
      });
    }

    const result = await pinataService.uploadTimeCapsule(capsuleData);
    
    res.json({
      success: true,
      capsule: result,
      message: 'Time capsule uploaded to Pinata IPFS successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download time capsule from Pinata IPFS
 * GET /api/pinata/capsule/:ipfsHash
 */
router.get('/capsule/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;

    if (!ipfsHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: ipfsHash'
      });
    }

    const capsuleData = await pinataService.downloadTimeCapsule(ipfsHash);
    
    res.json({
      success: true,
      capsule: capsuleData,
      message: 'Time capsule downloaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get file metadata from Pinata
 * GET /api/pinata/metadata/:ipfsHash
 */
router.get('/metadata/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;

    if (!ipfsHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: ipfsHash'
      });
    }

    const metadata = await pinataService.getFileMetadata(ipfsHash);
    
    res.json({
      success: true,
      metadata: metadata,
      message: 'File metadata retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Unpin file from Pinata
 * DELETE /api/pinata/unpin/:ipfsHash
 */
router.delete('/unpin/:ipfsHash', async (req, res) => {
  try {
    const { ipfsHash } = req.params;

    if (!ipfsHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: ipfsHash'
      });
    }

    const result = await pinataService.unpinFile(ipfsHash);
    
    res.json({
      success: true,
      result: result,
      message: 'File unpinned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
