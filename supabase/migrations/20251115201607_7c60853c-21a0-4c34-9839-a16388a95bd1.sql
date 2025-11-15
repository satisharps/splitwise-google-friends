-- Fix profile visibility issue for group member queries
-- Create a security definer function to check if users share a group

CREATE OR REPLACE FUNCTION public.users_share_group(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_members gm1
    INNER JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = _user1_id 
    AND gm2.user_id = _user2_id
  )
$$;

-- Update the profiles RLS policy to use the security definer function
DROP POLICY IF EXISTS "Users can view profiles in their groups" ON public.profiles;

CREATE POLICY "Users can view profiles in their groups" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  public.users_share_group(auth.uid(), user_id)
);