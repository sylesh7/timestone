'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, User, Calendar, FileIcon, Eye, Unlock, MessageSquare } from 'lucide-react';
import TimestoneAPI from '@/lib/api';

interface Capsule {
  id: string;
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
  const [userAddress, setUserAddress] = useState('');
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadUserCapsules = async () => {
    if (!userAddress.trim()) return;
    
    setLoading(true);
    try {
      const data = await TimestoneAPI.getUserCapsules(userAddress);
      
      if (data.success) {
        setCapsules(data.capsules || []);
      }
    } catch (error) {
      console.error('Failed to load capsules:', error);
      setCapsules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await TimestoneAPI.getStats();
      
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        // Set fallback stats if backend returns failure
        setStats({
          totalCapsules: 0,
          sealedCapsules: 0,
          unlockedCapsules: 0,
          encryptionAlgorithm: 'Kyber-768-Simulation',
          serverStatus: 'online',
          error: 'Stats unavailable'
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set fallback stats on error
      setStats({
        totalCapsules: 0,
        sealedCapsules: 0,
        unlockedCapsules: 0,
        encryptionAlgorithm: 'Kyber-768-Simulation',
        serverStatus: 'error',
        error: 'Connection failed'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (!type) return '📁'; // Fix for undefined/null type
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📄';
  };

  const getTimeRemaining = (unlockTimestamp: string) => {
    const now = new Date().getTime();
    const unlockTime = new Date(unlockTimestamp).getTime();
    const diff = unlockTime - now;
    
    if (diff <= 0) return 'Ready to unlock';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Time Capsule Dashboard</h1>
            <p className="text-gray-300">Manage and view your encrypted time capsules</p>
          </div>

          {/* Stats Section */}
          {loadingStats ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30 animate-pulse">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-8 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Total Capsules</h3>
                <p className="text-3xl font-bold text-purple-400">{stats.totalCapsules || 0}</p>
                {stats.error && (
                  <p className="text-xs text-yellow-400 mt-1">⚠️ {stats.error}</p>
                )}
              </div>
              <div className="bg-yellow-900/20 rounded-lg p-6 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Sealed Capsules</h3>
                <p className="text-3xl font-bold text-yellow-400">{stats.sealedCapsules || 0}</p>
              </div>
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Unlocked Capsules</h3>
                <p className="text-3xl font-bold text-green-400">{stats.unlockedCapsules || 0}</p>
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

          {/* Load Capsules by Address */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Load Capsules by Address</h3>
            <div className="bg-gray-900/20 rounded-lg p-6 border border-gray-600/30">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Enter your wallet address or identifier to load your capsules:
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  placeholder="0x1234...abcd or your identifier"
                  onKeyPress={(e) => e.key === 'Enter' && loadUserCapsules()}
                />
                <button
                  onClick={loadUserCapsules}
                  disabled={!userAddress.trim() || loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    'Load Capsules'
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
                  Capsules for {userAddress} ({capsules.length})
                </h2>
                <button
                  onClick={() => {
                    setCapsules([]);
                    setUserAddress('');
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear Results
                </button>
              </div>
              
              {capsules.map((capsule) => (
                <div
                  key={capsule.id}
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
                              capsule.canUnlock 
                                ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                                : 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
                            }`}>
                              {capsule.canUnlock ? '🔓 Ready to unlock' : '🔒 Time locked'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                        <div className="space-y-1">
                          <p className="text-gray-300">
                            <User className="w-4 h-4 inline mr-2" />
                            <span className="text-white font-medium">Creator:</span> 
                            <span className="font-mono text-xs ml-1">{capsule.metadata.creatorAddress}</span>
                          </p>
                          <p className="text-gray-300">
                            <User className="w-4 h-4 inline mr-2" />
                            <span className="text-white font-medium">Recipient:</span> 
                            <span className="font-mono text-xs ml-1">{capsule.metadata.recipientAddress}</span>
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
                          <span className="font-mono ml-1">{capsule.id}</span>
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
                      {capsule.canUnlock ? (
                        <Link
                          href={`/unlock?capsuleId=${capsule.id}`}
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
                        href={`/unlock?capsuleId=${capsule.id}`}
                        className="border border-purple-500/50 text-purple-300 hover:bg-purple-500/20 px-4 py-2 rounded-lg text-sm transition-colors text-center"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : userAddress && !loading ? (
            <div className="text-center py-12">
              <FileIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Capsules Found</h3>
              <p className="text-gray-500 mb-6">
                No time capsules found for address: {userAddress}
              </p>
              <Link
                href="/create"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
              >
                Create Your First Capsule
              </Link>
            </div>
          ) : !userAddress && (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Enter Your Address</h3>
              <p className="text-gray-500 mb-6">
                Enter your address above to load and view your time capsules.
              </p>
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
