'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, User, Calendar, FileIcon, Eye, Unlock, MessageSquare } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';

interface Capsule {
  fileId: string;
  fileName: string;
  metadata: {
    fileName: string;
    unlockTimestamp: string;
    creatorAddress: string;
    recipientAddress: string;
    status: string;
    createdAt: string;
    message?: string;
  };
  canUnlock: boolean;
  role: 'creator' | 'recipient';
  pinata?: {
    ipfsHash: string;
    gateway: string;
  };
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadUserCapsules = async () => {
    if (!isConnected || !address) {
      setCapsules([]);
      return;
    }  
    setLoading(true);
    try {
      if (!(window as any).ethereum) {
        throw new Error('No wallet found');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(TIME_ORACLE_FILE_LOCKER_ADDRESS, TIME_ORACLE_FILE_LOCKER_ABI, provider);
      
      // Get all files for the user (both created and received)
      const allFileIds = await contract.getAllUserFiles(address);
      
      // Get detailed info for each file
      const capsulesData = await Promise.all(allFileIds.map(async (fileId: string) => {
        try {
          const fileInfo = await contract.getFileInfo(fileId);
          const [ipfsHash, fileName, unlockTimestamp, owner, recipient, lockFee, isUnlocked] = fileInfo;
          
          // Determine role based on current user's address
          const isCreator = address.toLowerCase() === owner.toLowerCase();
          const isRecipient = address.toLowerCase() === recipient.toLowerCase();
          
          return {
            fileId,
            fileName,
            metadata: {
              fileName,
              unlockTimestamp: new Date(Number(unlockTimestamp) * 1000).toISOString(),
              creatorAddress: owner,
              recipientAddress: recipient,
              status: isUnlocked ? 'unlocked' : 'locked',
              createdAt: new Date().toISOString(), // Contract doesn't store creation time
              message: ''
            },
            canUnlock: !isUnlocked && new Date(Number(unlockTimestamp) * 1000) <= new Date(),
            role: isCreator ? 'creator' : 'recipient',
            pinata: {
              ipfsHash,
              gateway: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
            }
          };
        } catch (error) {
          console.error(`Error loading file ${fileId}:`, error);
          return null;
        }
      }));
      
      // Filter out any null results from failed loads
      const validCapsules = capsulesData.filter(capsule => capsule !== null);
      setCapsules(validCapsules);
    } catch (error) {
      console.error('Failed to load capsules from contract:', error);
      setCapsules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const totalCapsules = capsules.length;
      const sealedCapsules = capsules.filter(c => c.metadata.status === 'locked').length;
      const unlockedCapsules = capsules.filter(c => c.metadata.status === 'unlocked').length;
      const createdCapsules = capsules.filter(c => c.role === 'creator').length;
      const receivedCapsules = capsules.filter(c => c.role === 'recipient').length;
      
      setStats({
        totalCapsules,
        sealedCapsules,
        unlockedCapsules,
        createdCapsules,
        receivedCapsules,
        encryptionAlgorithm: 'Kyber-768-Simulation',
        serverStatus: 'online',
        blockchain: 'Etherlink Testnet'
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        totalCapsules: 0,
        sealedCapsules: 0,
        unlockedCapsules: 0,
        createdCapsules: 0,
        receivedCapsules: 0,
        encryptionAlgorithm: 'Kyber-768-Simulation',
        serverStatus: 'error',
        error: 'Connection failed'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadUserCapsules();
    } else {
      setCapsules([]);
    }
  }, [isConnected, address]);

  useEffect(() => {
    loadStats();
  }, [capsules]);

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
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('text')) return '📝';
    if (type.includes('archive') || type.includes('zip')) return '📦';
    return '📁';
  };

  const getTimeRemaining = (unlockTimestamp: string) => {
    const now = new Date().getTime();
    const unlockTime = new Date(unlockTimestamp).getTime();
    const diff = unlockTime - now;
    
    if (diff <= 0) return 'Ready to unlock';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 minute remaining';
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-300 hover:text-green-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-black/60 backdrop-blur-lg rounded-xl p-8 border border-green-500/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Time Capsule Dashboard</h1>
            <p className="text-gray-300">Manage and view your encrypted time capsules</p>
            {address && (
              <p className="text-sm text-gray-400 mt-2">
                Connected: <span className="font-mono text-green-300">{address}</span>
              </p>
            )}
          </div>

          {/* Stats Section */}
          {loadingStats ? (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-8 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Total Capsules</h3>
                <p className="text-3xl font-bold text-green-400">{stats.totalCapsules || 0}</p>
                {stats.error && (
                  <p className="text-xs text-yellow-400 mt-1">⚠️ {stats.error}</p>
                )}
              </div>
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Created by You</h3>
                <p className="text-3xl font-bold text-green-400">{stats.createdCapsules || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Files you sent</p>
              </div>
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Sent to You</h3>
                <p className="text-3xl font-bold text-green-400">{stats.receivedCapsules || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Files you received</p>
              </div>
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Sealed</h3>
                <p className="text-3xl font-bold text-green-400">{stats.sealedCapsules || 0}</p>
                <div className="text-xs text-gray-400 mt-1">
                  Server: <span className={stats.serverStatus === 'online' ? 'text-green-400' : 'text-red-400'}>
                    {stats.serverStatus || 'unknown'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* My Capsules Section */}
          <div className="mb-8">
            <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  🔑 My Capsules
                  <span className="ml-2 text-sm font-normal text-blue-300">(Capsules with saved keys)</span>
                </span>
                {TimestoneAPI.getAllStoredCapsules().length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all saved private keys? You will need to manually enter keys to unlock capsules.')) {
                        const storedCapsules = TimestoneAPI.getAllStoredCapsules();
                        storedCapsules.forEach(item => TimestoneAPI.removePrivateKey(item.capsuleId));
                        setStats({...stats}); // Force re-render
                      }
                    }}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    Clear All Keys
                  </button>
                )}
              </h3>
              
              {(() => {
                const storedCapsules = TimestoneAPI.getAllStoredCapsules();
                if (storedCapsules.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-400 text-lg mb-2">No capsules found</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Create your first time capsule to see it here
                      </p>
                      <Link
                        href="/create"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
                      >
                        Create Capsule
                      </Link>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    <p className="text-blue-300 text-sm mb-4">
                      Found {storedCapsules.length} capsule{storedCapsules.length !== 1 ? 's' : ''} with saved keys:
                    </p>
                    {storedCapsules.map((item) => (
                      <div key={item.capsuleId} className="bg-black/30 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">📦</span>
                              <div>
                                <p className="font-mono text-sm text-white">
                                  {item.capsuleId}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Private key saved locally
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/unlock?capsuleId=${item.capsuleId}`}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                            >
                              🔓 Unlock
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Remove private key for this capsule? You won\'t be able to auto-unlock it anymore.')) {
                                  TimestoneAPI.removePrivateKey(item.capsuleId);
                                  setStats({...stats}); // Force re-render
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                              title="Remove saved key"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Load Capsules Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Your Time Capsules</h3>
            <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-300 mb-1">
                    {address ? `Loading capsules for: ${address}` : 'Connect your wallet to load capsules'}
                  </p>
                  <p className="text-xs text-gray-400">
                    This will show all capsules you created or received
                  </p>
                </div>
                <button
                  onClick={loadUserCapsules}
                  disabled={!isConnected || loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    'Refresh Capsules'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Loaded Capsules */}
          {capsules.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Your Capsules ({capsules.length})
                </h2>
                <div className="flex gap-2 text-sm">
                  <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">
                    Created: {capsules.filter(c => c.role === 'creator').length}
                  </span>
                  <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                    Received: {capsules.filter(c => c.role === 'recipient').length}
                  </span>
                </div>
              </div>
              
              {capsules.map((capsule) => (
                <div
                  key={capsule.fileId}
                  className="bg-black/30 rounded-lg p-6 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="text-3xl mr-4">
                          {getFileTypeIcon(capsule.fileName)}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {capsule.metadata.fileName}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              capsule.role === 'creator' 
                                ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' 
                                : 'bg-green-900/50 text-green-300 border border-green-500/30'
                            }`}>
                              {capsule.role === 'creator' ? '📤 Created by you' : '📥 Sent to you'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              capsule.metadata.status === 'unlocked'
                                ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                                : capsule.canUnlock 
                                ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                                : 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
                            }`}>
                              {capsule.metadata.status === 'unlocked' 
                                ? '✅ Unlocked' 
                                : capsule.canUnlock 
                                ? '🔓 Ready to unlock' 
                                : '🔒 Time locked'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <User className="w-4 h-4 inline mr-2" />
                            <span className="text-white font-medium">Creator:</span> 
                            <span className="font-mono text-xs ml-1 break-all">{capsule.metadata.creatorAddress}</span>
                          </p>
                          <p className="text-gray-300">
                            <User className="w-4 h-4 inline mr-2" />
                            <span className="text-white font-medium">Recipient:</span> 
                            <span className="font-mono text-xs ml-1 break-all">{capsule.metadata.recipientAddress}</span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            <span className="text-white font-medium">Created:</span> {new Date(capsule.metadata.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-300">
                            <Clock className="w-4 h-4 inline mr-2" />
                            <span className="text-white font-medium">Unlocks:</span> {new Date(capsule.metadata.unlockTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {capsule.metadata.message && (
                        <div className="bg-purple-900/20 rounded-lg p-3 mb-4 border border-purple-500/30">
                          <p className="text-purple-300 text-sm">
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            <span className="font-medium">Message:</span> {capsule.metadata.message}
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        <p>
                          <span className="text-white">Capsule ID:</span> 
                          <span className="font-mono ml-1">{capsule.fileId}</span>
                        </p>
                        {capsule.pinata?.ipfsHash && (
                          <p>
                            <span className="text-white">IPFS Hash:</span> 
                            <span className="font-mono ml-1">{capsule.pinata.ipfsHash}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      {capsule.metadata.status === 'unlocked' ? (
                        <div className="bg-purple-900/30 text-purple-300 px-4 py-2 rounded-lg text-sm text-center border border-purple-500/30">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Already Unlocked
                        </div>
                      ) : capsule.canUnlock ? (
                        <Link
                          href={`/unlock?capsuleId=${capsule.fileId}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          Unlock Now
                        </Link>
                      ) : (
                        <div className="bg-yellow-900/30 text-yellow-300 px-4 py-2 rounded-lg text-sm text-center border border-yellow-500/30">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {getTimeRemaining(capsule.metadata.unlockTimestamp)}
                        </div>
                      )}
                      
                      <Link
                        href={`/unlock?capsuleId=${capsule.fileId}`}
                        className="border border-purple-500/50 text-purple-300 hover:bg-purple-500/20 px-4 py-2 rounded-lg text-sm transition-colors text-center"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        {capsule.metadata.status === 'unlocked' ? 'View Contents' : 'View Details'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isConnected || !address ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-500 mb-6">
                Please connect your wallet to load and view your time capsules.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Capsules Found</h3>
              <p className="text-gray-500 mb-6">
                No time capsules found for address: {address}
              </p>
              <Link
                href="/create"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
              >
                Create Your First Capsule
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8 pt-8 border-t border-gray-600">
            <Link
              href="/create"
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Create New Capsule
            </Link>
            <Link
              href="/unlock"
              className="border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Unlock Capsule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}