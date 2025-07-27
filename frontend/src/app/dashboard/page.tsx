'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, User, Calendar, FileIcon, Eye } from 'lucide-react';
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
  pinata: {
    ipfsHash: string;
    gateway: string;
  };
}

export default function Dashboard() {
  const [userAddress, setUserAddress] = useState('');
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await TimestoneAPI.getStats();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
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
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Dashboard</h1>

          {/* Stats Section */}
          {stats && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Total Capsules</h3>
                <p className="text-3xl font-bold text-purple-400">{stats.totalCapsules}</p>
              </div>
              <div className="bg-yellow-900/20 rounded-lg p-6 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Sealed Capsules</h3>
                <p className="text-3xl font-bold text-yellow-400">{stats.sealedCapsules}</p>
              </div>
              <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-lg font-semibold text-white mb-2">Unlocked Capsules</h3>
                <p className="text-3xl font-bold text-green-400">{stats.unlockedCapsules}</p>
              </div>
            </div>
          )}

          {/* User Address Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter Your Address to View Your Capsules
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                className="flex-1 px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="0x1234...abcd or your identifier"
              />
              <button
                onClick={loadUserCapsules}
                disabled={!userAddress.trim() || loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load Capsules'}
              </button>
            </div>
          </div>

          {/* Capsules List */}
          {capsules.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Capsules ({capsules.length})
              </h2>
              
              {capsules.map((capsule) => (
                <div
                  key={capsule.id}
                  className="bg-black/20 rounded-lg p-6 border border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">
                          {getFileTypeIcon(capsule.fileName)}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {capsule.metadata.fileName}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400 space-x-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              capsule.role === 'creator' 
                                ? 'bg-blue-900/50 text-blue-300' 
                                : 'bg-green-900/50 text-green-300'
                            }`}>
                              {capsule.role === 'creator' ? 'Created by you' : 'Sent to you'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              capsule.canUnlock 
                                ? 'bg-green-900/50 text-green-300' 
                                : 'bg-yellow-900/50 text-yellow-300'
                            }`}>
                              {capsule.canUnlock ? 'Unlockable' : 'Locked'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                          <p><User className="w-4 h-4 inline mr-1" />
                            <span className="text-white">Creator:</span> {capsule.metadata.creatorAddress}
                          </p>
                          <p><User className="w-4 h-4 inline mr-1" />
                            <span className="text-white">Recipient:</span> {capsule.metadata.recipientAddress}
                          </p>
                        </div>
                        <div>
                          <p><Calendar className="w-4 h-4 inline mr-1" />
                            <span className="text-white">Created:</span> {new Date(capsule.metadata.createdAt).toLocaleDateString()}
                          </p>
                          <p><Clock className="w-4 h-4 inline mr-1" />
                            <span className="text-white">Unlock:</span> {new Date(capsule.metadata.unlockTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm">
                          {capsule.canUnlock ? (
                            <CheckCircle className="w-4 h-4 inline mr-1 text-green-400" />
                          ) : (
                            <Clock className="w-4 h-4 inline mr-1 text-yellow-400" />
                          )}
                          <span className={capsule.canUnlock ? 'text-green-300' : 'text-yellow-300'}>
                            {getTimeRemaining(capsule.metadata.unlockTimestamp)}
                          </span>
                        </p>
                      </div>

                      {capsule.metadata.message && (
                        <div className="mt-3 bg-purple-900/20 rounded p-3">
                          <p className="text-sm text-gray-300">
                            <span className="text-purple-300 font-medium">Message:</span> {capsule.metadata.message}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {capsule.canUnlock && capsule.role === 'recipient' && (
                        <Link
                          href={`/unlock?id=${capsule.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Unlock
                        </Link>
                      )}
                      
                      <Link
                        href={`/capsule/${capsule.id}`}
                        className="border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      
                      <a
                        href={capsule.pinata.gateway}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1"
                      >
                        <FileIcon className="w-4 h-4" />
                        IPFS
                      </a>
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
                You haven't created or received any time capsules yet.
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
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Welcome to Your Dashboard</h3>
              <p className="text-gray-500 mb-6">
                Enter your address above to view your time capsules.
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
