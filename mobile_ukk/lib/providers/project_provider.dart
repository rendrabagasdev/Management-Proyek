import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../models/project_model.dart';

// Projects list provider
final projectsProvider = FutureProvider.autoDispose<List<Project>>((ref) async {
  try {
    await apiServiceProvider.initialize();
    final response = await apiServiceProvider.getProjects();

    return response
        .map((json) => Project.fromJson(json as Map<String, dynamic>))
        .toList();
  } catch (e) {
    print('❌ Failed to load projects: $e');
    throw Exception('Failed to load projects: $e');
  }
});

// Single project detail provider
final projectDetailProvider = FutureProvider.autoDispose.family<Project, int>((
  ref,
  projectId,
) async {
  try {
    await apiServiceProvider.initialize();
    final response = await apiServiceProvider.getProjectDetail(projectId);

    return Project.fromJson(response);
  } catch (e) {
    print('❌ Failed to load project detail: $e');
    throw Exception('Failed to load project detail: $e');
  }
});
