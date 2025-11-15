import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, CheckCircle2, Loader2, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Balance = {
  userId: string;
  userName: string;
  balance: number; // positive = owed to them, negative = they owe
};

type Settlement = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
};

type Member = {
  user_id: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
};

type Expense = {
  id: string;
  paid_by: string;
  amount: number;
  expense_splits: {
    user_id: string;
    amount: number;
  }[];
};

type SettlementRecord = {
  payer_id: string;
  payee_id: string;
  amount: number;
};

export function SettlementSummary({
  groupId,
  members,
  expenses,
  currency,
  onSettlementAdded,
}: {
  groupId: string;
  members: Member[];
  expenses: Expense[];
  currency: string;
  onSettlementAdded: () => void;
}) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlingDebt, setSettlingDebt] = useState<Settlement | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingSettlements, setExistingSettlements] = useState<SettlementRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettlements();
  }, [groupId]);

  const fetchSettlements = async () => {
    const { data } = await supabase
      .from("settlements")
      .select("payer_id, payee_id, amount")
      .eq("group_id", groupId);
    
    setExistingSettlements(data || []);
  };

  useEffect(() => {
    calculateBalances();
  }, [expenses, members, existingSettlements]);

  const calculateBalances = () => {
    // Initialize balances for all members
    const balanceMap = new Map<string, { balance: number; userName: string }>();
    
    members.forEach((member) => {
      balanceMap.set(member.user_id, {
        balance: 0,
        userName: member.profiles?.display_name || member.profiles?.email || "Unknown",
      });
    });

    // Calculate from expenses
    expenses.forEach((expense) => {
      const payer = balanceMap.get(expense.paid_by);
      if (payer) {
        payer.balance += expense.amount;
      }

      expense.expense_splits.forEach((split) => {
        const debtor = balanceMap.get(split.user_id);
        if (debtor) {
          debtor.balance -= split.amount;
        }
      });
    });

    // Apply existing settlements
    // When someone pays their debt, their negative balance increases (moves toward zero)
    // When someone receives payment, their positive balance decreases (moves toward zero)
    existingSettlements.forEach((settlement) => {
      const payer = balanceMap.get(settlement.payer_id);
      const payee = balanceMap.get(settlement.payee_id);
      
      if (payer) payer.balance += settlement.amount;
      if (payee) payee.balance -= settlement.amount;
    });

    // Convert to array and filter out zero balances
    const balanceArray: Balance[] = Array.from(balanceMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        balance: Math.round(data.balance * 100) / 100,
      }))
      .filter((b) => Math.abs(b.balance) > 0.01);

    setBalances(balanceArray);

    // Calculate optimal settlements using greedy algorithm
    const creditors = balanceArray.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = balanceArray.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);

    const settlementsNeeded: Settlement[] = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, -debtor.balance);

      if (amount > 0.01) {
        settlementsNeeded.push({
          from: debtor.userId,
          fromName: debtor.userName,
          to: creditor.userId,
          toName: creditor.userName,
          amount: Math.round(amount * 100) / 100,
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }

    setSettlements(settlementsNeeded);
  };

  const handleSettleDebt = async () => {
    if (!settlingDebt) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("settlements").insert({
        group_id: groupId,
        payer_id: settlingDebt.from,
        payee_id: settlingDebt.to,
        amount: settlingDebt.amount,
        currency,
        notes: notes.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Settlement recorded!",
        description: `${settlingDebt.fromName} paid ${currency} ${settlingDebt.amount.toFixed(2)} to ${settlingDebt.toName}`,
      });

      setSettlingDebt(null);
      setNotes("");
      fetchSettlements();
      onSettlementAdded();
    } catch (error: any) {
      toast({
        title: "Error recording settlement",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (expenses.length === 0) {
    return (
      <Alert className="border-muted">
        <DollarSign className="h-4 w-4" />
        <AlertDescription className="text-xs md:text-sm">
          No expenses yet. Add expenses to see who owes what.
        </AlertDescription>
      </Alert>
    );
  }

  if (settlements.length === 0) {
    return (
      <Alert className="border-green-500/20 bg-green-500/5">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-xs md:text-sm text-green-700 dark:text-green-400">
          All settled! Everyone is square.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-3 md:space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Settlement Summary
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Simplified payments to settle all balances
          </p>
        </div>

        <div className="space-y-2 md:space-y-2.5">
          {settlements.map((settlement, index) => (
            <Card key={index} className="shadow-sm border-border/50">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
                      <p className="text-xs md:text-sm font-medium truncate">
                        {settlement.fromName}
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      owes
                    </p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                      <p className="text-xs md:text-sm font-medium truncate">
                        {settlement.toName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2 flex-shrink-0">
                    <p className="text-base md:text-lg font-bold text-primary whitespace-nowrap">
                      {currency} {settlement.amount.toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setSettlingDebt(settlement)}
                      className="w-full"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs md:text-sm">Settle</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!settlingDebt} onOpenChange={(open) => !open && setSettlingDebt(null)}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Record Settlement</DialogTitle>
            <DialogDescription className="text-sm">
              Confirm that this payment has been made
            </DialogDescription>
          </DialogHeader>

          {settlingDebt && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-accent/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">{settlingDebt.fromName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">{settlingDebt.toName}</span>
                </div>
                <div className="flex items-center justify-between text-base md:text-lg font-bold pt-2 border-t">
                  <span>Amount:</span>
                  <span className="text-primary">
                    {currency} {settlingDebt.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="E.g., Paid via PayPal, Cash payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSettlingDebt(null);
                setNotes("");
              }}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSettleDebt}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Settlement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
