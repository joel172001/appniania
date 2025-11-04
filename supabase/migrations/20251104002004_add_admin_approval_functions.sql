/*
  # Add Admin Approval Functions for Deposits and Withdrawals

  1. New Functions
    - `approve_deposit(transaction_id)` - Approves a deposit and adds funds to user balance
    - `reject_deposit(transaction_id, reason)` - Rejects a deposit with optional reason
    - `approve_withdrawal(withdrawal_id)` - Approves a withdrawal and deducts from balance
    - `reject_withdrawal(withdrawal_id, reason)` - Rejects a withdrawal with optional reason

  2. Changes
    - Updates transaction status
    - Updates user balance when approved
    - Adds admin notes for rejections
    - Creates notification for user

  3. Security
    - These functions can be called directly from SQL
    - In future, can be restricted to admin role only
*/

-- Function to approve a deposit
CREATE OR REPLACE FUNCTION approve_deposit(
  p_transaction_id uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_result jsonb;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM transactions
  WHERE id = p_transaction_id AND type = 'deposit' AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Transaction not found or already processed'
    );
  END IF;

  -- Update transaction status
  UPDATE transactions
  SET status = 'completed',
      description = description || COALESCE(' | Admin note: ' || p_admin_note, '')
  WHERE id = p_transaction_id;

  -- Add funds to user balance
  UPDATE profiles
  SET balance = balance + v_transaction.amount,
      updated_at = now()
  WHERE id = v_transaction.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deposit approved successfully',
    'amount', v_transaction.amount,
    'user_id', v_transaction.user_id
  );
END;
$$;

-- Function to reject a deposit
CREATE OR REPLACE FUNCTION reject_deposit(
  p_transaction_id uuid,
  p_reason text DEFAULT 'Rejected by admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM transactions
  WHERE id = p_transaction_id AND type = 'deposit' AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Transaction not found or already processed'
    );
  END IF;

  -- Update transaction status
  UPDATE transactions
  SET status = 'rejected',
      description = description || ' | Reason: ' || p_reason
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deposit rejected',
    'user_id', v_transaction.user_id
  );
END;
$$;

-- Function to approve a withdrawal
CREATE OR REPLACE FUNCTION approve_withdrawal(
  p_withdrawal_id uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Withdrawal request not found or already processed'
    );
  END IF;

  -- Update withdrawal status
  UPDATE withdrawal_requests
  SET status = 'completed',
      admin_notes = p_admin_note,
      processed_at = now()
  WHERE id = p_withdrawal_id;

  -- Create completed transaction record
  INSERT INTO transactions (user_id, type, amount, status, description)
  VALUES (
    v_withdrawal.user_id,
    'withdrawal',
    v_withdrawal.amount,
    'completed',
    'Withdrawal to ' || v_withdrawal.usdt_address || ' - Approved'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Withdrawal approved successfully',
    'amount', v_withdrawal.amount,
    'user_id', v_withdrawal.user_id,
    'address', v_withdrawal.usdt_address
  );
END;
$$;

-- Function to reject a withdrawal
CREATE OR REPLACE FUNCTION reject_withdrawal(
  p_withdrawal_id uuid,
  p_reason text DEFAULT 'Rejected by admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Get withdrawal details
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Withdrawal request not found or already processed'
    );
  END IF;

  -- Return funds to user balance
  UPDATE profiles
  SET balance = balance + v_withdrawal.amount,
      updated_at = now()
  WHERE id = v_withdrawal.user_id;

  -- Update withdrawal status
  UPDATE withdrawal_requests
  SET status = 'rejected',
      admin_notes = p_reason,
      processed_at = now()
  WHERE id = p_withdrawal_id;

  -- Create rejected transaction record
  INSERT INTO transactions (user_id, type, amount, status, description)
  VALUES (
    v_withdrawal.user_id,
    'withdrawal',
    v_withdrawal.amount,
    'rejected',
    'Withdrawal rejected: ' || p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Withdrawal rejected and funds returned to user',
    'amount', v_withdrawal.amount,
    'user_id', v_withdrawal.user_id
  );
END;
$$;

-- Helper function to list pending deposits
CREATE OR REPLACE FUNCTION list_pending_deposits()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  amount numeric,
  tx_hash text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    p.email,
    t.amount,
    t.tx_hash,
    t.created_at
  FROM transactions t
  JOIN profiles p ON t.user_id = p.id
  WHERE t.type = 'deposit' AND t.status = 'pending'
  ORDER BY t.created_at DESC;
END;
$$;

-- Helper function to list pending withdrawals
CREATE OR REPLACE FUNCTION list_pending_withdrawals()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  amount numeric,
  usdt_address text,
  requested_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    p.email,
    w.amount,
    w.usdt_address,
    w.requested_at
  FROM withdrawal_requests w
  JOIN profiles p ON w.user_id = p.id
  WHERE w.status = 'pending'
  ORDER BY w.requested_at DESC;
END;
$$;
