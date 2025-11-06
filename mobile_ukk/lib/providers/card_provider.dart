import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/card_detail_model.dart';

// Card detail provider
final cardDetailProvider = FutureProvider.autoDispose.family<CardDetail, int>((
  ref,
  cardId,
) async {
  try {
    await apiServiceProvider.initialize();
    final response = await apiServiceProvider.getCardDetail(cardId);

    return CardDetail.fromJson(response);
  } catch (e) {
    print('❌ Failed to load card detail: $e');
    throw Exception('Failed to load card detail: $e');
  }
});

// Card operations class
class CardOperations {
  Future<void> updateCardStatus(
    int cardId,
    String status,
    WidgetRef ref,
  ) async {
    try {
      await apiServiceProvider.updateCardStatus(cardId, status);
      // Invalidate card detail to refresh
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateCard(
    int cardId,
    Map<String, dynamic> data,
    WidgetRef ref,
  ) async {
    try {
      await apiServiceProvider.updateCard(cardId, data);
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> startTimer(int cardId, WidgetRef ref) async {
    try {
      await apiServiceProvider.startTimer(cardId);
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> stopTimer(int cardId, int timeLogId, WidgetRef ref) async {
    try {
      await apiServiceProvider.stopTimer(cardId, timeLogId);
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> addComment(int cardId, String content, WidgetRef ref) async {
    try {
      await apiServiceProvider.addComment(cardId, content);
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleSubtask(int cardId, int subtaskId, WidgetRef ref) async {
    try {
      await apiServiceProvider.toggleSubtask(cardId, subtaskId);
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> addSubtask(int cardId, String title, WidgetRef ref) async {
    try {
      await apiServiceProvider.addSubtask(cardId, {'title': title});
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }

  Future<void> resetCard(int cardId, WidgetRef ref) async {
    try {
      await apiServiceProvider.resetCard(cardId);
      ref.invalidate(cardDetailProvider(cardId));
    } catch (e) {
      rethrow;
    }
  }
}

final cardOperationsProvider = Provider<CardOperations>((ref) {
  return CardOperations();
});
