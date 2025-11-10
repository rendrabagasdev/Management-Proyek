import 'package:dio/dio.dart';

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

  NotificationModel copyWith({
    int? id,
    String? type,
    String? title,
    String? message,
    String? link,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      link: link ?? this.link,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class NotificationService {
  final Dio _dio;
  final String _baseUrl;

  NotificationService(this._dio, this._baseUrl);

  // Get notifications
  Future<List<NotificationModel>> getNotifications({
    bool unreadOnly = false,
  }) async {
    try {
      final url = unreadOnly
          ? '$_baseUrl/mobile/notifications?unreadOnly=true'
          : '$_baseUrl/mobile/notifications';

      final response = await _dio.get(url);

      if (response.data['notifications'] != null) {
        return (response.data['notifications'] as List)
            .map((json) => NotificationModel.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error getting notifications: $e');
      return [];
    }
  }

  // Get unread count
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get(
        '$_baseUrl/mobile/notifications/unread-count',
      );
      return response.data['count'] ?? 0;
    } catch (e) {
      print('Error getting unread count: $e');
      return 0;
    }
  }

  // Mark notification as read
  Future<bool> markAsRead(int notificationId) async {
    try {
      await _dio.patch(
        '$_baseUrl/mobile/notifications',
        data: {
          'notificationIds': [notificationId],
        },
      );
      return true;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }

  // Mark all as read
  Future<bool> markAllAsRead() async {
    try {
      await _dio.patch(
        '$_baseUrl/mobile/notifications',
        data: {'markAllAsRead': true},
      );
      return true;
    } catch (e) {
      print('Error marking all as read: $e');
      return false;
    }
  }

  // Delete notification
  Future<bool> deleteNotification(int notificationId) async {
    try {
      await _dio.delete('$_baseUrl/mobile/notifications?id=$notificationId');
      return true;
    } catch (e) {
      print('Error deleting notification: $e');
      return false;
    }
  }
}
