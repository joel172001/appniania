/*
  # Add phone column to profiles table

  1. Changes
    - Add `phone` column to profiles table to store user phone numbers

  2. Notes
    - Column is optional (nullable) as existing users may not have phones
    - No default value to avoid masking missing data
*/

-- Add phone column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;
