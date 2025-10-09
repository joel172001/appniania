/*
  # Setup Automated Daily Earnings with pg_cron

  1. Enable pg_cron Extension
    - Required for scheduling automatic tasks

  2. Create Function
    - `calculate_daily_earnings()` - Processes daily earnings for all active investments

  3. Schedule Daily Job
    - Runs every day at midnight UTC
    - Calculates and credits earnings automatically

  ## Important Notes
  - This ensures earnings are calculated automatically every day
  - Users will see their balance grow daily without manual intervention
  - Completed investments are marked as such automatically
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to calculate daily earnings
CREATE OR REPLACE FUNCTION calculate_daily_earnings()
RETURNS void AS $$
DECLARE
  investment_record RECORD;
  daily_return NUMERIC;
  today_date DATE;
BEGIN
  today_date := CURRENT_DATE;

  FOR investment_record IN 
    SELECT i.*, p.daily_return_percentage, p.name as plan_name
    FROM investments i
    JOIN investment_plans p ON i.plan_id = p.id
    WHERE i.status = 'active'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM earnings 
      WHERE investment_id = investment_record.id 
      AND date = today_date
    ) THEN
      daily_return := (investment_record.amount * investment_record.daily_return_percentage) / 100;

      INSERT INTO earnings (investment_id, user_id, amount, date)
      VALUES (investment_record.id, investment_record.user_id, daily_return, today_date);

      UPDATE investments
      SET 
        total_earned = total_earned + daily_return,
        last_payout_date = NOW()
      WHERE id = investment_record.id;

      UPDATE profiles
      SET 
        balance = balance + daily_return,
        total_earnings = total_earnings + daily_return,
        updated_at = NOW()
      WHERE id = investment_record.user_id;

      INSERT INTO transactions (user_id, type, amount, status, description)
      VALUES (
        investment_record.user_id,
        'earning',
        daily_return,
        'completed',
        'Daily return from ' || investment_record.plan_name
      );

      IF NOW() >= investment_record.end_date THEN
        UPDATE investments
        SET status = 'completed'
        WHERE id = investment_record.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the job to run every day at midnight UTC
SELECT cron.schedule(
  'daily-earnings-calculation',
  '0 0 * * *',
  'SELECT calculate_daily_earnings();'
);