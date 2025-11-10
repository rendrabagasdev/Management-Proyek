import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart';
import 'package:mobile_ukk/services/api_service.dart';
import 'package:mobile_ukk/services/pusher_service.dart';
import 'dart:developer' as developer;

class NotificationModel {
  final int id;
  final String type;
  final String title;
  final String message;
  final String? link;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.link,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      type: json['type'],
      title: json['title'],
      message: json['message'],
      link: json['link'],
      isRead: json['isRead'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      type: type,
      title: title,
      message: message,
      link: link,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }
}

class NotificationState {
  final List<NotificationModel> notifications;
  final int unreadCount;
  final bool isLoading;

  NotificationState({
    this.notifications = const [],
    this.unreadCount = 0,
    this.isLoading = false,
  });

  NotificationState copyWith({
    List<NotificationModel>? notifications,
    int? unreadCount,
    bool? isLoading,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class NotificationNotifier extends Notifier<NotificationState> {
  final ApiService _apiService = ApiService();
  final PusherService _pusherService = PusherService();

  int? _subscribedUserId;

  @override
  NotificationState build() {
    return NotificationState();
  }

  List<NotificationModel> get notifications => state.notifications;
  int get unreadCount => state.unreadCount;
  bool get isLoading => state.isLoading;

  // Fetch notifications
  Future<void> fetchNotifications({bool unreadOnly = false}) async {
    state = state.copyWith(isLoading: true);

    try {
      final response = await _apiService.getNotifications(
        unreadOnly: unreadOnly,
      );

      if (response['notifications'] != null) {
        final notifications = (response['notifications'] as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();
        state = state.copyWith(notifications: notifications);
      }
    } catch (e) {
      developer.log(
        'Error fetching notifications: $e',
        name: 'NotificationProvider',
      );
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  // Fetch unread count
  Future<void> fetchUnreadCount() async {
    try {
      final response = await _apiService.getUnreadCount();
      state = state.copyWith(unreadCount: response['count'] ?? 0);
    } catch (e) {
      developer.log(
        'Error fetching unread count: $e',
        name: 'NotificationProvider',
      );
    }
  }

  // Mark as read
  Future<void> markAsRead(int notificationId) async {
    try {
      await _apiService.markNotificationsAsRead(
        notificationIds: [notificationId],
      );

      // Update local state
      final updatedNotifications = state.notifications.map((n) {
        if (n.id == notificationId && !n.isRead) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();

      final unreadCountChange =
          state.notifications.any((n) => n.id == notificationId && !n.isRead)
          ? 1
          : 0;

      state = state.copyWith(
        notifications: updatedNotifications,
        unreadCount: (state.unreadCount - unreadCountChange).clamp(0, 999),
      );
    } catch (e) {
      developer.log('Error marking as read: $e', name: 'NotificationProvider');
    }
  }

  // Mark all as read
  Future<void> markAllAsRead() async {
    try {
      await _apiService.markNotificationsAsRead(markAllAsRead: true);

      // Update local state
      final updatedNotifications = state.notifications
          .map((n) => n.copyWith(isRead: true))
          .toList();

      state = state.copyWith(
        notifications: updatedNotifications,
        unreadCount: 0,
      );
    } catch (e) {
      developer.log(
        'Error marking all as read: $e',
        name: 'NotificationProvider',
      );
    }
  }

  // Delete notification
  Future<void> deleteNotification(int notificationId) async {
    try {
      await _apiService.deleteNotification(notificationId);

      // Update local state
      final notificationToDelete = state.notifications.firstWhere(
        (n) => n.id == notificationId,
        orElse: () => NotificationModel(
          id: -1,
          type: '',
          title: '',
          message: '',
          isRead: true,
          createdAt: DateTime.now(),
        ),
      );

      final updatedNotifications = state.notifications
          .where((n) => n.id != notificationId)
          .toList();

      final unreadCountChange = !notificationToDelete.isRead ? 1 : 0;

      state = state.copyWith(
        notifications: updatedNotifications,
        unreadCount: (state.unreadCount - unreadCountChange).clamp(0, 999),
      );
    } catch (e) {
      developer.log(
        'Error deleting notification: $e',
        name: 'NotificationProvider',
      );
    }
  }

  // Subscribe to real-time notifications
  void subscribeToNotifications(int userId) {
    if (_subscribedUserId == userId) return; // Already subscribed

    final channelName = 'user-$userId';
    _pusherService.subscribeToChannel(channelName);
    _pusherService.bindEvent(channelName, 'notification:new', (data) {
      developer.log(
        '📬 New notification received: $data',
        name: 'NotificationProvider',
      );

      if (data != null && data['notification'] != null) {
        final notification = NotificationModel.fromJson(data['notification']);
        final updatedNotifications = [notification, ...state.notifications];
        state = state.copyWith(
          notifications: updatedNotifications,
          unreadCount: state.unreadCount + 1,
        );
      }
    });

    _subscribedUserId = userId;
    developer.log(
      '✅ Subscribed to notifications for user $userId',
      name: 'NotificationProvider',
    );
  }

  // Unsubscribe from notifications
  void unsubscribeFromNotifications() {
    if (_subscribedUserId != null) {
      final channelName = 'user-$_subscribedUserId';
      _pusherService.unsubscribeFromChannel(channelName);
      _subscribedUserId = null;
      developer.log(
        '❌ Unsubscribed from notifications',
        name: 'NotificationProvider',
      );
    }
  }

  void cleanUp() {
    unsubscribeFromNotifications();
  }
}

// Provider
final notificationProvider =
    NotifierProvider<NotificationNotifier, NotificationState>(() {
      return NotificationNotifier();
    });
