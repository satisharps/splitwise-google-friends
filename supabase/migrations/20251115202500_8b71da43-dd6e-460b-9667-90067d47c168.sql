-- Create settlements table to track debt payments
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL,
  payee_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  settled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Group members can view settlements in their groups
CREATE POLICY "Group members can view settlements" 
ON public.settlements 
FOR SELECT 
USING (is_group_member(auth.uid(), group_id));

-- Group members can create settlements
CREATE POLICY "Group members can create settlements" 
ON public.settlements 
FOR INSERT 
WITH CHECK (
  is_group_member(auth.uid(), group_id)
  AND created_by = auth.uid()
);

-- Only creator can delete their settlements
CREATE POLICY "Settlement creator can delete" 
ON public.settlements 
FOR DELETE 
USING (created_by = auth.uid());

-- Add index for performance
CREATE INDEX idx_settlements_group_id ON public.settlements(group_id);
CREATE INDEX idx_settlements_payer_payee ON public.settlements(payer_id, payee_id);