'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Calendar, User, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';

interface CreateCapsuleData {
  file: File | null;
  recipientAddress: string;
  creatorAddress: string;
  message: string;
  unlockDate: string;
  unlockTime: string;
}

interface CapsuleResult {
  success: boolean;
  capsule?: any;
  privateKey?: string;
  fileId?: string;
  error?: string;
}

export default function CreateCapsule() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<CreateCapsuleData>({
    file: null,
    recipientAddress: '',
    creatorAddress: '',
    message: '',
    unlockDate: '',
    unlockTime: ''
  });
  
  const [result, setResult] = useState<CapsuleResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CreateCapsuleData, value: string | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setResult({ success: false, error: 'Please connect your wallet first' });
      return;
    }

    if (!formData.file || !formData.recipientAddress || !formData.unlockDate || !formData.unlockTime) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Step 1: Encrypt and upload to IPFS
      console.log('Encrypting and uploading file...');
      const uploadResult = await TimestoneAPI.uploadToPinata(formData.file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload to IPFS');
      }

      console.log('File uploaded to IPFS:', uploadResult.ipfsHash);

      // Step 2: Calculate unlock timestamp
      const unlockDateTime = new Date(`${formData.unlockDate}T${formData.unlockTime}`);
      const unlockTimestamp = Math.floor(unlockDateTime.getTime() / 1000);

      if (unlockTimestamp <= Math.floor(Date.now() / 1000)) {
        throw new Error('Unlock time must be in the future');
      }

      // Step 3: Lock file on-chain
      console.log('Locking file on-chain...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        TIME_ORACLE_FILE_LOCKER_ADDRESS,
        TIME_ORACLE_FILE_LOCKER_ABI,
        signer
      );

      const lockFee = ethers.parseEther("0.001"); // 0.001 XTZ fee
      
      const tx = await contract.lockFile(
        uploadResult.ipfsHash,
        formData.file.name,
        unlockTimestamp,
        formData.recipientAddress,
        { value: lockFee }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract fileId from the FileLocked event
      const fileLockedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === contract.interface.getEventTopic('FileLocked')
      );

      if (!fileLockedEvent) {
        throw new Error('FileLocked event not found in transaction');
      }

      const decodedEvent = contract.interface.parseLog(fileLockedEvent);
      const fileId = decodedEvent.args.fileId;

      console.log('File locked successfully with fileId:', fileId);

      setResult({
        success: true,
        privateKey: uploadResult.privateKey,
        fileId: fileId
      });

    } catch (error) {
      console.error('Error creating capsule:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create time capsule'
      });
    } finally {
      setLoading(false);
    }
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
              <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Create Time Capsule</h1>
              <p className="text-gray-300">Lock your file with time-based encryption and send it to a recipient</p>
            </div>

            {result?.success ? (
              <div className="bg-green-900/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                  <h3 className="text-lg font-semibold text-green-400">Capsule Created Successfully!</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-300">File ID:</span>
                    <p className="text-white font-mono text-sm break-all">{result.fileId}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-300">Private Key:</span>
                    <div className="mt-2 p-3 bg-black/30 rounded-lg border border-gray-600">
                      <p className="text-white font-mono text-sm break-all">{result.privateKey}</p>
                    </div>
                    <p className="text-xs text-yellow-300 mt-2">
                      ⚠️ Save this private key securely! You'll need it to unlock the capsule.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.fileId || '');
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Copy File ID
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.privateKey || '');
                      }}
                      className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Copy Private Key
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    File *
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      required
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-white">
                        {formData.file ? formData.file.name : 'Click to upload file'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {formData.file ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB` : 'Max 10MB'}
                      </p>
                    </label>
                  </div>
                </div>

                {/* Recipient Address */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Recipient Address *
                  </label>
                  <input
                    type="text"
                    value={formData.recipientAddress}
                    onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                    placeholder="Enter recipient's wallet address"
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    The address that will receive and be able to unlock this capsule
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Unlock Date */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Unlock Date *
                  </label>
                  <input
                    type="date"
                    value={formData.unlockDate}
                    onChange={(e) => handleInputChange('unlockDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Unlock Time */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Unlock Time *
                  </label>
                  <input
                    type="time"
                    value={formData.unlockTime}
                    onChange={(e) => handleInputChange('unlockTime', e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Fee Information */}
                <div className="bg-blue-900/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300">Lock Fee:</span>
                    <span className="text-white font-semibold">0.001 XTZ</span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1">
                    This fee is required to lock your file on the blockchain
                  </p>
                </div>

                {/* Error Display */}
                {result?.success === false && (
                  <div className="bg-red-900/20 backdrop-blur-lg rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                      <p className="text-red-300">{result.error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !isConnected}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Capsule...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Create Time Capsule
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
