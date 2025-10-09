/*
  # Add Tasks System and Earnings Balance

  1. Schema Changes
    - Add `earnings_balance` column to profiles table
    - Separate earnings that can be transferred to main balance

  2. New Tables
    - `daily_tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `reward_amount` (numeric)
      - `task_type` (text: social_media, video, survey, etc)
      - `task_url` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `user_task_completions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `task_id` (uuid, references daily_tasks)
      - `completed_at` (timestamptz)
      - `reward_credited` (boolean)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Users can view their own task completions
    - Users can create completions for active tasks
*/

-- Add earnings_balance to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'earnings_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN earnings_balance numeric DEFAULT 0 CHECK (earnings_balance >= 0);
  END IF;
END $$;

-- Create daily_tasks table
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_amount numeric NOT NULL CHECK (reward_amount > 0),
  task_type text NOT NULL DEFAULT 'general',
  task_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tasks"
  ON daily_tasks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create user_task_completions table
CREATE TABLE IF NOT EXISTS user_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  completion_date date DEFAULT CURRENT_DATE,
  reward_credited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task completions"
  ON user_task_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own task completions"
  ON user_task_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_task_completions_user_id ON user_task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_task_id ON user_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_date ON user_task_completions(completion_date);

-- Create unique constraint for one task per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_task_per_day 
  ON user_task_completions(user_id, task_id, completion_date);

-- Insert default daily tasks
INSERT INTO daily_tasks (title, description, reward_amount, task_type, task_url)
VALUES 
  ('Follow us on Twitter', 'Follow our official Twitter account and like our latest post', 2.50, 'social_media', 'https://twitter.com'),
  ('Watch Tutorial Video', 'Watch our complete investment tutorial video on YouTube', 3.00, 'video', 'https://youtube.com'),
  ('Share on Social Media', 'Share CryptoInvest platform with your friends on any social media', 2.00, 'social_media', 'https://facebook.com')
ON CONFLICT DO NOTHING;

-- Function to credit task reward
CREATE OR REPLACE FUNCTION credit_task_reward()
RETURNS TRIGGER AS $$
DECLARE
  task_reward NUMERIC;
BEGIN
  SELECT reward_amount INTO task_reward
  FROM daily_tasks
  WHERE id = NEW.task_id;

  UPDATE profiles
  SET 
    earnings_balance = earnings_balance + task_reward,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  UPDATE user_task_completions
  SET reward_credited = true
  WHERE id = NEW.id;

  INSERT INTO transactions (user_id, type, amount, status, description)
  VALUES (
    NEW.user_id,
    'earning',
    task_reward,
    'completed',
    'Task reward: ' || (SELECT title FROM daily_tasks WHERE id = NEW.task_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task reward
DROP TRIGGER IF EXISTS trigger_credit_task_reward ON user_task_completions;
CREATE TRIGGER trigger_credit_task_reward
  AFTER INSERT ON user_task_completions
  FOR EACH ROW
  EXECUTE FUNCTION credit_task_reward();