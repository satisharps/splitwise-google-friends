-- Add DELETE policies for better data privacy

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow group creators to delete/cancel invitations
CREATE POLICY "Group creators can delete invitations" 
ON public.group_invitations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.expense_groups 
    WHERE expense_groups.id = group_invitations.group_id 
    AND expense_groups.created_by = auth.uid()
  )
);

-- Allow invited users to reject/delete their invitations
CREATE POLICY "Invited users can delete their invitations" 
ON public.group_invitations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.email = group_invitations.invited_email
  )
);