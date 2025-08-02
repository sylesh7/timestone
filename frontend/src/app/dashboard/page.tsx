'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, User, Calendar, FileIcon, Eye, Unlock, MessageSquare, Home, Archive, Settings, Plus, Search, BarChart3 } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useAccount } from 'wagmi';
import { ShinyButton } from '@/components/ui/shiny-button';
import EncryptedButton from '@/components/ui/encrypted-button';
import VerticalDock from '@/components/ui/vertical-dock';

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

  const handleViewCapsule = (capsule: Capsule) => {
    // Navigate to unlock page with capsule ID
    window.location.href = `/unlock?capsuleId=${capsule.fileId}`;
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <style jsx>{`
        .dashboard-card {
          width: 100%;
          background: transparent;
          border-radius: 20px;
          transition: all 0.3s;
          padding: 0.25px;
          border: 1px solid rgba(75, 85, 99, 0.3);
        }

        .dashboard-card:hover {
          background-image: linear-gradient(163deg, #00ff75 0%, #3700ff 100%);
          box-shadow: 0px 0px 0px 0px rgba(0, 255, 117, 0.30);
          border: none;
        }

        .dashboard-card-inner {
          width: 100%;
          height: 100%;
          background-color: #1a1a1a;
          border-radius: 18px;
          transition: all 0.2s;
        }

        .dashboard-card-inner:hover {
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
            onClick: () => {} 
          },
          { 
            icon: <Unlock size={18} className="text-white" />, 
            label: 'Unlock Capsule', 
            onClick: () => window.location.href = '/unlock' 
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
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        <div className="relative">
          {/* Main Container */}
          <div className="dashboard-card">
            <div className="dashboard-card-inner">
              <div className="p-8 relative">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Time Capsule Dashboard</h1>
                <p className="text-gray-300 text-lg">Manage and view your encrypted time capsules</p>
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
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Total Capsules</h3>
                <p className="text-3xl font-bold text-green-400">{stats.totalCapsules || 0}</p>
                {stats.error && (
                  <p className="text-xs text-yellow-400 mt-1">⚠️ {stats.error}</p>
                )}
              </div>
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Created by You</h3>
                <p className="text-3xl font-bold text-cyan-400">{stats.createdCapsules || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Files you sent</p>
              </div>
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Sent to You</h3>
                <p className="text-3xl font-bold text-emerald-400">{stats.receivedCapsules || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Files you received</p>
              </div>
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Sealed</h3>
                <p className="text-3xl font-bold text-amber-400">{stats.sealedCapsules || 0}</p>
                <div className="text-xs text-gray-400 mt-1">
                  Server: <span className={stats.serverStatus === 'online' ? 'text-green-400' : 'text-red-400'}>
                    {stats.serverStatus || 'unknown'}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

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
                <ShinyButton
                  onClick={loadUserCapsules}
                  disabled={!isConnected || loading}
                  shimmerColor="#06b6d4"
                  background="linear-gradient(110deg, #7c3aed 45%, #06b6d4 55%, #7c3aed)"
                  className="text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Refresh Capsules'
                  )}
                </ShinyButton>
              </div>
            </div>
          </div>

          {/* Loaded Capsules Display */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6"> Your Time Capsules</h3>
            
            {capsules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capsules.map((capsule, index) => (
                  <div
                    key={capsule.fileId}
                    className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 hover:border-purple-500/50 transition-colors cursor-pointer"
                    onClick={() => handleViewCapsule(capsule)}
                  >
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {capsule.metadata.fileName || `Capsule #${index + 1}`}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <span className="text-green-400">Creator:</span> {capsule.metadata.creatorAddress}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-blue-400">Unlock Time:</span> {new Date(capsule.metadata.unlockTimestamp).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-purple-400">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          capsule.metadata.status === 'unlocked'
                            ? 'bg-green-600 text-white'
                            : 'bg-orange-600 text-white'
                        }`}>
                          {capsule.metadata.status === 'unlocked' ? '🔓 Unlocked' : '🔒 Locked'}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400 text-lg">No time capsules found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Create your first time capsule or check if you're connected to the right wallet
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8 pt-8 border-t border-gray-600">
            <Link href="/create">
              <EncryptedButton className="font-semibold">
                Create New Capsule
              </EncryptedButton>
            </Link>
            <Link href="/unlock">
              <ShinyButton
                shimmerColor="#10b981"
                background="linear-gradient(110deg, #059669 45%, #10b981 55%, #059669)"
                className="text-white border-green-500 font-semibold px-8"
              >
                Unlock Capsule
              </ShinyButton>
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