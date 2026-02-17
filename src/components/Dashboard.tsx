import { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  LogOut,
  Plus,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Settings as SettingsIcon,
  Menu,
  X as XIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Investment, Transaction } from '../lib/supabase';
import { InvestmentPlans } from './InvestmentPlans';
import { DepositModal } from './DepositModal';
import { WithdrawalModal } from './WithdrawalModal';
import { TransactionHistory } from './TransactionHistory';
import { TransferModal } from './TransferModal';
import { NotificationsPanel } from './NotificationsPanel';
import { Settings } from './Settings';
import { DashboardLayout } from './DashboardLayout';
import { DashboardMain } from './DashboardMain';

export function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showInvestmentPlans, setShowInvestmentPlans] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
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
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const totalActiveInvestment = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      profile={profile}
      onSettingsClick={() => setShowSettings(true)}
    >
      <DashboardMain
        profile={profile}
        user={user}
        onShowInvestmentPlans={() => setShowInvestmentPlans(true)}
        onShowDepositModal={() => setShowDepositModal(true)}
        onShowWithdrawalModal={() => setShowWithdrawalModal(true)}
        onShowTransferModal={() => setShowTransferModal(true)}
      />

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

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </DashboardLayout>
  );
}
