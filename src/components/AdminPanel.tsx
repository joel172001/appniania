import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, DollarSign, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react';

type PendingDeposit = {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  tx_hash: string | null;
  created_at: string;
};

type PendingWithdrawal = {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  usdt_address: string;
  requested_at: string;
};

export function AdminPanel() {
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: depositsData } = await supabase.rpc('list_pending_deposits');
      const { data: withdrawalsData } = await supabase.rpc('list_pending_withdrawals');

      setDeposits(depositsData || []);
      setWithdrawals(withdrawalsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveDeposit = async (id: string, email: string, amount: number) => {
    if (!confirm(`¿Aprobar depósito de $${amount} para ${email}?`)) return;

    setProcessing(id);
    try {
      const { data, error } = await supabase.rpc('approve_deposit', {
        p_transaction_id: id,
        p_admin_note: 'Aprobado desde panel de admin'
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ Depósito aprobado! $${amount} agregado al balance de ${email}`);
        loadData();
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectDeposit = async (id: string, email: string, amount: number) => {
    const reason = prompt(`¿Rechazar depósito de $${amount} para ${email}?\n\nEscribe la razón:`);
    if (!reason) return;

    setProcessing(id);
    try {
      const { data, error } = await supabase.rpc('reject_deposit', {
        p_transaction_id: id,
        p_reason: reason
      });

      if (error) throw error;

      if (data.success) {
        alert(`❌ Depósito rechazado para ${email}`);
        loadData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveWithdrawal = async (id: string, email: string, amount: number, address: string) => {
    const txHash = prompt(`¿Aprobar retiro de $${amount} para ${email}?\n\nDirección: ${address}\n\nIngresa el hash de la transacción (opcional):`);
    if (txHash === null) return;

    setProcessing(id);
    try {
      const { data, error } = await supabase.rpc('approve_withdrawal', {
        p_withdrawal_id: id,
        p_admin_note: txHash ? `TX Hash: ${txHash}` : 'Aprobado desde panel de admin'
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ Retiro aprobado! Enviado $${amount} a ${address}`);
        loadData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectWithdrawal = async (id: string, email: string, amount: number) => {
    const reason = prompt(`¿Rechazar retiro de $${amount} para ${email}?\n\nLos fondos serán devueltos al usuario.\n\nEscribe la razón:`);
    if (!reason) return;

    setProcessing(id);
    try {
      const { data, error } = await supabase.rpc('reject_withdrawal', {
        p_withdrawal_id: id,
        p_reason: reason
      });

      if (error) throw error;

      if (data.success) {
        alert(`❌ Retiro rechazado. $${amount} devuelto a ${email}`);
        loadData();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Panel de Administración</h1>
            <p className="text-slate-300">Gestiona depósitos y retiros pendientes</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <ArrowDownToLine size={24} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Depósitos Pendientes</h2>
                <p className="text-slate-400">{deposits.length} solicitudes</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">Cargando...</div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No hay depósitos pendientes</div>
            ) : (
              <div className="space-y-4">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-semibold">{deposit.user_email}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(deposit.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                          ${deposit.amount}
                        </p>
                      </div>
                    </div>

                    {deposit.tx_hash && (
                      <div className="mb-3 p-2 bg-slate-800 rounded text-xs">
                        <p className="text-slate-400">TX Hash:</p>
                        <p className="text-slate-300 break-all">{deposit.tx_hash}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveDeposit(deposit.id, deposit.user_email, deposit.amount)}
                        disabled={processing === deposit.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectDeposit(deposit.id, deposit.user_email, deposit.amount)}
                        disabled={processing === deposit.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <ArrowUpFromLine size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Retiros Pendientes</h2>
                <p className="text-slate-400">{withdrawals.length} solicitudes</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">Cargando...</div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No hay retiros pendientes</div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-white font-semibold">{withdrawal.user_email}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(withdrawal.requested_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">
                          ${withdrawal.amount}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3 p-2 bg-slate-800 rounded text-xs">
                      <p className="text-slate-400">Dirección USDT:</p>
                      <p className="text-slate-300 break-all">{withdrawal.usdt_address}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveWithdrawal(withdrawal.id, withdrawal.user_email, withdrawal.amount, withdrawal.usdt_address)}
                        disabled={processing === withdrawal.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(withdrawal.id, withdrawal.user_email, withdrawal.amount)}
                        disabled={processing === withdrawal.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Acceso:</strong> Para acceder a este panel, ve a: <code className="bg-yellow-500/20 px-2 py-1 rounded">/admin</code>
          </p>
        </div>
      </div>
    </div>
  );
}
