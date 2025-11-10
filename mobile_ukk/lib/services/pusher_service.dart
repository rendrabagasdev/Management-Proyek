import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';

class PusherService {
  static final PusherService _instance = PusherService._internal();
  factory PusherService() => _instance;
  PusherService._internal();

  late PusherChannelsFlutter pusher;
  bool _initialized = false;

  // Event handlers for channels
  final Map<String, Map<String, Function(dynamic)>> _eventHandlers = {};

  // Pusher credentials (sama dengan web)
  static const String _appKey = 'c3a163cfc028456c9ef8';
  static const String _cluster = 'ap1';

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      pusher = PusherChannelsFlutter.getInstance();

      await pusher.init(
        apiKey: _appKey,
        cluster: _cluster,
        onConnectionStateChange: onConnectionStateChange,
        onError: onError,
        onSubscriptionSucceeded: onSubscriptionSucceeded,
        onEvent: onEvent,
        onSubscriptionError: onSubscriptionError,
        onDecryptionFailure: onDecryptionFailure,
        onMemberAdded: onMemberAdded,
        onMemberRemoved: onMemberRemoved,
      );

      await pusher.connect();
      _initialized = true;
      print('Pusher initialized successfully');
    } catch (e) {
      print('Error initializing Pusher: $e');
    }
  }

  Future<void> disconnect() async {
    if (!_initialized) return;
    try {
      await pusher.disconnect();
      _initialized = false;
      print('Pusher disconnected');
    } catch (e) {
      print('Error disconnecting Pusher: $e');
    }
  }

  Future<void> subscribeToChannel(String channelName) async {
    if (!_initialized) {
      await initialize();
    }
    try {
      await pusher.subscribe(channelName: channelName);
      print('Subscribed to channel: $channelName');
    } catch (e) {
      print('Error subscribing to channel $channelName: $e');
    }
  }

  Future<void> unsubscribeFromChannel(String channelName) async {
    try {
      await pusher.unsubscribe(channelName: channelName);
      // Clean up event handlers for this channel
      _eventHandlers.remove(channelName);
      print('Unsubscribed from channel: $channelName');
    } catch (e) {
      print('Error unsubscribing from channel $channelName: $e');
    }
  }

  // Bind custom event handler
  void bindEvent(
    String channelName,
    String eventName,
    Function(dynamic) handler,
  ) {
    if (!_eventHandlers.containsKey(channelName)) {
      _eventHandlers[channelName] = {};
    }
    _eventHandlers[channelName]![eventName] = handler;
    print('Event handler bound: $eventName on $channelName');
  }

  // Unbind event handler
  void unbindEvent(String channelName, String eventName) {
    if (_eventHandlers.containsKey(channelName)) {
      _eventHandlers[channelName]!.remove(eventName);
      print('Event handler unbound: $eventName on $channelName');
    }
  }

  // Event handlers
  void onConnectionStateChange(dynamic currentState, dynamic previousState) {
    print('Connection state changed: $previousState -> $currentState');
  }

  void onError(String message, int? code, dynamic e) {
    print('Pusher error: $message (code: $code)');
  }

  void onEvent(PusherEvent event) {
    print('Pusher event received: ${event.eventName} on ${event.channelName}');

    // Call custom event handlers if registered
    final channelName = event.channelName;
    final eventName = event.eventName;

    if (_eventHandlers.containsKey(channelName) &&
        _eventHandlers[channelName]!.containsKey(eventName)) {
      try {
        _eventHandlers[channelName]![eventName]!(event.data);
      } catch (e) {
        print(
          'Error executing event handler for $eventName on $channelName: $e',
        );
      }
    }
  }

  void onSubscriptionSucceeded(String channelName, dynamic data) {
    print('Subscription succeeded: $channelName');
  }

  void onSubscriptionError(String message, dynamic e) {
    print('Subscription error: $message');
  }

  void onDecryptionFailure(String event, String reason) {
    print('Decryption failure: $event - $reason');
  }

  void onMemberAdded(String channelName, PusherMember member) {
    print('Member added to $channelName: ${member.userId}');
  }

  void onMemberRemoved(String channelName, PusherMember member) {
    print('Member removed from $channelName: ${member.userId}');
  }
}
