import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

interface TipPostProps {
  postId: string;
  onTipSuccess?: () => void;
}

export const TipPost: React.FC<TipPostProps> = ({ postId, onTipSuccess }) => {
  const { tipPost, getPostTips, contract, account, isRegistered } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTips, setCurrentTips] = useState<string>('0');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (!contract || !account) {
        setIsInitialized(false);
        return;
      }

      try {
        await contract.getPostTipping(postId);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing contract:', err);
        setIsInitialized(false);
      }
    };

    initialize();
  }, [contract, account, postId]);

  const handleTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInitialized) {
      setError('Please connect your wallet first');
      return;
    }
    if (!isRegistered) {
      setError('Please register a username first');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tx = await tipPost(postId, amount);
      await tx.wait();
      setAmount('');
      if (onTipSuccess) {
        onTipSuccess();
      }

      const tips = await getPostTips(postId);
      setCurrentTips(ethers.formatEther(tips));
    } catch (err) {
      console.error('Error tipping post:', err);
      setError(err instanceof Error ? err.message : 'Failed to tip post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTips = async () => {
      if (!isInitialized) return;
      
      try {
        const tips = await getPostTips(postId);
        setCurrentTips(ethers.formatEther(tips));
      } catch (err) {
        console.error('Error fetching tips:', err);
        setError('Failed to fetch current tips');
      }
    };
    fetchTips();
  }, [postId, getPostTips, isInitialized]);

  const formatEthAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num > 0 ? num.toFixed(6) : '0.000000';
  };

  if (!isInitialized) {
    return (
      <div className="mt-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Connect Wallet</h3>
            <p className="text-sm text-slate-600">Connect your wallet to view and send tips</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="mt-4 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg border border-amber-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-800">Register Required</h3>
            <p className="text-sm text-amber-600">Create a username to start sending tips</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Support Creator</h3>
            <p className="text-blue-100 text-sm">Show your appreciation with a tip</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Current Tips Display */}
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Current Tips</p>
              <p className="text-2xl font-bold text-indigo-900">{formatEthAmount(currentTips)}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tip Form */}
        <form onSubmit={handleTip} className="space-y-4">
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 pl-12 text-lg border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              disabled={loading}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="text-slate-500 font-medium">ETH</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              loading || !amount || parseFloat(amount) <= 0
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Send Tip'
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 