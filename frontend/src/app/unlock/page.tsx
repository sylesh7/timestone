'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Unlock, Key, Download, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';

interface UnlockData {
  fileId: string;
  privateKey: string;
  requesterAddress: string;
}

interface UnlockResult {
  success: boolean;
  content?: {
    fileContent: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    message: string;
  };
  capsuleInfo?: any;
  error?: string;
}

export default function UnlockCapsule() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<UnlockData>({
    fileId: '',
    privateKey: '',
    requesterAddress: ''
  });
  
  const [unlocking, setUnlocking] = useState(false);
  const [result, setResult] = useState<UnlockResult | null>(null);
  const [capsuleMetadata, setCapsuleMetadata] = useState<any>(null);
  const [checkingCapsule, setCheckingCapsule] = useState(false);
  const [autoFilledKey, setAutoFilledKey] = useState(false);

  // Load capsule ID from URL parameters
  useEffect(() => {
    const fileId = searchParams.get('fileId');
    if (fileId) {
      setFormData(prev => ({ ...prev, fileId }));
      checkCapsuleStatus(fileId);
    }
  }, [searchParams]);

  const checkCapsuleStatus = async (fileId: string) => {
    if (!fileId.trim()) return;
    
    setCheckingCapsule(true);
    setAutoFilledKey(false);
    
    try {
      if (!(window as any).ethereum) {
        throw new Error('No wallet found');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(TIME_ORACLE_FILE_LOCKER_ADDRESS, TIME_ORACLE_FILE_LOCKER_ABI, provider);
      
      const fileInfo = await contract.getFileInfo(fileId);
      
      if (fileInfo) {
        const [ipfsHash, fileName, unlockTimestamp, owner, lockFee, isUnlocked] = fileInfo;
        
        setCapsuleMetadata({
          fileId,
          ipfsHash,
          fileName,
          unlockTimestamp: new Date(Number(unlockTimestamp) * 1000).toISOString(),
          owner,
          lockFee: ethers.formatEther(lockFee),
          isUnlocked,
          status: isUnlocked ? 'unlocked' : 'locked'
        });
         // Auto-fill private key if we have it stored
        const storedPrivateKey = TimestoneAPI.getPrivateKey(fileId);
        if (storedPrivateKey && !formData.privateKey) {
          setFormData(prev => ({ ...prev, privateKey: storedPrivateKey }));
          setAutoFilledKey(true);
          console.log(`🔑 Auto-filled private key for file: ${fileId}`);
        }
      } else {
        setCapsuleMetadata(null);
        setResult({ success: false, error: 'File not found on-chain' });
      }
    } catch (error: any) {
      setCapsuleMetadata(null);
      setResult({ success: false, error: `Failed to check file status: ${error.message}` });
    } finally {
      setCheckingCapsule(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setResult({ success: false, error: 'Please connect your wallet first' });
      return;
    }
    
    if (!formData.fileId || !formData.privateKey || !formData.requesterAddress) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setUnlocking(true);
    setResult(null);

    try {
      if (!(window as any).ethereum) {
        throw new Error('No wallet found');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TIME_ORACLE_FILE_LOCKER_ADDRESS, TIME_ORACLE_FILE_LOCKER_ABI, signer);

      console.log('Requesting unlock for fileId:', formData.fileId);
      
      // Call requestUnlock (emits UnlockRequested event)
      const requestTx = await contract.requestUnlock(formData.fileId);
      await requestTx.wait();
      
      console.log('Unlock requested, waiting for time oracle confirmation...');

      // Step 2: Confirm unlock (requires time oracle rollup confirmation)
      const unlockFee = ethers.parseEther("0.001"); // 0.001 XTZ unlock fee
      
      console.log('Confirming unlock with fee:', ethers.formatEther(unlockFee));
      
      const confirmTx = await contract.confirmUnlock(formData.fileId, { value: unlockFee });
      const receipt = await confirmTx.wait();
      
      console.log('Unlock confirmed on-chain');

      // Step 3: Get file info from contract and download from IPFS
      const fileInfo = await contract.getFileInfo(formData.fileId);
      const [ipfsHash, fileName, unlockTimestamp, owner, lockFee, isUnlocked] = fileInfo;

      if (!isUnlocked) {
        throw new Error('File was not unlocked on-chain');
      }

      // Step 4: Download and decrypt from IPFS (keep existing logic)
      const fileBuffer = await TimestoneAPI.downloadFromPinata(ipfsHash);
      
      // Decrypt using private key (existing logic)
      const decryptedData = await TimestoneAPI.decryptData(
        { encryptedData: fileBuffer },
        formData.privateKey
      );

      setResult({
        success: true,
        content: {
          fileContent: decryptedData.toString('base64'),
          fileName: fileName,
          fileType: 'application/octet-stream',
          fileSize: fileBuffer.byteLength,
          message: 'File unlocked successfully from IPFS and decrypted!'
        },
        capsuleInfo: {
          fileId: formData.fileId,
          ipfsHash,
          fileName,
          unlockedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Error unlocking capsule:', error);
      setResult({ 
        success: false, 
        error: error.message || 'Failed to unlock time capsule' 
      });
    } finally {
      setUnlocking(false);
    }
  };

  const downloadFile = () => {
    if (!result?.content) return;
    
    try {
      const byteCharacters = atob(result.content.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.content?.fileType || 'application/octet-stream' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.content.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (!type) return '📁'; // Fix for undefined/null type
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
  };

  const isUnlockable = (unlockTimestamp: string) => {
    return new Date() >= new Date(unlockTimestamp);
  };

  if (result?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Time Capsule Unlocked!</h1>
              
              <div className="bg-black/20 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl mr-3">
                    {getFileTypeIcon(result.content?.fileType || '')}
                  </span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">
                      {result.content!.fileName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(result.content?.fileSize || 0)} • {result.content?.fileType || 'Unknown'}
                    </p>
                  </div>
                </div>

                {result.content!.message && (
                  <div className="bg-purple-900/20 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-2">Message:</h4>
                    <p className="text-gray-300 text-sm">{result.content!.message}</p>
                  </div>
                )}

                <div className="text-xs text-gray-400 space-y-1">
                  <p><span className="text-white">Created:</span> {new Date(result.capsuleInfo!.createdAt).toLocaleString()}</p>
                  <p><span className="text-white">Creator:</span> {result.capsuleInfo!.creator}</p>
                  <p><span className="text-white">Unlocked:</span> {new Date(result.capsuleInfo!.unlockedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={downloadFile}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
                <Link
                  href="/unlock"
                  className="border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-6 py-3 rounded-lg transition-all"
                >
                  Unlock Another
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            <Unlock className="w-8 h-8 inline mr-2" />
            Unlock Time Capsule
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Capsule ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Capsule ID <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.fileId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileId: e.target.value }))}
                  onBlur={() => checkCapsuleStatus(formData.fileId)}
                  className="flex-1 px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter capsule ID (Field_ID)"
                  required
                />
                {checkingCapsule && (
                  <div className="flex items-center px-3">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Capsule Status */}
            {capsuleMetadata && (
              <div className={`rounded-lg p-4 border ${
                isUnlockable(capsuleMetadata.metadata.unlockTimestamp)
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-yellow-900/20 border-yellow-500/30'
              }`}>
                <div className="flex items-center mb-2">
                  {isUnlockable(capsuleMetadata.metadata.unlockTimestamp) ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                  )}
                  <h3 className="font-semibold text-white">
                    {isUnlockable(capsuleMetadata.metadata.unlockTimestamp) 
                      ? 'Ready to Unlock' 
                      : 'Still Locked'}
                  </h3>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="text-white">File:</span> {capsuleMetadata.metadata.fileName}</p>
                  <p><span className="text-white">Creator:</span> {capsuleMetadata.metadata.creatorAddress}</p>
                  <p><span className="text-white">Recipient:</span> {capsuleMetadata.metadata.recipientAddress}</p>
                  <p><span className="text-white">Unlock Time:</span> {new Date(capsuleMetadata.metadata.unlockTimestamp).toLocaleString()}</p>
                  {!isUnlockable(capsuleMetadata.metadata.unlockTimestamp) && (
                    <p className="text-yellow-300 font-medium">
                      ⏱️ Unlocks in: {Math.ceil((new Date(capsuleMetadata.metadata.unlockTimestamp).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Requester Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.requesterAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, requesterAddress: e.target.value }))}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="Enter your address (must match recipient)"
                required
              />
            </div>

            {/* Private Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Key className="w-4 h-4 inline mr-1" />
                Private Key <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.privateKey}
                onChange={(e) => setFormData(prev => ({ ...prev, privateKey: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
                placeholder="Paste your private key here..."
                required
              />
              {autoFilledKey ? (
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  ✅ Private key auto-filled from secure storage
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  This is the private key you received when creating the capsule
                </p>
              )}
            </div>

            {/* Error Display */}
            {result?.success === false && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-red-300">{result.error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={unlocking || !formData.fileId || !formData.privateKey || !formData.requesterAddress}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {unlocking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Unlocking Capsule...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5 mr-2" />
                  Unlock Time Capsule
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">🔒 Security Notice</p>
                <p>Your private key never leaves your device. All decryption happens locally in your browser.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
