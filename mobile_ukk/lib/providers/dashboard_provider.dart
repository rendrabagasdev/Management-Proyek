import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/card_model.dart';

// Dashboard stats model
class DashboardStats {
  final int activeCards;
  final int todoCards;
  final int completedCards;
  final int totalProjects;
  final List<Map<String, dynamic>> projects;
  final List<Card> myCards;

  DashboardStats({
    required this.activeCards,
    required this.todoCards,
    required this.completedCards,
    required this.totalProjects,
    required this.projects,
    required this.myCards,
  });
}

// Dashboard stats provider
final dashboardStatsProvider = FutureProvider.autoDispose<DashboardStats>((
  ref,
) async {
  try {
    // Ensure API service is initialized
    await apiServiceProvider.initialize();

    // Get dashboard stats from API
    final response = await apiServiceProvider.getDashboardStats();

    // Parse projects
    final projects =
        (response['projects'] as List?)?.map((p) {
          return {
            'id': p['id'] as int,
            'name': p['name'] as String,
            'taskCount': p['taskCount'] as int? ?? 0,
          };
        }).toList() ??
        [];

    // Parse cards
    final cardsData = response['myCards'] as List? ?? [];
    final cards = cardsData.map((json) {
      return Card.fromJson(json as Map<String, dynamic>);
    }).toList();

    // Count by status
    final activeCards = cards
        .where((c) => c.status == Status.IN_PROGRESS)
        .length;
    final todoCards = cards.where((c) => c.status == Status.TODO).length;
    final completedCards = cards.where((c) => c.status == Status.DONE).length;

    return DashboardStats(
      activeCards: activeCards,
      todoCards: todoCards,
      completedCards: completedCards,
      totalProjects: projects.length,
      projects: projects,
      myCards: cards,
    );
  } catch (e) {
    print('❌ Failed to load dashboard stats: $e');
    throw Exception('Failed to load dashboard stats: $e');
  }
});
