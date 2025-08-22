import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

class PinataService {
  constructor() {
    // Force reload environment variables
    dotenv.config();
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
    this.pinataJWT = process.env.PINATA_JWT;
    this.baseURL = 'https://api.pinata.cloud';
    
    // Configure axios with authentication
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'pinata_api_key': this.pinataApiKey,
        'pinata_secret_api_key': this.pinataSecretApiKey,
        'Authorization': `Bearer ${this.pinataJWT}`
      }
    });
  }

  /**
   * Upload encrypted data to Pinata IPFS
   * @param {Buffer} data - Encrypted data to upload
   * @param {string} filename - Original filename
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Upload result with IPFS hash
   */
  async uploadToPinata(data, filename = 'encrypted_capsule.dat', metadata = {}) {
    try {
      // Force reload environment variables before upload
      dotenv.config();
      this.pinataApiKey = process.env.PINATA_API_KEY;
      this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
      this.pinataJWT = process.env.PINATA_JWT;
      
      // Recreate axios instance with fresh credentials
      this.axiosInstance = axios.create({
        baseURL: this.baseURL,
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretApiKey,
          'Authorization': `Bearer ${this.pinataJWT}`
        }
      });
      
      if (!this.pinataApiKey || !this.pinataSecretApiKey) {
        throw new Error('Pinata API credentials not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY');
      }

      const formData = new FormData();
      
      // Add the file data
      formData.append('file', data, {
        filename: filename,
        contentType: 'application/octet-stream'
      });

      // Minimal metadata to avoid Pinata's 10 key limit
      const pinataMetadata = {
        name: filename
        // No keyvalues to avoid Pinata limit
      };

      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Remove custom pinning options to avoid key limit issues
      // const pinataOptions = {
      //   cidVersion: 1,
      //   customPinPolicy: {
      //     regions: [
      //       {
      //         id: 'FRA1',
      //         desiredReplicationCount: 2
      //       },
      //       {
      //         id: 'NYC1', 
      //         desiredReplicationCount: 2
      //       }
      //     ]
      //   }
      // };
      // formData.append('pinataOptions', JSON.stringify(pinataOptions));

      // Upload to Pinata
      const response = await this.axiosInstance.post('/pinning/pinFileToIPFS', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
        filename: filename,
        gateway: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        pinataUrl: `https://app.pinata.cloud/pinmanager?filter=${response.data.IpfsHash}`,
        uploadedAt: new Date().toISOString(),
        metadata: pinataMetadata
      };
    } catch (error) {
      console.error('Pinata upload error:', error.response?.data || error.message);
      throw new Error(`Pinata upload failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Retrieve data from Pinata IPFS using hash
   * @param {string} ipfsHash - IPFS hash
   * @returns {Promise<Buffer>} Retrieved data
   */
  async downloadFromPinata(ipfsHash) {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Pinata download failed: ${error.message}`);
    }
  }

  /**
   * Upload time capsule data (encrypted file + metadata) to Pinata
   * @param {Object} capsuleData - Complete capsule data
   * @returns {Promise<Object>} Upload result
   */
  async uploadTimeCapsule(capsuleData) {
    try {
      const capsuleJson = JSON.stringify(capsuleData, null, 2);
      const filename = `capsule_${capsuleData.id || Date.now()}.json`;
      
      // Don't pass any metadata to avoid Pinata's 10 key limit
      const metadata = {};
      
      const result = await this.uploadToPinata(Buffer.from(capsuleJson), filename, metadata);
      
      return {
        ...result,
        capsuleId: capsuleData.id,
        type: 'time_capsule'
      };
    } catch (error) {
      throw new Error(`Time capsule upload failed: ${error.message}`);
    }
  }

  /**
   * Download and parse time capsule data from Pinata
   * @param {string} ipfsHash - IPFS hash
   * @returns {Promise<Object>} Parsed capsule data
   */
  async downloadTimeCapsule(ipfsHash) {
    try {
      const data = await this.downloadFromPinata(ipfsHash);
      const capsuleData = JSON.parse(data.toString());
      
      return capsuleData;
    } catch (error) {
      throw new Error(`Time capsule download failed: ${error.message}`);
    }
  }

  /**
   * Get Pinata account status and usage
   * @returns {Promise<Object>} Pinata status
   */
  async getStatus() {
    try {
      // Force reload environment variables before status check
      dotenv.config();
      this.pinataApiKey = process.env.PINATA_API_KEY;
      this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
      this.pinataJWT = process.env.PINATA_JWT;
      
      // Recreate axios instance with fresh credentials
      this.axiosInstance = axios.create({
        baseURL: this.baseURL,
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretApiKey,
          'Authorization': `Bearer ${this.pinataJWT}`
        }
      });
      
      const status = {
        pinataConfigured: !!(this.pinataApiKey && this.pinataSecretApiKey),
        timestamp: new Date().toISOString()
      };

      if (status.pinataConfigured) {
        try {
          // Test authentication
          const testAuth = await this.axiosInstance.get('/data/testAuthentication');
          status.authenticated = testAuth.data.message === 'Congratulations! You are communicating with the Pinata API!';
          
          // Get account info
          const userInfo = await this.axiosInstance.get('/data/userPinnedDataTotal');
          status.totalPins = userInfo.data.pin_count;
          status.totalSize = userInfo.data.pin_size_total;
          status.sizeWithReplicationsTotal = userInfo.data.pin_size_with_replications_total;
          
        } catch (error) {
          status.authError = error.response?.data?.error || error.message;
        }
      }

      return status;
    } catch (error) {
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * List pinned files on Pinata
   * @param {Object} options - Query options
   * @returns {Promise<Object>} List of pinned files
   */
  async listPinnedFiles(options = {}) {
    try {
      const queryParams = {
        status: 'pinned',
        pageLimit: options.limit || 10,
        pageOffset: options.offset || 0,
        ...options
      };

      const response = await this.axiosInstance.get('/data/pinList', {
        params: queryParams
      });

      return {
        success: true,
        count: response.data.count,
        files: response.data.rows.map(file => ({
          ipfsHash: file.ipfs_pin_hash,
          size: file.size,
          timestamp: file.date_pinned,
          name: file.metadata?.name,
          keyvalues: file.metadata?.keyvalues
        }))
      };
    } catch (error) {
      throw new Error(`List files failed: ${error.message}`);
    }
  }

  /**
   * Unpin file from Pinata
   * @param {string} ipfsHash - IPFS hash to unpin
   * @returns {Promise<Object>} Unpin result
   */
  async unpinFile(ipfsHash) {
    try {
      await this.axiosInstance.delete(`/pinning/unpin/${ipfsHash}`);
      
      return {
        success: true,
        ipfsHash: ipfsHash,
        unpinnedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Unpin failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata from Pinata
   * @param {string} ipfsHash - IPFS hash
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(ipfsHash) {
    try {
      const response = await this.axiosInstance.get(`/data/pinList?hashContains=${ipfsHash}`);
      
      if (response.data.count === 0) {
        throw new Error('File not found');
      }
      
      const file = response.data.rows[0];
      return {
        success: true,
        ipfsHash: file.ipfs_pin_hash,
        size: file.size,
        timestamp: file.date_pinned,
        name: file.metadata?.name,
        keyvalues: file.metadata?.keyvalues
      };
    } catch (error) {
      throw new Error(`Get metadata failed: ${error.message}`);
    }
  }
}

export default PinataService;
