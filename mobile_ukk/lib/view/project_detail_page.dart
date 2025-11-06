import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/project_provider.dart';
import '../models/card_model.dart' as CardModel;

class ProjectDetailPage extends ConsumerWidget {
  const ProjectDetailPage({super.key});

  Color _getStatusColor(CardModel.Status status) {
    switch (status) {
      case CardModel.Status.TODO:
        return Colors.grey;
      case CardModel.Status.IN_PROGRESS:
        return Colors.blue;
      case CardModel.Status.REVIEW:
        return Colors.purple;
      case CardModel.Status.DONE:
        return Colors.green;
    }
  }

  Color _getPriorityColor(CardModel.Priority priority) {
    switch (priority) {
      case CardModel.Priority.LOW:
        return Colors.blue;
      case CardModel.Priority.MEDIUM:
        return Colors.orange;
      case CardModel.Priority.HIGH:
        return Colors.red;
      case CardModel.Priority.URGENT:
        return Colors.deepOrange;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectId = ModalRoute.of(context)!.settings.arguments as int;
    final projectAsync = ref.watch(projectDetailProvider(projectId));

    return Scaffold(
      backgroundColor: const Color(0xFFFAF9F6),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: projectAsync.when(
          data: (project) => Text(
            project.name,
            style: const TextStyle(
              color: Colors.black87,
              fontWeight: FontWeight.w600,
            ),
          ),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Error'),
        ),
      ),
      body: projectAsync.when(
        data: (project) {
          // Group cards by status
          final allCards = project.boards
              .expand((board) => board.cards)
              .cast<Map<String, dynamic>>()
              .map((cardJson) => CardModel.Card.fromJson(cardJson))
              .toList();

          final todoCards = allCards
              .where((c) => c.status == CardModel.Status.TODO)
              .toList();
          final inProgressCards = allCards
              .where((c) => c.status == CardModel.Status.IN_PROGRESS)
              .toList();
          final reviewCards = allCards
              .where((c) => c.status == CardModel.Status.REVIEW)
              .toList();
          final doneCards = allCards
              .where((c) => c.status == CardModel.Status.DONE)
              .toList();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(projectDetailProvider(projectId));
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Project Info Card
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // My Tasks Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber[50],
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.amber[300]!,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.person,
                                size: 16,
                                color: Colors.amber[700],
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Showing only my assigned tasks',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.amber[900],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (project.description != null &&
                            project.description!.isNotEmpty) ...[
                          Text(
                            project.description!,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        Row(
                          children: [
                            _InfoChip(
                              icon: Icons.people,
                              label: '${project.members.length} members',
                            ),
                            const SizedBox(width: 8),
                            _InfoChip(
                              icon: Icons.assignment_ind,
                              label: '${allCards.length} my tasks',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Kanban Board
                  SizedBox(
                    height: MediaQuery.of(context).size.height - 200,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      children: [
                        _BoardColumn(
                          title: 'To Do',
                          cards: todoCards,
                          color: Colors.grey,
                          icon: Icons.inbox,
                          getStatusColor: _getStatusColor,
                          getPriorityColor: _getPriorityColor,
                        ),
                        _BoardColumn(
                          title: 'In Progress',
                          cards: inProgressCards,
                          color: Colors.blue,
                          icon: Icons.play_circle,
                          getStatusColor: _getStatusColor,
                          getPriorityColor: _getPriorityColor,
                        ),
                        _BoardColumn(
                          title: 'Review',
                          cards: reviewCards,
                          color: Colors.purple,
                          icon: Icons.rate_review,
                          getStatusColor: _getStatusColor,
                          getPriorityColor: _getPriorityColor,
                        ),
                        _BoardColumn(
                          title: 'Done',
                          cards: doneCards,
                          color: Colors.green,
                          icon: Icons.check_circle,
                          getStatusColor: _getStatusColor,
                          getPriorityColor: _getPriorityColor,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                'Failed to load project',
                style: TextStyle(fontSize: 16, color: Colors.grey[700]),
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(projectDetailProvider(projectId));
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[700]),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }
}

class _BoardColumn extends StatelessWidget {
  final String title;
  final List<CardModel.Card> cards;
  final Color color;
  final IconData icon;
  final Color Function(CardModel.Status) getStatusColor;
  final Color Function(CardModel.Priority) getPriorityColor;

  const _BoardColumn({
    required this.title,
    required this.cards,
    required this.color,
    required this.icon,
    required this.getStatusColor,
    required this.getPriorityColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Column Header
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    cards.length.toString(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Cards List
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: cards.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          'No tasks',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: cards.length,
                      itemBuilder: (context, index) {
                        final card = cards[index];
                        return _CardTile(
                          card: card,
                          getPriorityColor: getPriorityColor,
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CardTile extends StatelessWidget {
  final CardModel.Card card;
  final Color Function(CardModel.Priority) getPriorityColor;

  const _CardTile({required this.card, required this.getPriorityColor});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/card-detail', arguments: card.id);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: getPriorityColor(card.priority).withOpacity(0.3),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title and Priority
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    card.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: getPriorityColor(card.priority).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    card.priority.name,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: getPriorityColor(card.priority),
                    ),
                  ),
                ),
              ],
            ),

            // Due Date
            if (card.dueDate != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 12, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(card.dueDate!),
                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = date.difference(now);

    if (diff.inDays == 0) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Tomorrow';
    } else if (diff.inDays < 0) {
      return 'Overdue';
    } else {
      return '${diff.inDays} days left';
    }
  }
}
