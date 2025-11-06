enum ProjectRole { LEADER, DEVELOPER, DESIGNER, OBSERVER }

enum GlobalRole { ADMIN, LEADER, MEMBER }

class Project {
  final int id;
  final String name;
  final String? description;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int createdBy;
  final ProjectCreator? creator;
  final List<ProjectMember> members;
  final List<Board> boards;

  Project({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
    required this.updatedAt,
    required this.createdBy,
    this.creator,
    this.members = const [],
    this.boards = const [],
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      createdBy: json['createdBy'] as int,
      creator: json['creator'] != null
          ? ProjectCreator.fromJson(json['creator'] as Map<String, dynamic>)
          : null,
      members:
          (json['members'] as List<dynamic>?)
              ?.map((m) => ProjectMember.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      boards:
          (json['boards'] as List<dynamic>?)
              ?.map((b) => Board.fromJson(b as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'createdBy': createdBy,
      'creator': creator?.toJson(),
      'members': members.map((m) => m.toJson()).toList(),
      'boards': boards.map((b) => b.toJson()).toList(),
    };
  }
}

class ProjectCreator {
  final int id;
  final String name;
  final String email;

  ProjectCreator({required this.id, required this.name, required this.email});

  factory ProjectCreator.fromJson(Map<String, dynamic> json) {
    return ProjectCreator(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'email': email};
  }
}

class ProjectMember {
  final int id;
  final int userId;
  final int projectId;
  final ProjectRole projectRole;
  final DateTime joinedAt;
  final User? user;

  ProjectMember({
    required this.id,
    required this.userId,
    required this.projectId,
    required this.projectRole,
    required this.joinedAt,
    this.user,
  });

  factory ProjectMember.fromJson(Map<String, dynamic> json) {
    return ProjectMember(
      id: json['id'] as int,
      userId: json['userId'] as int,
      projectId: json['projectId'] as int,
      projectRole: _parseProjectRole(json['projectRole'] as String),
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      user: json['user'] != null
          ? User.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'projectId': projectId,
      'projectRole': projectRole.name,
      'joinedAt': joinedAt.toIso8601String(),
      'user': user?.toJson(),
    };
  }

  static ProjectRole _parseProjectRole(String role) {
    return ProjectRole.values.firstWhere(
      (r) => r.name == role,
      orElse: () => ProjectRole.DEVELOPER,
    );
  }
}

class User {
  final int id;
  final String name;
  final String email;
  final GlobalRole globalRole;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.globalRole,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      globalRole: _parseGlobalRole(json['globalRole'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'globalRole': globalRole.name,
    };
  }

  static GlobalRole _parseGlobalRole(String role) {
    return GlobalRole.values.firstWhere(
      (r) => r.name == role,
      orElse: () => GlobalRole.MEMBER,
    );
  }
}

class Board {
  final int id;
  final String name;
  final int position;
  final int projectId;
  final List<dynamic> cards; // Using dynamic for now, will be CardDetail

  Board({
    required this.id,
    required this.name,
    required this.position,
    required this.projectId,
    this.cards = const [],
  });

  factory Board.fromJson(Map<String, dynamic> json) {
    return Board(
      id: json['id'] as int,
      name: json['name'] as String,
      position: json['position'] as int,
      projectId: json['projectId'] as int,
      cards: json['cards'] as List<dynamic>? ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'position': position,
      'projectId': projectId,
      'cards': cards,
    };
  }
}
