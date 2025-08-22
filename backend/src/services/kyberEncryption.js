import crypto from 'crypto';
import forge from 'node-forge';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import mime from 'mime-types';

/**
 * Enhanced Post-Quantum Inspired Encryption Service
 * 
 * Supports encryption of all file types including:
 * - Videos (mp4, avi, mkv, mov, etc.)
 * - Audio (mp3, wav, flac, m4a, etc.)
 * - Images (jpg, png, gif, webp, etc.)
 * - Documents (pdf, doc, txt, etc.)
 * - Any binary data
 */

class KyberEncryptionService {
  constructor() {
    this.KYBER_VARIANT = 'Kyber-768-Simulation';
    this.AES_KEY_SIZE = 32; // 256 bits
    this.IV_SIZE = 12; // 96 bits for GCM
    this.TAG_SIZE = 16; // 128 bits authentication tag
    this.SALT_SIZE = 32; // 256 bits salt for key derivation
  }

  /**
   * Generate a post-quantum inspired key pair
   * Uses X25519 + RSA hybrid for enhanced security
   * @returns {Object} { publicKey, privateKey }
   */
  generateKeyPair() {
    try {
      // Generate X25519 key pair (elliptic curve, fast)
      const x25519Private = crypto.randomBytes(32);
      const x25519Public = x25519.getPublicKey(x25519Private);
      
      // Generate RSA key pair for additional security layer
      const rsaKeyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      const rsaPublicKey = forge.pki.publicKeyToPem(rsaKeyPair.publicKey);
      const rsaPrivateKey = forge.pki.privateKeyToPem(rsaKeyPair.privateKey);

      // Combine keys into structured format
      const publicKey = {
        x25519: Buffer.from(x25519Public).toString('base64'),
        rsa: Buffer.from(rsaPublicKey).toString('base64'),
        algorithm: this.KYBER_VARIANT,
        version: '1.0'
      };

      const privateKey = {
        x25519: Buffer.from(x25519Private).toString('base64'),
        rsa: Buffer.from(rsaPrivateKey).toString('base64'),
        algorithm: this.KYBER_VARIANT,
        version: '1.0'
      };

      return {
        publicKey: Buffer.from(JSON.stringify(publicKey)).toString('base64'),
        privateKey: Buffer.from(JSON.stringify(privateKey)).toString('base64'),
        algorithm: this.KYBER_VARIANT,
        keySize: 2048,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Key generation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data using hybrid post-quantum inspired approach
   * @param {Buffer|string} data - Data to encrypt
   * @param {string} publicKey - Base64 encoded public key
   * @returns {Object} Encryption result with all necessary components
   */
  encrypt(data, publicKey) {
    try {
      // Convert data to buffer if string
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      
      // Parse public key
      const publicKeyObj = JSON.parse(Buffer.from(publicKey, 'base64').toString());
      
      // Generate random AES key and salt
      const aesKey = crypto.randomBytes(this.AES_KEY_SIZE);
      const salt = crypto.randomBytes(this.SALT_SIZE);
      const iv = crypto.randomBytes(16); // CBC needs 16-byte IV

      // Derive encryption key using PBKDF2 with salt
      const derivedKey = crypto.pbkdf2Sync(aesKey, salt, 100000, this.AES_KEY_SIZE, 'sha256');

      // Encrypt data with AES-256-CBC (more compatible)
      const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
      const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

      // Generate ephemeral X25519 key pair for this encryption
      const ephemeralPrivate = crypto.randomBytes(32);
      const ephemeralPublic = x25519.getPublicKey(ephemeralPrivate);
      
      // Perform X25519 key exchange
      const recipientX25519Public = Buffer.from(publicKeyObj.x25519, 'base64');
      const sharedSecret = x25519.getSharedSecret(ephemeralPrivate, recipientX25519Public);
      
      // Use shared secret to encrypt the AES key
      const keyEncryptionKey = sha256(sharedSecret);
      const keyIv = crypto.randomBytes(16); // CBC needs 16-byte IV
      const keyCipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(keyEncryptionKey).slice(0, 32), keyIv);
      const encryptedAesKey = Buffer.concat([keyCipher.update(aesKey), keyCipher.final()]);

      // Additional RSA layer for key protection
      const rsaPublicKeyPem = Buffer.from(publicKeyObj.rsa, 'base64').toString();
      const rsaPublicKeyObj = forge.pki.publicKeyFromPem(rsaPublicKeyPem);
      const rsaEncryptedKey = rsaPublicKeyObj.encrypt(
        Buffer.from(sharedSecret).toString('base64')
      );

      return {
        encryptedData: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        encryptedAesKey: encryptedAesKey.toString('base64'),
        keyIv: keyIv.toString('base64'),
        ephemeralPublic: Buffer.from(ephemeralPublic).toString('base64'),
        rsaEncryptedKey: Buffer.from(rsaEncryptedKey, 'binary').toString('base64'),
        algorithm: this.KYBER_VARIANT,
        encryptionScheme: 'X25519-ECDH + RSA + AES-256-CBC + PBKDF2',
        timestamp: new Date().toISOString(),
        dataSize: dataBuffer.length
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using hybrid post-quantum inspired approach
   * @param {Object} encryptionResult - Result from encrypt method
   * @param {string} privateKey - Base64 encoded private key
   * @returns {Buffer} Decrypted data
   */
  decrypt(encryptionResult, privateKey) {
    try {
      const {
        encryptedData,
        iv,
        salt,
        encryptedAesKey,
        keyIv,
        ephemeralPublic,
        rsaEncryptedKey
      } = encryptionResult;

      // Parse private key
      const privateKeyObj = JSON.parse(Buffer.from(privateKey, 'base64').toString());
      
      // Decrypt shared secret using RSA
      const rsaPrivateKeyPem = Buffer.from(privateKeyObj.rsa, 'base64').toString();
      const rsaPrivateKeyObj = forge.pki.privateKeyFromPem(rsaPrivateKeyPem);
      const rsaDecryptedKey = rsaPrivateKeyObj.decrypt(
        Buffer.from(rsaEncryptedKey, 'base64').toString('binary')
      );
      const sharedSecretFromRsa = Buffer.from(rsaDecryptedKey, 'base64');

      // Verify with X25519 key exchange
      const recipientX25519Private = Buffer.from(privateKeyObj.x25519, 'base64');
      const ephemeralPublicKey = Buffer.from(ephemeralPublic, 'base64');
      const sharedSecretFromX25519 = x25519.getSharedSecret(recipientX25519Private, ephemeralPublicKey);

      // Verify shared secrets match (security check)
      if (!Buffer.from(sharedSecretFromRsa).equals(Buffer.from(sharedSecretFromX25519))) {
        throw new Error('Key verification failed - potential tampering detected');
      }

      // Decrypt AES key
      const keyEncryptionKey = Buffer.from(sha256(sharedSecretFromX25519)).slice(0, 32);
      const keyDecipher = crypto.createDecipheriv('aes-256-cbc', keyEncryptionKey, Buffer.from(keyIv, 'base64'));
      const aesKey = Buffer.concat([
        keyDecipher.update(Buffer.from(encryptedAesKey, 'base64')),
        keyDecipher.final()
      ]);

      // Derive decryption key using PBKDF2 with salt
      const derivedKey = crypto.pbkdf2Sync(aesKey, Buffer.from(salt, 'base64'), 100000, this.AES_KEY_SIZE, 'sha256');

      // Decrypt data with AES-256-CBC
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, Buffer.from(iv, 'base64'));
      const encryptedBuffer = Buffer.from(encryptedData, 'base64');
      const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Enhanced file encryption with comprehensive file type support
   * @param {Buffer} fileBuffer - File content buffer
   * @param {Object} metadata - File metadata including type detection
   * @param {string} publicKey - Public key for encryption
   * @returns {Object} Complete encryption package with file analysis
   */
  encryptFile(fileBuffer, metadata, publicKey) {
    try {
      // Analyze file type and properties
      const fileAnalysis = this.analyzeFile(fileBuffer, metadata);
      
      // Create comprehensive file package
      const filePackage = {
        content: fileBuffer.toString('base64'),
        metadata: {
          name: metadata.name || 'unknown_file',
          originalType: metadata.type || fileAnalysis.mimeType,
          detectedType: fileAnalysis.mimeType,
          category: fileAnalysis.category,
          size: fileBuffer.length,
          hash: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
          uploadedAt: new Date().toISOString(),
          fileSignature: fileAnalysis.signature,
          isMultimedia: fileAnalysis.isMultimedia,
          compression: fileAnalysis.compression
        },
        analysis: fileAnalysis
      };

      const packageString = JSON.stringify(filePackage);
      const encryptionResult = this.encrypt(packageString, publicKey);

      return {
        ...encryptionResult,
        fileMetadata: filePackage.metadata,
        fileAnalysis: fileAnalysis,
        packagedAt: new Date().toISOString(),
        originalSize: fileBuffer.length,
        encryptedSize: Buffer.from(encryptionResult.encryptedData, 'base64').length
      };
    } catch (error) {
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Analyze file type, category, and properties
   * @param {Buffer} fileBuffer - File content
   * @param {Object} metadata - File metadata
   * @returns {Object} File analysis results
   */
  analyzeFile(fileBuffer, metadata) {
    try {
      // Detect MIME type from filename and content
      const mimeType = mime.lookup(metadata.name) || 'application/octet-stream';
      const signature = this.getFileSignature(fileBuffer);
      
      // Categorize file type
      const category = this.categorizeFile(mimeType, metadata.name);
      
      // Check if it's multimedia content
      const isMultimedia = ['video', 'audio', 'image'].includes(category);
      
      // Analyze compression
      const compression = this.analyzeCompression(signature, mimeType);
      
      // Get file properties
      const properties = this.getFileProperties(fileBuffer, mimeType, category);

      return {
        mimeType,
        category,
        signature,
        isMultimedia,
        compression,
        properties,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        mimeType: 'application/octet-stream',
        category: 'unknown',
        signature: 'unknown',
        isMultimedia: false,
        compression: 'unknown',
        properties: {},
        error: error.message,
        analyzedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get file signature (magic bytes)
   * @param {Buffer} fileBuffer - File content
   * @returns {string} File signature
   */
  getFileSignature(fileBuffer) {
    if (!fileBuffer || fileBuffer.length < 4) return 'unknown';
    
    const signatures = {
      // Images
      'ffd8ff': 'JPEG',
      '89504e47': 'PNG',
      '47494638': 'GIF',
      '52494646': 'WEBP/RIFF',
      '424d': 'BMP',
      '49492a00': 'TIFF',
      
      // Videos
      '000000': 'MP4/MOV', // ftyp box
      '1a45dfa3': 'WEBM/MKV',
      '52494646': 'AVI',
      '464c5601': 'FLV',
      '3026b275': 'WMV',
      
      // Audio  
      '494433': 'MP3',
      '52494646': 'WAV',
      '664c6143': 'FLAC',
      '4f676753': 'OGG',
      'm4a': 'M4A',
      
      // Documents
      '25504446': 'PDF',
      'd0cf11e0': 'MS Office',
      '504b0304': 'ZIP/Office',
      '7f454c46': 'ELF',
      '4d5a9000': 'EXE',
      
      // Archives
      '1f8b08': 'GZIP',
      '504b0304': 'ZIP',
      '526172211a0700': 'RAR'
    };
    
    const firstBytes = fileBuffer.slice(0, 8).toString('hex');
    
    for (const [sig, type] of Object.entries(signatures)) {
      if (firstBytes.startsWith(sig)) {
        return type;
      }
    }
    
    return 'unknown';
  }

  /**
   * Categorize file based on MIME type and extension
   * @param {string} mimeType - MIME type
   * @param {string} filename - Filename
   * @returns {string} File category
   */
  categorizeFile(mimeType, filename = '') {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    // Video formats
    if (mimeType.startsWith('video/') || 
        ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext)) {
      return 'video';
    }
    
    // Audio formats
    if (mimeType.startsWith('audio/') || 
        ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'].includes(ext)) {
      return 'audio';
    }
    
    // Image formats
    if (mimeType.startsWith('image/') || 
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'ico'].includes(ext)) {
      return 'image';
    }
    
    // Document formats
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext) ||
        mimeType.includes('document') || mimeType.includes('text')) {
      return 'document';
    }
    
    // Archive formats
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) ||
        mimeType.includes('archive') || mimeType.includes('compressed')) {
      return 'archive';
    }
    
    // Code files
    if (['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'rb'].includes(ext)) {
      return 'code';
    }
    
    return 'other';
  }

  /**
   * Analyze file compression
   * @param {string} signature - File signature
   * @param {string} mimeType - MIME type
   * @returns {string} Compression type
   */
  analyzeCompression(signature, mimeType) {
    const compressed = ['GZIP', 'ZIP', 'RAR', 'FLAC', 'WEBP', 'PNG'];
    const uncompressed = ['BMP', 'WAV', 'TIFF'];
    
    if (compressed.some(type => signature.includes(type))) {
      return 'compressed';
    }
    
    if (uncompressed.some(type => signature.includes(type))) {
      return 'uncompressed';
    }
    
    if (mimeType.includes('video') || mimeType.includes('audio')) {
      return 'codec-compressed';
    }
    
    return 'unknown';
  }

  /**
   * Get file-specific properties
   * @param {Buffer} fileBuffer - File content
   * @param {string} mimeType - MIME type
   * @param {string} category - File category
   * @returns {Object} File properties
   */
  getFileProperties(fileBuffer, mimeType, category) {
    const properties = {
      size: fileBuffer.length,
      entropy: this.calculateEntropy(fileBuffer.slice(0, 1024)), // Sample entropy
    };
    
    // Add category-specific properties
    switch (category) {
      case 'video':
        properties.estimatedDuration = 'unknown'; // Would need video parsing
        properties.estimatedResolution = 'unknown';
        break;
      case 'audio':
        properties.estimatedDuration = 'unknown'; // Would need audio parsing
        properties.estimatedBitrate = 'unknown';
        break;
      case 'image':
        properties.estimatedDimensions = 'unknown'; // Would need image parsing
        break;
    }
    
    return properties;
  }

  /**
   * Calculate file entropy (randomness measure)
   * @param {Buffer} data - Data sample
   * @returns {number} Entropy value
   */
  calculateEntropy(data) {
    if (!data || data.length === 0) return 0;
    
    const frequency = new Array(256).fill(0);
    for (let i = 0; i < data.length; i++) {
      frequency[data[i]]++;
    }
    
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (frequency[i] > 0) {
        const p = frequency[i] / data.length;
        entropy -= p * Math.log2(p);
      }
    }
    
    return Math.round(entropy * 100) / 100;
  }

  /**
   * Decrypt file and extract metadata
   * @param {Object} encryptionResult - Encrypted file package
   * @param {string} privateKey - Private key for decryption
   * @returns {Object} { fileBuffer, metadata }
   */
  decryptFile(encryptionResult, privateKey) {
    try {
      const decryptedPackage = this.decrypt(encryptionResult, privateKey);
      const filePackage = JSON.parse(decryptedPackage.toString());

      return {
        fileBuffer: Buffer.from(filePackage.content, 'base64'),
        metadata: filePackage.metadata
      };
    } catch (error) {
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  /**
   * Validate key pair
   * @param {string} publicKey - Base64 encoded public key
   * @param {string} privateKey - Base64 encoded private key
   * @returns {boolean} True if keys are valid pair
   */
  validateKeyPair(publicKey, privateKey) {
    try {
      const testData = 'validation_test_' + Date.now();
      const encrypted = this.encrypt(testData, publicKey);
      const decrypted = this.decrypt(encrypted, privateKey);
      return decrypted.toString() === testData;
    } catch (error) {
      return false;
    }
  }
}

export default KyberEncryptionService;
