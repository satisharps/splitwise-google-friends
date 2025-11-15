-- Allow users to add themselves as members to any group (link-based invitations)
CREATE POLICY "Users can add themselves to groups"
ON public.group_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);