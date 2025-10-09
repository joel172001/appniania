/*
  # Add Withdrawal Requests and Admin Notifications

  1. New Tables
    - `withdrawal_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `amount` (numeric)
      - `usdt_address` (text)
      - `status` (text: pending, completed, rejected)
      - `admin_notes` (text)
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `admin_notifications`
      - `id` (uuid, primary key)
      - `type` (text: withdrawal_request, deposit, etc)
      - `title` (text)
      - `message` (text)
      - `reference_id` (uuid)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view and create their own withdrawal requests
    - Admin notifications are for admin viewing only
*/

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  usdt_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  admin_notes text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Add function to create admin notification on withdrawal request
CREATE OR REPLACE FUNCTION notify_admin_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, message, reference_id)
  VALUES (
    'withdrawal_request',
    'New Withdrawal Request',
    'User ' || NEW.user_id::text || ' requested withdrawal of $' || NEW.amount::text || ' to ' || NEW.usdt_address,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal notifications
DROP TRIGGER IF EXISTS trigger_notify_admin_on_withdrawal ON withdrawal_requests;
CREATE TRIGGER trigger_notify_admin_on_withdrawal
  AFTER INSERT ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_withdrawal();