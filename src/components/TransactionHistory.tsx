import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { Transaction } from '../lib/supabase';

type TransactionHistoryProps = {
  transactions: Transaction[];
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="text-emerald-400" size={20} />;
      case 'withdrawal':
        return <ArrowUpRight className="text-red-400" size={20} />;
      case 'earning':
        return <TrendingUp className="text-cyan-400" size={20} />;
      case 'investment':
        return <DollarSign className="text-blue-400" size={20} />;
      default:
        return <Clock className="text-slate-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'earning':
        return 'Daily Earning';
      case 'investment':
        return 'Investment';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Transactions</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Clock size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm sm:text-base">No transactions yet</p>
          <p className="text-xs sm:text-sm mt-1">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-slate-700/50 rounded-lg p-3 sm:p-4 border border-slate-600 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                        {getTypeLabel(transaction.type)}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          transaction.status
                        )} w-fit`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-xs sm:text-sm text-slate-400 truncate">{transaction.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-bold text-sm sm:text-base ${
                      transaction.type === 'deposit' || transaction.type === 'earning'
                        ? 'text-emerald-400'
                        : transaction.type === 'withdrawal'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {transaction.type === 'deposit' || transaction.type === 'earning' ? '+' : '-'}$
                    {transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
