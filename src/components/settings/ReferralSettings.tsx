import { useState, useEffect } from 'react';
import { Copy, Check, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ReferralSettings() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadReferrals();
    }
  }, [profile]);

  const loadReferrals = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:profiles!referrals_referred_id_fkey(full_name, email)
      `)
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setReferrals(data);
    }
    setLoading(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Referral Program</h3>
        <p className="text-slate-400 text-sm mb-6">
          Share your referral link and earn rewards when people join
        </p>
      </div>

      <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Your Referral Code</h4>
          <p className="text-slate-400 text-sm mb-3">Share this code with friends</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <code className="text-cyan-400 font-mono text-lg">
              {profile?.referral_code || 'LOADING...'}
            </code>
            <button
              onClick={copyReferralCode}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <label className="block text-sm text-slate-400 mb-2">Referral Link</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={`${window.location.origin}?ref=${profile?.referral_code}`}
              className="flex-1 min-w-64 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm break-all"
              readOnly
            />
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-semibold flex items-center gap-2">
            <Users size={20} />
            Your Referrals ({referrals.length})
          </h4>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-700/30 rounded-lg">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No referrals yet</p>
            <p className="text-sm mt-1">Share your link to start earning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-white font-medium">
                      {referral.referred?.full_name || 'User'}
                    </p>
                    <p className="text-slate-400 text-sm">{referral.referred?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
