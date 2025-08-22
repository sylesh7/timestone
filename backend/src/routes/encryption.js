import express from 'express';
import KyberEncryptionService from '../services/kyberEncryption.js';

const router = express.Router();
const encryptionService = new KyberEncryptionService();

/**
 * Generate new Kyber key pair
 * POST /api/encrypt/keypair
 */
router.post('/keypair', async (req, res) => {
  try {
    const keyPair = encryptionService.generateKeyPair();
    
    res.json({
      success: true,
      keyPair: {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        algorithm: keyPair.algorithm,
        createdAt: keyPair.createdAt
      },
      message: 'Key pair generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Encrypt data with public key
 * POST /api/encrypt/data
 * Body: { data: string|base64, publicKey: string }
 */
router.post('/data', async (req, res) => {
  try {
    const { data, publicKey } = req.body;

    if (!data || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: data, publicKey'
      });
    }

    const encryptionResult = encryptionService.encrypt(data, publicKey);
    
    res.json({
      success: true,
      encrypted: encryptionResult,
      message: 'Data encrypted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Decrypt data with private key
 * POST /api/encrypt/decrypt
 * Body: { encryptedData: object, privateKey: string }
 */
router.post('/decrypt', async (req, res) => {
  try {
    const { encryptedData, privateKey } = req.body;

    if (!encryptedData || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: encryptedData, privateKey'
      });
    }

    const decryptedData = encryptionService.decrypt(encryptedData, privateKey);
    
    res.json({
      success: true,
      decrypted: decryptedData.toString(),
      size: decryptedData.length,
      message: 'Data decrypted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate key pair
 * POST /api/encrypt/validate
 * Body: { publicKey: string, privateKey: string }
 */
router.post('/validate', async (req, res) => {
  try {
    const { publicKey, privateKey } = req.body;

    if (!publicKey || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: publicKey, privateKey'
      });
    }

    const isValid = encryptionService.validateKeyPair(publicKey, privateKey);
    
    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Key pair is valid' : 'Key pair is invalid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get encryption info
 * GET /api/encrypt/info
 */
router.get('/info', (req, res) => {
  try {
    res.json({
      success: true,
      info: {
        algorithm: encryptionService.KYBER_VARIANT,
        description: 'Post-Quantum Encryption using Kyber + AES-256-GCM',
        keySize: 3072,
        aesKeySize: encryptionService.AES_KEY_SIZE * 8, // bits
        ivSize: encryptionService.IV_SIZE * 8, // bits
        features: [
          'Quantum-resistant key encapsulation',
          'AES-256-GCM data encryption',
          'Authenticated encryption',
          'Future-proof cryptography'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
