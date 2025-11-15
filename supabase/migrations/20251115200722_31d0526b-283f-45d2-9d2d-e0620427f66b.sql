-- Fix critical security issue: Restrict profile visibility to only group members
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a more secure policy: Users can only view profiles of people in their groups
CREATE POLICY "Users can view profiles in their groups" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    INNER JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.user_id
  )
);

-- Restrict group invitations visibility to group creators only (not all members)
DROP POLICY IF EXISTS "Users can view invitations for their groups" ON public.group_invitations;

CREATE POLICY "Group creators can view invitations" 
ON public.group_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.expense_groups 
    WHERE expense_groups.id = group_invitations.group_id 
    AND expense_groups.created_by = auth.uid()
  )
);

-- Allow invited users to view their own invitations
CREATE POLICY "Invited users can view their invitations" 
ON public.group_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.email = group_invitations.invited_email
  )
);