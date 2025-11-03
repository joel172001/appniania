import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  LogOut,
  Plus,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Investment, Transaction } from '../lib/supabase';
import { InvestmentPlans } from './InvestmentPlans';
import { DepositModal } from './DepositModal';
import { WithdrawalModal } from './WithdrawalModal';
import { TransactionHistory } from './TransactionHistory';
import { DailyTasks } from './DailyTasks';
import { TransferModal } from './TransferModal';
import { NotificationsPanel } from './NotificationsPanel';

export function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showInvestmentPlans, setShowInvestmentPlans] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);

    const [investmentsData, transactionsData] = await Promise.all([
      supabase
        .from('investments')
        .select('*, plan:investment_plans(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (investmentsData.data) setInvestments(investmentsData.data);
    if (transactionsData.data) setTransactions(transactionsData.data);

    await refreshProfile();
    setLoading(false);
  };

  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const totalActiveInvestment = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">Ci</span>
              </div>
              <span className="text-xl font-bold text-white">CryptoInvest</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-300 text-sm">{profile?.email}</span>
              <NotificationsPanel />
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs sm:text-sm">Total Balance</span>
              <Wallet className="text-emerald-400" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              ${profile?.balance.toFixed(2) || '0.00'}
            </div>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDepositModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <Plus size={14} />
                Deposit
              </button>
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <ArrowUpRight size={14} />
                Withdraw
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs sm:text-sm">Total Invested</span>
              <DollarSign className="text-blue-400" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              ${profile?.total_invested.toFixed(2) || '0.00'}
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-blue-400 mt-2">
              <ArrowUpRight size={14} />
              {activeInvestments.length} active
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs sm:text-sm">Total Earnings</span>
              <TrendingUp className="text-cyan-400" size={18} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
              ${profile?.total_earnings.toFixed(2) || '0.00'}
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              disabled={!profile?.total_earnings || profile.total_earnings < 10}
              className="mt-3 sm:mt-4 w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <ArrowDownRight size={16} />
              Transfer to Balance
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Active Investments</h2>
              <button
                onClick={() => setShowInvestmentPlans(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={16} />
                New Investment
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading...</div>
            ) : activeInvestments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock size={48} className="mx-auto mb-3 opacity-50" />
                <p>No active investments yet</p>
                <p className="text-sm mt-1">Start investing to earn daily returns</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeInvestments.map((investment) => {
                  const daysActive = Math.floor(
                    (Date.now() - new Date(investment.start_date).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const plan = investment.plan;
                  return (
                    <div
                      key={investment.id}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{plan?.name}</h3>
                          <p className="text-sm text-slate-400">
                            {plan?.daily_return_percentage}% daily for {plan?.duration_days} days
                          </p>
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-600">
                        <div>
                          <p className="text-xs text-slate-400">Invested</p>
                          <p className="text-white font-semibold">${investment.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Earned</p>
                          <p className="text-emerald-400 font-semibold">${investment.total_earned.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Days Active</p>
                          <p className="text-white font-semibold">{daysActive} / {plan?.duration_days}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Status</p>
                          <p className="text-white font-semibold">
                            {((daysActive / (plan?.duration_days || 1)) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <TransactionHistory transactions={transactions} />
        </div>
      </main>

      {showInvestmentPlans && (
        <InvestmentPlans
          onClose={() => setShowInvestmentPlans(false)}
          onInvestmentCreated={loadDashboardData}
        />
      )}

      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onDepositCreated={loadDashboardData}
        />
      )}

      {showWithdrawalModal && (
        <WithdrawalModal
          onClose={() => setShowWithdrawalModal(false)}
          onWithdrawalCreated={loadDashboardData}
        />
      )}

      {showTransferModal && (
        <TransferModal
          onClose={() => setShowTransferModal(false)}
          onTransferCompleted={loadDashboardData}
        />
      )}
    </div>
  );
}
