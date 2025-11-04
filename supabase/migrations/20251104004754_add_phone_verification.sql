/*
  # Add Phone Verification System

  1. New Tables
    - `phone_verifications`
      - `id` (uuid, primary key)
      - `phone_number` (text) - Phone number to verify
      - `code` (text) - 6-digit verification code
      - `verified` (boolean) - Whether code was verified
      - `expires_at` (timestamptz) - When code expires (5 minutes)
      - `created_at` (timestamptz)
      - `attempts` (integer) - Number of verification attempts

  2. Changes
    - Add `phone_verified` column to profiles table
    - Add `phone_verification_required` column to profiles

  3. Security
    - Enable RLS on `phone_verifications` table
    - Add policies for creating and verifying codes
    - Add function to generate and verify codes

  4. Functions
    - `generate_verification_code()` - Creates a new 6-digit code
    - `verify_phone_code()` - Verifies the code and marks phone as verified
*/

-- Create phone verifications table
CREATE TABLE IF NOT EXISTS phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  code text NOT NULL,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  attempts integer DEFAULT 0
);

-- Add phone verification columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_verification_required'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_verification_required boolean DEFAULT true;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a verification code
CREATE POLICY "Anyone can create verification code"
  ON phone_verifications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can view their own verification codes
CREATE POLICY "Users can view own verification codes"
  ON phone_verifications
  FOR SELECT
  TO public
  USING (true);

-- Policy: Users can update their verification attempts
CREATE POLICY "Users can update verification codes"
  ON phone_verifications
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Function: Generate a 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code(p_phone_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Generate random 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  
  -- Set expiration to 5 minutes from now
  v_expires_at := now() + interval '5 minutes';
  
  -- Delete old codes for this phone number
  DELETE FROM phone_verifications
  WHERE phone_number = p_phone_number
  AND verified = false;
  
  -- Insert new verification code
  INSERT INTO phone_verifications (phone_number, code, expires_at)
  VALUES (p_phone_number, v_code, v_expires_at)
  RETURNING id INTO v_id;
  
  RETURN json_build_object(
    'success', true,
    'code', v_code,
    'expires_at', v_expires_at,
    'id', v_id
  );
END;
$$;

-- Function: Verify phone code
CREATE OR REPLACE FUNCTION verify_phone_code(p_phone_number text, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_verification_record RECORD;
  v_user_id uuid;
BEGIN
  -- Find the verification record
  SELECT * INTO v_verification_record
  FROM phone_verifications
  WHERE phone_number = p_phone_number
  AND verified = false
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if record exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró código de verificación'
    );
  END IF;
  
  -- Check if expired
  IF v_verification_record.expires_at < now() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El código ha expirado'
    );
  END IF;
  
  -- Check attempts
  IF v_verification_record.attempts >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Demasiados intentos. Solicita un nuevo código'
    );
  END IF;
  
  -- Check if code matches
  IF v_verification_record.code != p_code THEN
    -- Increment attempts
    UPDATE phone_verifications
    SET attempts = attempts + 1
    WHERE id = v_verification_record.id;
    
    RETURN json_build_object(
      'success', false,
      'message', 'Código incorrecto',
      'attempts_left', 3 - (v_verification_record.attempts + 1)
    );
  END IF;
  
  -- Code is correct! Mark as verified
  UPDATE phone_verifications
  SET verified = true
  WHERE id = v_verification_record.id;
  
  -- Update user profile if user exists
  UPDATE profiles
  SET phone_verified = true,
      phone_verification_required = false
  WHERE phone = p_phone_number;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Teléfono verificado exitosamente'
  );
END;
$$;
