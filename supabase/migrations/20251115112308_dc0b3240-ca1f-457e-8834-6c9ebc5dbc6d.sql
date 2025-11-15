-- Allow creators to view their own groups (creating separate policy since IF NOT EXISTS isn't supported)
DROP POLICY IF EXISTS "Creators can view their groups" ON public.expense_groups;

CREATE POLICY "Creators can view their groups"
ON public.expense_groups
FOR SELECT
USING (auth.uid() = created_by);

-- Create trigger to add the creator as a member after creating a group
DROP TRIGGER IF EXISTS add_creator_as_member_trigger ON public.expense_groups;

CREATE TRIGGER add_creator_as_member_trigger
AFTER INSERT ON public.expense_groups
FOR EACH ROW
EXECUTE FUNCTION public.add_creator_as_member();