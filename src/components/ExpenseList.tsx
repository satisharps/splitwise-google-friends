import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, Calendar, User } from "lucide-react";

type Expense = {
  id: string;
  name: string;
  amount: number;
  paid_by: string;
  expense_date: string;
  split_type: string;
  payer_profile?: {
    display_name: string | null;
    email: string | null;
  } | null;
  expense_splits: {
    user_id: string;
    amount: number;
    profiles: {
      display_name: string | null;
      email: string | null;
    } | null;
  }[];
};

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
  };
  return symbols[currency] || currency + " ";
};

export function ExpenseList({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const currencySymbol = getCurrencySymbol(currency);

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No expenses yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first expense to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{expense.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(expense.expense_date), "MMM d, yyyy")}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-base font-semibold">
                {currencySymbol}{expense.amount.toFixed(2)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Paid by:</span>
              <span className="font-medium">
                {expense.payer_profile?.display_name ||
                  expense.payer_profile?.email ||
                  "Unknown"}
              </span>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                Split {expense.split_type === "equal" ? "Equally" : `By ${expense.split_type}`}
              </p>
              <div className="space-y-1.5">
                {expense.expense_splits.map((split) => (
                  <div
                    key={split.user_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {split.profiles?.display_name ||
                        split.profiles?.email ||
                        "Unknown"}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{split.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
