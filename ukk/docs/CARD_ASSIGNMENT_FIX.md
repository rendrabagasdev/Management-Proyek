# Card Assignment - Prevent Multiple Unfinished Tasks

## 🐛 Problem Identified

**Issue:** User bisa di-assign multiple cards sekaligus, meskipun belum menyelesaikan task sebelumnya.

**Root Cause:**

1. Sistem hanya validasi membership dan role
2. Tidak ada check apakah user sudah punya active unfinished tasks
3. `updateMany` vs `update` untuk deactivate assignments

## 📊 Data Found (Before Fix)

```
User: Developer Budi (ID: 5)
├─ Card #3: "Setup project repository" [TODO] ⏳
└─ Card #1: "Setup authentication system" [IN_PROGRESS] ⏳

❌ User has 2 unfinished tasks simultaneously!
```

## ✅ Solution Implemented

### 1. Add Validation in `/api/cards/[id]/assign/route.ts`

**Before Assignment, Check:**

```typescript
// Check if user already has active assignments
const userActiveAssignments = await prisma.cardAssignment.findMany({
  where: {
    assignedTo: assigneeId,
    isActive: true,
    cardId: { not: cardId }, // Exclude current card
  },
  include: {
    card: { select: { id: true, title: true, status: true } }
  },
});

// Check if any active assignment has unfinished card
const unfinishedCards = userActiveAssignments.filter(
  (assignment) => assignment.card.status !== "DONE"
);

if (unfinishedCards.length > 0) {
  return NextResponse.json({
    message: `User already has ${unfinishedCards.length} unfinished task(s)`,
    unfinishedCards: [...]
  }, { status: 400 });
}
```

### 2. Fix Deactivation Logic

**Before (❌ Bug):**

```typescript
// Only deactivates FIRST active assignment
const currentAssignment = card.assignments.find((a) => a.isActive);
if (currentAssignment) {
  await tx.cardAssignment.update({
    where: { id: currentAssignment.id },
    data: { isActive: false, unassignedAt: new Date() },
  });
}
```

**After (✅ Fixed):**

```typescript
// Deactivates ALL active assignments for this card
await tx.cardAssignment.updateMany({
  where: { cardId, isActive: true },
  data: { isActive: false, unassignedAt: new Date() },
});
```

## 🎯 Business Rules

### Assignment Rules:

1. ✅ User must be project member
2. ✅ User cannot be OBSERVER role
3. ✅ **NEW:** User cannot have multiple unfinished tasks
4. ✅ Only LEADER or ADMIN can assign tasks
5. ✅ Allow re-assignment of same card
6. ✅ DONE cards can be reassigned (resets to TODO)

### What is "Unfinished Task"?

Task with status:

- `TODO` ⏳
- `IN_PROGRESS` ⏳
- `REVIEW` ⏳

Task with status `DONE` ✅ is considered finished.

## 📋 API Response

### Success (200):

```json
{
  "id": 1,
  "title": "Task title",
  "assigneeId": 5,
  "status": "TODO",
  "assignments": [
    {
      "id": 1,
      "cardId": 1,
      "assignedTo": 5,
      "assignedBy": 2,
      "isActive": true,
      "assignee": { "id": 5, "name": "Developer Budi" }
    }
  ]
}
```

### Error - User Has Unfinished Tasks (400):

```json
{
  "message": "User already has 2 unfinished task(s): \"Setup repository\", \"Auth system\". Please complete existing tasks first.",
  "unfinishedCards": [
    { "cardId": 3, "title": "Setup repository", "status": "TODO" },
    { "cardId": 1, "title": "Auth system", "status": "IN_PROGRESS" }
  ]
}
```

## 🧪 Testing Scenarios

### Scenario 1: Assign to User with No Tasks ✅

```
Given: User has 0 active assignments
When: Leader assigns Card #1 to user
Then: Assignment succeeds
```

### Scenario 2: Assign to User with Unfinished Task ❌

```
Given: User has Card #1 [IN_PROGRESS]
When: Leader tries to assign Card #2 to same user
Then: Assignment BLOCKED with error message
```

### Scenario 3: Assign to User with Completed Task ✅

```
Given: User has Card #1 [DONE]
When: Leader assigns Card #2 to user
Then: Assignment succeeds (DONE task doesn't count)
```

### Scenario 4: Re-assign Same Card ✅

```
Given: Card #1 assigned to User A
When: Leader re-assigns Card #1 to User B
Then: Assignment succeeds (allow changing assignee)
```

## 🔧 Database Cleanup Scripts

### Check Current State:

```bash
npx tsc scripts/check-assignments.ts --outDir scripts/dist --skipLibCheck
node scripts/dist/check-assignments.js
```

### Fix Duplicate Assignments:

```bash
npx tsc scripts/fix-duplicate-assignments.ts --outDir scripts/dist --skipLibCheck
node scripts/dist/fix-duplicate-assignments.js
```

## 📊 Migration Considerations

**Existing Data:** Users might already have multiple unfinished tasks.

**Options:**

1. **Grandfather existing assignments** - Allow current state, enforce going forward
2. **Force cleanup** - Deactivate all but one assignment per user
3. **Manual review** - Admin reviews and reassigns manually

**Recommendation:** Option 1 (Grandfather) - Let users finish existing tasks naturally, prevent new violations.

## 🎓 Lessons Learned

1. ✅ Always validate business rules at API level
2. ✅ Use `updateMany` for bulk operations
3. ✅ Check for existing state before creating new records
4. ✅ Provide clear error messages with context
5. ✅ Include affected data in error responses
6. ✅ Write scripts to check and fix data inconsistencies

## 🚀 Next Steps

1. Monitor assignment endpoint logs
2. Add analytics for assignment patterns
3. Consider adding workload indicators
4. Add notification when user completes task (can accept new assignments)
5. Dashboard showing team workload distribution

---

**Status:** ✅ FIXED - Deploy to production after testing
**Date:** November 4, 2025
**Priority:** HIGH - Prevents work overload and burnout
