import { v4 as uuidv4 } from 'uuid';
import KyberEncryptionService from './kyberEncryption.js';
import PinataService from './pinataService.js';

class TimeCapsuleService {
  constructor() {
    this.encryption = new KyberEncryptionService();
    this.pinata = new PinataService();
    this.capsules = new Map(); // In-memory storage for demo (use database in production)
  }

  /**
   * Create a new time capsule
   * @param {Object} params - Capsule parameters
   * @returns {Promise<Object>} Created capsule info
   */
  async createTimeCapsule(params) {
    try {
      const {
        fileBuffer,
        fileName,
        fileType,
        unlockTimestamp,
        recipientAddress,
        creatorAddress,
        message
      } = params;

      // Generate unique capsule ID
      const capsuleId = uuidv4();

      // Generate Kyber key pair for this capsule
      const keyPair = this.encryption.generateKeyPair();

      // Prepare file metadata
      const fileMetadata = {
        name: fileName,
        type: fileType,
        originalSize: fileBuffer.length
      };

      // Encrypt the file
      const encryptedFile = this.encryption.encryptFile(
        fileBuffer,
        fileMetadata,
        keyPair.publicKey
      );

      // Create capsule data structure
      const capsuleData = {
        id: capsuleId,
        encryptedContent: encryptedFile,
        metadata: {
          fileName,
          fileType,
          unlockTimestamp,
          recipientAddress,
          creatorAddress,
          message,
          createdAt: new Date().toISOString(),
          status: 'sealed'
        },
        encryption: {
          algorithm: this.encryption.KYBER_VARIANT,
          publicKey: keyPair.publicKey,
          keyCreatedAt: keyPair.createdAt
        },
        // Private key stored separately (in production, use secure key management)
        privateKey: keyPair.privateKey
      };

      // Upload to Pinata IPFS
      const pinataResult = await this.pinata.uploadTimeCapsule(capsuleData);

      // Store capsule reference (metadata only, not private key)
      const capsuleRef = {
        id: capsuleId,
        ipfsHash: pinataResult.ipfsHash,
        fileName: pinataResult.filename,
        metadata: capsuleData.metadata,
        encryption: {
          algorithm: capsuleData.encryption.algorithm,
          publicKey: capsuleData.encryption.publicKey
        },
        pinata: {
          ipfsHash: pinataResult.ipfsHash,
          gateway: pinataResult.gateway,
          pinataUrl: pinataResult.pinataUrl,
          uploadedAt: pinataResult.uploadedAt
        },
        fileAnalysis: encryptedFile.fileAnalysis
      };

      // Store in memory (use database in production)
      this.capsules.set(capsuleId, {
        ...capsuleRef,
        privateKey: keyPair.privateKey // Only for demo - secure this properly
      });

      return {
        success: true,
        capsule: capsuleRef,
        privateKey: keyPair.privateKey, // Return to user for safekeeping
        message: 'Time capsule created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create time capsule: ${error.message}`);
    }
  }

  /**
   * Get capsule metadata (without decrypting)
   * @param {string} capsuleId - Capsule ID
   * @returns {Object} Capsule metadata
   */
  getCapsuleMetadata(capsuleId) {
    try {
      const capsule = this.capsules.get(capsuleId);
      
      if (!capsule) {
        throw new Error('Capsule not found');
      }

      // Return metadata without private key
      const { privateKey, ...metadata } = capsule;
      
      return {
        success: true,
        capsule: metadata,
        canUnlock: this.canUnlock(capsule.metadata.unlockTimestamp)
      };
    } catch (error) {
      throw new Error(`Failed to get capsule: ${error.message}`);
    }
  }

  /**
   * Unlock and decrypt time capsule
   * @param {string} capsuleId - Capsule ID
   * @param {string} privateKey - Private key for decryption
   * @param {string} requesterAddress - Address requesting unlock
   * @returns {Promise<Object>} Decrypted content
   */
  async unlockTimeCapsule(capsuleId, privateKey, requesterAddress) {
    try {
      const capsule = this.capsules.get(capsuleId);
      
      if (!capsule) {
        throw new Error('Capsule not found');
      }

      // Check if unlock time has passed
      if (!this.canUnlock(capsule.metadata.unlockTimestamp)) {
        throw new Error('Capsule cannot be unlocked yet');
      }

      // Verify requester is the recipient (in production, add proper auth)
      if (requesterAddress !== capsule.metadata.recipientAddress) {
        throw new Error('Unauthorized: You are not the recipient of this capsule');
      }

      // Download capsule data from Pinata IPFS
      const capsuleData = await this.pinata.downloadTimeCapsule(capsule.ipfsHash);

      // Decrypt the file
      const decryptedFile = this.encryption.decryptFile(
        capsuleData.encryptedContent,
        privateKey
      );

      // Update capsule status
      capsule.metadata.status = 'unlocked';
      capsule.metadata.unlockedAt = new Date().toISOString();
      capsule.metadata.unlockedBy = requesterAddress;

      return {
        success: true,
        content: {
          fileBuffer: decryptedFile.fileBuffer,
          metadata: decryptedFile.metadata,
          message: capsule.metadata.message
        },
        capsuleInfo: {
          id: capsuleId,
          createdAt: capsule.metadata.createdAt,
          unlockedAt: capsule.metadata.unlockedAt,
          creator: capsule.metadata.creatorAddress
        }
      };
    } catch (error) {
      throw new Error(`Failed to unlock capsule: ${error.message}`);
    }
  }

  /**
   * Check if capsule can be unlocked
   * @param {string} unlockTimestamp - ISO timestamp
   * @returns {boolean} True if can be unlocked
   */
  canUnlock(unlockTimestamp) {
    const now = new Date();
    const unlockTime = new Date(unlockTimestamp);
    return now >= unlockTime;
  }

  /**
   * List all capsules for a user
   * @param {string} userAddress - User's address
   * @returns {Array} User's capsules
   */
  getUserCapsules(userAddress) {
    try {
      const userCapsules = [];
      
      for (const [id, capsule] of this.capsules.entries()) {
        if (capsule.metadata.creatorAddress === userAddress || 
            capsule.metadata.recipientAddress === userAddress) {
          
          const { privateKey, ...capsuleInfo } = capsule;
          userCapsules.push({
            ...capsuleInfo,
            canUnlock: this.canUnlock(capsule.metadata.unlockTimestamp),
            role: capsule.metadata.creatorAddress === userAddress ? 'creator' : 'recipient'
          });
        }
      }

      return {
        success: true,
        capsules: userCapsules,
        count: userCapsules.length
      };
    } catch (error) {
      throw new Error(`Failed to get user capsules: ${error.message}`);
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service stats
   */
  getStats() {
    try {
      const totalCapsules = this.capsules.size;
      const unlockedCapsules = Array.from(this.capsules.values())
        .filter(c => c.metadata.status === 'unlocked').length;
      
      return {
        success: true,
        stats: {
          totalCapsules,
          sealedCapsules: totalCapsules - unlockedCapsules,
          unlockedCapsules,
          encryptionAlgorithm: this.encryption.KYBER_VARIANT,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
}

export default TimeCapsuleService;
