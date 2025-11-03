/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance concerns:

  ## 1. Performance Optimizations
    - Add missing index for foreign key on investments.plan_id
    - Optimize all RLS policies to use (SELECT auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth functions for each row

  ## 2. Function Security
    - Set explicit search_path on all functions to prevent search_path attacks
    - Use 'SET search_path = public, pg_temp' for security

  ## 3. Unused Indexes Cleanup
    - Remove indexes that are not being used to reduce write overhead
    - Keep only indexes that improve query performance

  ## 4. RLS Policy Improvements
    - Optimize all policies for better performance at scale
    - Maintain security while improving query execution speed
*/

-- Add missing index for foreign key
CREATE INDEX IF NOT EXISTS idx_investments_plan_id ON public.investments(plan_id);

-- Drop unused indexes to reduce overhead
DROP INDEX IF EXISTS public.idx_earnings_user_id;
DROP INDEX IF EXISTS public.idx_withdrawal_receipts_user_id;
DROP INDEX IF EXISTS public.idx_withdrawal_receipts_withdrawal_id;
DROP INDEX IF EXISTS public.idx_user_notifications_is_read;
DROP INDEX IF EXISTS public.idx_profiles_referral_code;
DROP INDEX IF EXISTS public.idx_profiles_referred_by;
DROP INDEX IF EXISTS public.idx_referrals_referred_id;
DROP INDEX IF EXISTS public.idx_identity_verifications_status;
DROP INDEX IF EXISTS public.idx_user_task_completions_user_id;
DROP INDEX IF EXISTS public.idx_user_task_completions_task_id;
DROP INDEX IF EXISTS public.idx_user_task_completions_date;
DROP INDEX IF EXISTS public.idx_withdrawal_requests_user_id;
DROP INDEX IF EXISTS public.idx_withdrawal_requests_status;
DROP INDEX IF EXISTS public.idx_admin_notifications_is_read;
DROP INDEX IF EXISTS public.idx_admin_notifications_created_at;

-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Fix RLS policies for investments table
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;

CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own investments"
  ON public.investments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own investments"
  ON public.investments FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix RLS policies for transactions table
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix RLS policies for earnings table
DROP POLICY IF EXISTS "Users can view own earnings" ON public.earnings;

CREATE POLICY "Users can view own earnings"
  ON public.earnings FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Fix RLS policies for withdrawal_requests table
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON public.withdrawal_requests;

CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix RLS policies for user_task_completions table
DROP POLICY IF EXISTS "Users can view own task completions" ON public.user_task_completions;
DROP POLICY IF EXISTS "Users can create own task completions" ON public.user_task_completions;

CREATE POLICY "Users can view own task completions"
  ON public.user_task_completions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own task completions"
  ON public.user_task_completions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix RLS policies for withdrawal_receipts table
DROP POLICY IF EXISTS "Users can view own withdrawal receipts" ON public.withdrawal_receipts;

CREATE POLICY "Users can view own withdrawal receipts"
  ON public.withdrawal_receipts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Fix RLS policies for user_notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;

CREATE POLICY "Users can view own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix RLS policies for referrals table
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (referrer_id = (SELECT auth.uid()) OR referred_id = (SELECT auth.uid()));

-- Fix RLS policies for identity_verifications table
DROP POLICY IF EXISTS "Users can view own verifications" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can create own verifications" ON public.identity_verifications;

CREATE POLICY "Users can view own verifications"
  ON public.identity_verifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own verifications"
  ON public.identity_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix function security - set explicit search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_with_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  referrer_profile RECORD;
  admin_record RECORD;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      NEW.referral_code := generate_referral_code();
      BEGIN
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        CONTINUE;
      END;
    END LOOP;
  END IF;

  IF NEW.referred_by IS NOT NULL THEN
    INSERT INTO referrals (referrer_id, referred_id, referral_code)
    VALUES (NEW.referred_by, NEW.id, NEW.referral_code)
    ON CONFLICT DO NOTHING;

    SELECT * INTO referrer_profile FROM profiles WHERE id = NEW.referred_by;

    FOR admin_record IN SELECT id FROM profiles WHERE role = 'admin' LOOP
      INSERT INTO user_notifications (user_id, type, title, message)
      VALUES (
        admin_record.id,
        'referral_signup',
        'New Referral Signup',
        NEW.email || ' signed up using ' || COALESCE(referrer_profile.email, 'unknown') || '''s referral link'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_daily_earnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  investment_record RECORD;
  daily_earning numeric;
  plan_record RECORD;
BEGIN
  FOR investment_record IN 
    SELECT * FROM investments 
    WHERE status = 'active'
    AND (last_payout_date IS NULL OR last_payout_date < CURRENT_DATE)
  LOOP
    SELECT * INTO plan_record FROM investment_plans WHERE id = investment_record.plan_id;
    
    IF plan_record.id IS NOT NULL THEN
      daily_earning := investment_record.amount * (plan_record.daily_return_percentage / 100);
      
      INSERT INTO earnings (user_id, investment_id, amount, earned_date)
      VALUES (investment_record.user_id, investment_record.id, daily_earning, CURRENT_DATE);
      
      UPDATE investments 
      SET 
        total_earned = total_earned + daily_earning,
        last_payout_date = CURRENT_DATE
      WHERE id = investment_record.id;
      
      UPDATE profiles 
      SET 
        total_earnings = total_earnings + daily_earning,
        earnings_balance = earnings_balance + daily_earning,
        updated_at = now()
      WHERE id = investment_record.user_id;
      
      INSERT INTO transactions (user_id, type, amount, status, description)
      VALUES (
        investment_record.user_id,
        'earning',
        daily_earning,
        'completed',
        'Daily earnings from ' || plan_record.name
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  admin_record RECORD;
  user_email text;
BEGIN
  SELECT email INTO user_email FROM profiles WHERE id = NEW.user_id;
  
  FOR admin_record IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO user_notifications (user_id, type, title, message, reference_id)
    VALUES (
      admin_record.id,
      'withdrawal_request',
      'New Withdrawal Request',
      user_email || ' requested withdrawal of $' || NEW.amount::text,
      NEW.id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  admin_record RECORD;
  user_email text;
BEGIN
  SELECT email INTO user_email FROM profiles WHERE id = NEW.user_id;
  
  FOR admin_record IN SELECT id FROM profiles WHERE role = 'admin' LOOP
    INSERT INTO user_notifications (user_id, type, title, message, reference_id)
    VALUES (
      admin_record.id,
      'verification_submitted',
      'New Identity Verification',
      user_email || ' submitted identity verification documents',
      NEW.id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_withdrawal_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO user_notifications (user_id, type, title, message, reference_id)
    VALUES (
      NEW.user_id,
      'withdrawal_completed',
      'Withdrawal Completed',
      'Your withdrawal of $' || NEW.amount::text || ' has been processed',
      NEW.id::text
    );
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE profiles 
    SET balance = balance + NEW.amount 
    WHERE id = NEW.user_id;
    
    INSERT INTO user_notifications (user_id, type, title, message, reference_id)
    VALUES (
      NEW.user_id,
      'withdrawal_rejected',
      'Withdrawal Rejected',
      'Your withdrawal request of $' || NEW.amount::text || ' has been rejected. Amount refunded.',
      NEW.id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    UPDATE profiles 
    SET verification_status = 'verified'
    WHERE id = NEW.user_id;
    
    INSERT INTO user_notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'verification_approved',
      'Identity Verified',
      'Your identity verification has been approved'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE profiles 
    SET verification_status = 'rejected'
    WHERE id = NEW.user_id;
    
    INSERT INTO user_notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'verification_rejected',
      'Identity Verification Rejected',
      'Your identity verification was rejected. Reason: ' || COALESCE(NEW.admin_notes, 'No reason provided')
    );
  END IF;
  
  RETURN NEW;
END;
$$;
