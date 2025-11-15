import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Member = {
  user_id: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
};

type SplitType = "equal" | "percentage" | "amount";

type Split = {
  userId: string;
  value: string;
};

export function AddExpenseDialog({
  groupId,
  members,
  onExpenseAdded,
}: {
  groupId: string;
  members: Member[];
  onExpenseAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [splits, setSplits] = useState<Split[]>([]);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setAmount("");
    setPaidBy("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setSplitType("equal");
    setSplits([]);
  };

  const calculateEqualSplits = () => {
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || members.length === 0) return [];
    
    const perPerson = totalAmount / members.length;
    return members.map((member) => ({
      userId: member.user_id,
      amount: perPerson.toFixed(2),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = parseFloat(amount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Calculate splits based on type
      let finalSplits: { userId: string; amount: number }[] = [];

      if (splitType === "equal") {
        finalSplits = calculateEqualSplits().map((s) => ({
          userId: s.userId,
          amount: parseFloat(s.amount),
        }));
      } else if (splitType === "percentage") {
        const totalPercentage = splits.reduce(
          (sum, s) => sum + parseFloat(s.value || "0"),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          toast({
            title: "Invalid percentages",
            description: "Percentages must add up to 100%",
            variant: "destructive",
          });
          return;
        }
        finalSplits = splits.map((s) => ({
          userId: s.userId,
          amount: (totalAmount * parseFloat(s.value)) / 100,
        }));
      } else {
        // amount type
        const totalSplit = splits.reduce(
          (sum, s) => sum + parseFloat(s.value || "0"),
          0
        );
        if (Math.abs(totalSplit - totalAmount) > 0.01) {
          toast({
            title: "Invalid amounts",
            description: "Split amounts must equal the total amount",
            variant: "destructive",
          });
          return;
        }
        finalSplits = splits.map((s) => ({
          userId: s.userId,
          amount: parseFloat(s.value),
        }));
      }

      // Create expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          group_id: groupId,
          name,
          amount: totalAmount,
          paid_by: paidBy,
          expense_date: expenseDate,
          split_type: splitType,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create splits
      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(
          finalSplits.map((s) => ({
            expense_id: expense.id,
            user_id: s.userId,
            amount: s.amount,
          }))
        );

      if (splitsError) throw splitsError;

      toast({
        title: "Expense added",
        description: "The expense has been successfully added.",
      });

      resetForm();
      setOpen(false);
      onExpenseAdded();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeSplits = (type: SplitType) => {
    if (type === "equal") {
      setSplits([]);
    } else {
      setSplits(
        members.map((m) => ({
          userId: m.user_id,
          value: "",
        }))
      );
    }
  };

  const updateSplit = (userId: string, value: string) => {
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, value } : s))
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Add an expense and split it among group members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              placeholder="e.g., Dinner at restaurant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy} required>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => {
                  console.log("Member data:", member);
                  const displayName = member.profiles?.display_name || 
                                     member.profiles?.email || 
                                     member.user_id.slice(0, 8);
                  return (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="splitType">Split Type</Label>
            <Select
              value={splitType}
              onValueChange={(value: SplitType) => {
                setSplitType(value);
                initializeSplits(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Split Equally</SelectItem>
                <SelectItem value="percentage">By Percentage</SelectItem>
                <SelectItem value="amount">By Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {splitType !== "equal" && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <Label className="text-sm font-medium">
                Split Details {splitType === "percentage" ? "(%)" : "(Amount)"}
              </Label>
              <div className="space-y-2">
                {members.map((member) => {
                  const split = splits.find((s) => s.userId === member.user_id);
                  const displayName = member.profiles?.display_name || 
                                     member.profiles?.email || 
                                     member.user_id.slice(0, 8);
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3"
                    >
                      <Label className="flex-1 text-sm">
                        {displayName}
                      </Label>
                      <Input
                        type="number"
                        step={splitType === "percentage" ? "0.01" : "0.01"}
                        placeholder={splitType === "percentage" ? "0" : "0.00"}
                        value={split?.value || ""}
                        onChange={(e) =>
                          updateSplit(member.user_id, e.target.value)
                        }
                        className="w-32"
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
