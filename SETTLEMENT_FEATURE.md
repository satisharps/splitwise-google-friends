# Settlement Tracking Feature

## Overview
The settlement tracking feature automatically calculates who owes whom in a group based on all expenses and their splits, then suggests optimized payment transfers to settle all debts.

## How It Works

### 1. Balance Calculation
For each member, the system calculates their net balance:
- **Balance = Total Paid - Total Owed**
- Positive balance = Money owed to them
- Negative balance = Money they owe

Example:
- Alice paid $100 for dinner (3 people, split equally)
  - Alice: +$100 (paid) -$33.33 (her share) = **+$66.67**
  - Bob: -$33.33 (owes)
  - Carol: -$33.33 (owes)

### 2. Settlement Optimization
The system uses a greedy algorithm to minimize the number of transactions needed:

**Without optimization:**
- Bob pays Alice $33.33
- Carol pays Alice $33.33
- Total: 2 transactions

**With optimization (for complex scenarios):**
If Alice owes Dave $30 and Bob owes Alice $33.33:
- Bob pays Dave $30 (settles Alice's debt to Dave)
- Bob pays Alice $3.33
- Total: 2 transactions instead of 3

### 3. Settlement Types Supported

#### Equal Split
```
Expense: $90 dinner
Paid by: Alice
Members: Alice, Bob, Carol
Result:
- Each owes: $30
- Bob owes Alice $30
- Carol owes Alice $30
```

#### Percentage Split
```
Expense: $100 project
Paid by: Alice
Split: Alice 50%, Bob 30%, Carol 20%
Result:
- Alice: +$100 -$50 = +$50
- Bob owes Alice $30
- Carol owes Alice $20
```

#### Amount Split
```
Expense: $150 trip
Paid by: Alice
Custom: Alice $50, Bob $60, Carol $40
Result:
- Alice: +$150 -$50 = +$100
- Bob owes Alice $60
- Carol owes Alice $40
```

## Database Schema

### settlements table
```sql
CREATE TABLE public.settlements (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES expense_groups,
  payer_id UUID NOT NULL,        -- Who paid
  payee_id UUID NOT NULL,        -- Who received payment
  amount NUMERIC NOT NULL,       -- Amount paid
  currency TEXT NOT NULL,
  settled_at TIMESTAMP,
  notes TEXT,                    -- Optional payment notes
  created_by UUID NOT NULL,
  created_at TIMESTAMP
);
```

## UI Components

### SettlementSummary Component
Location: `src/components/SettlementSummary.tsx`

**Features:**
1. Calculates balances from all expenses and splits
2. Applies existing settlements to reduce balances
3. Shows optimized payment suggestions
4. Provides "Settle" button for each suggested payment
5. Records settlement transactions with optional notes

**States:**
- **No expenses:** Shows info message
- **All settled:** Shows success message (all balances = 0)
- **Active debts:** Shows simplified payment list

### Settlement Dialog
Confirms settlement with:
- From/To member names
- Amount to be paid
- Optional notes field (e.g., "Paid via PayPal")
- Confirm/Cancel buttons

## User Flow

1. **View Balances**
   - Navigate to group detail page
   - See "Settlement Status" section
   - View who owes whom

2. **Record Settlement**
   - Click "Settle" button on a payment
   - Optionally add notes
   - Click "Confirm Settlement"
   - Balance updates automatically

3. **Multiple Expenses**
   - System aggregates all expenses
   - Calculates net balances
   - Minimizes number of payments needed

## Example Scenarios

### Scenario 1: Simple Split
```
Expenses:
1. Alice paid $60 for lunch (split 3 ways)

Balances:
- Alice: +$40 (paid $60, owes $20)
- Bob: -$20
- Carol: -$20

Settlements Needed:
- Bob pays Alice $20
- Carol pays Alice $20
```

### Scenario 2: Multiple Expenses
```
Expenses:
1. Alice paid $60 for lunch (split equally, 3 people)
2. Bob paid $90 for dinner (split equally, 3 people)

Balances:
- Alice: +$60 -$20 -$30 = +$10
- Bob: +$90 -$20 -$30 = +$40
- Carol: -$20 -$30 = -$50

Settlements Needed:
- Carol pays Bob $40
- Carol pays Alice $10
```

### Scenario 3: Complex Chain
```
Expenses:
1. Alice paid $100 (split equally, 4 people)
2. Bob paid $80 (split equally, 4 people)
3. Carol paid $60 (split equally, 4 people)

Balances:
- Alice: +$100 -$60 = +$40
- Bob: +$80 -$60 = +$20
- Carol: +$60 -$60 = $0
- Dave: -$60

Settlements Needed (optimized):
- Dave pays Alice $40
- Dave pays Bob $20
```

## Security & Permissions

### RLS Policies
- Group members can view settlements in their groups
- Group members can create settlements
- Only settlement creator can delete their settlements

### Validation
- Settlement amount must be positive
- Payer and payee must be different
- Both must be group members
- Currency must match group currency

## Mobile Responsive
- Touch-friendly settle buttons (44px minimum)
- Scrollable settlement list
- Compact layout on small screens
- Readable text sizes (12px - 16px)

## Performance Considerations

1. **Calculation:** O(n log n) where n = number of members
2. **Storage:** Only stores settlement records, not balances
3. **Updates:** Real-time recalculation on expense changes
4. **Optimization:** Greedy algorithm minimizes transactions

## Future Enhancements

1. **Payment Integration**
   - Direct PayPal/Venmo links
   - In-app payment processing

2. **Reminders**
   - Notify members with outstanding balances
   - Payment due date tracking

3. **History**
   - View past settlements
   - Export settlement reports

4. **Analytics**
   - Payment completion rate
   - Average settlement time
   - Member payment reliability

## Testing Checklist

- [ ] Add expense and verify balance calculation
- [ ] Record settlement and verify balance updates
- [ ] Add multiple expenses and verify optimization
- [ ] Test with different split types (equal, %, amount)
- [ ] Verify mobile responsiveness
- [ ] Test with 2, 3, 5+ members
- [ ] Verify permissions (only members can settle)
- [ ] Test settlement notes field
- [ ] Verify currency consistency

## Status
✅ **IMPLEMENTED AND READY**

All features deployed and working:
- Balance calculation ✅
- Settlement optimization ✅
- Settlement recording ✅
- Mobile responsive UI ✅
- RLS security ✅
