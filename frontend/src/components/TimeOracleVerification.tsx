'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { TimeOracleResponse, createTimeVerificationRequest, sendTimeOracleMessage, waitForRollupConfirmation } from '@/lib/tezos-rollup';

interface TimeOracleVerificationProps {
  onVerificationComplete: (response: TimeOracleResponse) => void;
  onVerificationError: (error: string) => void;
  autoStart?: boolean;
}

export default function TimeOracleVerification({ 
  onVerificationComplete, 
  onVerificationError,
  autoStart = false
}: TimeOracleVerificationProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'waiting' | 'confirmed' | 'error'>('idle');
  const [response, setResponse] = useState<TimeOracleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startVerification = async () => {
    try {
      setStatus('sending');
      setError(null);
      
      // Create time verification request
      const request = createTimeVerificationRequest();
      console.log('🕐 Starting time oracle verification...');
      
      // Send message to rollup
      await sendTimeOracleMessage(request);
      
      setStatus('waiting');
      console.log('⏳ Waiting for rollup confirmation...');
      
      // Wait for rollup confirmation
      const rollupResponse = await waitForRollupConfirmation();
      
      setResponse(rollupResponse);
      setStatus('confirmed');
      
      console.log('✅ Time oracle verification completed:', rollupResponse);
      onVerificationComplete(rollupResponse);
      
    } catch (err: any) {
      console.error('❌ Time oracle verification failed:', err);
      setError(err.message || 'Verification failed');
      setStatus('error');
      onVerificationError(err.message || 'Verification failed');
    }
  };

  // Only auto-start if explicitly requested
  useEffect(() => {
    if (autoStart) {
      startVerification();
    }
  }, [autoStart]);

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending to Time Oracle...';
      case 'waiting':
        return 'Time Oracle Rollup Confirming...';
      case 'confirmed':
        return 'Time Oracle Rollup Confirmed';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Initializing...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return 'text-blue-400';
      case 'waiting':
        return 'text-yellow-400';
      case 'confirmed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black/20 border border-white/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {status === 'waiting' && (
              <p className="text-xs text-gray-400 mt-1">
                Verifying time with smart rollup...
              </p>
            )}
            {status === 'confirmed' && response && (
              <div className="text-xs text-gray-400 mt-1 space-y-1">
                <p>Confidence: {(response.confidence_score * 100).toFixed(1)}%</p>
                <p>Hash: {response.verification_hash.slice(0, 8)}...</p>
                <p>Level: {response.rollup_level}</p>
              </div>
            )}
            {status === 'error' && error && (
              <p className="text-xs text-red-400 mt-1">
                {error}
              </p>
            )}
          </div>
        </div>
        
        {status === 'error' && (
          <button
            onClick={startVerification}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>
      
      {/* Progress indicator for waiting state */}
      {status === 'waiting' && (
        <div className="mt-3">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div className="bg-yellow-400 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Processing on rollup...
          </p>
        </div>
      )}
    </div>
  );
} 