import { useState, useEffect } from 'react';
import { Shield, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onSkip?: () => void;
}

export function PhoneVerification({ phoneNumber, onVerified, onSkip }: PhoneVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    sendVerificationCode();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const sendVerificationCode = async () => {
    setLoading(true);
    setError('');
    setCanResend(false);
    setTimeLeft(300);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-sms`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      setGeneratedCode(data.code);
      console.log('Código de verificación:', data.code);
    } catch (err: any) {
      setError(err.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyCode = async (enteredCode: string) => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('verify_phone_code', {
        p_phone_number: phoneNumber,
        p_code: enteredCode,
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
        }, 1500);
      } else {
        setError(data.message);
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar código');
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verificación de Teléfono</h1>
            <p className="text-slate-400">
              Ingresa el código de 6 dígitos enviado a
            </p>
            <p className="text-blue-400 font-semibold mt-1">{phoneNumber}</p>
          </div>

          {generatedCode && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <p className="text-blue-400 text-sm text-center">
                <strong>Código de desarrollo:</strong> {generatedCode}
              </p>
              <p className="text-slate-400 text-xs text-center mt-1">
                (Este mensaje solo aparece en desarrollo)
              </p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-4">
                <Check size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verificado!</h2>
              <p className="text-slate-400">Tu teléfono ha sido verificado exitosamente</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading || success}
                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-700 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm mb-2">
                  {canResend ? (
                    'El código ha expirado'
                  ) : (
                    <>El código expira en <span className="text-blue-400 font-semibold">{formatTime(timeLeft)}</span></>
                  )}
                </p>
                {canResend ? (
                  <button
                    onClick={sendVerificationCode}
                    disabled={loading}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold"
                  >
                    Reenviar código
                  </button>
                ) : (
                  <button
                    onClick={sendVerificationCode}
                    disabled={!canResend || loading}
                    className="text-slate-500 text-sm cursor-not-allowed"
                  >
                    Reenviar código
                  </button>
                )}
              </div>

              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Verificar más tarde
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>No compartas tu código con nadie</p>
        </div>
      </div>
    </div>
  );
}
