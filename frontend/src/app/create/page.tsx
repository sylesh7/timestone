'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Calendar, User, MessageSquare, Loader2, CheckCircle, AlertCircle, Download, Copy, Eye, EyeOff, Clock } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';

// Magic UI Components
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { motion } from 'framer-motion';

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
  fileId?: string;
  privateKey?: string;
  error?: string;
}

export default function CreateCapsule() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<CreateCapsuleData>({
    file: null,
    recipientAddress: '',
    creatorAddress: address || '',
    message: '',
    unlockDate: '',
    unlockTime: '12:00'
  });
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CapsuleResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFullKey, setShowFullKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  // Update creator address when wallet connects
  React.useEffect(() => {
    if (address && !formData.creatorAddress) {
      setFormData(prev => ({ ...prev, creatorAddress: address }));
    }
  }, [address]);

  const handleFileChange = (file: File) => {
    setFormData(prev => ({ ...prev, file }));
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setResult({ success: false, error: 'Please connect your wallet first' });
      return;
    }
    
    if (!formData.file || !formData.recipientAddress || !formData.creatorAddress || !formData.unlockDate) {
      setResult({ success: false, error: 'Please fill in all required fields' });
      return;
    }

    // Validate addresses are different
    if (formData.creatorAddress.toLowerCase() === formData.recipientAddress.toLowerCase()) {
      setResult({ success: false, error: 'Creator and recipient addresses must be different' });
      return;
    }

    // Validate unlock date is in the future
    const unlockDateTime = new Date(`${formData.unlockDate}T${formData.unlockTime}`);
    if (unlockDateTime <= new Date()) {
      setResult({ success: false, error: 'Unlock date must be in the future' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const capsuleData = {
        file: formData.file,
        recipientAddress: formData.recipientAddress,
        creatorAddress: formData.creatorAddress,
        message: formData.message,
        unlockTimestamp: unlockDateTime.toISOString(),
      };

      const data = await TimestoneAPI.createTimeCapsule(capsuleData);

      if (!data.success) {
        throw new Error(data.error || 'Failed to create time capsule');
      }

      // Step 2: Lock on-chain using smart contract
      if (!(window as any).ethereum) {
        throw new Error('No wallet found');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TIME_ORACLE_FILE_LOCKER_ADDRESS, TIME_ORACLE_FILE_LOCKER_ABI, signer);

      // Convert unlockTimestamp to seconds
      const unlockTimestamp = Math.floor(unlockDateTime.getTime() / 1000);
      
      // Set lock fee to 0.001 XTZ
      const lockFee = ethers.parseEther("0.001");

      console.log('Locking file on-chain:', {
        ipfsHash: data.capsule.ipfsHash,
        fileName: formData.file.name,
        unlockTimestamp,
        recipient: formData.recipientAddress,
        lockFee: ethers.formatEther(lockFee)
      });

      // Call lockFile on the contract with recipient parameter
      const tx = await contract.lockFile(
        data.capsule.ipfsHash,
        formData.file.name,
        unlockTimestamp,
        formData.recipientAddress, // Pass recipient address
        { value: lockFee }
      );

      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Get fileId from the FileLocked event
      const event = receipt.logs.map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).find((e: any) => e && e.name === 'FileLocked');
      
      const fileId = event?.args?.fileId;

      if (!fileId) {
        throw new Error('Failed to get fileId from transaction');
      }

      console.log('File locked on-chain with fileId:', fileId);

      setResult({
        success: true,
        capsule: data.capsule,
        privateKey: data.privateKey,
        fileId: fileId
      });
      } catch (error: any) {
        setResult({ 
          success: false, 
          error: error?.message || 'Failed to create time capsule'  
        });
      } finally {
        setUploading(false);
      }
  };

  const formatPrivateKey = (key: string) => {
    if (!key) return '';
    if (showFullKey) return key;
    // Show first 3 chars + "ek-" prefix, then asterisks, then last 4 chars
    return `ek-${key.substring(0, 8)}${'*'.repeat(20)}${key.substring(key.length - 8)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const downloadPrivateKey = (privateKey: string, fileName: string) => {
    const content = `Time Capsule Private Key
========================

⚠️ IMPORTANT: Keep this key safe and secure!

File: ${fileName}
Capsule ID: ${result?.fileId || 'N/A'}
Created: ${new Date().toLocaleString()}
Creator: ${formData.creatorAddress}
Recipient: ${formData.recipientAddress}

Private Key:
${privateKey}

Instructions:
1. Save this file in a secure location
2. You will need this key to unlock your time capsule
3. DO NOT share this key with anyone except the intended recipient
4. We cannot recover lost keys - keep multiple backups

---
Generated by TimeStone - Decentralized Time Capsules
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timestone-key-${fileName.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  if (result?.success) {
    return (
      <div className="min-h-screen bg-black p-6 relative overflow-hidden">
        
        <div className="max-w-3xl mx-auto relative z-10">
          <MagicCard className="bg-black/60 border-green-500/20 hover:border-green-500/40">
            <div className="p-8 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl font-bold mb-4"
              >
                <AnimatedGradientText
                  colorFrom="#22c55e"
                  colorTo="#16a34a"
                >
                  Time Capsule Created Successfully!
                </AnimatedGradientText>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-gray-300 mb-8 text-lg"
              >
                Your file has been encrypted and stored securely. Save your private key - you'll need it to unlock the capsule.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <MagicCard className="bg-black/60 border-blue-500/20 hover:border-blue-500/40 mb-8">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center justify-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Capsule Details
                    </h3>
                    <div className="text-left text-sm text-gray-400 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">ID:</span>
                        <span className="font-mono text-blue-300">{result.capsule?.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">File:</span>
                        <span className="text-white">{result.capsule?.fileName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">IPFS Hash:</span>
                        <span className="font-mono text-purple-300">{result.capsule?.pinata?.ipfsHash?.substring(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Creator:</span>
                        <span className="font-mono text-green-300">{formData.creatorAddress?.substring(0, 10)}...</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Recipient:</span>
                        <span className="font-mono text-yellow-300">{formData.recipientAddress?.substring(0, 10)}...</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Unlock Date:</span>
                        <span className="text-white">{new Date(result.capsule?.metadata?.unlockTimestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <MagicCard className="bg-red-900/20 border-red-500/30 hover:border-red-500/50 mb-8">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center justify-center">
                      ⚠️ IMPORTANT - Save Your Private Key Safely
                    </h3>
                    
                    <MagicCard className="bg-black/60 mb-6">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">Private Key:</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowFullKey(!showFullKey)}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded"
                              title={showFullKey ? "Hide key" : "Show key"}
                            >
                              {showFullKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(result.privateKey || '')}
                              className="text-green-400 hover:text-green-300 p-1 rounded"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-black/80 rounded-lg p-3 font-mono text-sm break-all border border-gray-700">
                          <span className="text-green-300">{formatPrivateKey(result.privateKey || '')}</span>
                        </div>
                        {keyCopied && (
                          <motion.p 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-green-400 text-xs mt-2 text-center"
                          >
                            ✓ Copied to clipboard!
                          </motion.p>
                        )}
                      </div>
                    </MagicCard>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <ShimmerButton
                        onClick={() => downloadPrivateKey(result.privateKey || '', result.capsule?.fileName || 'capsule')}
                        shimmerColor="#22c55e"
                        background="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                        className="flex items-center px-6 py-3"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Key File
                      </ShimmerButton>
                      
                      <Link href="/dashboard">
                        <ShimmerButton
                          shimmerColor="#22c55e"
                          background="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                          className="flex items-center px-6 py-3"
                        >
                          View Dashboard
                        </ShimmerButton>
                      </Link>
                    </div>
                  </div>
                </MagicCard>
              </motion.div>
            </div>
          </MagicCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center mb-8"
        >
          <Link href="/" className="flex items-center text-gray-300 hover:text-green-400 transition-colors group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>

        <MagicCard className="bg-black/60 border-green-500/20 hover:border-green-500/40">
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-bold mb-2">
                <AnimatedGradientText
                  colorFrom="#22c55e"
                  colorTo="#16a34a"
                >
                  Create Time Capsule
                </AnimatedGradientText>
              </h1>
              <p className="text-gray-300">Preserve your precious memories for the future</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File <span className="text-red-400 ml-1">*</span>
                </label>
                <MagicCard className={`border-2 border-dashed transition-all duration-300 ${
                  dragActive
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-gray-500 hover:border-green-500/50'
                }`}>
                  <div
                    className="p-8 text-center"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {formData.file ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {previewUrl && (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-32 h-32 object-cover rounded-xl mx-auto"
                          />
                        )}
                        <div className="text-white">
                          <p className="font-medium text-lg">
                            {getFileTypeIcon(formData.file.type)} {formData.file.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatFileSize(formData.file.size)} • {formData.file.type}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, file: null }));
                            setPreviewUrl(null);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Remove File
                        </button>
                      </motion.div>
                    ) : (
                      <div>
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Upload className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-gray-300 mb-2 text-lg">
                          Drag and drop your file here, or{' '}
                          <label className="text-green-400 hover:text-green-300 cursor-pointer font-medium underline decoration-green-400/50 hover:decoration-green-300">
                            browse
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                              accept="*/*"
                            />
                          </label>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports: Photos, Videos, Audio, Documents (Max: 100MB)
                        </p>
                      </div>
                    )}
                  </div>
                </MagicCard>
              </motion.div>

              {/* Creator Address */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Your Address (Creator) <span className="text-red-400 ml-1">*</span>
                </label>
                <MagicCard className="p-1">
                  <input
                    type="text"
                    value={formData.creatorAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, creatorAddress: e.target.value }))}
                    className="w-full px-4 py-4 bg-black/40 border-0 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                    placeholder="0x1234...abcd (your wallet address)"
                    required
                    readOnly={!!address}
                  />
                </MagicCard>
                {address && (
                  <p className="text-xs text-green-400 mt-2 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Auto-filled from connected wallet
                  </p>
                )}
              </motion.div>

              {/* Recipient Address */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Recipient Address <span className="text-red-400 ml-1">*</span>
                </label>
                <MagicCard className="p-1">
                  <input
                    type="text"
                    value={formData.recipientAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                    className="w-full px-4 py-4 bg-black/40 border-0 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                    placeholder="0x5678...efgh (recipient wallet address)"
                    required
                  />
                </MagicCard>
                <p className="text-xs text-gray-400 mt-2">This person will be able to unlock the capsule after the unlock time</p>
              </motion.div>

              {/* Unlock Date & Time */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="grid md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Unlock Date <span className="text-red-400 ml-1">*</span>
                  </label>
                  <MagicCard className="p-1">
                    <input
                      type="date"
                      value={formData.unlockDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, unlockDate: e.target.value }))}
                      className="w-full px-4 py-4 bg-black/40 border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:bg-green-400 [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:p-1"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </MagicCard>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Unlock Time
                  </label>
                  <MagicCard className="p-1">
                    <input
                      type="time"
                      value={formData.unlockTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, unlockTime: e.target.value }))}
                      className="w-full px-4 py-4 bg-black/40 border-0 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:bg-green-400 [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:p-1"
                    />
                  </MagicCard>
                </div>
              </motion.div>

              {/* Date/Time Preview */}
              {formData.unlockDate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MagicCard className="bg-green-900/20 border-green-500/30">
                    <div className="p-6 text-center">
                      <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center justify-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Capsule will unlock on:
                      </h3>
                      <div className="text-white text-xl font-bold mb-2">
                        {new Date(`${formData.unlockDate}T${formData.unlockTime || '12:00'}`).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-green-400 text-lg">
                        at {new Date(`${formData.unlockDate}T${formData.unlockTime || '12:00'}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                      {(() => {
                        const unlockDateTime = new Date(`${formData.unlockDate}T${formData.unlockTime || '12:00'}`);
                        const now = new Date();
                        const timeDiff = unlockDateTime.getTime() - now.getTime();
                        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        
                        if (timeDiff > 0) {
                          return (
                            <p className="text-gray-400 mt-3">
                              ⏱️ {days > 0 ? `${days} days and ${hours} hours` : `${hours} hours`} from now
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-red-400 mt-3">
                              ⚠️ Please select a future date and time
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </MagicCard>
                </motion.div>
              )}

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message (Optional)
                </label>
                <MagicCard className="p-1">
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-4 bg-black/40 border-0 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none"
                    placeholder="Write a message for the future..."
                  />
                </MagicCard>
              </motion.div>

              {/* Error Display */}
              {result?.success === false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MagicCard className="bg-red-900/20 border-red-500/30">
                    <div className="p-4 flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                      <p className="text-red-300">{result.error}</p>
                    </div>
                  </MagicCard>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <ShimmerButton
                  type="submit"
                  disabled={uploading || !formData.file}
                  shimmerColor="#22c55e"
                  background="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  className="w-full text-lg font-semibold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Time Capsule...
                    </>
                  ) : (
                    'Create Time Capsule'
                  )}
                </ShimmerButton>
              </motion.div>
            </form>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}