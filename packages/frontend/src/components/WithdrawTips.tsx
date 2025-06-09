import React, { useCallback, useEffect, useState } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

interface TipsInfo {
  total: string;
  withdrawn: string;
  available: string;
}

export const WithdrawTips: React.FC = () => {
  const { withdrawTips, getAvailableTips, contract, account, isRegistered } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tipsInfo, setTipsInfo] = useState<TipsInfo>({
    total: '0',
    withdrawn: '0',
    available: '0'
  });

  const fetchTipsInfo = useCallback(async () => {
    if (!contract || !account) {
      setTipsInfo({ total: '0', withdrawn: '0', available: '0' });
      return;
    }

    if (!isRegistered) {
      setTipsInfo({ total: '0', withdrawn: '0', available: '0' });
      setError('Please register a username to view and withdraw tips');
      return;
    }

    try {
      const info = await getAvailableTips();
      setTipsInfo(info);
      setError(null);
    } catch (err) {
      console.error('Error fetching tips info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tips info');
    }
  }, [contract, account, getAvailableTips, isRegistered]);

  useEffect(() => {
    if (contract && account) {
      fetchTipsInfo();
    }
  }, [contract, account, fetchTipsInfo]);

  const handleWithdraw = async () => {
    if (!isRegistered) {
      setError('Please register a username first');
      return;
    }

    if (parseFloat(tipsInfo.available) <= 0) {
      setError('No tips available to withdraw');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const tx = await withdrawTips();
      await tx.wait();
      setSuccess(`Successfully withdrew ${tipsInfo.available} ETH!`);
      await fetchTipsInfo();
    } catch (err) {
      console.error('Error withdrawing tips:', err);
      setError(err instanceof Error ? err.message : 'Failed to withdraw tips');
    } finally {
      setLoading(false);
    }
  };

  const formatEthAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num > 0 ? num.toFixed(6) : '0.000000';
  };

  if (!isRegistered) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 shadow-lg border border-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Tips Dashboard</h3>
          <p className="text-slate-600 mb-6">Register a username to start receiving and withdrawing tips</p>
          <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Registration Required
          </div>
        </div>
      </div>
    );
  }

  const availableAmount = parseFloat(tipsInfo.available);
  const hasAvailableTips = availableAmount > 0;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Tips Dashboard</h3>
            <p className="text-emerald-100">Manage your earnings</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 text-sm font-medium uppercase tracking-wide">Total Earned</span>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatEthAmount(tipsInfo.total)}</p>
            <p className="text-blue-600 text-sm">ETH</p>
          </div>

          {/* Withdrawn */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-600 text-sm font-medium uppercase tracking-wide">Withdrawn</span>
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatEthAmount(tipsInfo.withdrawn)}</p>
            <p className="text-purple-600 text-sm">ETH</p>
          </div>

          {/* Available */}
          <div className={`bg-gradient-to-br rounded-xl p-6 border ${
            hasAvailableTips 
              ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
              : 'from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium uppercase tracking-wide ${
                hasAvailableTips ? 'text-emerald-600' : 'text-gray-500'
              }`}>Available</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                hasAvailableTips ? 'bg-emerald-500' : 'bg-gray-400'
              }`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <p className={`text-2xl font-bold ${
              hasAvailableTips ? 'text-emerald-900' : 'text-gray-700'
            }`}>{formatEthAmount(tipsInfo.available)}</p>
            <p className={`text-sm ${
              hasAvailableTips ? 'text-emerald-600' : 'text-gray-500'
            }`}>ETH</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          <button
            onClick={handleWithdraw}
            disabled={loading || !hasAvailableTips || !contract || !account}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              hasAvailableTips && !loading
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Withdrawal...
              </div>
            ) : hasAvailableTips ? (
              `Withdraw ${formatEthAmount(tipsInfo.available)} ETH`
            ) : (
              'No Tips Available'
            )}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <svg className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-emerald-700 text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        {!hasAvailableTips && !error && (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-slate-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">No tips to withdraw yet</p>
                <p className="text-slate-500 text-sm">Tips will appear here once users send them to your registered username.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};