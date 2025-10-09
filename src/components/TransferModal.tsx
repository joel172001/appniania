import { useState } from 'react';
import { X, ArrowDownRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type TransferModalProps = {
  onClose: () => void;
  onTransferCompleted: () => void;
};

export function TransferModal({ onClose, onTransferCompleted }: TransferModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setError('');
    setLoading(true);

    const transferAmount = parseFloat(amount);

    if (transferAmount < 10) {
      setError('Minimum transfer is $10');
      setLoading(false);
      return;
    }

    if (transferAmount > profile.total_earnings) {
      setError('Insufficient earnings balance');
      setLoading(false);
      return;
    }

    try {
      const newBalance = profile.balance + transferAmount;
      const newEarnings = profile.total_earnings - transferAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          total_earnings: newEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'earning',
        amount: transferAmount,
        status: 'completed',
        description: `Transferred $${transferAmount.toFixed(2)} from earnings to main balance`,
      });

      await refreshProfile();

      setSuccess(true);
      setTimeout(() => {
        onTransferCompleted();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to transfer earnings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700">
        <div className="border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Transfer Earnings</h2>
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
                  <span className="text-slate-400 text-sm">Available Earnings</span>
                  <span className="text-white font-bold text-2xl">
                    ${profile?.total_earnings.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Current Balance</span>
                  <span className="text-cyan-400 font-semibold">
                    ${profile?.balance.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transfer Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    placeholder="Minimum: $10.00"
                    min="10"
                    max={profile?.total_earnings}
                    step="0.01"
                    required
                  />
                  <p className="text-slate-400 text-xs mt-2">
                    Minimum transfer amount is $10.00
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    This will transfer funds from your earnings to your main balance. You can then withdraw from your main balance.
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
                      <ArrowDownRight size={18} />
                      Transfer to Balance
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto text-cyan-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Transfer Complete!</h3>
              <p className="text-slate-300">
                Your earnings have been successfully transferred to your main balance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
