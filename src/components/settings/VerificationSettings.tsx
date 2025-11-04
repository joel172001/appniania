import { useState, useEffect } from 'react';
import { FileText, Check, X, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ImageCapture } from './ImageCapture';

export function VerificationSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [documentType, setDocumentType] = useState<'passport' | 'national_id'>('national_id');
  const [passportNumber, setPassportNumber] = useState('');
  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadVerification();
    }
  }, [user]);

  const loadVerification = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading verification:', error);
      } else if (data) {
        setVerification(data);
      }
    } catch (err) {
      console.error('Error loading verification:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');

    if (!documentFront || !selfie) {
      setError('Please upload all required documents');
      return;
    }

    if (documentType === 'national_id' && !documentBack) {
      setError('Please upload both sides of your ID');
      return;
    }

    if (documentType === 'passport' && !passportNumber) {
      setError('Please enter your passport number');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (documentFront.size > maxSize || (documentBack && documentBack.size > maxSize) || selfie.size > maxSize) {
      setError('Each file must be less than 10MB');
      return;
    }

    setLoading(true);

    try {
      const frontUrl = await uploadFile(documentFront, 'verification-documents');
      const backUrl = documentBack ? await uploadFile(documentBack, 'verification-documents') : null;
      const selfieUrl = await uploadFile(selfie, 'verification-selfies');

      const { error: insertError } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_front_url: frontUrl,
          document_back_url: backUrl,
          selfie_url: selfieUrl,
          passport_number: documentType === 'passport' ? passportNumber : null,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      await loadVerification();
      await refreshProfile();

      setDocumentFront(null);
      setDocumentBack(null);
      setSelfie(null);
      setPassportNumber('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      in_review: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      aprovado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
    };

    const icons: Record<string, any> = {
      pending: Clock,
      in_review: AlertCircle,
      verified: Check,
      aprovado: Check,
      rejected: X,
    };

    const Icon = icons[status] || AlertCircle;
    const style = styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/50';

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${style}`}>
        <Icon size={16} />
        <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Identity Verification</h3>
          <p className="text-slate-400 text-sm mb-6">Loading verification status...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (verification) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Identity Verification</h3>
          <p className="text-slate-400 text-sm mb-6">Your verification status and details</p>
        </div>

        <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h4 className="text-white font-semibold">Verification Status</h4>
            {getStatusBadge(verification.status)}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Document Type</label>
              <p className="text-white capitalize">{verification.document_type.replace('_', ' ')}</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Submitted At</label>
              <p className="text-white">{new Date(verification.submitted_at).toLocaleString()}</p>
            </div>

            {verification.status === 'rejected' && verification.admin_notes && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium mb-1">Reason for Rejection:</p>
                <p className="text-red-300 text-sm">{verification.admin_notes}</p>
              </div>
            )}

            {(verification.status === 'verified' || verification.status === 'aprovado') && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-4">
                <p className="text-emerald-400 text-sm flex items-center gap-2">
                  <Check size={18} />
                  Your identity has been verified successfully!
                </p>
              </div>
            )}
          </div>

          {(verification.status === 'rejected' || verification.status === 'pending') && (
            <button
              onClick={() => setVerification(null)}
              className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Submit New Verification
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Identity Verification</h3>
        <p className="text-slate-400 text-sm mb-6">Verify your identity to access all platform features</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Document Type</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDocumentType('national_id')}
              className={`p-4 rounded-lg border-2 transition-all ${
                documentType === 'national_id'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <FileText className={documentType === 'national_id' ? 'text-blue-400' : 'text-slate-400'} size={32} />
              <p className="text-white font-medium mt-2 text-sm">National ID</p>
              <p className="text-slate-400 text-xs">ID card or license</p>
            </button>

            <button
              type="button"
              onClick={() => setDocumentType('passport')}
              className={`p-4 rounded-lg border-2 transition-all ${
                documentType === 'passport'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <FileText className={documentType === 'passport' ? 'text-blue-400' : 'text-slate-400'} size={32} />
              <p className="text-white font-medium mt-2 text-sm">Passport</p>
              <p className="text-slate-400 text-xs">International passport</p>
            </button>
          </div>
        </div>

        {documentType === 'passport' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Passport Number</label>
            <input
              type="text"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="A1234567"
              required
            />
          </div>
        )}

        <ImageCapture
          label="Lado Frontal del Documento"
          description="Toma una foto clara del frente de tu documento de identidad"
          onCapture={setDocumentFront}
          captured={documentFront}
          required
        />

        {documentType === 'national_id' && (
          <ImageCapture
            label="Lado Posterior del Documento"
            description="Toma una foto clara de la parte trasera de tu documento de identidad"
            onCapture={setDocumentBack}
            captured={documentBack}
            required
          />
        )}

        <ImageCapture
          label="Selfie con tu Documento"
          description="Toma una selfie sosteniendo tu documento de identidad junto a tu rostro"
          onCapture={setSelfie}
          captured={selfie}
          required
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Verification'}
        </button>
      </form>
    </div>
  );
}
