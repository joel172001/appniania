import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  ArrowLeft,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  usdt_address: string;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  user?: {
    email: string;
    full_name: string;
  };
};

type IdentityVerification = {
  id: string;
  user_id: string;
  document_type: string;
  document_front_url: string;
  document_back_url: string | null;
  selfie_url: string;
  passport_number: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  user?: {
    email: string;
    full_name: string;
  };
};

export function AdminPanel() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'verifications'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Withdrawal | IdentityVerification | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
    }
  }, [profile, activeTab]);

  const loadData = async () => {
    setLoading(true);

    if (activeTab === 'withdrawals') {
      const { data } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:profiles!withdrawal_requests_user_id_fkey(email, full_name)
        `)
        .order('requested_at', { ascending: false });

      if (data) setWithdrawals(data);
    } else {
      const { data } = await supabase
        .from('identity_verifications')
        .select(`
          *,
          user:profiles!identity_verifications_user_id_fkey(email, full_name)
        `)
        .order('submitted_at', { ascending: false });

      if (data) setVerifications(data);
    }

    setLoading(false);
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'completed' | 'rejected') => {
    setProcessingId(withdrawalId);

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: action,
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: (selectedItem as Withdrawal)?.user_id,
        type: 'withdrawal_update',
        title: `Withdrawal ${action}`,
        message: `Your withdrawal request has been ${action}. ${adminNotes || ''}`,
      });

      setSelectedItem(null);
      setAdminNotes('');
      await loadData();
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      alert('Failed to process withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerificationAction = async (verificationId: string, action: 'aprovado' | 'rejected') => {
    setProcessingId(verificationId);

    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          status: action,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', verificationId);

      if (error) throw error;

      if (action === 'aprovado') {
        await supabase
          .from('profiles')
          .update({ identity_verified: true })
          .eq('id', (selectedItem as IdentityVerification)?.user_id);
      }

      await supabase.from('notifications').insert({
        user_id: (selectedItem as IdentityVerification)?.user_id,
        type: 'verification_update',
        title: `Identity Verification ${action === 'aprovado' ? 'Approved' : 'Rejected'}`,
        message: `Your identity verification has been ${action === 'aprovado' ? 'approved' : 'rejected'}. ${adminNotes || ''}`,
      });

      setSelectedItem(null);
      setAdminNotes('');
      await loadData();
    } catch (err) {
      console.error('Error processing verification:', err);
      alert('Failed to process verification');
    } finally {
      setProcessingId(null);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center max-w-md">
          <Shield className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You need administrator privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-400" size={24} />
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <DollarSign size={20} />
            Withdrawals ({withdrawals.filter(w => w.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'verifications'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText size={20} />
            Verifications ({verifications.filter(v => v.status === 'pending').length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : activeTab === 'withdrawals' ? (
          <div className="grid gap-4">
            {withdrawals.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                <Clock className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-300">No withdrawal requests</p>
              </div>
            ) : (
              withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">
                          ${withdrawal.amount.toFixed(2)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            withdrawal.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : withdrawal.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {withdrawal.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-1">
                        User: {withdrawal.user?.full_name || withdrawal.user?.email}
                      </p>
                      <p className="text-slate-400 text-sm mb-1">
                        Wallet: {withdrawal.usdt_address}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Requested: {new Date(withdrawal.requested_at).toLocaleString()}
                      </p>
                      {withdrawal.admin_notes && (
                        <div className="mt-3 bg-slate-700/50 rounded-lg p-3">
                          <p className="text-slate-300 text-sm">
                            <span className="font-medium">Admin Notes:</span> {withdrawal.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                    {withdrawal.status === 'pending' && (
                      <button
                        onClick={() => setSelectedItem(withdrawal)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {verifications.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                <FileText className="mx-auto text-slate-400 mb-3" size={48} />
                <p className="text-slate-300">No verification requests</p>
              </div>
            ) : (
              verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg capitalize">
                          {verification.document_type.replace('_', ' ')}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            verification.status === 'aprovado' || verification.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : verification.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {verification.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-1">
                        User: {verification.user?.full_name || verification.user?.email}
                      </p>
                      {verification.passport_number && (
                        <p className="text-slate-400 text-sm mb-1">
                          Passport: {verification.passport_number}
                        </p>
                      )}
                      <p className="text-slate-500 text-xs">
                        Submitted: {new Date(verification.submitted_at).toLocaleString()}
                      </p>
                      {verification.admin_notes && (
                        <div className="mt-3 bg-slate-700/50 rounded-lg p-3">
                          <p className="text-slate-300 text-sm">
                            <span className="font-medium">Admin Notes:</span> {verification.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                    {verification.status === 'pending' && (
                      <button
                        onClick={() => setSelectedItem(verification)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl my-8">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">
                {activeTab === 'withdrawals' ? 'Review Withdrawal' : 'Review Identity Verification'}
              </h2>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeTab === 'withdrawals' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Amount</label>
                      <p className="text-white text-xl font-bold">
                        ${(selectedItem as Withdrawal).amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">User</label>
                      <p className="text-white">
                        {(selectedItem as Withdrawal).user?.full_name || (selectedItem as Withdrawal).user?.email}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-slate-400 mb-1">Wallet Address</label>
                      <p className="text-white font-mono text-sm break-all">
                        {(selectedItem as Withdrawal).usdt_address}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add notes (optional)..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Document Type</label>
                      <p className="text-white capitalize">
                        {(selectedItem as IdentityVerification).document_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">User</label>
                      <p className="text-white">
                        {(selectedItem as IdentityVerification).user?.full_name || (selectedItem as IdentityVerification).user?.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Documents</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-2">Front Side</p>
                        <a
                          href={(selectedItem as IdentityVerification).document_front_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                        >
                          <ImageIcon className="mx-auto text-blue-400 mb-2" size={32} />
                          <p className="text-blue-400 text-sm text-center flex items-center justify-center gap-2">
                            View Document <ExternalLink size={14} />
                          </p>
                        </a>
                      </div>

                      {(selectedItem as IdentityVerification).document_back_url && (
                        <div>
                          <p className="text-slate-400 text-sm mb-2">Back Side</p>
                          <a
                            href={(selectedItem as IdentityVerification).document_back_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                          >
                            <ImageIcon className="mx-auto text-blue-400 mb-2" size={32} />
                            <p className="text-blue-400 text-sm text-center flex items-center justify-center gap-2">
                              View Document <ExternalLink size={14} />
                            </p>
                          </a>
                        </div>
                      )}

                      <div>
                        <p className="text-slate-400 text-sm mb-2">Selfie</p>
                        <a
                          href={(selectedItem as IdentityVerification).selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                        >
                          <ImageIcon className="mx-auto text-cyan-400 mb-2" size={32} />
                          <p className="text-cyan-400 text-sm text-center flex items-center justify-center gap-2">
                            View Selfie <ExternalLink size={14} />
                          </p>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add notes (optional)..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setAdminNotes('');
                }}
                disabled={!!processingId}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'withdrawals') {
                    handleWithdrawalAction(selectedItem.id, 'rejected');
                  } else {
                    handleVerificationAction(selectedItem.id, 'rejected');
                  }
                }}
                disabled={!!processingId}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle size={20} />
                {processingId === selectedItem.id ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'withdrawals') {
                    handleWithdrawalAction(selectedItem.id, 'completed');
                  } else {
                    handleVerificationAction(selectedItem.id, 'aprovado');
                  }
                }}
                disabled={!!processingId}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                {processingId === selectedItem.id ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
