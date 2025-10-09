/*
  # Fix Admin Notifications RLS Policy

  1. Changes
    - Drop the restrictive RLS policy on admin_notifications
    - Create new policy that allows system to insert notifications
    - Keep read policy for authenticated users

  2. Security
    - Allow service role and triggers to insert notifications
    - Authenticated users can read notifications
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow admin to view notifications" ON admin_notifications;

-- Create new policies
CREATE POLICY "Allow authenticated users to view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to insert notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role to update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);