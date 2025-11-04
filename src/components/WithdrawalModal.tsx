import { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { WithdrawalVoucher } from './WithdrawalVoucher';

type WithdrawalModalProps = {
  onClose: () => void;
  onWithdrawalCreated: () => void;
};

export function WithdrawalModal({ onClose, onWithdrawalCreated }: WithdrawalModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [usdtAddress, setUsdtAddress] = useState(profile?.usdt_address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setError('');
    setLoading(true);

    const withdrawalAmount = parseFloat(amount);

    if (withdrawalAmount < 10) {
      setError('Minimum withdrawal is $10');
      setLoading(false);
      return;
    }

    if (withdrawalAmount > profile.balance) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }

    if (!usdtAddress || usdtAddress.length < 10) {
      setError('Please enter a valid USDT address');
      setLoading(false);
      return;
    }

    try {
      const commission = withdrawalAmount * 0.10;
      const netAmount = withdrawalAmount - commission;
      const newBalance = profile.balance - withdrawalAmount;

      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount: withdrawalAmount,
          usdt_address: usdtAddress,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: withdrawalAmount,
        status: 'pending',
        description: `Withdrawal request of $${withdrawalAmount}`,
      });

      if (transactionError) throw transactionError;

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          usdt_address: usdtAddress
        })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      await refreshProfile();

      const timestamp = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setVoucherData({
        id: withdrawalData.id,
        amount: withdrawalAmount,
        address: usdtAddress,
        timestamp: timestamp,
        commission: commission,
        netAmount: netAmount
      });

      setSuccess(true);
      setShowVoucher(true);
      onWithdrawalCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  if (showVoucher && voucherData) {
    return <WithdrawalVoucher onClose={onClose} withdrawalData={voucherData} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-700">
        <div className="border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Withdraw USDT</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {!success ? (
            <>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Available Balance</span>
                  <span className="text-white font-bold text-2xl">${profile?.balance.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Withdrawal Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    placeholder="Minimum: 10 USDT"
                    min="10"
                    max={profile?.balance}
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your USDT Address (TRC20)
                  </label>
                  <input
                    type="text"
                    value={usdtAddress}
                    onChange={(e) => setUsdtAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    placeholder="Enter your TRC20 USDT address"
                    required
                  />
                  <p className="text-slate-400 text-xs mt-2">
                    Make sure this is a valid TRC20 address
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    Your withdrawal request will be reviewed and processed within 24 hours. You will receive a notification when it's completed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Send size={18} />
                      Request Withdrawal
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto text-cyan-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Request Submitted!</h3>
              <p className="text-slate-300">
                Your withdrawal request has been submitted successfully.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                An admin will process your request within 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
