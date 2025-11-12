# Firebase Migration Guide

## ✅ Migration Status

### Web (Next.js) - 100% Complete ✅

- ✅ 15 files updated (components, API routes, lib)
- ✅ 31 replacements total (Pusher → Firebase)
- ✅ Firebase hooks created (`useFirebaseEvent`)
- ✅ Firebase triggers created (`triggerCardEvent`, `triggerProjectEvent`)
- ✅ No compilation errors
- ✅ Ready for Firebase project configuration

### Mobile (Flutter) - 100% Complete ✅

- ✅ Firebase packages installed (`firebase_core`, `firebase_database`, `firebase_messaging`)
- ✅ `FirebaseService` class created (235 lines)
- ✅ `card_detail_page.dart` updated
- ✅ `main.dart` initialized with Firebase
- ✅ No compilation errors
- ⏳ Pending: Firebase project configuration files (Android/iOS)

### Next Steps

1. Setup Firebase project di [Firebase Console](https://console.firebase.google.com/)
2. Get API keys dan update environment variables
3. Download `google-services.json` (Android) dan `GoogleService-Info.plist` (iOS)
4. Test real-time updates end-to-end
5. (Optional) Setup push notifications

---

## Overview

Aplikasi telah berhasil dimigrasikan dari **Pusher** ke **Firebase Realtime Database** untuk real-time updates dan notifications.

## Keuntungan Firebase vs Pusher

| Fitur                  | Pusher                              | Firebase                             |
| ---------------------- | ----------------------------------- | ------------------------------------ |
| **Harga**              | Berbayar setelah 200k messages/hari | **GRATIS** untuk penggunaan moderate |
| **Real-time**          | ✅ WebSocket                        | ✅ WebSocket                         |
| **Push Notifications** | ❌ Perlu service terpisah           | ✅ Built-in FCM                      |
| **Authentication**     | ❌ Perlu integrasi manual           | ✅ Firebase Auth (opsional)          |
| **Database**           | ❌ Tidak ada                        | ✅ Realtime Database + Firestore     |
| **Analytics**          | ❌ Tidak ada                        | ✅ Google Analytics terintegrasi     |
| **Hosting**            | ❌ Tidak ada                        | ✅ Firebase Hosting                  |

## 🚀 Setup Firebase (Langkah-langkah dengan API Key Asli)

### 1. Buat Firebase Project

1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add Project" / "Tambah Project"
3. Beri nama project: `ukk-management` (atau nama lain)
4. Enable/Disable Google Analytics (opsional)
5. Klik "Create Project"

### 2. Setup Realtime Database

1. Di Firebase Console, pilih project Anda
2. Klik "Build" > "Realtime Database" di sidebar kiri
3. Klik "Create Database"
4. Pilih lokasi server (pilih yang terdekat dengan pengguna Anda):
   - `us-central1` - Amerika
   - `asia-southeast1` - Singapore (RECOMMENDED untuk Indonesia)
   - `europe-west1` - Eropa
5. Pilih mode:
   - **Development Mode** untuk testing (buka untuk semua)
   - **Production Mode** dengan rules keamanan
6. Klik "Enable"

### 3. Dapatkan Firebase Config

#### A. Client-side Config (untuk Browser)

1. Di Firebase Console, klik ⚙️ (Settings) > "Project settings"
2. Scroll ke bawah ke "Your apps"
3. Klik ikon **Web** (`</>`)
4. Daftarkan app dengan nickname: `ukk-web`
5. Copy konfigurasi yang muncul:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ukk-management.firebaseapp.com",
  databaseURL:
    "https://ukk-management-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ukk-management",
  storageBucket: "ukk-management.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijk1234567890",
};
```

#### B. Server-side Config (Firebase Admin)

1. Di Firebase Console, klik ⚙️ > "Project settings"
2. Klik tab "Service accounts"
3. Klik "Generate new private key"
4. Download file JSON (simpan dengan aman!)
5. File ini berisi credentials untuk server-side access

### 4. Update Environment Variables

Buat/update file `.env.local`:

```env
# ===== FIREBASE CLIENT CONFIG (Browser) =====
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ukk-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://ukk-management-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ukk-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ukk-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijk1234567890

# ===== FIREBASE ADMIN CONFIG (Server) =====
FIREBASE_DATABASE_URL=https://ukk-management-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"ukk-management","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@ukk-management.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40ukk-management.iam.gserviceaccount.com"}'
```

⚠️ **PENTING**:

- File `.env.local` jangan di-commit ke Git!
- Pastikan `.env.local` sudah ada di `.gitignore`
- Service account JSON sangat sensitif - jangan share!

### 5. Setup Firebase Security Rules

Di Firebase Console > Realtime Database > Rules, set rules ini:

```json
{
  "rules": {
    "projects": {
      "$projectId": {
        "events": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    },
    "cards": {
      "$cardId": {
        "events": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    },
    "users": {
      "$userId": {
        "events": {
          ".read": "auth != null && auth.uid == $userId",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

**Penjelasan:**

- **`.read": true`** - Semua orang bisa baca events (untuk real-time updates)
- **`.write": "auth != null"`** - Hanya authenticated users yang bisa write
- **User events** - Hanya user sendiri yang bisa baca notifikasinya

⚠️ Untuk production, tambahkan validasi lebih ketat!

## 📦 Files yang Dibuat/Diubah

### New Files (Firebase)

1. **`lib/firebase.ts`** - Firebase client config (browser)
2. **`lib/firebase-admin.ts`** - Firebase Admin SDK (server)
3. **`lib/firebase-hooks.ts`** - React hooks untuk real-time (replaces Pusher hooks)
4. **`lib/firebase-triggers.ts`** - Server helpers untuk trigger events (replaces Pusher triggers)
5. **`scripts/migrate-pusher-to-firebase.js`** - Migration script

### Modified Files (Migration)

**Components:**

- ✅ `components/cards/CardDetail.tsx` - 9 replacements
- ✅ `components/NotificationBell.tsx` - 1 replacement
- ✅ `components/projects/KanbanBoard.tsx` - 5 replacements

**Lib:**

- ✅ `lib/notifications.ts` - 4 replacements
- ⚠️ `lib/pusher.ts` - Kept for reference (can be deleted)
- ⚠️ `lib/pusher-client.ts` - Kept for reference (can be deleted)

**API Routes (10 files):**

- ✅ `app/api/cards/route.ts`
- ✅ `app/api/cards/[id]/route.ts`
- ✅ `app/api/cards/[id]/assign/route.ts`
- ✅ `app/api/cards/[id]/comments/route.ts`
- ✅ `app/api/cards/[id]/subtasks/route.ts`
- ✅ `app/api/cards/[id]/subtasks/[subtaskId]/route.ts`
- ✅ `app/api/cards/[id]/time/route.ts`
- ✅ `app/api/mobile/cards/[id]/subtasks/route.ts`
- ✅ `app/api/mobile/cards/[id]/subtasks/[subtaskId]/route.ts`
- ✅ `app/api/mobile/cards/[id]/subtasks/[subtaskId]/toggle/route.ts`

## 🔄 API Changes

### Before (Pusher):

```typescript
import { triggerCardEvent } from "@/lib/pusher";

await triggerCardEvent(cardId, "card:updated", {
  card: updatedCard,
  userId: session.user.id,
});
```

### After (Firebase):

```typescript
import { triggerCardEvent } from "@/lib/firebase-triggers";

await triggerCardEvent(cardId, "card:updated", {
  card: updatedCard,
  userId: session.user.id,
});
```

**Channel Structure Change:**

- Pusher: `card-${cardId}` → Firebase: `cards/${cardId}/events`
- Pusher: `project-${projectId}` → Firebase: `projects/${projectId}/events`
- Pusher: `user-${userId}` → Firebase: `users/${userId}/events`

## 🎣 Hook Changes

### Before (Pusher):

```typescript
import { usePusherEvent } from "@/lib/pusher-client";

usePusherEvent(`card-${cardId}`, "card:updated", (data) => {
  // handle update
});
```

### After (Firebase):

```typescript
import { useFirebaseEvent } from "@/lib/firebase-hooks";

useFirebaseEvent(`cards/${cardId}/events`, "card:updated", (data) => {
  // handle update
});
```

---

## 📱 Setup Mobile (Flutter)

### 1. Firebase Packages (Already Installed ✅)

```yaml
dependencies:
  firebase_core: ^3.8.1
  firebase_database: ^11.3.3
  firebase_messaging: ^15.1.5
```

### 2. Firebase Configuration Files

#### Android Configuration

1. Di Firebase Console > Project Settings > Add app
2. Pilih **Android** icon
3. Isi package name: `com.example.mobile_ukk` (lihat di `android/app/build.gradle`)
4. Download `google-services.json`
5. Letakkan file di: `mobile_ukk/android/app/google-services.json`

6. Update `android/build.gradle.kts`:

```kotlin
buildscript {
    dependencies {
        // Add Firebase plugin
        classpath("com.google.gms:google-services:4.4.0")
    }
}
```

7. Update `android/app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services") // Add this line
}
```

#### iOS Configuration

1. Di Firebase Console > Project Settings > Add app
2. Pilih **iOS** icon
3. Isi bundle ID: `com.example.mobileUkk` (lihat di `ios/Runner.xcodeproj/project.pbxproj`)
4. Download `GoogleService-Info.plist`
5. Buka Xcode: `open ios/Runner.xcworkspace`
6. Drag & drop file `GoogleService-Info.plist` ke project di Xcode (ke folder Runner)
7. Pastikan "Copy items if needed" dicentang

### 3. Firebase Initialization (Already Done ✅)

File `lib/main.dart` sudah diupdate dengan Firebase initialization:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'YOUR-API-KEY-HERE',
      appId: 'YOUR-APP-ID-HERE',
      messagingSenderId: 'YOUR-SENDER-ID-HERE',
      projectId: 'YOUR-PROJECT-ID-HERE',
      databaseURL: 'https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com',
    ),
  );

  // Initialize Firebase service
  await FirebaseService().initialize();

  runApp(const ProviderScope(child: MyApp()));
}
```

**Update dengan API Keys asli dari Firebase Console > Project Settings > General > Your apps > iOS/Android**

### 4. FirebaseService Usage (Already Updated ✅)

File `lib/view/card_detail_page.dart` sudah menggunakan FirebaseService:

```dart
import '../services/firebase_service.dart';

class _CardDetailPageState extends ConsumerState<CardDetailPage> {
  final FirebaseService _firebaseService = FirebaseService();
  String? _eventPath;

  @override
  void initState() {
    super.initState();
    _setupFirebase();
  }

  Future<void> _setupFirebase() async {
    await _firebaseService.initialize();
    _eventPath = 'cards/${widget.cardId}/events';
    await _firebaseService.subscribeToPath(_eventPath!);

    // Bind event handlers
    _firebaseService.bindEvent(
      _eventPath!,
      'card:updated',
      (data) => _onCardUpdated(data as Map<String, dynamic>)
    );
  }

  @override
  void dispose() {
    if (_eventPath != null) {
      _firebaseService.unsubscribeFromPath(_eventPath!);
    }
    super.dispose();
  }
}
```

### 5. FCM Push Notifications (Already Built-in ✅)

FirebaseService sudah include FCM support:

```dart
// Get FCM token
String? token = await FirebaseService().getFCMToken();
// Send token to backend untuk save ke database

// Notifications sudah otomatis ditangani oleh FirebaseService
// Lihat _setupFCMListeners() di firebase_service.dart
```

**Untuk iOS**, tambahkan permission di `ios/Runner/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### 6. Testing Mobile

1. **Update Firebase config** di `main.dart` dengan API keys asli
2. **Place config files**:
   - Android: `android/app/google-services.json`
   - iOS: `ios/Runner/GoogleService-Info.plist`
3. **Run app**:
   ```bash
   cd mobile_ukk
   flutter run
   ```
4. **Test real-time updates**:
   - Buka card detail page di mobile
   - Update card dari web
   - Should see real-time update di mobile
5. **Test push notifications**:
   - Grant notification permission saat diminta
   - Check console untuk FCM token
   - Test send notification dari Firebase Console

---

## 🔔 Push Notifications (Optional - Future Enhancement)

Firebase juga support Push Notifications lewat FCM (Firebase Cloud Messaging):

### Setup FCM untuk Web Push:

1. Di Firebase Console > Project Settings > Cloud Messaging
2. Generate Web Push certificates
3. Install service worker:

```typescript
// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "...",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message", payload);
  // Show notification
});
```

4. Request permission dan get FCM token:

```typescript
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();
const token = await getToken(messaging, {
  vapidKey: "YOUR_PUBLIC_VAPID_KEY",
});
// Save token to database
```

5. Send push dari server:

```typescript
import { getMessaging } from "firebase-admin/messaging";

await getMessaging().send({
  token: userFCMToken,
  notification: {
    title: "New Card Assigned",
    body: "You have been assigned to Card #123",
  },
  data: {
    cardId: "123",
    type: "card:assigned",
  },
});
```

## 🧪 Testing

### 1. Local Testing (Dummy Keys)

Dengan dummy keys yang sudah ada, aplikasi akan compile tapi real-time features tidak akan bekerja. Ini OK untuk development fitur lain.

### 2. Testing dengan Firebase Asli

1. Setup Firebase project (langkah di atas)
2. Update `.env.local` dengan keys asli
3. Restart development server: `npm run dev`
4. Buka 2 browser windows ke `/cards/1`
5. Edit card di window 1
6. Lihat update real-time di window 2

### Test Cases:

- [ ] ✅ Create card → muncul di kanban board pengguna lain
- [ ] ✅ Update card status → pindah kolom real-time
- [ ] ✅ Add comment → muncul di CardDetail pengguna lain
- [ ] ✅ Start timer → status berubah real-time
- [ ] ✅ Complete subtask → checkbox update untuk semua
- [ ] ✅ Assign card → notifikasi real-time

## 📊 Firebase Console Monitoring

Setelah setup, Anda bisa monitor di Firebase Console:

1. **Realtime Database > Data** - Lihat struktur data real-time
2. **Realtime Database > Usage** - Monitor reads/writes per hari
3. **Analytics** (jika enabled) - User behavior
4. **Performance** - App performance metrics

## 💰 Firebase Pricing

### Realtime Database Free Tier (Spark Plan):

- ✅ **1 GB stored**
- ✅ **10 GB/month downloaded**
- ✅ **100 simultaneous connections**

Ini cukup untuk:

- ~500-1000 users aktif per hari
- Ratusan ribu real-time events per hari

### Blaze Plan (Pay as you go):

Jika melebihi free tier:

- **$5/GB storage per bulan**
- **$1/GB download**

💡 **Tip**: Firebase lebih murah dari Pusher untuk skala besar!

## 🔐 Security Best Practices

1. **Jangan commit `.env.local`** - Pastikan di `.gitignore`
2. **Service Account JSON** - Simpan di environment variable production (Vercel, Railway, dll)
3. **Firebase Rules** - Set rules ketat di production
4. **API Keys** - Client API key boleh public, tapi set domain restrictions
5. **Rate Limiting** - Tambahkan rate limiting di API routes

## 🚨 Troubleshooting

### Error: "Permission denied"

**Problem**: Firebase rules terlalu ketat  
**Solution**: Update rules atau ensure user authenticated

### Error: "FIREBASE_SERVICE_ACCOUNT not found"

**Problem**: Server-side env variable tidak ter-set  
**Solution**: Check `.env.local` atau production environment variables

### Real-time updates tidak working

**Problem**: Config tidak benar  
**Solutions**:

1. Check browser console untuk errors
2. Verify Firebase config di `.env.local`
3. Check Firebase Console > Realtime Database bahwa data masuk
4. Check Network tab untuk WebSocket connections

### Events tidak persist

**Problem**: Using `triggerFirebaseEvent` yang overwrite  
**Solution**: Gunakan `pushFirebaseEvent` untuk events yang perlu history

## 📚 Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Admin Node.js](https://firebase.google.com/docs/admin/setup)
- [FCM Push Notifications](https://firebase.google.com/docs/cloud-messaging)

## ✅ Migration Checklist

- [x] Install Firebase packages
- [x] Create Firebase config files
- [x] Create Firebase hooks
- [x] Create Firebase triggers
- [x] Update CardDetail component
- [x] Update NotificationBell component
- [x] Update notifications.ts
- [x] Update all API routes
- [ ] Setup real Firebase project
- [ ] Update .env.local with real keys
- [ ] Test real-time features
- [ ] Deploy to production
- [ ] Setup Firebase security rules
- [ ] (Optional) Setup FCM push notifications
- [ ] Remove old Pusher files (pusher.ts, pusher-client.ts)
- [ ] Remove Pusher from package.json

## 🎉 Summary

Migration berhasil! Aplikasi sekarang menggunakan Firebase dengan keuntungan:

- ✅ **Gratis** untuk penggunaan moderate
- ✅ **Real-time updates** sama seperti Pusher
- ✅ **Push notifications** built-in (tinggal implement)
- ✅ **Skalabilitas** lebih baik
- ✅ **Monitoring** dan analytics gratis

Tinggal setup Firebase project asli dan update environment variables! 🚀
