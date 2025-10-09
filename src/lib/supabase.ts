import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  usdt_address: string | null;
  balance: number;
  earnings_balance: number;
  total_invested: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
};

export type InvestmentPlan = {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number | null;
  daily_return_percentage: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'cancelled';
  total_earned: number;
  last_payout_date: string | null;
  created_at: string;
  plan?: InvestmentPlan;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'earning' | 'investment';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  tx_hash: string | null;
  description: string | null;
  created_at: string;
};

export type DailyTask = {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  task_type: string;
  task_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type UserTaskCompletion = {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
  completion_date: string;
  reward_credited: boolean;
  created_at: string;
};

export type WithdrawalReceipt = {
  id: string;
  withdrawal_id: string;
  user_id: string;
  amount: number;
  destination_address: string;
  transaction_reference: string;
  processed_by: string;
  processed_at: string;
  created_at: string;
};

export type UserNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};
