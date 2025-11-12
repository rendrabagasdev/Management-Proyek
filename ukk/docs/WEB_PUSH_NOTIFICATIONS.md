# Web Push Notifications Implementation

## ✅ Completed Implementation

Web Push Notifications telah berhasil diimplementasikan menggunakan Firebase Cloud Messaging (FCM).

## 🎯 Features

### 1. **Background Notifications**

- ✅ Notifikasi muncul bahkan ketika tab browser tertutup
- ✅ Service Worker (`firebase-messaging-sw.js`) handle background messages
- ✅ Click notification membuka halaman yang relevan

### 2. **Foreground Notifications**

- ✅ Toast notification muncul saat app sedang aktif
- ✅ Real-time updates via Firebase Realtime Database
- ✅ Auto-dismiss after 3 seconds

### 3. **Permission Management**

- ✅ Request permission saat user login
- ✅ Store FCM token di database
- ✅ Auto-cleanup token saat logout

### 4. **Push Notification Types**

- 🔔 Card Assigned
- 🔔 Card Updated
- 🔔 Card Completed
- 🔔 Comment Added
- 🔔 Mention in Comment
- 🔔 Subtask Completed
- 🔔 Project Invitation

## 📁 Files Created/Modified

### **New Files:**

1. **`public/firebase-messaging-sw.js`**

   - Service Worker untuk background notifications
   - Handle notification click events
   - Open app ketika notification di-click

2. **`lib/fcm.ts`**

   - Client-side FCM utilities
   - Permission request
   - Token management
   - Foreground message listener

3. **`lib/fcm-admin.ts`**

   - Server-side FCM utilities
   - Send push to single user
   - Send push to multiple users
   - Send push to project members
   - Auto-cleanup invalid tokens

4. **`app/api/fcm/token/route.ts`**

   - POST: Save/update FCM token
   - DELETE: Remove FCM token (logout)

5. **`components/ServiceWorkerRegister.tsx`**

   - Register service worker on app load

6. **`public/icon-192x192.png`** & **`public/icon-72x72.png`**
   - Notification icons

### **Modified Files:**

1. **`prisma/schema.prisma`**

   - Added `fcmToken` field to User model

2. **`lib/notifications.ts`**

   - Integrated push notifications
   - Call `sendPushNotificationToUser()` on notification create

3. **`components/NotificationProvider.tsx`**

   - Initialize FCM on login
   - Listen for foreground messages
   - Cleanup on logout

4. **`lib/firebase.ts`**

   - Export `getFirebaseApp()` for FCM

5. **`app/layout.tsx`**
   - Added `<ServiceWorkerRegister />`

## 🚀 How It Works

### **User Login Flow:**

```
1. User logs in
2. NotificationProvider initialized
3. Request notification permission
4. Get FCM token from Firebase
5. Save token to database via POST /api/fcm/token
6. Register foreground message listener
```

### **Notification Flow:**

```
1. Event occurs (e.g., card assigned)
2. createNotification() called
3. Save to database
4. Trigger Firebase real-time event
5. Send FCM push notification
6. User receives notification:
   - Foreground: Toast appears
   - Background: Browser notification
```

### **Token Cleanup:**

```
- Invalid tokens auto-removed when send fails
- Token removed on logout
- Token updated on re-login
```

## 🧪 Testing Push Notifications

### **Test Steps:**

1. **Login ke aplikasi**

   ```
   - Buka http://localhost:3000/login
   - Login dengan salah satu user
   ```

2. **Allow notification permission**

   ```
   - Browser akan request permission
   - Click "Allow"
   ```

3. **Trigger notification**

   - Assign card ke user lain
   - Add comment
   - Complete subtask
   - Invite to project

4. **Test background notification**
   ```
   - Minimize atau close tab
   - Trigger notification dari user lain
   - Browser notification akan muncul
   - Click notification → app opens
   ```

### **Test Different Scenarios:**

#### **Foreground Test:**

```bash
# Window active, app open
1. Login as Leader
2. Open card detail
3. Login as Member di tab lain
4. Assign card to Leader
5. Leader melihat toast notification
```

#### **Background Test:**

```bash
# Window minimized/closed
1. Login as Leader
2. Close tab atau minimize
3. Login as Member
4. Assign card to Leader
5. Browser notification appears
6. Click → app opens to card page
```

## 🔧 Configuration

### **Environment Variables:**

Already configured in `.env`:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY="BKS4p7zdUBQMLU8QZVc7Q3wzllMdqS5Sl_hvj2FPY907K_ytZHvcY4MbOOJfguv-m9Uao_pFk61NvtUzJ72DNdQ"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="761099492855"
```

### **Database:**

Migration already applied:

```sql
ALTER TABLE users ADD COLUMN fcmToken TEXT NULL;
```

## 📊 Database Schema

```prisma
model User {
  id           Int        @id @default(autoincrement())
  name         String
  email        String     @unique
  passwordHash String
  globalRole   GlobalRole @default(MEMBER)
  fcmToken     String?    @db.Text // ← NEW FIELD
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  // ... relations
}
```

## 🎨 Notification Appearance

### **Browser Notification:**

```
┌─────────────────────────────┐
│ 🔴 UKK                      │
│ New Card Assigned           │
│ John assigned you to        │
│ "Build Login Page"          │
│                             │
│ [View]  [Close]             │
└─────────────────────────────┘
```

### **Foreground Toast:**

```
┌─────────────────────────────┐
│ New Card Assigned           │
│ John assigned you to        │
│ "Build Login Page"          │
└─────────────────────────────┘
```

## 🔐 Security

- ✅ FCM tokens stored securely in database
- ✅ Only authenticated users can save tokens
- ✅ Tokens deleted on logout
- ✅ Invalid tokens auto-cleaned
- ✅ Server-side validation via NextAuth

## 📱 Browser Support

| Browser | Support                |
| ------- | ---------------------- |
| Chrome  | ✅ Full                |
| Firefox | ✅ Full                |
| Edge    | ✅ Full                |
| Safari  | ⚠️ Limited (iOS 16.4+) |
| Opera   | ✅ Full                |

## 🐛 Troubleshooting

### **Notification tidak muncul:**

1. **Check browser permission**

   ```
   Settings → Site Settings → Notifications
   Pastikan "Allow" untuk localhost
   ```

2. **Check FCM token**

   ```sql
   SELECT id, name, fcmToken FROM users;
   ```

3. **Check browser console**

   ```
   F12 → Console tab
   Look for FCM initialization logs
   ```

4. **Check service worker**
   ```
   F12 → Application tab → Service Workers
   Ensure firebase-messaging-sw.js is active
   ```

### **Token tidak tersimpan:**

```bash
# Check API endpoint
curl -X POST http://localhost:3000/api/fcm/token \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'
```

### **Service worker tidak register:**

```javascript
// Check in browser console
navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log("Active service workers:", regs);
});
```

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add notification sound
- [ ] Add notification badge count
- [ ] Add notification history page
- [ ] Add notification preferences (opt-in/out)
- [ ] Add notification grouping
- [ ] Add notification actions (mark as read, delete)
- [ ] Add notification scheduling
- [ ] Add notification analytics

## 📚 API Reference

### **Client-Side (lib/fcm.ts):**

```typescript
// Request permission
await requestNotificationPermission();

// Get FCM token
const token = await getFCMToken();

// Save token to backend
await saveFCMToken(token);

// Delete token
await deleteFCMToken();

// Listen for foreground messages
onForegroundMessage((payload) => {
  console.log("Message:", payload);
});
```

### **Server-Side (lib/fcm-admin.ts):**

```typescript
// Send to single user
await sendPushNotificationToUser(userId, {
  title: "Title",
  body: "Message",
  link: "/cards/123",
});

// Send to multiple users
await sendPushNotificationToUsers([1, 2, 3], payload);

// Send to project members
await sendPushNotificationToProjectMembers(projectId, payload);
```

## ✅ Implementation Complete!

Web Push Notifications sekarang **fully functional**! 🎉

- ✅ Background notifications
- ✅ Foreground notifications
- ✅ Permission management
- ✅ Token storage & cleanup
- ✅ Auto-send on all notification events

**Ready to test!** 🚀
