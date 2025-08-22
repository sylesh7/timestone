const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface TimeCapsuleData {
  file: File;
  recipientAddress: string;
  creatorAddress: string;
  message: string;
  unlockTimestamp: string;
}

export interface UnlockData {
  capsuleId: string;
  privateKey: string;
  requesterAddress: string;
}

export class TimestoneAPI {
  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Health check
  static async getHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse(response);
  }

  // Encryption endpoints
  static async generateKeyPair() {
    const response = await fetch(`${API_BASE_URL}/api/encrypt/keypair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response);
  }

  static async encryptData(data: string, publicKey: string) {
    const response = await fetch(`${API_BASE_URL}/api/encrypt/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, publicKey }),
    });
    return this.handleResponse(response);
  }

  static async decryptData(encryptionResult: any, privateKey: string) {
    console.log('=== DECRYPT DATA DEBUG ===');
    console.log('Input type:', typeof encryptionResult);
    console.log('Input constructor:', encryptionResult?.constructor?.name);
    console.log('Private key length:', privateKey.length);
    
    // Validate inputs
    if (!encryptionResult) {
      throw new Error('Encryption result is null or undefined');
    }
    
    if (!privateKey || privateKey.trim().length === 0) {
      throw new Error('Private key is null, undefined, or empty');
    }
    
    // The encryptionResult should now be the proper object from the capsule data
    const requestBody = { 
      encryptedData: encryptionResult, 
      privateKey: privateKey.trim()
    };
    
    console.log('Sending decrypt request to API...');
    console.log('Request body keys:', Object.keys(requestBody));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/encrypt/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Decrypt API error:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Decryption failed: ${errorJson.error || errorText}`);
        } catch (parseError) {
          throw new Error(`Decryption failed: ${response.status} - ${errorText}`);
        }
      }
      
      const result = await response.json();
      console.log('✅ Decrypt API response received');
      console.log('=== END DECRYPT DEBUG ===');
      
      return result;
    } catch (error: any) {
      console.error('❌ Decrypt request failed:', error);
      console.log('=== END DECRYPT DEBUG ===');
      throw error;
    }
  }

  // Pinata/IPFS endpoints
  static async getPinataStatus() {
    const response = await fetch(`${API_BASE_URL}/api/pinata/status`);
    return this.handleResponse(response);
  }

  static async uploadToPinata(data: string | ArrayBuffer, filename?: string) {
    const response = await fetch(`${API_BASE_URL}/api/pinata/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: typeof data === 'string' ? data : Array.from(new Uint8Array(data)),
        filename,
      }),
    });
    return this.handleResponse(response);
  }

  static async downloadFromPinata(ipfsHash: string) {
    console.log('Downloading from IPFS hash:', ipfsHash);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pinata/download/${ipfsHash}`);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} - ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      console.log('✅ Downloaded buffer size:', buffer.byteLength);
      
      // Try to parse as JSON first (time capsule data)
      try {
        const text = new TextDecoder().decode(buffer);
        const capsuleData = JSON.parse(text);
        console.log('✅ Parsed as JSON capsule data');
        console.log('Capsule data keys:', Object.keys(capsuleData));
        
        // Return the encryptedContent from the capsule data
        if (capsuleData.encryptedContent) {
          console.log('✅ Found encryptedContent in capsule data');
          return capsuleData.encryptedContent;
        } else {
          console.log('❌ No encryptedContent found in capsule data');
          throw new Error('No encrypted content found in capsule data');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse as JSON, treating as raw data');
        // If not JSON, return the raw buffer
        return buffer;
      }
    } catch (error) {
      console.error('❌ IPFS download failed:', error);
      throw error;
    }
  }

  // Time Capsule endpoints
  static async createTimeCapsule(data: TimeCapsuleData) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('recipientAddress', data.recipientAddress);
    formData.append('creatorAddress', data.creatorAddress);
    formData.append('message', data.message);
    formData.append('unlockTimestamp', data.unlockTimestamp);

    const response = await fetch(`${API_BASE_URL}/api/capsule/create`, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse(response);
  }

  static async getCapsuleMetadata(capsuleId: string) {
    const response = await fetch(`${API_BASE_URL}/api/capsule/${capsuleId}`);
    return this.handleResponse(response);
  }

  static async unlockTimeCapsule(data: UnlockData) {
    const response = await fetch(`${API_BASE_URL}/api/capsule/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getUserCapsules(userAddress: string) {
    const response = await fetch(`${API_BASE_URL}/api/capsule/user/${encodeURIComponent(userAddress)}`);
    return this.handleResponse(response);
  }

  static async getStats() {
    const response = await fetch(`${API_BASE_URL}/api/capsule/stats`);
    return this.handleResponse(response);
  }

  static async checkUnlockStatus(capsuleId: string) {
    const response = await fetch(`${API_BASE_URL}/api/capsule/${capsuleId}/can-unlock`);
    return this.handleResponse(response);
  }

  static async validatePrivateKey(capsuleId: string, privateKey: string) {
    const response = await fetch(`${API_BASE_URL}/api/capsule/validate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ capsuleId, privateKey }),
    });
    return this.handleResponse(response);
  }

  // Debug endpoints
  static async getDebugInfo() {
    const response = await fetch(`${API_BASE_URL}/api/debug/debug`);
    return this.handleResponse(response);
  }

  static async getDebugCapsules() {
    const response = await fetch(`${API_BASE_URL}/api/debug/capsules`);
    return this.handleResponse(response);
  }

  // Utility methods
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  }

  static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // File type utilities
  static getFileTypeIcon(mimeType: string): string {
    if (!mimeType) return '📁'; // Fix for undefined mimeType
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document') || mimeType.includes('text')) return '📝';
    if (mimeType.includes('archive') || mimeType.includes('zip')) return '📦';
    return '📁';
  }

  // UPDATED: Private Key Management with better interface
  static storePrivateKey(capsuleId: string, privateKey: string, metadata?: any): void {
    try {
      const capsuleData = {
        capsuleId,
        privateKey,
        metadata,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(`timestone_capsule_${capsuleId}`, JSON.stringify(capsuleData));
      console.log(`🔑 Private key stored for capsule: ${capsuleId}`);
    } catch (error) {
      console.error('Failed to store private key:', error);
    }
  }

  static getPrivateKey(capsuleId: string): string | null {
    try {
      const stored = localStorage.getItem(`timestone_capsule_${capsuleId}`);
      if (!stored) return null;
      
      const capsuleData = JSON.parse(stored);
      // Handle both old format (direct string) and new format (object)
      if (typeof capsuleData === 'string') {
        return capsuleData;
      } else if (capsuleData && capsuleData.privateKey) {
        return capsuleData.privateKey;
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  static getAllStoredCapsules(): Array<{capsuleId: string, metadata?: any, createdAt?: string}> {
    try {
      const capsules: Array<{capsuleId: string, metadata?: any, createdAt?: string}> = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('timestone_capsule_')) {
          const capsuleId = key.replace('timestone_capsule_', '');
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const capsuleData = JSON.parse(stored);
              if (typeof capsuleData === 'string') {
                // Old format
                capsules.push({ capsuleId });
              } else {
                // New format
                capsules.push({
                  capsuleId,
                  metadata: capsuleData.metadata,
                  createdAt: capsuleData.createdAt
                });
              }
            }
          } catch (e) {
            // Skip invalid entries
            console.warn(`Invalid capsule data for ${capsuleId}`);
          }
        }
      }
      return capsules;
    } catch (error) {
      console.error('Failed to get stored capsules:', error);
      return [];
    }
  }

  static removePrivateKey(capsuleId: string): void {
    try {
      localStorage.removeItem(`timestone_capsule_${capsuleId}`);
      console.log(`🗑️ Private key removed for capsule: ${capsuleId}`);
    } catch (error) {
      console.error('Failed to remove private key:', error);
    }
  }

  // LEGACY: Keep old method names for backward compatibility
  static savePrivateKey(capsuleId: string, privateKey: string): void {
    this.storePrivateKey(capsuleId, privateKey);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('archive') || mimeType.includes('zip')) return 'archive';
    return 'other';
  }
}

export default TimestoneAPI;