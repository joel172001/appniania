import { useState } from 'react';
import { X, Copy, CheckCircle, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type DepositModalProps = {
  onClose: () => void;
  onDepositCreated: () => void;
};

export function DepositModal({ onClose, onDepositCreated }: DepositModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const depositAddress = 'TXa8B9cD3eF4gH5iJ6kL7mN8oP9qR0sT1u';

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    const depositAmount = parseFloat(amount);

    if (depositAmount < 10) {
      setError('Minimum deposit is $10');
      setLoading(false);
      return;
    }

    try {
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount: depositAmount,
        status: 'pending',
        tx_hash: txHash || null,
        description: `USDT deposit of $${depositAmount}`,
      });

      if (transactionError) throw transactionError;

      setSuccess(true);
      setTimeout(() => {
        onDepositCreated();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-700">
        <div className="border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Deposit USDT</h2>
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
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Upload size={18} className="text-emerald-400" />
                  Step 1: Send USDT (TRC20)
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Send USDT (TRC20 network only) to the following address:
                </p>

                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <p className="text-xs text-slate-400 mb-2">Deposit Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-400 text-sm flex-1 break-all">
                      {depositAddress}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                      title="Copy address"
                    >
                      {copied ? <CheckCircle size={20} className="text-emerald-400" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">
             Before pressing the green Deposit button, make sure you have correctly copied our network and completed the deposit. Once you make the deposit in USDT, it will appear as pending until it is confirmed on the network..
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Step 2: Enter Amount Sent (USDT)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="Minimum: 10 USDT"
                    min="10"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transaction Hash (Optional)
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="Enter transaction hash"
                  />
                  <p className="text-slate-400 text-xs mt-2">
                    Providing the transaction hash helps us verify your deposit faster
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    Your deposit will be reviewed and credited to your account within 10-30 minutes after confirmation.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Deposit'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Deposit Submitted!</h3>
              <p className="text-slate-300">
                Your deposit request has been submitted and is being processed.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                You'll receive the funds in your account shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
