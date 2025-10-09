/*
  # Add Withdrawal Receipts and Enhanced Notifications

  1. New Tables
    - `withdrawal_receipts`
      - `id` (uuid, primary key)
      - `withdrawal_id` (uuid, references withdrawal_requests)
      - `user_id` (uuid, references profiles)
      - `amount` (numeric)
      - `destination_address` (text)
      - `transaction_reference` (text)
      - `processed_by` (text)
      - `processed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `user_notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text: withdrawal_completed, withdrawal_rejected, etc)
      - `title` (text)
      - `message` (text)
      - `reference_id` (uuid)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view their own receipts and notifications
*/

-- Create withdrawal_receipts table
CREATE TABLE IF NOT EXISTS withdrawal_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  destination_address text NOT NULL,
  transaction_reference text NOT NULL,
  processed_by text DEFAULT 'Admin',
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawal receipts"
  ON withdrawal_receipts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_receipts_user_id ON withdrawal_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_receipts_withdrawal_id ON withdrawal_receipts(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

-- Update notify_admin_on_withdrawal function to include more details
CREATE OR REPLACE FUNCTION notify_admin_on_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  SELECT email, full_name INTO user_email, user_name
  FROM profiles
  WHERE id = NEW.user_id;

  INSERT INTO admin_notifications (type, title, message, reference_id)
  VALUES (
    'withdrawal_request',
    'New Withdrawal Request',
    'User: ' || COALESCE(user_name, 'N/A') || ' (' || user_email || ')' || E'\n' ||
    'Amount: $' || NEW.amount::text || E'\n' ||
    'USDT Address: ' || NEW.usdt_address || E'\n' ||
    'Requested at: ' || NEW.requested_at::text,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create receipt and notify user when withdrawal is completed
CREATE OR REPLACE FUNCTION process_withdrawal_completion()
RETURNS TRIGGER AS $$
DECLARE
  tx_ref TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    tx_ref := 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
    
    INSERT INTO withdrawal_receipts (
      withdrawal_id,
      user_id,
      amount,
      destination_address,
      transaction_reference
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.amount,
      NEW.usdt_address,
      tx_ref
    );

    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      reference_id
    ) VALUES (
      NEW.user_id,
      'withdrawal_completed',
      'Withdrawal Completed',
      'Your withdrawal of $' || NEW.amount::text || ' has been processed successfully.' || E'\n' ||
      'Destination: ' || NEW.usdt_address || E'\n' ||
      'Transaction Reference: ' || tx_ref || E'\n' ||
      'Processed at: ' || NOW()::text,
      NEW.id
    );
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO user_notifications (
      user_id,
      type,
      title,
      message,
      reference_id
    ) VALUES (
      NEW.user_id,
      'withdrawal_rejected',
      'Withdrawal Rejected',
      'Your withdrawal request of $' || NEW.amount::text || ' has been rejected.' || E'\n' ||
      CASE WHEN NEW.admin_notes IS NOT NULL THEN 'Reason: ' || NEW.admin_notes ELSE 'Please contact support for more information.' END,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal completion
DROP TRIGGER IF EXISTS trigger_process_withdrawal_completion ON withdrawal_requests;
CREATE TRIGGER trigger_process_withdrawal_completion
  AFTER UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION process_withdrawal_completion();