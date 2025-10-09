import { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, InvestmentPlan } from '../lib/supabase';

type InvestmentPlansProps = {
  onClose: () => void;
  onInvestmentCreated: () => void;
};

export function InvestmentPlans({ onClose, onInvestmentCreated }: InvestmentPlansProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const { data } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .order('min_amount', { ascending: true });

    if (data) setPlans(data);
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !user || !profile) return;

    setError('');
    setLoading(true);

    const investAmount = parseFloat(amount);

    if (investAmount < selectedPlan.min_amount) {
      setError(`Minimum investment is $${selectedPlan.min_amount}`);
      setLoading(false);
      return;
    }

    if (selectedPlan.max_amount && investAmount > selectedPlan.max_amount) {
      setError(`Maximum investment is $${selectedPlan.max_amount}`);
      setLoading(false);
      return;
    }

    if (investAmount > profile.balance) {
      setError('Insufficient balance. Please deposit first.');
      setLoading(false);
      return;
    }

    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      const { error: investmentError } = await supabase.from('investments').insert({
        user_id: user.id,
        plan_id: selectedPlan.id,
        amount: investAmount,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        total_earned: 0,
      });

      if (investmentError) throw investmentError;

      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'investment',
        amount: investAmount,
        status: 'completed',
        description: `Investment in ${selectedPlan.name}`,
      });

      if (transactionError) throw transactionError;

      const newBalance = profile.balance - investAmount;
      const newTotalInvested = profile.total_invested + investAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          total_invested: newTotalInvested,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      onInvestmentCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create investment');
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectedEarnings = (plan: InvestmentPlan, investAmount: number) => {
    const dailyReturn = (investAmount * plan.daily_return_percentage) / 100;
    const totalReturn = dailyReturn * plan.duration_days;
    return totalReturn;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Investment Plans</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {!selectedPlan ? (
          <div className="p-6">
            <div className="mb-6 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-300 text-sm">
                Available Balance: <span className="text-white font-bold text-lg">${profile?.balance.toFixed(2)}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const projectedEarnings = calculateProjectedEarnings(plan, plan.min_amount);
                const totalReturn = ((projectedEarnings / plan.min_amount) * 100).toFixed(0);

                return (
                  <div
                    key={plan.id}
                    className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
                        {plan.daily_return_percentage}% Daily
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-6">{plan.description}</p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <DollarSign size={18} className="text-emerald-400" />
                        <span className="text-sm">
                          ${plan.min_amount} - ${plan.max_amount || 'Unlimited'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock size={18} className="text-cyan-400" />
                        <span className="text-sm">{plan.duration_days} days duration</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300">
                        <TrendingUp size={18} className="text-blue-400" />
                        <span className="text-sm">Up to {totalReturn}% total return</span>
                      </div>
                    </div>

                    <button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all">
                      Select Plan
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <button
              onClick={() => {
                setSelectedPlan(null);
                setAmount('');
                setError('');
              }}
              className="text-emerald-400 hover:text-emerald-300 mb-4 text-sm"
            >
              ← Back to plans
            </button>

            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{selectedPlan.name}</h3>
              <p className="text-slate-300 mb-4">{selectedPlan.description}</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Daily Return</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    {selectedPlan.daily_return_percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Duration</p>
                  <p className="text-white font-bold text-lg">{selectedPlan.duration_days} days</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Min - Max</p>
                  <p className="text-white font-bold text-lg">
                    ${selectedPlan.min_amount} - ${selectedPlan.max_amount || '∞'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleInvest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Investment Amount (USDT)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder={`Min: ${selectedPlan.min_amount}`}
                  min={selectedPlan.min_amount}
                  max={selectedPlan.max_amount || undefined}
                  step="0.01"
                  required
                />
              </div>

              {amount && parseFloat(amount) >= selectedPlan.min_amount && (
                <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4">
                  <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle size={18} />
                    Projected Earnings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-xs">Daily Earnings</p>
                      <p className="text-white font-bold">
                        ${((parseFloat(amount) * selectedPlan.daily_return_percentage) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Earnings</p>
                      <p className="text-emerald-400 font-bold">
                        ${calculateProjectedEarnings(selectedPlan, parseFloat(amount)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Return</p>
                      <p className="text-white font-bold">
                        ${(parseFloat(amount) + calculateProjectedEarnings(selectedPlan, parseFloat(amount))).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">ROI</p>
                      <p className="text-cyan-400 font-bold">
                        {((calculateProjectedEarnings(selectedPlan, parseFloat(amount)) / parseFloat(amount)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm Investment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
