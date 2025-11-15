-- Add RLS policy to allow users to add themselves to groups when they have a pending invitation
CREATE POLICY "Users can join groups they are invited to"
ON group_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM group_invitations gi
    INNER JOIN auth.users au ON au.email = gi.invited_email
    WHERE gi.group_id = group_members.group_id
    AND gi.status = 'pending'
    AND au.id = auth.uid()
  )
);

-- Add email column to profiles table for easier querying
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Create trigger to populate email from auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_email_sync
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();