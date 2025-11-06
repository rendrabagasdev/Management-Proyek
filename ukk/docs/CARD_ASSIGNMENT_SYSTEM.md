# Card Assignment System dengan History Tracking

## 📋 Overview

Sistem assignment yang baru menggunakan tabel `card_assignments` untuk tracking history lengkap setiap assignment card. Ini memastikan:

1. ✅ **Validasi ketat**: User yang di-assign HARUS member di project
2. ✅ **History lengkap**: Semua assignment tercatat untuk laporan
3. ✅ **Audit trail**: Siapa assign siapa, kapan, dan alasannya

---

## 🗄️ Database Schema

### Table: `card_assignments`

```sql
CREATE TABLE `card_assignments` (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    cardId          INT NOT NULL,              -- Card yang di-assign
    assignedTo      INT NOT NULL,              -- User yang di-assign (HARUS project member)
    assignedBy      INT NOT NULL,              -- Leader/Admin yang melakukan assign
    projectMemberId INT NOT NULL,              -- Ensure assignedTo is project member
    assignedAt      DATETIME DEFAULT NOW(),    -- Kapan di-assign
    unassignedAt    DATETIME NULL,             -- Kapan di-unassign (for history)
    reason          TEXT NULL,                 -- Alasan assignment
    isActive        BOOLEAN DEFAULT TRUE,      -- Current active assignment

    FOREIGN KEY (cardId) REFERENCES cards(id),
    FOREIGN KEY (assignedTo) REFERENCES users(id),
    FOREIGN KEY (assignedBy) REFERENCES users(id),
    FOREIGN KEY (projectMemberId) REFERENCES project_members(id),

    INDEX (cardId, isActive),
    INDEX (assignedTo, isActive)
);
```

### Key Fields:

- **`projectMemberId`**: Foreign key ke `project_members` untuk **enforce** bahwa user yang di-assign adalah member project
- **`isActive`**: Hanya 1 assignment aktif per card (yang terbaru)
- **`unassignedAt`**: Untuk tracking history (kapan assignment berakhir)
- **`reason`**: Optional reason untuk assignment (untuk laporan)

---

## 🔧 API Endpoints

### 1. **Assign/Reassign Card** (Leader/Admin)

**Endpoint:** `PATCH /api/cards/[id]/assign`

**Request Body:**

```json
{
  "assigneeId": 123, // User ID to assign
  "reason": "Has relevant experience" // Optional reason
}
```

**Permission:** LEADER atau ADMIN

**Flow:**

1. Validate user is LEADER/ADMIN
2. Validate assignee is project member (by checking `project_members`)
3. Validate assignee is not OBSERVER (unless ADMIN)
4. Deactivate current assignment (`isActive = false`)
5. Create new assignment record
6. Update card `assigneeId` and status
7. If card was DONE, reset to TODO

**Response:**

```json
{
  "id": 1,
  "title": "Task Title",
  "assigneeId": 123,
  "status": "TODO",
  "assignments": [
    {
      "id": 1,
      "assignedTo": 123,
      "assignedBy": 456,
      "assignedAt": "2025-11-04T10:00:00Z",
      "isActive": true,
      "assignee": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assigner": {
        "id": 456,
        "name": "Jane Leader"
      }
    }
  ]
}
```

---

### 2. **Get Assignment History**

**Endpoint:** `GET /api/cards/[id]/assignment-history`

**Permission:** Any authenticated user

**Response:**

```json
[
  {
    "id": 2,
    "cardId": 1,
    "assignedTo": 123,
    "assignedBy": 456,
    "assignedAt": "2025-11-04T10:00:00Z",
    "unassignedAt": null,
    "reason": "Has relevant experience",
    "isActive": true,
    "assignee": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "globalRole": "MEMBER"
    },
    "assigner": {
      "id": 456,
      "name": "Jane Leader",
      "globalRole": "LEADER"
    },
    "projectMember": {
      "projectRole": "DEVELOPER"
    }
  },
  {
    "id": 1,
    "cardId": 1,
    "assignedTo": 789,
    "assignedBy": 456,
    "assignedAt": "2025-11-03T10:00:00Z",
    "unassignedAt": "2025-11-04T10:00:00Z",
    "reason": "Initial assignment",
    "isActive": false,
    "assignee": {
      /* ... */
    },
    "assigner": {
      /* ... */
    }
  }
]
```

---

### 3. **Get Assignment Report** (Project Level)

**Endpoint:** `GET /api/projects/[id]/assignment-report`

**Query Parameters:**

- `startDate` (optional): Filter dari tanggal
- `endDate` (optional): Filter sampai tanggal
- `userId` (optional): Filter by specific user

**Permission:** Project member atau ADMIN

**Response:**

```json
{
  "assignments": [
    {
      "id": 1,
      "assignedAt": "2025-11-04T10:00:00Z",
      "isActive": true,
      "card": {
        "id": 1,
        "title": "Task Title",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "board": {
          "name": "Sprint 1"
        }
      },
      "assignee": {
        "id": 123,
        "name": "John Doe"
      },
      "assigner": {
        "id": 456,
        "name": "Jane Leader"
      }
    }
  ],
  "stats": {
    "totalAssignments": 15,
    "activeAssignments": 8,
    "completedAssignments": 7,
    "byMember": {
      "John Doe": 5,
      "Jane Smith": 4,
      "Bob Wilson": 6
    },
    "byStatus": {
      "TODO": 3,
      "IN_PROGRESS": 5,
      "REVIEW": 2,
      "DONE": 5
    }
  }
}
```

---

## 📊 Use Cases

### **Use Case 1: Leader Assign Task to Member**

```typescript
// Leader di web
PATCH /api/cards/123/assign
{
  "assigneeId": 456,
  "reason": "Has relevant experience with React"
}

// Result:
// - New assignment record created
// - Card.assigneeId updated to 456
// - If card was DONE, status reset to TODO
// - History saved in card_assignments table
```

### **Use Case 2: View Assignment History (Laporan)**

```typescript
// Get history untuk specific card
GET / api / cards / 123 / assignment - history;

// Result: List semua assignment history
// - Siapa pernah di-assign
// - Kapan di-assign & unassign
// - Siapa yang melakukan assign
// - Alasan assignment
```

### **Use Case 3: Project Assignment Report**

```typescript
// Get report untuk project
GET /api/projects/1/assignment-report?startDate=2025-11-01&endDate=2025-11-30

// Result:
// - List semua assignment dalam periode
// - Statistics (total, active, completed)
// - Breakdown per member
// - Breakdown per status
```

### **Use Case 4: Reassign Card yang DONE**

```typescript
// Card sudah DONE, tapi ada revisi
PATCH /api/cards/123/assign
{
  "assigneeId": 789,
  "reason": "Need revision based on feedback"
}

// Result:
// - Old assignment deactivated (isActive = false, unassignedAt set)
// - New assignment created
// - Card status: DONE → TODO
// - Card assigneeId: 456 → 789
// - Full history preserved
```

---

## ✅ Benefits

1. **Data Integrity**

   - `projectMemberId` foreign key ensures user is project member
   - Cannot assign to users outside project
   - Cannot assign to OBSERVER (unless ADMIN override)

2. **Complete History**

   - Every assignment tracked
   - Know who assigned whom and when
   - Reason for assignment recorded
   - Can generate detailed reports

3. **Audit Trail**

   - Full accountability
   - Can track leadership decisions
   - Good for performance reviews
   - Compliance & governance

4. **Analytics Ready**
   - Query assignments by date range
   - Query assignments by user
   - Calculate workload per member
   - Track assignment patterns

---

## 🔐 Business Rules

1. **Assignment Permission**

   - ✅ LEADER can assign within their projects
   - ✅ ADMIN can assign anywhere
   - ❌ MEMBER cannot assign

2. **Assignee Validation**

   - ✅ Must be project member
   - ✅ Cannot assign to OBSERVER (unless ADMIN)
   - ✅ Validated via `projectMemberId` foreign key

3. **One Active Assignment**

   - ✅ Only 1 `isActive = true` per card
   - ✅ Old assignment auto-deactivated on reassign
   - ✅ History preserved with `unassignedAt`

4. **Status Reset on Reassign**
   - ✅ DONE card → reassigned → status becomes TODO
   - ✅ Member can start fresh on task

---

## 🎯 Next Steps

1. **Mobile Integration**

   - Add assignment endpoints to mobile API
   - Show assignment history in card detail
   - Display current assignee and assigner

2. **Notifications**

   - Notify user when assigned to card
   - Notify when reassigned
   - Send reason in notification

3. **Reports Dashboard**

   - Visual charts for assignment distribution
   - Workload balance across members
   - Assignment trends over time

4. **Performance Reviews**
   - Use assignment data for reviews
   - Calculate completion rates
   - Track time per assignment
