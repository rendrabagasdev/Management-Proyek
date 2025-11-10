import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/project_provider.dart';
import '../models/card_model.dart' as CardModel;

class ProjectDetailPage extends ConsumerWidget {
  const ProjectDetailPage({super.key});

  Color _getStatusColor(CardModel.Status status) {
    switch (status) {
      case CardModel.Status.TODO:
        return const Color(0xFF6B7280); // Gray
      case CardModel.Status.IN_PROGRESS:
        return const Color(0xFF3B82F6); // Blue
      case CardModel.Status.REVIEW:
        return const Color(0xFF8B5CF6); // Purple
      case CardModel.Status.DONE:
        return const Color(0xFF10B981); // Green
    }
  }

  Color _getPriorityColor(CardModel.Priority priority) {
    switch (priority) {
      case CardModel.Priority.LOW:
        return const Color(0xFF06B6D4); // Cyan
      case CardModel.Priority.MEDIUM:
        return const Color(0xFFF59E0B); // Amber
      case CardModel.Priority.HIGH:
        return const Color(0xFFEF4444); // Red
      case CardModel.Priority.URGENT:
        return const Color(0xFFDC2626); // Dark Red
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
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.white, Colors.grey.shade50],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // My Tasks Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.amber.shade100,
                                Colors.amber.shade50,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.amber.shade300,
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.person_pin,
                                size: 18,
                                color: Colors.amber.shade800,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'My Assigned Tasks',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.amber.shade900,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (project.description != null &&
                            project.description!.isNotEmpty) ...[
                          Text(
                            project.description!,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[700],
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                        Row(
                          children: [
                            _InfoChip(
                              icon: Icons.people_rounded,
                              label: '${project.members.length} members',
                              color: Colors.blue,
                            ),
                            const SizedBox(width: 12),
                            _InfoChip(
                              icon: Icons.assignment_rounded,
                              label: '${allCards.length} tasks',
                              color: Colors.green,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

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
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
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
      width: 300,
      margin: const EdgeInsets.only(right: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Column Header with gradient
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withOpacity(0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 20, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    cards.length.toString(),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Cards List with better styling
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
                border: Border.all(color: color.withOpacity(0.2), width: 2),
              ),
              child: cards.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.inbox_outlined,
                              size: 48,
                              color: Colors.grey.shade300,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No tasks yet',
                              style: TextStyle(
                                color: Colors.grey.shade400,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
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
    final priorityColor = getPriorityColor(card.priority);

    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/card-detail', arguments: card.id);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: priorityColor.withOpacity(0.3), width: 2),
          boxShadow: [
            BoxShadow(
              color: priorityColor.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Priority bar at top
            Container(
              height: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [priorityColor, priorityColor.withOpacity(0.6)],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Priority Badge
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          card.title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1F2937),
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: priorityColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: priorityColor.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          card.priority.name,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: priorityColor,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Bottom info row
                  Row(
                    children: [
                      // Due Date
                      if (card.dueDate != null) ...[
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: _isOverdue(card.dueDate!)
                                  ? Colors.red.shade50
                                  : Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.access_time_rounded,
                                  size: 14,
                                  color: _isOverdue(card.dueDate!)
                                      ? Colors.red.shade700
                                      : Colors.blue.shade700,
                                ),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    _formatDate(card.dueDate!),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: _isOverdue(card.dueDate!)
                                          ? Colors.red.shade700
                                          : Colors.blue.shade700,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        // Show creator avatar if no due date
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.purple.shade400,
                                Colors.purple.shade600,
                              ],
                            ),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.purple.withOpacity(0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              card.creator.name.substring(0, 1).toUpperCase(),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isOverdue(DateTime date) {
    return date.isBefore(DateTime.now());
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = date.difference(now);

    if (diff.inDays == 0) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Tomorrow';
    } else if (diff.inDays < 0) {
      return 'Overdue!';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d left';
    } else {
      return '${(diff.inDays / 7).floor()}w left';
    }
  }
}
