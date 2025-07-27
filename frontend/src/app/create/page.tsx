'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Calendar, User, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import TimestoneAPI from '@/lib/api';

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
  error?: string;
}

export default function CreateCapsule() {
  const [formData, setFormData] = useState<CreateCapsuleData>({
    file: null,
    recipientAddress: '',
    creatorAddress: '',
    message: '',
    unlockDate: '',
    unlockTime: '12:00'
  });
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CapsuleResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    
    if (!formData.file || !formData.recipientAddress || !formData.creatorAddress || !formData.unlockDate) {
      setResult({ success: false, error: 'Please fill in all required fields' });
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

      if (data.success) {
        setResult({
          success: true,
          capsule: data.capsule,
          privateKey: data.privateKey
        });
      } else {
        setResult({ success: false, error: data.error || 'Failed to create capsule' });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error occurred' 
      });
    } finally {
      setUploading(false);
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
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
  };

  if (result?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Time Capsule Created Successfully!</h1>
              <p className="text-gray-300 mb-6">
                Your file has been encrypted and stored securely. Save your private key - you'll need it to unlock the capsule.
              </p>
              
              <div className="bg-black/20 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Capsule Details:</h3>
                <div className="text-left text-sm text-gray-400 space-y-1">
                  <p><span className="text-white">ID:</span> {result.capsule?.id}</p>
                  <p><span className="text-white">File:</span> {result.capsule?.fileName}</p>
                  <p><span className="text-white">IPFS Hash:</span> {result.capsule?.pinata?.ipfsHash}</p>
                  <p><span className="text-white">Unlock Date:</span> {new Date(result.capsule?.metadata?.unlockTimestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-red-300 mb-2">⚠️ IMPORTANT - Save Your Private Key:</h3>
                <div className="bg-black/40 rounded p-3 text-xs font-mono text-gray-300 break-all">
                  {result.privateKey}
                </div>
                <p className="text-xs text-red-300 mt-2">
                  This key is required to unlock your capsule. Store it safely - we cannot recover it for you.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Link
                  href="/create"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Another
                </Link>
                <Link
                  href="/dashboard"
                  className="border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-6 py-2 rounded-lg transition-all"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Create Time Capsule</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload File <span className="text-red-400">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-purple-400 bg-purple-400/10'
                    : 'border-gray-500 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="space-y-4">
                    {previewUrl && (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                    )}
                    <div className="text-white">
                      <p className="font-medium">
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
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">
                      Drag and drop your file here, or{' '}
                      <label className="text-purple-400 hover:text-purple-300 cursor-pointer">
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
            </div>

            {/* Creator Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Your Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.creatorAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, creatorAddress: e.target.value }))}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="0x1234...abcd or your identifier"
                required
              />
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Recipient Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="0x5678...efgh or recipient identifier"
                required
              />
            </div>

            {/* Unlock Date & Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Unlock Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.unlockDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, unlockDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unlock Time
                </label>
                <input
                  type="time"
                  value={formData.unlockTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, unlockTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Message (Optional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                placeholder="Write a message for the future..."
              />
            </div>

            {/* Error Display */}
            {result?.success === false && (
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
              disabled={uploading || !formData.file}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Time Capsule...
                </>
              ) : (
                'Create Time Capsule'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
