enum Priority {
  LOW,
  MEDIUM,
  HIGH,
  URGENT;

  String get displayName {
    switch (this) {
      case Priority.LOW:
        return 'Low';
      case Priority.MEDIUM:
        return 'Medium';
      case Priority.HIGH:
        return 'High';
      case Priority.URGENT:
        return 'Urgent';
    }
  }

  static Priority fromString(String priority) {
    switch (priority.toUpperCase()) {
      case 'LOW':
        return Priority.LOW;
      case 'MEDIUM':
        return Priority.MEDIUM;
      case 'HIGH':
        return Priority.HIGH;
      case 'URGENT':
        return Priority.URGENT;
      default:
        return Priority.MEDIUM;
    }
  }
}

enum Status {
  TODO,
  IN_PROGRESS,
  REVIEW,
  DONE;

  String get displayName {
    switch (this) {
      case Status.TODO:
        return 'To Do';
      case Status.IN_PROGRESS:
        return 'In Progress';
      case Status.REVIEW:
        return 'Review';
      case Status.DONE:
        return 'Done';
    }
  }

  static Status fromString(String status) {
    switch (status.toUpperCase()) {
      case 'TODO':
        return Status.TODO;
      case 'IN_PROGRESS':
        return Status.IN_PROGRESS;
      case 'REVIEW':
        return Status.REVIEW;
      case 'DONE':
        return Status.DONE;
      default:
        return Status.TODO;
    }
  }
}

class User {
  final int id;
  final String name;

  User({required this.id, required this.name});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(id: json['id'] as int, name: json['name'] as String);
  }
}

class Subtask {
  final int id;
  final String title;
  final Status status;
  final User? assignee;

  Subtask({
    required this.id,
    required this.title,
    required this.status,
    this.assignee,
  });

  factory Subtask.fromJson(Map<String, dynamic> json) {
    return Subtask(
      id: json['id'] as int,
      title: json['title'] as String,
      status: Status.fromString(json['status'] as String),
      assignee: json['assignee'] != null
          ? User.fromJson(json['assignee'])
          : null,
    );
  }
}

class Comment {
  final int id;
  final String content;
  final DateTime createdAt;
  final User user;

  Comment({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.user,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as int,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: User.fromJson(json['user']),
    );
  }
}

class TimeLog {
  final int id;
  final int hours;
  final String? description;
  final DateTime loggedAt;
  final User user;

  TimeLog({
    required this.id,
    required this.hours,
    this.description,
    required this.loggedAt,
    required this.user,
  });

  factory TimeLog.fromJson(Map<String, dynamic> json) {
    return TimeLog(
      id: json['id'] as int,
      hours: json['hours'] as int,
      description: json['description'] as String?,
      loggedAt: DateTime.parse(json['loggedAt'] as String),
      user: User.fromJson(json['user']),
    );
  }
}

class Card {
  final int id;
  final String title;
  final String? description;
  final Priority priority;
  final Status status;
  final DateTime? dueDate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final User creator;
  final List<Subtask> subtasks;
  final List<Comment> comments;
  final List<TimeLog> timeLogs;

  Card({
    required this.id,
    required this.title,
    this.description,
    required this.priority,
    required this.status,
    this.dueDate,
    required this.createdAt,
    required this.updatedAt,
    required this.creator,
    required this.subtasks,
    required this.comments,
    required this.timeLogs,
  });

  factory Card.fromJson(Map<String, dynamic> json) {
    return Card(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      priority: Priority.fromString(json['priority'] as String),
      status: Status.fromString(json['status'] as String),
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      creator: User.fromJson(json['creator']),
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'priority': priority.name,
      'status': status.name,
      'dueDate': dueDate?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
