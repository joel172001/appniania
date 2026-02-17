import { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Plus,
  Clock,
  Zap,
  Activity
} from 'lucide-react';
import { supabase, Investment } from '../lib/supabase';

interface DashboardMainProps {
  profile: any;
  user: any;
  onShowInvestmentPlans: () => void;
  onShowDepositModal: () => void;
  onShowWithdrawalModal: () => void;
  onShowTransferModal: () => void;
}

export function DashboardMain({
  profile,
  user,
  onShowInvestmentPlans,
  onShowDepositModal,
  onShowWithdrawalModal,
  onShowTransferModal
}: DashboardMainProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInvestments();
    }
  }, [user]);

  const loadInvestments = async () => {
    try {
      const { data } = await supabase
        .from('investments')
        .select('*, plan:investment_plans(*)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (data) setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalEarned = investments.reduce((sum, inv) => sum + inv.total_earned, 0);
  const dailyRate = investments.length > 0 ? (totalEarned / investments.length) : 0;

  return (
    <div className="p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">MI TERMINAL</h1>
        <p className="text-slate-400 text-sm uppercase tracking-wider">ESTADO DE CUENTA DE {profile?.email?.toUpperCase() || 'D'}</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Equity Card */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2">TOTAL EQUITY</p>
            <div className="text-4xl font-bold">${profile?.balance.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        {/* Available Card */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold mb-2">DISPONIBLE</p>
            <div className="text-4xl font-bold">${Math.max(0, (profile?.balance || 0) - totalInvested).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: 24h Earnings */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-blue-500/30 transition-colors group">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">GANANCIA 24H</p>
              <p className="text-xs text-slate-500 mt-1">ACREDITADO HOY</p>
            </div>
          </div>
          <div className="text-3xl font-bold">${dailyRate.toFixed(4)}</div>
        </div>

        {/* Card 2: Invested */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-cyan-500/30 transition-colors group cursor-pointer" onClick={onShowInvestmentPlans}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
              <DollarSign size={20} className="text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">INVERTIDO</p>
              <p className="text-xs text-slate-500 mt-1">EN PLANES ACTIVOS</p>
            </div>
          </div>
          <div className="text-3xl font-bold">${totalInvested.toFixed(2)}</div>
        </div>

        {/* Card 3: Daily Estimate */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-yellow-500/30 transition-colors group">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
              <Activity size={20} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">ESTIMACIÓN DIARIA</p>
              <p className="text-xs text-slate-500 mt-1">BASADO EN EQUITY</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            ${((profile?.balance || 0) * 0.015).toFixed(4)}
          </div>
          <p className="text-xs text-yellow-600 mt-2">* VARIABLE: PUEDE FLUCTUAR SEGÚN MERCADO (1.5% O INFERIOR).</p>
        </div>

        {/* Card 4: System Status */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
              <Zap size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">ESTADO SISTEMA</p>
              <p className="text-xs text-slate-500 mt-1">ALGORITMO V3.0</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">CONECTADO</div>
        </div>
      </div>

      {/* Growth Projection & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Projection */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">PROYECCIÓN DE CRECIMIENTO</h3>
          <p className="text-slate-400 text-sm mb-6 uppercase">CRECIMIENTO PROGRESIVO DEL EQUITY TOTAL</p>
          <div className="space-y-4">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-3/4"></div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-2/3"></div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-6 uppercase tracking-wider">ESTADÍSTICAS NEXUS</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase text-sm font-semibold">TASA ALGORÍTMICA</span>
              <span className="font-bold text-lg">1.5%</span>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-slate-400 uppercase text-sm font-semibold">LIQUIDEZ CARTERA</span>
              <span className="font-bold text-lg text-cyan-400">INSTANTÁNEA</span>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"></div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-slate-400 uppercase text-sm font-semibold">PAGO DE RENDIMIENTOS</span>
              <span className="font-bold text-lg">CADA 24H</span>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"></div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-slate-400 uppercase text-sm font-semibold">SEGURIDAD</span>
              <span className="font-bold text-lg text-emerald-400">99.9%</span>
            </div>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-8 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full"></div>
    </div>
  );
}
