import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, RefreshCw, Lock } from 'lucide-react';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && deposits.length === 0 && withdrawals.length === 0 && !loading) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = 'Admin2024!';

    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  const loadData = async () => {
    setLoading(true);
    console.log('🔍 Cargando datos del admin...');

    try {
      console.log('📥 Consultando depósitos pendientes...');
      const { data: depositsData, error: dError } = await supabase
        .from('transactions')
        .select('*, profiles!inner(email)')
        .eq('type', 'deposit')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📥 Depósitos:', depositsData, 'Error:', dError);

      console.log('📤 Consultando retiros pendientes...');
      const { data: withdrawalsData, error: wError } = await supabase
        .from('withdrawal_requests')
        .select('*, profiles!inner(email)')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      console.log('📤 Retiros:', withdrawalsData, 'Error:', wError);

      if (dError) {
        console.error('❌ Error depósitos:', dError);
        alert('Error cargando depósitos: ' + dError.message);
      } else {
        console.log('✅ Depósitos cargados:', depositsData?.length || 0);
        setDeposits(depositsData || []);
      }

      if (wError) {
        console.error('❌ Error retiros:', wError);
        alert('Error cargando retiros: ' + wError.message);
      } else {
        console.log('✅ Retiros cargados:', withdrawalsData?.length || 0);
        setWithdrawals(withdrawalsData || []);
      }
    } catch (error: any) {
      console.error('❌ Error general:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveDeposit = async (deposit: any) => {
    if (!confirm(`¿Aprobar depósito de $${deposit.amount}?`)) return;

    setProcessing(deposit.id);
    try {
      console.log('✅ Aprobando depósito:', deposit.id);

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', deposit.id);

      if (updateError) throw updateError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', deposit.user_id)
        .single();

      const newBalance = (profile?.balance || 0) + parseFloat(deposit.amount);

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', deposit.user_id);

      if (balanceError) throw balanceError;

      await supabase.from('user_notifications').insert({
        user_id: deposit.user_id,
        type: 'success',
        title: 'Depósito Aprobado',
        message: `Tu depósito de $${deposit.amount} fue aprobado.`
      });

      alert('✅ Depósito aprobado!');
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const rejectDeposit = async (deposit: any) => {
    const reason = prompt('¿Razón del rechazo?');
    if (!reason) return;

    setProcessing(deposit.id);
    try {
      await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', deposit.id);

      await supabase.from('user_notifications').insert({
        user_id: deposit.user_id,
        type: 'error',
        title: 'Depósito Rechazado',
        message: `Razón: ${reason}`
      });

      alert('❌ Depósito rechazado');
      loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const approveWithdrawal = async (withdrawal: any) => {
    const txHash = prompt(`¿Aprobar retiro de $${withdrawal.amount}?\n\nIngresa TX Hash (opcional):`);
    if (txHash === null) return;

    setProcessing(withdrawal.id);
    try {
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          admin_notes: txHash || 'Aprobado'
        })
        .eq('id', withdrawal.id);

      await supabase.from('user_notifications').insert({
        user_id: withdrawal.user_id,
        type: 'success',
        title: 'Retiro Aprobado',
        message: `Tu retiro de $${withdrawal.amount} fue procesado.`
      });

      alert('✅ Retiro aprobado!');
      loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const rejectWithdrawal = async (withdrawal: any) => {
    const reason = prompt('¿Razón del rechazo?');
    if (!reason) return;

    setProcessing(withdrawal.id);
    try {
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          admin_notes: reason
        })
        .eq('id', withdrawal.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single();

      const newBalance = (profile?.balance || 0) + parseFloat(withdrawal.amount);

      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', withdrawal.user_id);

      await supabase.from('user_notifications').insert({
        user_id: withdrawal.user_id,
        type: 'error',
        title: 'Retiro Rechazado',
        message: `Fondos devueltos. Razón: ${reason}`
      });

      alert('❌ Retiro rechazado y fondos devueltos');
      loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
          <div className="flex justify-center mb-6">
            <Lock size={48} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-8">Admin Panel</h1>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white mb-4"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Entrar
            </button>
          </form>

          <p className="text-slate-400 text-center text-sm mt-4">
            Contraseña: Admin2024!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Panel de Administración</h1>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Lock size={20} />
              Salir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Depósitos Pendientes ({deposits.length})
            </h2>

            {loading ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : deposits.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay depósitos pendientes</p>
            ) : (
              <div className="space-y-4">
                {deposits.map((dep) => (
                  <div key={dep.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{dep.profiles.email}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(dep.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">${dep.amount}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => approveDeposit(dep)}
                        disabled={processing === dep.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectDeposit(dep)}
                        disabled={processing === dep.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Retiros Pendientes ({withdrawals.length})
            </h2>

            {loading ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : withdrawals.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay retiros pendientes</p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((wd) => (
                  <div key={wd.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{wd.profiles.email}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(wd.requested_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">${wd.amount}</p>
                    </div>

                    <div className="mb-3 p-2 bg-slate-800 rounded text-xs">
                      <p className="text-slate-400">Dirección:</p>
                      <p className="text-slate-300 break-all">{wd.usdt_address}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => approveWithdrawal(wd)}
                        disabled={processing === wd.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectWithdrawal(wd)}
                        disabled={processing === wd.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
      </div>
    </div>
  );
}
