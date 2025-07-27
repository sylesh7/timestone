// Emergency Pinata route with fresh environment loading
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';

const router = express.Router();

// Emergency Pinata upload that bypasses service caching
router.post('/emergency-upload', async (req, res) => {
  try {
    // Force fresh environment loading
    dotenv.config();
    
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
    const pinataJWT = process.env.PINATA_JWT;
    
    console.log('Emergency Upload - Credentials Check:');
    console.log('API Key:', pinataApiKey ? 'PRESENT' : 'MISSING');
    console.log('Secret Key:', pinataSecretApiKey ? 'PRESENT' : 'MISSING');
    console.log('JWT:', pinataJWT ? 'PRESENT' : 'MISSING');
    
    if (!pinataApiKey || !pinataSecretApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Emergency route: Pinata API credentials still not configured',
        debug: {
          apiKey: !!pinataApiKey,
          secretKey: !!pinataSecretApiKey,
          jwt: !!pinataJWT
        }
      });
    }

    const { data, filename, metadata } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: data'
      });
    }

    // Create fresh axios instance
    const axiosInstance = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
        'Authorization': `Bearer ${pinataJWT}`
      }
    });

    // Convert data to buffer
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
    
    const formData = new FormData();
    
    // Add the file data
    formData.append('file', dataBuffer, {
      filename: filename || `emergency_upload_${Date.now()}.dat`,
      contentType: 'application/octet-stream'
    });

    // Add metadata
    const pinataMetadata = {
      name: filename || `emergency_upload_${Date.now()}.dat`,
      keyvalues: {
        project: 'QNet-Lite-TimeCapsule-Emergency',
        emergency: 'true',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Upload to Pinata
    const response = await axiosInstance.post('/pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.json({
      success: true,
      emergency: true,
      pinata: {
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        filename: filename,
        gateway: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
      },
      message: 'Emergency Pinata upload successful'
    });

  } catch (error) {
    console.error('Emergency Pinata upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: `Emergency Pinata upload failed: ${error.response?.data?.error || error.message}`,
      emergency: true
    });
  }
});

export default router;
