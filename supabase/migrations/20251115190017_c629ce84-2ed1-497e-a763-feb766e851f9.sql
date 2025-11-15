-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'amount')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_splits table
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Group members can view expenses"
ON public.expenses
FOR SELECT
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create expenses"
ON public.expenses
FOR INSERT
WITH CHECK (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update expenses"
ON public.expenses
FOR UPDATE
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can delete expenses"
ON public.expenses
FOR DELETE
USING (is_group_member(auth.uid(), group_id));

-- RLS Policies for expense_splits
CREATE POLICY "Users can view splits for their group expenses"
ON public.expense_splits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_splits.expense_id
    AND is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Users can create splits for group expenses"
ON public.expense_splits
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_splits.expense_id
    AND is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Users can update splits for group expenses"
ON public.expense_splits
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_splits.expense_id
    AND is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Users can delete splits for group expenses"
ON public.expense_splits
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_splits.expense_id
    AND is_group_member(auth.uid(), e.group_id)
  )
);

-- Trigger for updating expenses updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();