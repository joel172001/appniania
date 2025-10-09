/*
  # Investment Platform Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `usdt_address` (text, for deposits)
      - `balance` (numeric, default 0)
      - `total_invested` (numeric, default 0)
      - `total_earnings` (numeric, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `investment_plans`
      - `id` (uuid, primary key)
      - `name` (text)
      - `min_amount` (numeric)
      - `max_amount` (numeric)
      - `daily_return_percentage` (numeric)
      - `duration_days` (integer)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

    - `investments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `plan_id` (uuid, references investment_plans)
      - `amount` (numeric)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (text: active, completed, cancelled)
      - `total_earned` (numeric, default 0)
      - `last_payout_date` (timestamptz)
      - `created_at` (timestamptz)

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text: deposit, withdrawal, earning, investment)
      - `amount` (numeric)
      - `status` (text: pending, completed, rejected)
      - `tx_hash` (text, for crypto transactions)
      - `description` (text)
      - `created_at` (timestamptz)

    - `earnings`
      - `id` (uuid, primary key)
      - `investment_id` (uuid, references investments)
      - `user_id` (uuid, references profiles)
      - `amount` (numeric)
      - `date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Restrict access to other users' data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  usdt_address text,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  total_invested numeric DEFAULT 0 CHECK (total_invested >= 0),
  total_earnings numeric DEFAULT 0 CHECK (total_earnings >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create investment_plans table
CREATE TABLE IF NOT EXISTS investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_amount numeric NOT NULL CHECK (min_amount > 0),
  max_amount numeric CHECK (max_amount >= min_amount),
  daily_return_percentage numeric NOT NULL CHECK (daily_return_percentage > 0),
  duration_days integer NOT NULL CHECK (duration_days > 0),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active investment plans"
  ON investment_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES investment_plans(id),
  amount numeric NOT NULL CHECK (amount > 0),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_earned numeric DEFAULT 0 CHECK (total_earned >= 0),
  last_payout_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'earning', 'investment')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  tx_hash text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own earnings"
  ON earnings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default investment plans
INSERT INTO investment_plans (name, min_amount, max_amount, daily_return_percentage, duration_days, description)
VALUES 
  ('Starter Plan', 100, 999, 1.5, 30, 'Perfect for beginners. 1.5% daily returns for 30 days'),
  ('Growth Plan', 1000, 4999, 2.0, 60, 'Accelerate your earnings. 2.0% daily returns for 60 days'),
  ('Premium Plan', 5000, 19999, 2.5, 90, 'Premium returns for serious investors. 2.5% daily returns for 90 days'),
  ('Elite Plan', 20000, NULL, 3.0, 120, 'Maximum returns for elite investors. 3.0% daily returns for 120 days')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_investment_id ON earnings(investment_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);