import { X, CheckCircle, Download } from 'lucide-react';

type WithdrawalVoucherProps = {
  onClose: () => void;
  withdrawalData: {
    id: string;
    amount: number;
    address: string;
    timestamp: string;
    commission: number;
    netAmount: number;
  };
};

export function WithdrawalVoucher({ onClose, withdrawalData }: WithdrawalVoucherProps) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-lg w-full border border-emerald-500/30 shadow-2xl">
        <div className="relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors bg-slate-700/50 rounded-full p-2"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 text-center border-b border-slate-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full mb-4 relative">
              <CheckCircle size={48} className="text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
            </div>

            <div className="bg-slate-900/50 rounded-lg py-2 px-4 inline-block mb-4">
              <p className="text-emerald-400 font-semibold text-lg">Operación exitosa</p>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">Retiro Enviado</h2>
            <p className="text-slate-300 text-sm">
              Tu solicitud de retiro ha sido enviada exitosamente. Se procesará dentro de 0-72 horas.
            </p>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-bold text-white mb-6">Detalles de la Solicitud</h3>

            <div className="space-y-4 bg-slate-900/50 rounded-xl p-6 border border-slate-700">
              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Nro. de Serie</span>
                <span className="text-white font-semibold">{withdrawalData.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Fecha y Hora</span>
                <span className="text-white font-semibold">{withdrawalData.timestamp}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Método de Retiro</span>
                <span className="text-white font-semibold">USDT (TRC20)</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Monto de Retiro</span>
                <span className="text-cyan-400 font-bold">${withdrawalData.amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                <span className="text-slate-400 text-sm">Comisión de Manejo</span>
                <span className="text-orange-400 font-semibold">${withdrawalData.commission.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-white font-bold">Monto Real</span>
                <span className="text-emerald-400 font-bold text-xl">${withdrawalData.netAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <strong className="text-white">Dirección USDT:</strong>
              </p>
              <p className="text-cyan-400 text-xs mt-1 break-all font-mono">
                {withdrawalData.address}
              </p>
            </div>

            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm text-center">
                Recibirás una notificación una vez que se procese tu retiro.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                <Download size={18} />
                Descargar
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
