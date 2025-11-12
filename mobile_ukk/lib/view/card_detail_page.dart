import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/card_provider.dart';
import '../providers/auth_provider.dart';
import '../models/card_detail_model.dart';
import '../models/card_model.dart' as CardModel;
import '../services/firebase_service.dart';

class CardDetailPage extends ConsumerStatefulWidget {
  final int cardId;

  const CardDetailPage({super.key, required this.cardId});

  @override
  ConsumerState<CardDetailPage> createState() => _CardDetailPageState();
}

class _CardDetailPageState extends ConsumerState<CardDetailPage> {
  final TextEditingController _commentController = TextEditingController();
  bool _isTimerRunning = false;
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

    // Subscribe to card events
    await _firebaseService.subscribeToPath(_eventPath!);

    // Bind event handlers with proper wrapping
    _firebaseService.bindEvent(
      _eventPath!,
      'card:updated',
      (data) => _onCardUpdated(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'card:assigned',
      (data) => _onCardAssigned(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'comment:created',
      (data) => _onCommentCreated(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'subtask:created',
      (data) => _onSubtaskChanged(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'subtask:updated',
      (data) => _onSubtaskChanged(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'subtask:deleted',
      (data) => _onSubtaskChanged(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'timelog:started',
      (data) => _onTimeLogChanged(data as Map<String, dynamic>),
    );
    _firebaseService.bindEvent(
      _eventPath!,
      'timelog:stopped',
      (data) => _onTimeLogChanged(data as Map<String, dynamic>),
    );
  }

  void _onCardUpdated(Map<String, dynamic> data) {
    final userId = data['userId'];
    // Refresh card data
    ref.invalidate(cardDetailProvider(widget.cardId));

    // Show notification if update from another user
    if (userId != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Card updated by another user'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _onCardAssigned(Map<String, dynamic> data) {
    ref.invalidate(cardDetailProvider(widget.cardId));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Card assigned'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _onCommentCreated(Map<String, dynamic> data) {
    ref.invalidate(cardDetailProvider(widget.cardId));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('New comment added'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _onSubtaskChanged(Map<String, dynamic> data) {
    ref.invalidate(cardDetailProvider(widget.cardId));
  }

  void _onTimeLogChanged(Map<String, dynamic> data) {
    ref.invalidate(cardDetailProvider(widget.cardId));
  }

  Future<void> _handleCompleteCard() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Selesaikan Card'),
        content: const Text(
          'Apakah Anda yakin ingin menyelesaikan card ini? Card akan dipindahkan ke status REVIEW.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.amber[700]),
            child: const Text('Selesaikan'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final operations = ref.read(cardOperationsProvider);
        await operations.updateCardStatus(widget.cardId, 'REVIEW', ref);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Card berhasil dipindahkan ke REVIEW'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    if (_eventPath != null) {
      _firebaseService.unsubscribeFromPath(_eventPath!);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cardAsync = ref.watch(cardDetailProvider(widget.cardId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Card Details'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          PopupMenuButton<CardModel.Status>(
            icon: const Icon(Icons.more_vert),
            onSelected: (status) async {
              final operations = ref.read(cardOperationsProvider);
              await operations.updateCardStatus(
                widget.cardId,
                status.name,
                ref,
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Status updated to ${status.name.toUpperCase()}',
                    ),
                  ),
                );
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: CardModel.Status.TODO,
                child: Text('TODO'),
              ),
              const PopupMenuItem(
                value: CardModel.Status.IN_PROGRESS,
                child: Text('IN PROGRESS'),
              ),
              const PopupMenuItem(
                value: CardModel.Status.REVIEW,
                child: Text('REVIEW'),
              ),
              const PopupMenuItem(
                value: CardModel.Status.DONE,
                child: Text('DONE'),
              ),
            ],
          ),
        ],
      ),
      body: cardAsync.when(
        data: (card) => _buildCardContent(card),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(cardDetailProvider(widget.cardId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCardContent(CardDetail card) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(cardDetailProvider(widget.cardId));
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card Header
            _buildCardHeader(card),
            const SizedBox(height: 24),

            // Time Tracking Section
            _buildTimeTracking(card),
            const SizedBox(height: 24),

            // Description
            if (card.description != null) ...[
              _buildSectionTitle('Description'),
              const SizedBox(height: 8),
              Text(
                card.description!,
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 24),
            ],

            // Subtasks Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionTitle('Subtasks (${card.subtasks.length})'),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  color: Colors.amber[700],
                  tooltip: 'Add Subtask',
                  onPressed: () => _showAddSubtaskDialog(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _buildSubtasks(card.subtasks),
            const SizedBox(height: 24),

            // Comments Section
            _buildSectionTitle('Comments (${card.comments.length})'),
            const SizedBox(height: 8),
            _buildComments(card.comments),
            const SizedBox(height: 16),
            _buildCommentInput(),
            const SizedBox(height: 24),

            // Time Logs Section
            if (card.timeLogs.isNotEmpty) ...[
              _buildSectionTitle('Time Logs'),
              const SizedBox(height: 8),
              _buildTimeLogs(card.timeLogs),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCardHeader(CardDetail card) {
    // Get current user from auth provider
    final authState = ref.watch(authProvider);
    final userId = authState.user?.id;

    // Check if current user is the assignee
    final isAssignee = card.assignee != null && card.assignee!.id == userId;

    // Show complete button if user is assignee and card is not in REVIEW or DONE
    final canComplete =
        isAssignee &&
        card.status != CardModel.Status.REVIEW &&
        card.status != CardModel.Status.DONE;

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    card.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _buildPriorityChip(card.priority),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildStatusChip(card.status),
                const SizedBox(width: 12),
                if (card.dueDate != null) _buildDueDateChip(card.dueDate!),
              ],
            ),
            if (card.assignee != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Assigned to: ${card.assignee!.name}',
                    style: const TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                ],
              ),
            ],
            // Complete Card Button
            if (canComplete) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _handleCompleteCard,
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Selesaikan Card'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber[700],
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPriorityChip(CardModel.Priority priority) {
    Color color;
    switch (priority) {
      case CardModel.Priority.LOW:
        color = Colors.blue;
        break;
      case CardModel.Priority.MEDIUM:
        color = Colors.orange;
        break;
      case CardModel.Priority.HIGH:
        color = Colors.red;
        break;
      case CardModel.Priority.URGENT:
        color = Colors.deepOrange;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color),
      ),
      child: Text(
        priority.name,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildStatusChip(CardModel.Status status) {
    Color color;
    switch (status) {
      case CardModel.Status.TODO:
        color = Colors.grey;
        break;
      case CardModel.Status.IN_PROGRESS:
        color = Colors.blue;
        break;
      case CardModel.Status.REVIEW:
        color = Colors.purple;
        break;
      case CardModel.Status.DONE:
        color = Colors.green;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.circle, size: 8, color: color),
          const SizedBox(width: 6),
          Text(
            status.name.replaceAll('_', ' '),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDueDateChip(DateTime dueDate) {
    final now = DateTime.now();
    final diff = dueDate.difference(now);
    final isOverdue = diff.isNegative;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isOverdue
            ? Colors.red.withValues(alpha: 0.1)
            : Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.calendar_today,
            size: 12,
            color: isOverdue ? Colors.red : Colors.green,
          ),
          const SizedBox(width: 6),
          Text(
            _formatDueDate(dueDate),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isOverdue ? Colors.red : Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeTracking(CardDetail card) {
    // Check if there's an active time log
    final activeTimeLog = card.timeLogs.any((log) => log.endTime == null);
    _isTimerRunning = activeTimeLog;

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Time Tracking',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  _formatTotalTime(card.timeLogs),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isTimerRunning
                    ? () => _stopTimer(card)
                    : () => _startTimer(),
                icon: Icon(_isTimerRunning ? Icons.stop : Icons.play_arrow),
                label: Text(_isTimerRunning ? 'Stop Timer' : 'Start Timer'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isTimerRunning ? Colors.red : Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildSubtasks(List<Subtask> subtasks) {
    if (subtasks.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text('No subtasks', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    return Column(
      children: subtasks.map((subtask) {
        final isCompleted = subtask.status == CardModel.Status.DONE;
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: CheckboxListTile(
            value: isCompleted,
            onChanged: (_) => _toggleSubtask(subtask.id, isCompleted),
            title: Text(
              subtask.title,
              style: TextStyle(
                decoration: isCompleted ? TextDecoration.lineThrough : null,
              ),
            ),
            secondary: isCompleted
                ? const Icon(Icons.check_circle, color: Colors.green)
                : const Icon(Icons.circle_outlined, color: Colors.grey),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildComments(List<Comment> comments) {
    if (comments.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No comments yet',
              style: TextStyle(color: Colors.grey),
            ),
          ),
        ),
      );
    }

    return Column(
      children: comments.map((comment) {
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.blue,
                      child: Text(
                        comment.user.name[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            comment.user.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            _formatCommentDate(comment.createdAt),
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  comment.text,
                  style: const TextStyle(fontSize: 14, height: 1.5),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCommentInput() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _commentController,
                decoration: const InputDecoration(
                  hintText: 'Add a comment...',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                ),
                maxLines: null,
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _addComment,
              icon: const Icon(Icons.send),
              style: IconButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeLogs(List<TimeLog> timeLogs) {
    return Column(
      children: timeLogs.map((log) {
        final duration = log.endTime != null
            ? log.endTime!.difference(log.startTime)
            : DateTime.now().difference(log.startTime);

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Icon(
              log.endTime != null ? Icons.timer_off : Icons.timer,
              color: log.endTime != null ? Colors.grey : Colors.green,
            ),
            title: Text(
              _formatDuration(duration),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${_formatDateTime(log.startTime)}${log.endTime != null ? ' - ${_formatDateTime(log.endTime!)}' : ' (Running)'}',
              style: const TextStyle(fontSize: 12),
            ),
          ),
        );
      }).toList(),
    );
  }

  // Helper methods
  String _formatTotalTime(List<TimeLog> timeLogs) {
    int totalSeconds = 0;
    for (var log in timeLogs) {
      final end = log.endTime ?? DateTime.now();
      totalSeconds += end.difference(log.startTime).inSeconds;
    }
    return _formatDuration(Duration(seconds: totalSeconds));
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }

  String _formatDueDate(DateTime date) {
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

  String _formatCommentDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inDays < 1) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  String _formatDateTime(DateTime date) {
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  // Actions
  Future<void> _startTimer() async {
    try {
      final operations = ref.read(cardOperationsProvider);
      await operations.startTimer(widget.cardId, ref);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Timer started'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start timer: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _stopTimer(CardDetail card) async {
    final activeLog = card.timeLogs.firstWhere((log) => log.endTime == null);
    try {
      final operations = ref.read(cardOperationsProvider);
      await operations.stopTimer(widget.cardId, activeLog.id, ref);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Timer stopped'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to stop timer: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _toggleSubtask(int subtaskId, bool currentStatus) async {
    try {
      final operations = ref.read(cardOperationsProvider);
      await operations.toggleSubtask(widget.cardId, subtaskId, ref);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update subtask: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showAddSubtaskDialog() {
    final TextEditingController titleController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Subtask'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            labelText: 'Subtask Title',
            hintText: 'Enter subtask title',
            border: OutlineInputBorder(),
          ),
          autofocus: true,
          textCapitalization: TextCapitalization.sentences,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (titleController.text.trim().isNotEmpty) {
                Navigator.pop(context);
                _addSubtask(titleController.text.trim());
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  Future<void> _addSubtask(String title) async {
    try {
      final operations = ref.read(cardOperationsProvider);
      await operations.addSubtask(widget.cardId, title, ref);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Subtask added successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add subtask: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty) {
      return;
    }

    try {
      final operations = ref.read(cardOperationsProvider);
      await operations.addComment(
        widget.cardId,
        _commentController.text.trim(),
        ref,
      );
      _commentController.clear();
      FocusScope.of(context).unfocus();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add comment: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
