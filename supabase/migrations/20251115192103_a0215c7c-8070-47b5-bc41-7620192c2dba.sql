-- Drop the problematic policy that tries to access auth.users
DROP POLICY IF EXISTS "Users can join groups they are invited to" ON public.group_members;

-- Create a new policy that uses profiles instead of auth.users
CREATE POLICY "Users can join groups they are invited to"
ON public.group_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM group_invitations gi
    JOIN profiles p ON p.email = gi.invited_email
    WHERE gi.group_id = group_members.group_id
      AND gi.status = 'pending'
      AND p.user_id = auth.uid()
  )
);

-- Simplify the invitation update policy
DROP POLICY IF EXISTS "Invited users can update their invitation status" ON public.group_invitations;

CREATE POLICY "Invited users can update their invitation status"
ON public.group_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.email = group_invitations.invited_email
  )
);