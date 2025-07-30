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
  content?: string;
  fileName?: string;
  error?: string;
}

interface FileInfo {
  ipfsHash: string;
  fileName: string;
  unlockTimestamp: number;
  owner: string;
  lockFee: number;
  isUnlocked: boolean;
}

export default function UnlockPage() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const [unlockData, setUnlockData] = useState<UnlockData>({
    fileId: '',
    privateKey: '',
    requesterAddress: ''
  });
  const [result, setResult] = useState<UnlockResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loadingFileInfo, setLoadingFileInfo] = useState(false);

  // Get fileId from URL if provided
  useEffect(() => {
    const fileIdFromUrl = searchParams.get('fileId');
    if (fileIdFromUrl) {
      setUnlockData(prev => ({ ...prev, fileId: fileIdFromUrl }));
      fetchFileInfo(fileIdFromUrl);
    }
  }, [searchParams]);

  const fetchFileInfo = async (fileId: string) => {
    if (!fileId) return;

    try {
      setLoadingFileInfo(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        TIME_ORACLE_FILE_LOCKER_ADDRESS,
        TIME_ORACLE_FILE_LOCKER_ABI,
        provider
      );

      const fileInfo = await contract.getFileInfo(fileId);
      setFileInfo({
        ipfsHash: fileInfo.ipfsHash,
        fileName: fileInfo.fileName,
        unlockTimestamp: Number(fileInfo.unlockTimestamp),
        owner: fileInfo.owner,
        lockFee: Number(fileInfo.lockFee),
        isUnlocked: fileInfo.isUnlocked
      });
    } catch (error) {
      console.error('Error fetching file info:', error);
      setFileInfo(null);
    } finally {
      setLoadingFileInfo(false);
    }
  };

  const handleInputChange = (field: keyof UnlockData, value: string) => {
    setUnlockData(prev => ({ ...prev, [field]: value }));
  };

  const handleUnlock = async () => {
    if (!isConnected || !address) {
      setResult({ success: false, error: 'Please connect your wallet first' });
      return;
    }

    if (!unlockData.fileId || !unlockData.privateKey) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Step 1: Request unlock on-chain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        TIME_ORACLE_FILE_LOCKER_ADDRESS,
        TIME_ORACLE_FILE_LOCKER_ABI,
        signer
      );

      console.log('Requesting unlock for fileId:', unlockData.fileId);
      
      // Request unlock transaction
      const requestTx = await contract.requestUnlock(unlockData.fileId);
      await requestTx.wait();
      console.log('Unlock requested successfully');

      // Step 2: Confirm unlock (this would normally wait for time oracle confirmation)
      // For now, we'll simulate the confirmation
      console.log('Confirming unlock...');
      const confirmTx = await contract.confirmUnlock(unlockData.fileId);
      await confirmTx.wait();
      console.log('Unlock confirmed successfully');

      // Step 3: Get file info from contract
      const fileInfo = await contract.getFileInfo(unlockData.fileId);
      const ipfsHash = fileInfo.ipfsHash;

      // Step 4: Download and decrypt from IPFS
      console.log('Downloading from IPFS:', ipfsHash);
      const encryptedContent = await TimestoneAPI.downloadFromPinata(ipfsHash);
      
      // Step 5: Decrypt using private key
      console.log('Decrypting content...');
      const decryptedContent = await TimestoneAPI.decryptFile(encryptedContent, unlockData.privateKey);

      setResult({
        success: true,
        content: decryptedContent,
        fileName: fileInfo.fileName
      });

    } catch (error) {
      console.error('Unlock failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlock file'
      });
    } finally {
      setLoading(false);
    }
  };

  const canUnlock = (timestamp: number) => {
    return Date.now() >= timestamp * 1000;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-white hover:text-purple-300 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <div className="text-center mb-8">
              <Unlock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Unlock Time Capsule</h1>
              <p className="text-gray-300">Enter your file ID and private key to unlock your time capsule</p>
            </div>

            {/* File Info Display */}
            {fileInfo && (
              <div className="bg-blue-900/20 backdrop-blur-lg rounded-xl p-6 mb-6 border border-blue-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  File Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">File Name:</span>
                    <p className="text-white font-medium">{fileInfo.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-300">Owner:</span>
                    <p className="text-white font-mono text-xs">{fileInfo.owner}</p>
                  </div>
                  <div>
                    <span className="text-gray-300">Unlock Date:</span>
                    <p className="text-white">{new Date(fileInfo.unlockTimestamp * 1000).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-300">Status:</span>
                    <p className={`font-medium ${fileInfo.isUnlocked ? 'text-green-400' : 'text-yellow-400'}`}>
                      {fileInfo.isUnlocked ? 'Unlocked' : 'Locked'}
                    </p>
                  </div>
                </div>
                {!fileInfo.isUnlocked && !canUnlock(fileInfo.unlockTimestamp) && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center text-yellow-300">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>File is still time-locked</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleUnlock(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  File ID *
                </label>
                <input
                  type="text"
                  value={unlockData.fileId}
                  onChange={(e) => handleInputChange('fileId', e.target.value)}
                  placeholder="Enter file ID from contract"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is the fileId from the smart contract (not a UUID)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Address *
                </label>
                <input
                  type="text"
                  value={unlockData.requesterAddress}
                  onChange={(e) => handleInputChange('requesterAddress', e.target.value)}
                  placeholder="Enter your wallet address"
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Must match the recipient address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  Private Key *
                </label>
                <textarea
                  value={unlockData.privateKey}
                  onChange={(e) => handleInputChange('privateKey', e.target.value)}
                  placeholder="Paste your private key here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is the private key you received when creating the capsule
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !isConnected}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 mr-2" />
                    Unlock Capsule
                  </>
                )}
              </button>
            </form>

            {/* Result */}
            {result && (
              <div className={`mt-6 p-6 rounded-xl ${
                result.success 
                  ? 'bg-green-900/20 border border-green-500/30' 
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-center mb-4">
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400 mr-2" />
                  )}
                  <h3 className={`text-lg font-semibold ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.success ? 'Unlock Successful!' : 'Unlock Failed'}
                  </h3>
                </div>
                
                {result.success && result.content && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-300">File Name:</span>
                      <p className="text-white font-medium">{result.fileName}</p>
                    </div>
                    <div>
                      <span className="text-gray-300">Content:</span>
                      <div className="mt-2 p-4 bg-black/30 rounded-lg border border-gray-600">
                        <pre className="text-white text-sm whitespace-pre-wrap break-words">
                          {result.content}
                        </pre>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const blob = new Blob([result.content!], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = result.fileName || 'decrypted-file.txt';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </button>
                    </div>
                  </div>
                )}
                
                {!result.success && result.error && (
                  <p className="text-red-300">{result.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
