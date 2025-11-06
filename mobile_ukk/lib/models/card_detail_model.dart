import 'card_model.dart';

class CardDetail {
  final int id;
  final String title;
  final String? description;
  final Status status;
  final Priority priority;
  final int boardId;
  final int createdBy;
  final int? assigneeId;
  final DateTime? dueDate;
  final int position;
  final DateTime createdAt;
  final DateTime updatedAt;
  final CardCreator? creator;
  final CardCreator? assignee;
  final Board? board;
  final List<Subtask> subtasks;
  final List<Comment> comments;
  final List<TimeLog> timeLogs;

  CardDetail({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    required this.boardId,
    required this.createdBy,
    this.assigneeId,
    this.dueDate,
    required this.position,
    required this.createdAt,
    required this.updatedAt,
    this.creator,
    this.assignee,
    this.board,
    this.subtasks = const [],
    this.comments = const [],
    this.timeLogs = const [],
  });

  factory CardDetail.fromJson(Map<String, dynamic> json) {
    return CardDetail(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: _parseStatus(json['status'] as String),
      priority: _parsePriority(json['priority'] as String),
      boardId: json['boardId'] as int,
      createdBy: json['createdBy'] as int,
      assigneeId: json['assigneeId'] as int?,
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : null,
      position: json['position'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      creator: json['creator'] != null
          ? CardCreator.fromJson(json['creator'] as Map<String, dynamic>)
          : null,
      assignee: json['assignee'] != null
          ? CardCreator.fromJson(json['assignee'] as Map<String, dynamic>)
          : null,
      board: json['board'] != null
          ? Board.fromJson(json['board'] as Map<String, dynamic>)
          : null,
      subtasks:
          (json['subtasks'] as List<dynamic>?)
              ?.map((s) => Subtask.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
      comments:
          (json['comments'] as List<dynamic>?)
              ?.map((c) => Comment.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      timeLogs:
          (json['timeLogs'] as List<dynamic>?)
              ?.map((t) => TimeLog.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  static Status _parseStatus(String status) {
    return Status.values.firstWhere(
      (s) => s.name == status,
      orElse: () => Status.TODO,
    );
  }

  static Priority _parsePriority(String priority) {
    return Priority.values.firstWhere(
      (p) => p.name == priority,
      orElse: () => Priority.MEDIUM,
    );
  }

  int get totalTimeMinutes {
    return timeLogs.fold(0, (sum, log) => sum + (log.durationMinutes ?? 0));
  }

  int get completedSubtasks {
    return subtasks.where((s) => s.completed).length;
  }

  double get subtaskProgress {
    if (subtasks.isEmpty) return 0.0;
    return completedSubtasks / subtasks.length;
  }
}

class CardCreator {
  final int id;
  final String name;
  final String? email;

  CardCreator({required this.id, required this.name, this.email});

  factory CardCreator.fromJson(Map<String, dynamic> json) {
    return CardCreator(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'email': email};
  }
}

class Board {
  final int id;
  final String name;
  final Project? project;

  Board({required this.id, required this.name, this.project});

  factory Board.fromJson(Map<String, dynamic> json) {
    return Board(
      id: json['id'] as int,
      name: json['name'] as String,
      project: json['project'] != null
          ? Project.fromJson(json['project'] as Map<String, dynamic>)
          : null,
    );
  }
}

class Project {
  final int id;
  final String name;

  Project({required this.id, required this.name});

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(id: json['id'] as int, name: json['name'] as String);
  }
}

class Subtask {
  final int id;
  final String title;
  final Status status;
  final int cardId;
  final int? assigneeId;
  final DateTime createdAt;
  final CardCreator? assignee;

  Subtask({
    required this.id,
    required this.title,
    required this.status,
    required this.cardId,
    this.assigneeId,
    required this.createdAt,
    this.assignee,
  });

  factory Subtask.fromJson(Map<String, dynamic> json) {
    return Subtask(
      id: json['id'] as int,
      title: json['title'] as String,
      status: _parseStatus(json['status'] as String),
      cardId: json['cardId'] as int,
      assigneeId: json['assigneeId'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      assignee: json['assignee'] != null
          ? CardCreator.fromJson(json['assignee'] as Map<String, dynamic>)
          : null,
    );
  }

  bool get completed => status == Status.DONE;

  static Status _parseStatus(String status) {
    return Status.values.firstWhere(
      (s) => s.name == status,
      orElse: () => Status.TODO,
    );
  }
}

class Comment {
  final int id;
  final String text;
  final int cardId;
  final int userId;
  final DateTime createdAt;
  final CardCreator user;

  Comment({
    required this.id,
    required this.text,
    required this.cardId,
    required this.userId,
    required this.createdAt,
    required this.user,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as int,
      text: json['text'] as String,
      cardId: json['cardId'] as int,
      userId: json['userId'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: CardCreator.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class TimeLog {
  final int id;
  final int cardId;
  final int userId;
  final DateTime startTime;
  final DateTime? endTime;
  final int? durationMinutes;
  final DateTime createdAt;
  final CardCreator user;

  TimeLog({
    required this.id,
    required this.cardId,
    required this.userId,
    required this.startTime,
    this.endTime,
    this.durationMinutes,
    required this.createdAt,
    required this.user,
  });

  factory TimeLog.fromJson(Map<String, dynamic> json) {
    return TimeLog(
      id: json['id'] as int,
      cardId: json['cardId'] as int,
      userId: json['userId'] as int,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: json['endTime'] != null
          ? DateTime.parse(json['endTime'] as String)
          : null,
      durationMinutes: json['durationMinutes'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: CardCreator.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  bool get isActive => endTime == null;

  String get formattedDuration {
    if (durationMinutes == null) return 'Running...';
    final hours = durationMinutes! ~/ 60;
    final minutes = durationMinutes! % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }
}
