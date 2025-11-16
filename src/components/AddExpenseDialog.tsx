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
      console.log("=== Add Expense Submission Started ===");
      console.log("Step 1 - Raw amount input:", amount);
      
      const totalAmount = parseFloat(amount);
      console.log("Step 2 - Parsed amount:", totalAmount);
      console.log("Step 3 - Is valid number:", !isNaN(totalAmount));
      console.log("Step 4 - Is positive:", totalAmount > 0);
      
      if (isNaN(totalAmount) || totalAmount <= 0) {
        console.error("Step 5 - Amount validation failed");
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (totalAmount > 999999999.99) {
        console.error("Step 5 - Amount too large");
        toast({
          title: "Amount too large",
          description: "Please enter an amount less than 999,999,999.99",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log("Step 6 - Amount validation passed");

      // Calculate splits based on type
      let finalSplits: { userId: string; amount: number }[] = [];

      console.log("Step 7 - Split type:", splitType);
      
      if (splitType === "equal") {
        console.log("Step 8 - Calculating equal splits");
        finalSplits = calculateEqualSplits().map((s) => ({
          userId: s.userId,
          amount: parseFloat(s.amount),
        }));
        console.log("Step 9 - Equal splits calculated:", finalSplits);
      } else if (splitType === "percentage") {
        console.log("Step 8 - Calculating percentage splits");
        const totalPercentage = splits.reduce(
          (sum, s) => sum + parseFloat(s.value || "0"),
          0
        );
        console.log("Step 9 - Total percentage:", totalPercentage);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          console.error("Step 10 - Percentage validation failed");
          toast({
            title: "Invalid percentages",
            description: "Percentages must add up to 100%",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        finalSplits = splits.map((s) => ({
          userId: s.userId,
          amount: (totalAmount * parseFloat(s.value)) / 100,
        }));
        console.log("Step 11 - Percentage splits calculated:", finalSplits);
      } else {
        console.log("Step 8 - Calculating amount splits");
        // amount type
        const totalSplit = splits.reduce(
          (sum, s) => sum + parseFloat(s.value || "0"),
          0
        );
        console.log("Step 9 - Total split amount:", totalSplit, "Expected:", totalAmount);
        if (Math.abs(totalSplit - totalAmount) > 0.01) {
          console.error("Step 10 - Amount split validation failed");
          toast({
            title: "Invalid amounts",
            description: "Split amounts must equal the total amount",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        finalSplits = splits.map((s) => ({
          userId: s.userId,
          amount: parseFloat(s.value),
        }));
        console.log("Step 11 - Amount splits calculated:", finalSplits);
      }

      // Create expense
      console.log("Step 12 - Creating expense with data:", {
        group_id: groupId,
        name,
        amount: totalAmount,
        paid_by: paidBy,
        expense_date: expenseDate,
        split_type: splitType,
      });
      
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

      if (expenseError) {
        console.error("Step 13 - Expense creation error:", expenseError);
        throw expenseError;
      }
      
      console.log("Step 14 - Expense created successfully:", expense);

      // Create splits
      const splitsToInsert = finalSplits.map((s) => ({
        expense_id: expense.id,
        user_id: s.userId,
        amount: s.amount,
      }));
      
      console.log("Step 15 - Inserting splits:", splitsToInsert);
      
      const { error: splitsError } = await supabase
        .from("expense_splits")
        .insert(splitsToInsert);

      if (splitsError) {
        console.error("Step 16 - Splits creation error:", splitsError);
        throw splitsError;
      }
      
      console.log("Step 17 - Splits created successfully");

      toast({
        title: "Expense added",
        description: "The expense has been successfully added.",
      });
      
      console.log("=== Expense Creation Completed Successfully ===");

      resetForm();
      setOpen(false);
      onExpenseAdded();
    } catch (error) {
      console.error("=== Expense Creation Error ===", error);
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
        <Button size="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          <span className="text-sm md:text-base">Add Expense</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] md:max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg md:text-xl">Add New Expense</DialogTitle>
          <DialogDescription className="text-sm">
            Add an expense and split it among group members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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
                min="0.01"
                max="999999999.99"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  console.log("Amount input changed:", e.target.value);
                  setAmount(e.target.value);
                }}
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
