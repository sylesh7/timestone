'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Unlock, Key, Download, Loader2, CheckCircle, AlertCircle, Clock, Home, BarChart3 } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';
import TimeOracleVerification from '@/components/TimeOracleVerification';
import { TimeOracleResponse } from '@/lib/tezos-rollup';
import VerticalDock from '@/components/ui/vertical-dock';

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
    requesterAddress: address || ''
  });
  
  const [unlocking, setUnlocking] = useState(false);
  const [result, setResult] = useState<UnlockResult | null>(null);
  const [capsuleMetadata, setCapsuleMetadata] = useState<any>(null);
  const [checkingCapsule, setCheckingCapsule] = useState(false);
  const [autoFilledKey, setAutoFilledKey] = useState(false);
  const [timeOracleVerified, setTimeOracleVerified] = useState(false);
  const [timeOracleResponse, setTimeOracleResponse] = useState<TimeOracleResponse | null>(null);
  const [showTimeOracleVerification, setShowTimeOracleVerification] = useState(false);

  // Auto-fill requester address when wallet connects
  useEffect(() => {
    if (address && !formData.requesterAddress) {
      setFormData(prev => ({ ...prev, requesterAddress: address }));
    }
  }, [address]);

  // Load capsule ID from URL parameters
  useEffect(() => {
    const fileId = searchParams.get('fileId') || searchParams.get('capsuleId');
    if (fileId) {
      setFormData(prev => ({ ...prev, fileId }));
      checkCapsuleStatus(fileId);
    }
  }, [searchParams]);

  // Helper function to ensure proper bytes32 format
  const ensureBytes32 = (value: string): string => {
    if (!value) return '';
    
    // If it's already a proper 0x hex string with 66 characters (0x + 64 hex chars)
    if (value.startsWith('0x') && value.length === 66) {
      return value;
    }
    
    // If it's a hex string without 0x prefix
    if (value.length === 64 && /^[0-9a-fA-F]+$/.test(value)) {
      return '0x' + value;
    }
    
    // If it's a shorter hex string, pad it
    if (value.startsWith('0x') && value.length < 66) {
      return value.padEnd(66, '0');
    }
    
    // If it's not hex, hash it to create bytes32
    return ethers.keccak256(ethers.toUtf8Bytes(value));
  };

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
      
      console.log('Checking capsule status for fileId:', fileId);
      
      // Convert to proper bytes32 format
      const bytes32FileId = ensureBytes32(fileId);
      console.log('Converted to bytes32:', bytes32FileId);
      
      const fileInfo = await contract.getFileInfo(bytes32FileId);
      
      if (fileInfo && fileInfo[0]) { // Check if ipfsHash exists and is not empty
        const [ipfsHash, fileName, unlockTimestamp, owner, recipient, lockFee, isUnlocked] = fileInfo;
        
        setCapsuleMetadata({
          fileId,
          ipfsHash,
          fileName,
          unlockTimestamp: new Date(Number(unlockTimestamp) * 1000).toISOString(),
          owner,
          recipient,
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
        
        // Clear any previous errors
        setResult(null);
      } else {
        setCapsuleMetadata(null);
        setResult({ success: false, error: 'File not found on-chain' });
      }
    } catch (error: any) {
      console.error('Error checking capsule status:', error);
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

    // Start time oracle verification first
    setShowTimeOracleVerification(true);
    setUnlocking(true);
    setResult(null);
  };

  const handleTimeOracleComplete = (response: TimeOracleResponse) => {
    console.log('✅ Time oracle verification completed:', response);
    setTimeOracleVerified(true);
    setTimeOracleResponse(response);
    
    // Proceed with unlock after time oracle verification
    proceedWithUnlock();
  };

  const handleTimeOracleError = (error: string) => {
    console.error('❌ Time oracle verification failed:', error);
    setUnlocking(false);
    setShowTimeOracleVerification(false);
    setResult({ success: false, error: `Time oracle verification failed: ${error}` });
  };

  const proceedWithUnlock = async () => {
    try {
      if (!(window as any).ethereum) {
        throw new Error('No wallet found');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TIME_ORACLE_FILE_LOCKER_ADDRESS, TIME_ORACLE_FILE_LOCKER_ABI, signer);

      console.log('Unlocking capsule for fileId:', formData.fileId);
      
      // Convert to proper bytes32 format
      const bytes32FileId = ensureBytes32(formData.fileId);
      console.log('Using bytes32 fileId:', bytes32FileId);
      
      // First, check current status
      const currentFileInfo = await contract.getFileInfo(bytes32FileId);
      const [currentIpfsHash, currentFileName, currentUnlockTimestamp, currentOwner, currentRecipient, currentLockFee, currentIsUnlocked] = currentFileInfo;
      
      if (!currentIpfsHash) {
        throw new Error('File not found on-chain');
      }
      
      const currentUnlockTime = new Date(Number(currentUnlockTimestamp) * 1000);
      const now = new Date();
      
      if (now < currentUnlockTime) {
        throw new Error(`File is still locked until ${currentUnlockTime.toLocaleString()}`);
      }
      
      // Check if blockchain unlock is needed
      if (!currentIsUnlocked) {
        console.log('Unlocking file on blockchain...');
        
        // Call confirmUnlock directly - this will prompt user to sign transaction
        const unlockFee = ethers.parseEther("0.001");
        console.log('Unlocking with fee:', ethers.formatEther(unlockFee));
        
        const unlockTx = await contract.confirmUnlock(bytes32FileId, { 
          value: unlockFee 
        });
        
        console.log('Transaction sent:', unlockTx.hash);
        console.log('Waiting for confirmation...');
        
        const receipt = await unlockTx.wait();
        console.log('Unlock confirmed on-chain');
      } else {
        console.log('File already unlocked, proceeding to download...');
      }

      // Step 3: Download from IPFS
      console.log('Downloading from IPFS hash:', currentIpfsHash);
      const encryptedContent = await TimestoneAPI.downloadFromPinata(currentIpfsHash);
      
      if (!encryptedContent) {
        throw new Error('Failed to download encrypted content from IPFS');
      }
      
      console.log('Downloaded encrypted content type:', typeof encryptedContent);
      
      // Step 4: Decrypt the file
      console.log('Decrypting file...');
      const decryptionResult = await TimestoneAPI.decryptData(
        encryptedContent,
        formData.privateKey
      );
      
      console.log('Decryption result:', decryptionResult);
      
      // Handle the API response
      let decryptedBase64;
      if (decryptionResult.success === false) {
        throw new Error(decryptionResult.error || 'Decryption failed');
      }
      
      // Extract the decrypted data from the API response
      if (decryptionResult.decryptedData) {
        decryptedBase64 = decryptionResult.decryptedData;
      } else if (decryptionResult.decrypted) {
        decryptedBase64 = decryptionResult.decrypted;
      } else if (typeof decryptionResult === 'string') {
        decryptedBase64 = decryptionResult;
      } else {
        throw new Error('Invalid decryption response format');
      }
      
      console.log('Extracted decrypted base64 length:', decryptedBase64.length);

      // Determine file type from fileName
      const fileExtension = currentFileName.split('.').pop()?.toLowerCase() || '';
      let fileType = 'application/octet-stream';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
        fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      } else if (['mp4', 'avi', 'mov'].includes(fileExtension)) {
        fileType = `video/${fileExtension}`;
      } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
        fileType = `audio/${fileExtension}`;
      } else if (fileExtension === 'pdf') {
        fileType = 'application/pdf';
      } else if (['txt', 'md'].includes(fileExtension)) {
        fileType = 'text/plain';
      }

      // Calculate file size from base64
      const fileSize = Math.floor((decryptedBase64.length * 3) / 4);

      setResult({
        success: true,
        content: {
          fileContent: decryptedBase64,
          fileName: currentFileName,
          fileType: fileType,
          fileSize: fileSize,
          message: 'File unlocked successfully from IPFS and decrypted!'
        },
        capsuleInfo: {
          fileId: formData.fileId,
          ipfsHash: currentIpfsHash,
          fileName: currentFileName,
          creator: currentOwner,
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
      setShowTimeOracleVerification(false);
    }
  };

  const downloadFile = () => {
    if (!result?.content) return;
    
    try {
      console.log('Downloading file:', result.content.fileName);
      console.log('File content type:', typeof result.content.fileContent);
      console.log('File content length:', result.content.fileContent?.length);
      
      let fileContent = result.content.fileContent;
      
      // Handle different data formats
      if (typeof fileContent === 'string') {
        // Check if it's already a valid base64 string
        try {
          // Test if it's valid base64 by trying to decode it
          atob(fileContent);
          console.log('Content is valid base64, proceeding with download');
        } catch (base64Error) {
          console.log('Content is not valid base64, treating as raw text');
          // If it's not base64, convert the string to base64
          fileContent = btoa(unescape(encodeURIComponent(fileContent)));
        }
      } else {
        console.error('Invalid file content type:', typeof fileContent);
        return;
      }
      
      // Now decode the base64 content
      const byteCharacters = atob(fileContent);
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
      
      console.log('✅ File downloaded successfully');
    } catch (error: any) {
      console.error('❌ Download failed:', error);
      alert('Download failed: ' + (error.message || 'Unknown error'));
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
    if (!type) return '📁';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
  };

  const isUnlockable = (unlockTimestamp: string) => {
    return new Date() >= new Date(unlockTimestamp);
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (result?.success) {
    return (
      <div className="min-h-screen bg-black p-6">
        <style jsx>{`
          .unlock-card {
            width: 100%;
            background: transparent;
            border-radius: 20px;
            transition: all 0.3s;
            padding: 0px;
            border: 1px solid #22c55e;
          }

          .unlock-card:hover {
            border: 1px solid #16a34a;
          }

          .unlock-card-inner {
            width: 100%;
            height: 100%;
            background-color: #000000;
            border-radius: 20px;
            transition: all 0.2s;
          }

          .unlock-card-inner:hover {
            transform: scale(0.98);
            border-radius: 20px;
          }
        `}</style>
        
        <div className="max-w-2xl mx-auto">
          <div className="unlock-card">
            <div className="unlock-card-inner">
              <div className="p-8">
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

                <div className="text-xs text-gray-400 space-y-1">
                  <p><span className="text-white">File ID:</span> {result.capsuleInfo!.fileId}</p>
                  <p><span className="text-white">Creator:</span> {truncateAddress(result.capsuleInfo!.creator)}</p>
                  <p><span className="text-white">Unlocked:</span> {new Date(result.capsuleInfo!.unlockedAt).toLocaleString()}</p>
                  <p><span className="text-white">IPFS Hash:</span> {truncateAddress(result.capsuleInfo!.ipfsHash)}</p>
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
                  className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-6 py-3 rounded-lg transition-all"
                >
                  Unlock Another
                </Link>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <style jsx>{`
        .unlock-card {
          width: 100%;
          background: transparent;
          border-radius: 20px;
          transition: all 0.3s;
          padding: 0px;
          border: 1px solid #22c55e;
        }

        .unlock-card:hover {
          border: 1px solid #16a34a;
        }

        .unlock-card-inner {
          width: 100%;
          height: 100%;
          background-color: #000000;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .unlock-card-inner:hover {
          transform: scale(0.98);
          border-radius: 20px;
        }
      `}</style>
      
      {/* Vertical Dock with Gooey Effects */}
      <VerticalDock 
        items={[
          { 
            icon: <Home size={18} className="text-white" />, 
            label: 'Home', 
            onClick: () => window.location.href = '/' 
          },
          { 
            icon: <BarChart3 size={18} className="text-white" />, 
            label: 'Dashboard', 
            onClick: () => window.location.href = '/dashboard' 
          },
          { 
            icon: <Unlock size={18} className="text-white" />, 
            label: 'Unlock Capsule', 
            onClick: () => {} 
          },
        ]}
        panelWidth={68}
        baseItemSize={50}
        magnification={70}
        particleCount={15}
        particleDistances={[90, 10]}
        particleR={100}
        animationTime={600}
        timeVariance={300}
        colors={[1, 2, 3, 4]}
      />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-300 hover:text-green-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="unlock-card">
          <div className="unlock-card-inner">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-white mb-8 text-center">
                <Unlock className="w-8 h-8 inline mr-2" />
                Unlock Time Capsule
              </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Capsule ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File ID <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.fileId}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileId: e.target.value }))}
                  onBlur={() => checkCapsuleStatus(formData.fileId)}
                  className="flex-1 px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none font-mono text-sm"
                  placeholder="Enter file ID (bytes32 format)"
                  required
                />
                {checkingCapsule && (
                  <div className="flex items-center px-3">
                    <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the unique file ID (bytes32) from the blockchain contract
              </p>
            </div>

            {/* Capsule Status */}
            {capsuleMetadata && (
              <div className={`rounded-lg p-4 border ${
                isUnlockable(capsuleMetadata.unlockTimestamp)
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-yellow-900/20 border-yellow-500/30'
              }`}>
                <div className="flex items-center mb-2">
                  {isUnlockable(capsuleMetadata.unlockTimestamp) ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                  )}
                  <h3 className="font-semibold text-white">
                    {isUnlockable(capsuleMetadata.unlockTimestamp) 
                      ? 'Ready to Unlock' 
                      : 'Still Locked'}
                  </h3>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><span className="text-white">File:</span> {capsuleMetadata.fileName}</p>
                  <p><span className="text-white">Creator:</span> {truncateAddress(capsuleMetadata.owner)}</p>
                  <p><span className="text-white">Recipient:</span> {truncateAddress(capsuleMetadata.recipient)}</p>
                  <p><span className="text-white">Status:</span> {capsuleMetadata.status}</p>
                  <p><span className="text-white">Unlock Time:</span> {new Date(capsuleMetadata.unlockTimestamp).toLocaleString()}</p>
                  {capsuleMetadata.status === 'locked' && (
                    <p className="text-yellow-300 font-medium">
                      💰 Unlock Fee: 0.001 XTZ (transaction required)
                    </p>
                  )}
                  {!isUnlockable(capsuleMetadata.unlockTimestamp) && (
                    <p className="text-yellow-300 font-medium">
                      ⏱️ Unlocks in: {(() => {
                        const timeDiff = new Date(capsuleMetadata.unlockTimestamp).getTime() - Date.now();
                        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        
                        if (days > 0) {
                          return `${days} day${days > 1 ? 's' : ''}`;
                        } else if (hours > 0) {
                          return `${hours} hour${hours > 1 ? 's' : ''}`;
                        } else if (minutes > 0) {
                          return `${minutes} minute${minutes > 1 ? 's' : ''}`;
                        } else {
                          return 'less than a minute';
                        }
                      })()}
                    </p>
                  )}
                  {timeOracleVerified && timeOracleResponse && (
                    <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded">
                      <p className="text-green-300 text-xs font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Time Oracle Verified ✓
                      </p>
                      <p className="text-green-400 text-xs">
                        Confidence: {(timeOracleResponse.confidence_score * 100).toFixed(1)}%
                      </p>
                    </div>
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
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none font-mono text-sm"
                placeholder="Enter your address"
                required
                readOnly={!!address}
              />
              {address && (
                <p className="text-xs text-green-400 mt-1">✅ Auto-filled from connected wallet</p>
              )}
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
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none resize-none font-mono text-sm"
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

            {/* Time Oracle Verification */}
            {showTimeOracleVerification && (
              <TimeOracleVerification
                onVerificationComplete={handleTimeOracleComplete}
                onVerificationError={handleTimeOracleError}
                autoStart={true}
              />
            )}

            {/* Error Display */}
            {result && !result.success && (
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
              disabled={unlocking || !formData.fileId || !formData.privateKey || !formData.requesterAddress || !isConnected}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {unlocking && showTimeOracleVerification ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying with Time Oracle...
                </>
              ) : unlocking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Unlocking Time Capsule...
                </>
              ) : !isConnected ? (
                'Connect Wallet First'
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
      </div>
    </div>
  );
}