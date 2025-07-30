'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, User, Calendar, FileIcon, Eye, Unlock, MessageSquare, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';

interface OnChainFile {
  fileId: string;
  ipfsHash: string;
  fileName: string;
  unlockTimestamp: number;
  owner: string;
  recipient: string;
  lockFee: number;
  isUnlocked: boolean;
  role: 'owner' | 'recipient';
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [files, setFiles] = useState<OnChainFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserFiles();
    }
  }, [isConnected, address]);

  const fetchUserFiles = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      // Connect to provider and contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        TIME_ORACLE_FILE_LOCKER_ADDRESS,
        TIME_ORACLE_FILE_LOCKER_ABI,
        provider
      );

      // Get all files for the user (both owned and received)
      const fileIds: string[] = await contract.getAllUserFiles(address);
      
      // Fetch details for each file
      const fileDetails: OnChainFile[] = [];
      for (const fileId of fileIds) {
        try {
          const fileInfo = await contract.getFileInfo(fileId);
          const role = address.toLowerCase() === fileInfo.owner.toLowerCase() ? 'owner' : 'recipient';
          
          fileDetails.push({
            fileId,
            ipfsHash: fileInfo.ipfsHash,
            fileName: fileInfo.fileName,
            unlockTimestamp: Number(fileInfo.unlockTimestamp),
            owner: fileInfo.owner,
            recipient: fileInfo.recipient,
            lockFee: Number(fileInfo.lockFee),
            isUnlocked: fileInfo.isUnlocked,
            role
          });
        } catch (err) {
          console.error(`Error fetching file ${fileId}:`, err);
        }
      }

      setFiles(fileDetails);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to fetch your files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const canUnlock = (unlockTimestamp: number) => {
    return Date.now() >= unlockTimestamp * 1000;
  };

  const handleUnlock = (fileId: string) => {
    // Navigate to unlock page with the fileId
    window.location.href = `/unlock?fileId=${fileId}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <div className="text-white text-xl mb-4">🔐 Connect Your Wallet</div>
          <p className="text-gray-300">Please connect your wallet to view your time capsules</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center text-white hover:text-purple-300 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FileIcon className="w-8 h-8 mr-3" />
            My Time Capsules
          </h1>
        </div>

        {/* Wallet Info */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6">
          <div className="text-white">
            <span className="text-gray-300">Connected Wallet: </span>
            <span className="font-mono text-sm">{address}</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="text-white ml-3">Loading your files...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-red-300 text-lg mb-2">⚠️ Error</div>
            <p className="text-red-200">{error}</p>
            <button 
              onClick={fetchUserFiles}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
            <FileIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No Time Capsules Found</h3>
            <p className="text-gray-300 mb-6">You haven't created or received any time capsules yet.</p>
            <Link 
              href="/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Create Your First Capsule
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <div key={file.fileId} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/15 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FileIcon className="w-6 h-6 text-purple-300 mr-2" />
                    <h3 className="text-white font-semibold truncate">{file.fileName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.isUnlocked ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      file.role === 'owner' 
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' 
                        : 'bg-green-900/50 text-green-300 border border-green-500/30'
                    }`}>
                      {file.role === 'owner' ? 'Owner' : 'Recipient'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-300">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-mono text-xs truncate">
                      {file.role === 'owner' ? file.recipient : file.owner}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Unlocks: {formatDate(file.unlockTimestamp)}</span>
                  </div>

                  <div className="flex items-center text-gray-300">
                    <span className="mr-2">Fee:</span>
                    <span className="font-mono">{ethers.formatEther(file.lockFee.toString())} XTZ</span>
                  </div>

                  <div className="flex items-center text-gray-300">
                    <span className="mr-2">File ID:</span>
                    <span className="font-mono text-xs truncate">{file.fileId}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  {!file.isUnlocked && canUnlock(file.unlockTimestamp) ? (
                    <button
                      onClick={() => handleUnlock(file.fileId)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all transform hover:scale-105"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unlock Now
                    </button>
                  ) : !file.isUnlocked ? (
                    <div className="flex-1 text-center px-4 py-2 bg-gray-600 text-gray-300 rounded-lg">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Locked
                    </div>
                  ) : (
                    <div className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded-lg">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Unlocked
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
