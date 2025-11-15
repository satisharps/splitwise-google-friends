# SplitEase - Comprehensive Test Cases

## 1. Authentication Flow

### TC-AUTH-001: Google Sign In - Success
**Preconditions:** User is not authenticated
**Steps:**
1. Navigate to /auth
2. Click "Continue with Google" button
3. Complete Google OAuth flow
4. Accept permissions
**Expected Result:** User is redirected to dashboard with authenticated session
**Priority:** Critical

### TC-AUTH-002: Google Sign In - Cancel
**Preconditions:** User is not authenticated
**Steps:**
1. Navigate to /auth
2. Click "Continue with Google" button
3. Cancel Google OAuth flow
**Expected Result:** User remains on auth page with appropriate message
**Priority:** High

### TC-AUTH-003: Authentication State Persistence
**Preconditions:** User is authenticated
**Steps:**
1. Sign in successfully
2. Refresh the page
3. Close and reopen browser
**Expected Result:** User session persists, remains authenticated
**Priority:** Critical

### TC-AUTH-004: Protected Route Access - Unauthenticated
**Preconditions:** User is not authenticated
**Steps:**
1. Directly navigate to /group/{groupId}
2. Attempt to access dashboard
**Expected Result:** User is redirected to /auth with returnUrl parameter
**Priority:** Critical

### TC-AUTH-005: Return URL After Authentication
**Preconditions:** User accessed protected route while unauthenticated
**Steps:**
1. Navigate to /group/{groupId} without auth
2. Sign in via Google
**Expected Result:** User is redirected back to original /group/{groupId} page
**Priority:** High

---

## 2. Dashboard Flow

### TC-DASH-001: View Empty Dashboard
**Preconditions:** User is authenticated, no groups exist
**Steps:**
1. Navigate to dashboard
**Expected Result:** 
- Empty state message displayed
- "No groups yet" message visible
- "Create your first group" CTA shown
**Priority:** High

### TC-DASH-002: View Dashboard with Groups
**Preconditions:** User is authenticated, has created/joined groups
**Steps:**
1. Navigate to dashboard
**Expected Result:**
- All groups displayed in grid layout (responsive)
- Each card shows: group name, member count, currency
- Groups ordered by created_at DESC
**Priority:** Critical

### TC-DASH-003: Dashboard Loading State
**Preconditions:** User is authenticated
**Steps:**
1. Navigate to dashboard
2. Observe loading indicator
**Expected Result:** Spinner displays while fetching data
**Priority:** Medium

### TC-DASH-004: Sign Out from Dashboard
**Preconditions:** User is authenticated
**Steps:**
1. Click user avatar/menu
2. Click "Sign Out"
**Expected Result:** 
- User is logged out
- Redirected to /auth
- Session cleared
**Priority:** Critical

---

## 3. Create Group Flow

### TC-GROUP-001: Create Group - Success
**Preconditions:** User is authenticated
**Steps:**
1. Click "Create Group" button
2. Enter group name (e.g., "Weekend Trip")
3. Select currency (e.g., "USD")
4. Click "Create Group" button
**Expected Result:**
- Group created successfully
- Toast notification shown
- Dashboard refreshes with new group
- Dialog closes
**Priority:** Critical

### TC-GROUP-002: Create Group - Empty Name
**Preconditions:** User is authenticated
**Steps:**
1. Click "Create Group" button
2. Leave group name empty
3. Click "Create Group" button
**Expected Result:** 
- Error toast: "Group name required"
- Dialog remains open
**Priority:** High

### TC-GROUP-003: Create Group - Loading State
**Preconditions:** User is authenticated
**Steps:**
1. Click "Create Group" button
2. Enter valid data
3. Submit form
4. Observe button state
**Expected Result:** Button shows loading spinner, is disabled during submission
**Priority:** Medium

### TC-GROUP-004: Create Group - Cancel
**Preconditions:** User is authenticated, dialog is open
**Steps:**
1. Click "Create Group" button
2. Enter data
3. Click outside dialog or press ESC
**Expected Result:** Dialog closes, no group created, form reset
**Priority:** Low

### TC-GROUP-005: Currency Selection
**Preconditions:** User is authenticated, create group dialog open
**Steps:**
1. Click currency dropdown
2. View available currencies
**Expected Result:** 
- All 7 currencies displayed (USD, EUR, GBP, INR, JPY, AUD, CAD)
- Currency symbols shown correctly
**Priority:** Medium

---

## 4. Group Detail Flow

### TC-DETAIL-001: View Group Details
**Preconditions:** User is a group member
**Steps:**
1. Click on a group card from dashboard
**Expected Result:**
- Group name displayed
- Currency shown
- Member list visible
- Expense list visible
- "Add Expense" button shown
- "Invite Friends" section visible
**Priority:** Critical

### TC-DETAIL-002: Auto-Join via Invite Link
**Preconditions:** User is authenticated, not a member
**Steps:**
1. Navigate to /group/{groupId} via shared link
**Expected Result:**
- User automatically added to group
- Welcome toast shown
- Group details displayed
**Priority:** Critical

### TC-DETAIL-003: Accept Pending Invitation
**Preconditions:** User has pending invitation to group
**Steps:**
1. Navigate to group detail page
2. View "Accept Invitation" card
3. Click "Accept Invitation"
**Expected Result:**
- User joins group
- Invitation status updated to "accepted"
- Welcome toast shown
- Page refreshes with member access
**Priority:** High

### TC-DETAIL-004: Copy Invite Link
**Preconditions:** User is a group member
**Steps:**
1. Navigate to group detail page
2. Click "Copy Link" button
**Expected Result:**
- Link copied to clipboard
- Toast: "Link copied!"
- Link format: {origin}/group/{groupId}
**Priority:** High

### TC-DETAIL-005: View Members List
**Preconditions:** User is a group member
**Steps:**
1. Navigate to group detail page
2. View members section
**Expected Result:**
- All members displayed
- Group creator shown (even if not in group_members table)
- Member display names or emails shown
- Member avatars shown (if available)
**Priority:** High

### TC-DETAIL-006: Back to Groups Navigation
**Preconditions:** User is on group detail page
**Steps:**
1. Click "Back to Groups" button
**Expected Result:** User navigated back to dashboard
**Priority:** Medium

---

## 5. Add Expense Flow

### TC-EXPENSE-001: Add Expense - Equal Split
**Preconditions:** User is a group member
**Steps:**
1. Click "Add Expense" button
2. Enter expense name
3. Enter amount
4. Select payer
5. Keep "Equal Split" selected
6. Click "Add Expense"
**Expected Result:**
- Expense created with equal splits for all members
- Toast: "Expense added successfully"
- Expense list refreshes
- Dialog closes
**Priority:** Critical

### TC-EXPENSE-002: Add Expense - Custom Split
**Preconditions:** User is a group member with 3+ members
**Steps:**
1. Click "Add Expense" button
2. Enter expense name and amount
3. Select payer
4. Select "Custom Split"
5. Enter custom amounts for each member
6. Click "Add Expense"
**Expected Result:**
- Expense created with custom splits
- Total splits = expense amount
- Toast: "Expense added successfully"
**Priority:** High

### TC-EXPENSE-003: Add Expense - Validation Errors
**Preconditions:** User is a group member
**Steps:**
1. Click "Add Expense" button
2. Leave required fields empty
3. Attempt to submit
**Expected Result:** 
- Validation errors shown for:
  - Empty expense name
  - Zero/negative amount
  - No payer selected
**Priority:** High

### TC-EXPENSE-004: Add Expense - Custom Split Total Mismatch
**Preconditions:** User is a group member
**Steps:**
1. Start creating expense with custom split
2. Enter amounts that don't sum to total
3. Attempt to submit
**Expected Result:** Error message: custom splits must equal total amount
**Priority:** High

### TC-EXPENSE-005: Add Expense - Date Selection
**Preconditions:** User is a group member
**Steps:**
1. Click "Add Expense" button
2. Click date field
3. Select a past date
4. Complete form and submit
**Expected Result:** Expense created with selected date
**Priority:** Medium

### TC-EXPENSE-006: View Expense List - Empty
**Preconditions:** Group has no expenses
**Steps:**
1. View group detail page
**Expected Result:**
- Empty state message
- "No expenses yet"
- "Add your first expense" message
**Priority:** Medium

### TC-EXPENSE-007: View Expense List - With Data
**Preconditions:** Group has expenses
**Steps:**
1. View group detail page
**Expected Result:**
- Expenses ordered by date (newest first)
- Each expense shows:
  - Name
  - Amount with currency
  - Payer name
  - Split type
  - Date
**Priority:** Critical

---

## 6. Mobile Responsiveness Tests

### TC-MOBILE-001: Auth Page on Mobile
**Device:** Mobile (< 640px)
**Steps:**
1. Open /auth on mobile
**Expected Result:**
- Logo properly sized
- Button full-width and touch-friendly (44px min height)
- Text readable
- Proper padding
**Priority:** High

### TC-MOBILE-002: Dashboard on Mobile
**Device:** Mobile (< 640px)
**Steps:**
1. View dashboard on mobile
**Expected Result:**
- Single column grid layout
- Cards stack vertically
- "Create Group" button full-width
- Touch-friendly targets
**Priority:** High

### TC-MOBILE-003: Group Detail on Mobile
**Device:** Mobile (< 640px)
**Steps:**
1. View group detail on mobile
**Expected Result:**
- Single column layout
- Members and expenses sections stack
- All buttons touch-friendly
- Text sizes appropriate
- Proper spacing
**Priority:** Critical

### TC-MOBILE-004: Create Group Dialog on Mobile
**Device:** Mobile (< 640px)
**Steps:**
1. Open create group dialog on mobile
**Expected Result:**
- Dialog fits screen with proper margins
- Inputs full-width
- Buttons stack vertically on small screens
- Scrollable if needed
**Priority:** High

### TC-MOBILE-005: Add Expense Dialog on Mobile
**Device:** Mobile (< 640px)
**Steps:**
1. Open add expense dialog on mobile
**Expected Result:**
- Dialog scrollable
- All fields accessible
- Custom split members list scrollable
- Buttons accessible
**Priority:** High

---

## 7. Data Persistence & RLS Tests

### TC-DATA-001: User Can Only View Their Groups
**Preconditions:** Multiple users with different groups
**Steps:**
1. User A creates groups
2. User B signs in
3. User B views dashboard
**Expected Result:** User B only sees groups they created or joined
**Priority:** Critical

### TC-DATA-002: Group Member Permissions
**Preconditions:** User is group member
**Steps:**
1. View group
2. Add expense
3. View expenses
**Expected Result:** All operations succeed per RLS policies
**Priority:** Critical

### TC-DATA-003: Non-Member Access Attempt
**Preconditions:** User is NOT a group member
**Steps:**
1. Directly navigate to /group/{groupId}
**Expected Result:** User automatically added to group OR access denied based on business logic
**Priority:** High

---

## 8. Error Handling Tests

### TC-ERROR-001: Network Failure During Group Creation
**Preconditions:** User is authenticated
**Steps:**
1. Simulate network failure
2. Attempt to create group
**Expected Result:** 
- Error toast displayed
- User can retry
- Dialog remains open
**Priority:** Medium

### TC-ERROR-002: Session Expiry
**Preconditions:** User session expired
**Steps:**
1. Perform authenticated action
**Expected Result:** User redirected to /auth
**Priority:** High

### TC-ERROR-003: Invalid Group ID
**Preconditions:** User is authenticated
**Steps:**
1. Navigate to /group/invalid-uuid
**Expected Result:** 
- Error message shown
- User can navigate back
**Priority:** Medium

---

## 9. Performance Tests

### TC-PERF-001: Dashboard Load Time
**Preconditions:** User has 20+ groups
**Steps:**
1. Navigate to dashboard
2. Measure load time
**Expected Result:** Dashboard loads in < 2 seconds
**Priority:** Low

### TC-PERF-002: Group Detail Load Time
**Preconditions:** Group has 50+ expenses
**Steps:**
1. Navigate to group detail
2. Measure load time
**Expected Result:** Page loads in < 2 seconds
**Priority:** Low

---

## Test Execution Priority

### P0 (Critical) - Must Pass Before Release:
- All authentication flows
- Create group
- Add expense (equal split)
- View group details
- Mobile responsiveness (key pages)
- RLS policies

### P1 (High) - Should Pass Before Release:
- Custom expense splits
- Invitation flows
- Error handling
- All mobile responsive tests

### P2 (Medium/Low) - Nice to Have:
- Edge cases
- Performance tests
- Minor UI validations

## Browser/Device Coverage

### Desktop:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile:
- iOS Safari (latest 2 versions)
- Android Chrome (latest 2 versions)

### Screen Sizes:
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+
