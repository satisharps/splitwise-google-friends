-- CRITICAL FIX: Prevent unauthorized manipulation of financial data

-- Drop overly permissive policies on expenses
DROP POLICY IF EXISTS "Group members can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Group members can delete expenses" ON public.expenses;

-- Only expense creator or group creator can update expenses
CREATE POLICY "Expense creator or group creator can update expenses" 
ON public.expenses 
FOR UPDATE 
USING (
  paid_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.expense_groups 
    WHERE expense_groups.id = expenses.group_id 
    AND expense_groups.created_by = auth.uid()
  )
);

-- Only expense creator or group creator can delete expenses
CREATE POLICY "Expense creator or group creator can delete expenses" 
ON public.expenses 
FOR DELETE 
USING (
  paid_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.expense_groups 
    WHERE expense_groups.id = expenses.group_id 
    AND expense_groups.created_by = auth.uid()
  )
);

-- Drop overly permissive policies on expense_splits
DROP POLICY IF EXISTS "Users can update splits for group expenses" ON public.expense_splits;
DROP POLICY IF EXISTS "Users can delete splits for group expenses" ON public.expense_splits;

-- Only expense creator or group creator can update splits
CREATE POLICY "Expense creator or group creator can update splits" 
ON public.expense_splits 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    LEFT JOIN public.expense_groups g ON g.id = e.group_id
    WHERE e.id = expense_splits.expense_id 
    AND (e.paid_by = auth.uid() OR g.created_by = auth.uid())
  )
);

-- Only expense creator or group creator can delete splits
CREATE POLICY "Expense creator or group creator can delete splits" 
ON public.expense_splits 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    LEFT JOIN public.expense_groups g ON g.id = e.group_id
    WHERE e.id = expense_splits.expense_id 
    AND (e.paid_by = auth.uid() OR g.created_by = auth.uid())
  )
);

-- Allow group creators to remove members
CREATE POLICY "Group creators can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.expense_groups 
    WHERE expense_groups.id = group_members.group_id 
    AND expense_groups.created_by = auth.uid()
  )
);

-- Restrict invitation creation to group creators only
DROP POLICY IF EXISTS "Group members can create invitations" ON public.group_invitations;

CREATE POLICY "Only group creators can create invitations" 
ON public.group_invitations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expense_groups 
    WHERE expense_groups.id = group_invitations.group_id 
    AND expense_groups.created_by = auth.uid()
  )
);