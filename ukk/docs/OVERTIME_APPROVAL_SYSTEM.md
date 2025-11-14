# 🕒 Overtime Approval System

## Overview

Sistem approval untuk task yang terlambat. User yang di-assign task overdue harus meminta izin dari leader/admin sebelum bisa melanjutkan pekerjaan.

## ✨ Features

### 1. **Automatic Overdue Detection**

- Sistem otomatis mendeteksi task yang melewati deadline
- Menampilkan warning OVERDUE dengan jumlah hari keterlambatan
- Alert merah untuk task yang sudah lewat deadline

### 2. **Overtime Request Flow**

#### For Members (Assignee):

1. **Task Overdue Detected**

   - Alert merah muncul di Card Detail
   - Menampilkan berapa hari terlambat
   - Button "Request Overtime Approval" muncul

2. **Submit Request**

   - Klik tombol request approval
   - Isi alasan kenapa terlambat (wajib)
   - Submit request ke leader/admin

3. **Wait for Approval**

   - Status "Pending" ditampilkan di card
   - Notifikasi otomatis ke semua leader project
   - Tidak bisa mulai timer sampai disetujui

4. **After Approval**
   - Status berubah ke "Approved" (hijau) atau "Rejected" (merah)
   - Jika approved: bisa lanjut kerja
   - Jika rejected: harus koordinasi dengan leader
   - Notes dari leader ditampilkan

#### For Leaders/Admin:

1. **Receive Notification**

   - Notifikasi real-time saat ada request baru
   - Email notifikasi (optional)

2. **Review Request**

   - Akses halaman `/overtime-approvals`
   - Lihat semua pending requests
   - Detail: requester, task, project, alasan, hari terlambat

3. **Approve or Reject**

   - Button Approve (hijau) atau Reject (merah)
   - Tambah notes/komentar (optional)
   - Konfirmasi keputusan

4. **Notification Sent**
   - User langsung dapat notifikasi
   - Status updated di card detail

## 📊 Database Schema

### New Table: `overtime_approvals`

```prisma
model OvertimeApproval {
  id            Int              @id @default(autoincrement())
  cardId        Int
  requestedBy   Int              // User yang request
  approverId    Int?             // Leader yang approve/reject
  status        ApprovalStatus   @default(PENDING)
  reason        String           @db.Text // Alasan kenapa terlambat
  daysOverdue   Int              // Berapa hari terlambat
  requestedAt   DateTime         @default(now())
  respondedAt   DateTime?
  approverNotes String?          @db.Text

  card      Card @relation(...)
  requester User @relation("OvertimeRequester", ...)
  approver  User? @relation("OvertimeApprover", ...)
}
```

### New Enum: `ApprovalStatus`

```prisma
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Updated Notification Types

```prisma
enum NotificationType {
  // ... existing types
  OVERTIME_REQUEST   // Untuk leader
  OVERTIME_APPROVED  // Untuk requester
  OVERTIME_REJECTED  // Untuk requester
}
```

## 🔌 API Endpoints

### GET `/api/overtime-approval`

Query params:

- `type=my-requests` - Get user's own requests
- `type=pending-approvals` - Get pending requests (leader/admin only)
- `type=all&cardId=123` - Get all approvals for specific card

### POST `/api/overtime-approval`

Request overtime approval

```json
{
  "cardId": 123,
  "reason": "Alasan kenapa terlambat..."
}
```

### PATCH `/api/overtime-approval`

Approve or reject request

```json
{
  "approvalId": 456,
  "action": "approve", // or "reject"
  "approverNotes": "Optional notes..."
}
```

## 🎨 UI Components

### 1. **OvertimeRequestDialog**

Location: `/components/cards/OvertimeRequestDialog.tsx`

- Dialog untuk submit overtime request
- Form dengan textarea untuk alasan
- Validation dan submission

### 2. **OvertimeApprovalStatus**

Location: `/components/cards/OvertimeApprovalStatus.tsx`

- Display current approval status
- Show pending/approved/rejected state
- Display approver notes
- History of all approval requests

### 3. **OvertimeApprovalsPage**

Location: `/app/overtime-approvals/page.tsx`

- Leader/admin dashboard
- List of all pending requests
- Approve/reject with notes
- Real-time updates

## 🚀 How It Works

### Scenario 1: Task Terlambat

```
1. User membuka Card Detail
2. Sistem cek: deadline < now?
3. Jika YA:
   - Hitung days overdue
   - Tampilkan alert OVERDUE merah
   - Tampilkan OvertimeApprovalStatus
   - Jika assignee: tampilkan button Request
```

### Scenario 2: Request Approval

```
1. User klik "Request Overtime Approval"
2. Dialog muncul
3. User isi alasan terlambat
4. Submit request:
   - Create OvertimeApproval record
   - Status: PENDING
   - Send notification ke leaders
5. Status "Pending" muncul di card
```

### Scenario 3: Leader Approve

```
1. Leader dapat notifikasi
2. Buka /overtime-approvals
3. Review request details
4. Klik "Approve"
5. Optional: tambah notes
6. Confirm:
   - Update status: APPROVED
   - Set approverId & respondedAt
   - Send notification ke requester
7. User dapat notifikasi & bisa lanjut kerja
```

### Scenario 4: Leader Reject

```
1-3. Same as approve
4. Klik "Reject"
5. Optional: tambah notes explaining why
6. Confirm:
   - Update status: REJECTED
   - Send notification ke requester
7. User harus koordinasi dengan tim
```

## 🔐 Permissions

### Who Can Request?

- ✅ Assignee of overdue task
- ❌ Other team members
- ❌ Already have pending request

### Who Can Approve/Reject?

- ✅ Project Creator
- ✅ Project Leaders (role: LEADER)
- ✅ Global ADMIN
- ❌ Regular members
- ❌ Non-project members

## 📱 Notifications

### New Notification Types:

1. **OVERTIME_REQUEST**

   - To: All project leaders + creator
   - Title: "Overtime Approval Request"
   - Message: "[User] meminta izin untuk task [Title] (X hari terlambat)"

2. **OVERTIME_APPROVED**

   - To: Requester
   - Title: "Overtime Request Approved"
   - Message: "Request approved by [Leader]"

3. **OVERTIME_REJECTED**
   - To: Requester
   - Title: "Overtime Request Rejected"
   - Message: "Request rejected by [Leader]"

## 🎯 Business Rules

1. **Only Overdue Tasks**

   - Request hanya bisa dibuat jika deadline sudah lewat
   - Sistem auto-calculate days overdue

2. **One Pending Request**

   - User tidak bisa submit multiple pending requests
   - Harus tunggu approved/rejected dulu

3. **Assignee Only**

   - Hanya assignee yang bisa request
   - Protect dari unauthorized requests

4. **Leader Approval Required**

   - Minimum project leader atau admin
   - Creator juga bisa approve

5. **Cannot Work Without Approval**
   - Timer start button disabled
   - Comment/update masih bisa
   - Harus tunggu approval dulu

## 📝 User Flow Example

### Member Perspective:

```
1. Login ke aplikasi
2. Buka task yang overdue
3. Lihat alert merah: "OVERDUE - 3 days"
4. Lihat status: belum ada approval
5. Klik "Request Overtime Approval"
6. Isi reason: "Terlambat karena bug kompleks di integration"
7. Submit
8. Lihat status: "Pending Approval"
9. Tunggu notifikasi
10. Dapat notif: "Overtime Approved"
11. Lihat notes dari leader: "OK, but finish by tomorrow"
12. Lanjut kerja pada task
```

### Leader Perspective:

```
1. Dapat notifikasi: "Overtime Request from John"
2. Klik notifikasi → redirect ke /overtime-approvals
3. Lihat request details:
   - Task: "Fix payment integration"
   - Requester: John Doe
   - Days overdue: 3 days
   - Reason: "Bug kompleks di integration"
4. Review reasoning
5. Decide: Approve atau Reject
6. Klik "Approve"
7. Tambah notes: "OK, but finish by tomorrow"
8. Submit
9. John dapat notification
```

## ✅ Benefits

1. **Accountability**

   - Track siapa yang terlambat
   - Alasan documented
   - Leader approval trail

2. **Communication**

   - Clear communication channel
   - No need WhatsApp/email
   - Everything in system

3. **Transparency**

   - Semua approval tercatat
   - History visible
   - Audit trail lengkap

4. **Control**
   - Leader kontrol overtime
   - Prevent abuse
   - Ensure quality over speed

## 🔄 Integration Points

- ✅ CardDetail component
- ✅ Navbar (Overtime Approvals menu)
- ✅ Notification system
- ✅ Firebase real-time updates
- ✅ Time tracking system

## 📈 Future Enhancements

- [ ] Auto-reject after X days
- [ ] Escalation to admin
- [ ] Statistics dashboard
- [ ] Bulk approve/reject
- [ ] Mobile push notifications
- [ ] Email notifications
- [ ] Slack integration

---

**Implementation Complete! ✅**

Sistem overtime approval sudah fully integrated dan siap digunakan!
