'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, User, Calendar, FileIcon, Eye, Unlock, MessageSquare, Home, Archive, Settings, Plus, Search, BarChart3 } from 'lucide-react';
import TimestoneAPI from '@/lib/api';
import { ethers } from 'ethers';
import { TIME_ORACLE_FILE_LOCKER_ABI, TIME_ORACLE_FILE_LOCKER_ADDRESS } from '@/lib/contract';
import { useUser } from "@civic/auth-web3/react";
import { useAccount } from "wagmi";
import { userHasWallet } from "@civic/auth-web3";
import { ShinyButton } from '@/components/ui/shiny-button';
import EncryptedButton from '@/components/ui/encrypted-button';
import VerticalDock from '@/components/ui/vertical-dock';
import IsolatedTitleComponent from '@/components/IsolatedTitleComponent';

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
  const userContext = useUser();
  const { address, isConnected } = useAccount();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadUserCapsules = async () => {
    if (!userContext.user || !userHasWallet(userContext) || !isConnected) {
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
      const allFileIds = await contract.getAllUserFiles(address!);
      
      // Get detailed info for each file
      const capsulesData = await Promise.all(allFileIds.map(async (fileId: string) => {
        try {
          const fileInfo = await contract.getFileInfo(fileId);
          const [ipfsHash, fileName, unlockTimestamp, owner, recipient, lockFee, isUnlocked] = fileInfo;
          
          // Determine role based on current user's address
          const isCreator = address!.toLowerCase() === owner.toLowerCase();
          const isRecipient = address!.toLowerCase() === recipient.toLowerCase();
          
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
            canUnlock: !isUnlocked && isClient && new Date(Number(unlockTimestamp) * 1000) <= new Date(),
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
    if (userContext.user && userHasWallet(userContext) && isConnected) {
      loadUserCapsules();
    } else {
      setCapsules([]);
    }
  }, [userContext.user, isConnected, address]);

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
    if (!type) return <FileIcon className="w-6 h-6 text-green-400" />;
    if (type.startsWith('image/')) return <Eye className="w-6 h-6 text-green-400" />;
    if (type.startsWith('video/')) return <Eye className="w-6 h-6 text-green-400" />;
    if (type.startsWith('audio/')) return <MessageSquare className="w-6 h-6 text-green-400" />;
    if (type.includes('pdf')) return <FileIcon className="w-6 h-6 text-green-400" />;
    if (type.includes('document') || type.includes('text')) return <FileIcon className="w-6 h-6 text-green-400" />;
    if (type.includes('archive') || type.includes('zip')) return <Archive className="w-6 h-6 text-green-400" />;
    return <FileIcon className="w-6 h-6 text-green-400" />;
  };

  const getTimeRemaining = (unlockTimestamp: string) => {
    if (!isClient) return 'Loading...';
    
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
      {/* TimeStone Title - Top Left - Completely Isolated */}
      <IsolatedTitleComponent />

      <style jsx>{`
        .dashboard-card {
          width: 100%;
          background: transparent;
          border-radius: 20px;
          transition: all 0.3s;
          padding: 0px;
          border: 1px solid #22c55e;
        }

        .dashboard-card:hover {
          border: 1px solid #16a34a;
        }

        .dashboard-card-inner {
          width: 100%;
          height: 100%;
          background-color: #000000;
          border-radius: 20px;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-8 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center hover:bg-gray-900/30 transition-colors">
                <h3 className="text-sm font-medium text-gray-300 mb-2 truncate">Total Capsules</h3>
                <p className="text-2xl font-bold text-green-400">{stats.totalCapsules || 0}</p>
                {stats.error && (
                  <p className="text-xs text-yellow-400 mt-1 truncate">⚠️ {stats.error}</p>
                )}
              </div>
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center hover:bg-gray-900/30 transition-colors">
                <h3 className="text-sm font-medium text-gray-300 mb-2 truncate">Created by You</h3>
                <p className="text-2xl font-bold text-cyan-400">{stats.createdCapsules || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Files you sent</p>
              </div>
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center hover:bg-gray-900/30 transition-colors">
                <h3 className="text-sm font-medium text-gray-300 mb-2 truncate">Sent to You</h3>
                <p className="text-2xl font-bold text-emerald-400">{stats.receivedCapsules || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Files you received</p>
              </div>
              <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 text-center hover:bg-gray-900/30 transition-colors">
                <h3 className="text-sm font-medium text-gray-300 mb-2 truncate">Sealed</h3>
                <p className="text-2xl font-bold text-amber-400">{stats.sealedCapsules || 0}</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 mb-1 truncate">
                    {address ? `Loading capsules for: ${address.substring(0, 10)}...${address.substring(address.length - 8)}` : 'Connect your wallet to load capsules'}
                  </p>
                  <p className="text-xs text-gray-400">
                    This will show all capsules you created or received
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ShinyButton
                    onClick={loadUserCapsules}
                    disabled={!isConnected || loading}
                    shimmerColor="#06b6d4"
                    background="linear-gradient(110deg, #7c3aed 45%, #06b6d4 55%, #7c3aed)"
                    className="text-white border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
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
          </div>

          {/* Loaded Capsules Display */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6"> Your Time Capsules</h3>
            
            {capsules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {capsules.map((capsule, index) => (
                  <div
                    key={capsule.fileId}
                    className={`bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 transition-all duration-300 min-h-[200px] flex flex-col ${
                      capsule.metadata.status === 'unlocked' 
                        ? 'opacity-75 cursor-default' 
                        : 'hover:border-green-500/50 cursor-pointer hover:scale-105 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      if (capsule.metadata.status !== 'unlocked') {
                        handleViewCapsule(capsule);
                      }
                    }}
                  >
                    {/* File Type Icon and Name */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0">
                        {getFileTypeIcon(capsule.metadata.fileName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-white mb-1 truncate" title={capsule.metadata.fileName || `Capsule #${index + 1}`}>
                          {capsule.metadata.fileName || `Capsule #${index + 1}`}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {capsule.role === 'creator' ? 'Created by you' : 'Sent to you'}
                          {capsule.metadata.status === 'unlocked' && (
                            <span className="text-green-400 font-medium ml-2">• Unlocked</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Capsule Details */}
                    <div className="space-y-3 text-sm flex-1">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Creator Address:</p>
                        <p className="text-green-400 font-mono text-xs truncate" title={capsule.metadata.creatorAddress}>
                          {capsule.metadata.creatorAddress.substring(0, 8)}...{capsule.metadata.creatorAddress.substring(capsule.metadata.creatorAddress.length - 6)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Recipient Address:</p>
                        <p className="text-blue-400 font-mono text-xs truncate" title={capsule.metadata.recipientAddress}>
                          {capsule.metadata.recipientAddress.substring(0, 8)}...{capsule.metadata.recipientAddress.substring(capsule.metadata.recipientAddress.length - 6)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Unlock Date:</p>
                        <p className="text-purple-400 text-sm font-medium">
                          {new Date(capsule.metadata.unlockTimestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(capsule.metadata.unlockTimestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Time Remaining:</p>
                        <p className="text-amber-400 text-sm font-medium">
                          {getTimeRemaining(capsule.metadata.unlockTimestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          capsule.metadata.status === 'unlocked'
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
                        }`}>
                          {capsule.metadata.status === 'unlocked' ? (
                            <span className="flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                        </span>
                        {capsule.canUnlock && capsule.metadata.status !== 'unlocked' && (
                          <span className="text-green-400 text-xs font-medium animate-pulse">
                            Ready to unlock!
                          </span>
                        )}
                        {capsule.metadata.status === 'unlocked' && (
                          <span className="text-gray-400 text-xs font-medium">
                            Already unlocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-6">
                  <Archive className="w-20 h-20 text-green-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No time capsules found</h3>
                <p className="text-gray-400 text-base mb-4">
                  Create your first time capsule or check if you're connected to the right wallet
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Link href="/create">
                    <EncryptedButton className="font-semibold px-6 py-3">
                      Create Your First Capsule
                    </EncryptedButton>
                  </Link>
                  <button
                    onClick={loadUserCapsules}
                    disabled={!isConnected || loading}
                    className="px-6 py-3 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-4 justify-center items-center mt-8 pt-8 border-t border-gray-600">
            <Link href="/create">
              <EncryptedButton className="font-semibold px-8 py-3">
                Create New Capsule
              </EncryptedButton>
            </Link>
            <Link href="/unlock">
              <ShinyButton
                shimmerColor="#10b981"
                background="linear-gradient(110deg, #059669 45%, #10b981 55%, #059669)"
                className="text-white border-green-500 font-semibold px-8 py-3"
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