import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Firebase Service untuk Real-time Updates dan Push Notifications
/// Menggantikan Pusher Service
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  late FirebaseDatabase _database;
  late FirebaseMessaging _messaging;
  bool _initialized = false;

  // Event handlers untuk channels
  final Map<String, Map<String, Function(dynamic)>> _eventHandlers = {};
  final Map<String, DatabaseReference> _subscriptions = {};

  /// Initialize Firebase Realtime Database dan FCM
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Initialize Firebase Realtime Database
      _database = FirebaseDatabase.instance;

      // Set persistence untuk offline support
      _database.setPersistenceEnabled(true);
      _database.setPersistenceCacheSizeBytes(10000000); // 10MB cache

      // Initialize Firebase Cloud Messaging untuk push notifications
      _messaging = FirebaseMessaging.instance;

      // Request permission untuk notifications
      await _requestNotificationPermission();

      // Setup FCM listeners
      _setupFCMListeners();

      _initialized = true;
      print('✅ Firebase initialized successfully');
    } catch (e) {
      print('❌ Error initializing Firebase: $e');
    }
  }

  /// Request notification permission (iOS/Android)
  Future<void> _requestNotificationPermission() async {
    try {
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        print('✅ Notification permission granted');

        // Get FCM token
        String? token = await _messaging.getToken();
        if (token != null) {
          print('📱 FCM Token: $token');
          // TODO: Save token to backend/database
        }
      } else {
        print('⚠️ Notification permission denied');
      }
    } catch (e) {
      print('❌ Error requesting notification permission: $e');
    }
  }

  /// Setup FCM message listeners
  void _setupFCMListeners() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📬 Foreground message received');
      print('Title: ${message.notification?.title}');
      print('Body: ${message.notification?.body}');
      print('Data: ${message.data}');

      // TODO: Show local notification
    });

    // Background/terminated messages
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('📬 Message opened from background');
      print('Data: ${message.data}');

      // TODO: Navigate to specific page based on data
    });
  }

  /// Subscribe to Firebase Realtime Database path
  /// Replaces Pusher channel subscription
  ///
  /// Example: subscribeToPath('cards/123/events')
  Future<void> subscribeToPath(String path) async {
    if (!_initialized) {
      await initialize();
    }

    try {
      if (_subscriptions.containsKey(path)) {
        print('⚠️ Already subscribed to: $path');
        return;
      }

      final ref = _database.ref(path);
      _subscriptions[path] = ref;

      // Listen to all events on this path
      ref.onValue.listen((DatabaseEvent event) {
        _handleDatabaseEvent(path, event);
      });

      print('✅ Subscribed to Firebase path: $path');
    } catch (e) {
      print('❌ Error subscribing to path $path: $e');
    }
  }

  /// Unsubscribe from Firebase path
  Future<void> unsubscribeFromPath(String path) async {
    try {
      if (_subscriptions.containsKey(path)) {
        // Firebase will automatically clean up listeners when reference is removed
        _subscriptions.remove(path);
        _eventHandlers.remove(path);
        print('✅ Unsubscribed from path: $path');
      }
    } catch (e) {
      print('❌ Error unsubscribing from path $path: $e');
    }
  }

  /// Handle database event and trigger registered handlers
  void _handleDatabaseEvent(String path, DatabaseEvent event) {
    final data = event.snapshot.value;

    if (data == null) return;

    // Data bisa berupa Map dengan event types sebagai keys
    if (data is Map) {
      data.forEach((key, value) {
        final eventType = key.toString();
        _triggerEventHandlers(path, eventType, value);
      });
    }
  }

  /// Trigger registered event handlers
  void _triggerEventHandlers(String path, String eventType, dynamic data) {
    if (_eventHandlers.containsKey(path) &&
        _eventHandlers[path]!.containsKey(eventType)) {
      try {
        print('🔔 Triggering handler: $eventType on $path');
        _eventHandlers[path]![eventType]!(data);
      } catch (e) {
        print('❌ Error executing handler for $eventType on $path: $e');
      }
    }
  }

  /// Bind event handler untuk specific event type
  ///
  /// Example:
  /// ```dart
  /// firebaseService.bindEvent(
  ///   'cards/123/events',
  ///   'card:updated',
  ///   (data) => print('Card updated: $data')
  /// );
  /// ```
  void bindEvent(String path, String eventType, Function(dynamic) handler) {
    if (!_eventHandlers.containsKey(path)) {
      _eventHandlers[path] = {};
    }
    _eventHandlers[path]![eventType] = handler;
    print('✅ Event handler bound: $eventType on $path');
  }

  /// Unbind event handler
  void unbindEvent(String path, String eventType) {
    if (_eventHandlers.containsKey(path)) {
      _eventHandlers[path]!.remove(eventType);
      print('✅ Event handler unbound: $eventType on $path');
    }
  }

  /// Get FCM token (untuk save ke backend)
  Future<String?> getFCMToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      print('❌ Error getting FCM token: $e');
      return null;
    }
  }

  /// Cleanup - unsubscribe all
  Future<void> dispose() async {
    try {
      final paths = _subscriptions.keys.toList();
      for (var path in paths) {
        await unsubscribeFromPath(path);
      }
      print('✅ Firebase service disposed');
    } catch (e) {
      print('❌ Error disposing Firebase service: $e');
    }
  }
}

/// Helper untuk compatibility dengan Pusher API
/// Subscribe ke card channel: 'cards/{cardId}/events'
Future<void> subscribeToCard(int cardId) async {
  await FirebaseService().subscribeToPath('cards/$cardId/events');
}

/// Subscribe ke project channel: 'projects/{projectId}/events'
Future<void> subscribeToProject(int projectId) async {
  await FirebaseService().subscribeToPath('projects/$projectId/events');
}

/// Subscribe ke user notifications: 'users/{userId}/events'
Future<void> subscribeToUser(int userId) async {
  await FirebaseService().subscribeToPath('users/$userId/events');
}
