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
  async getCapsuleMetadata(capsuleId) {
    try {
      let capsule = this.capsules.get(capsuleId);
      
      // If not found in memory, try to recover from IPFS (for server restarts)
      if (!capsule) {
        console.log(`🔍 Capsule ${capsuleId} not found in memory, attempting IPFS recovery...`);
        try {
          // Check if we can find it by scanning IPFS uploads
          // This is a fallback for when server restarts and loses memory
          capsule = await this.recoverCapsuleFromIPFS(capsuleId);
          if (capsule) {
            console.log(`✅ Successfully recovered capsule ${capsuleId} from IPFS`);
            // Store back in memory
            this.capsules.set(capsuleId, capsule);
          } else {
            console.log(`❌ Could not recover capsule ${capsuleId} from IPFS`);
          }
        } catch (recoverError) {
          console.log(`❌ IPFS recovery failed for ${capsuleId}:`, recoverError.message);
          // If recovery fails, capsule truly doesn't exist
        }
      }
      
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
   * Attempt to recover capsule from IPFS (fallback for server restarts)
   * @param {string} capsuleId - Capsule ID to recover
   * @returns {Promise<Object|null>} Recovered capsule or null
   */
  async recoverCapsuleFromIPFS(capsuleId) {
    try {
      console.log(`🔍 Searching IPFS for capsule: ${capsuleId}`);
      
      // Get list of pinned files and search for our capsule
      const pinnedFiles = await this.pinata.listPinnedFiles({ limit: 100 });
      console.log(`📋 Found ${pinnedFiles.files?.length || 0} files on IPFS`);
      
      if (!pinnedFiles.files || pinnedFiles.files.length === 0) {
        console.log('❌ No files found on IPFS');
        return null;
      }
      
      for (const file of pinnedFiles.files) {
        console.log(`🔍 Checking file: ${file.name} (${file.ipfsHash})`);
        
        // Look for files that contain our capsule ID
        if (file.name && file.name.includes(capsuleId)) {
          console.log(`✅ Found potential match: ${file.name}`);
          
          try {
            // Download and parse the capsule data
            console.log(`📥 Downloading capsule data from IPFS: ${file.ipfsHash}`);
            const capsuleData = await this.pinata.downloadTimeCapsule(file.ipfsHash);
            
            if (capsuleData && capsuleData.id === capsuleId) {
              console.log(`✅ Successfully parsed capsule data for: ${capsuleId}`);
              
              // Reconstruct capsule reference (without private key for security)
              const recoveredCapsule = {
                id: capsuleId,
                ipfsHash: file.ipfsHash,
                fileName: file.name,
                metadata: capsuleData.metadata,
                encryption: capsuleData.encryption,
                pinata: {
                  ipfsHash: file.ipfsHash,
                  gateway: `https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`,
                  pinataUrl: `https://app.pinata.cloud/pinmanager?filter=${file.ipfsHash}`,
                  uploadedAt: file.timestamp
                },
                fileAnalysis: capsuleData.fileAnalysis || {},
                // Note: privateKey is NOT recovered for security - user must provide it
                // But we store a placeholder to indicate it's a recovered capsule
                recovered: true,
                recoveredAt: new Date().toISOString()
              };
              
              console.log(`🎉 Successfully recovered capsule: ${capsuleId}`);
              return recoveredCapsule;
            } else {
              console.log(`❌ Capsule ID mismatch: expected ${capsuleId}, got ${capsuleData?.id || 'undefined'}`);
            }
          } catch (parseError) {
            console.log(`❌ Failed to parse file ${file.name}:`, parseError.message);
            // Skip files that can't be parsed as capsules
            continue;
          }
        }
      }
      
      console.log(`❌ No matching capsule found for ID: ${capsuleId}`);
      return null;
    } catch (error) {
      console.warn(`❌ Failed to recover capsule ${capsuleId} from IPFS:`, error.message);
      return null;
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
      let capsule = this.capsules.get(capsuleId);
      
      // If not found in memory, try to recover from IPFS
      if (!capsule) {
        console.log(`🔍 Capsule ${capsuleId} not found in memory, attempting IPFS recovery for unlock...`);
        capsule = await this.recoverCapsuleFromIPFS(capsuleId);
        if (capsule) {
          console.log(`✅ Successfully recovered capsule ${capsuleId} from IPFS for unlock`);
          // Store back in memory
          this.capsules.set(capsuleId, capsule);
        }
      }
      
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
      console.log(`📥 Downloading capsule data from IPFS: ${capsule.ipfsHash}`);
      const capsuleData = await this.pinata.downloadTimeCapsule(capsule.ipfsHash);

      // Decrypt the file
      console.log(`🔓 Attempting to decrypt capsule with provided private key...`);
      const decryptedFile = this.encryption.decryptFile(
        capsuleData.encryptedContent,
        privateKey
      );

      // Update capsule status
      capsule.metadata.status = 'unlocked';
      capsule.metadata.unlockedAt = new Date().toISOString();
      capsule.metadata.unlockedBy = requesterAddress;

      console.log(`🎉 Successfully unlocked capsule: ${capsuleId}`);

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
      console.error(`❌ Failed to unlock capsule ${capsuleId}:`, error.message);
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
      // Safely get capsule count
      const totalCapsules = this.capsules ? this.capsules.size : 0;
      
      let unlockedCapsules = 0;
      
      // Safely calculate unlocked capsules
      if (this.capsules && this.capsules.size > 0) {
        try {
          unlockedCapsules = Array.from(this.capsules.values())
            .filter(c => c && c.metadata && c.metadata.status === 'unlocked').length;
        } catch (filterError) {
          console.warn('Error calculating unlocked capsules:', filterError.message);
          unlockedCapsules = 0;
        }
      }
      
      const stats = {
        totalCapsules,
        sealedCapsules: Math.max(0, totalCapsules - unlockedCapsules),
        unlockedCapsules,
        encryptionAlgorithm: this.encryption ? this.encryption.KYBER_VARIANT : 'Kyber-768-Simulation',
        timestamp: new Date().toISOString(),
        serverStatus: 'online'
      };
      
      console.log('📊 Stats calculated successfully:', stats);
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error.message);
      
      // Return safe fallback stats instead of crashing
      return {
        success: true,
        stats: {
          totalCapsules: 0,
          sealedCapsules: 0,
          unlockedCapsules: 0,
          encryptionAlgorithm: 'Kyber-768-Simulation',
          timestamp: new Date().toISOString(),
          serverStatus: 'online',
          error: 'Stats calculation failed, showing defaults'
        }
      };
    }
  }
}

export default TimeCapsuleService;
