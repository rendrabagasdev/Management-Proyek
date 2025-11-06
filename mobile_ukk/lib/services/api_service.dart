import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  late final Dio _dio;
  SharedPreferences? _prefs;
  bool _isInitialized = false;

  // Backend URL - Use localhost for web, 10.0.2.2 for Android emulator
  static const String _baseUrl = 'http://localhost:3000/api/mobile';
  static const String _tokenKey = 'auth_token';

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        contentType: 'application/json',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );

    // Add interceptor for adding token to headers
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            clearToken();
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<void> initialize() async {
    if (!_isInitialized) {
      _prefs = await SharedPreferences.getInstance();
      _isInitialized = true;
    }
  }

  // Auth endpoints
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Dashboard endpoints
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await _dio.get('/dashboard/stats');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Project endpoints
  Future<List<dynamic>> getProjects() async {
    try {
      final response = await _dio.get('/projects');
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getProjectDetail(int projectId) async {
    try {
      final response = await _dio.get('/projects/$projectId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Card endpoints
  Future<Map<String, dynamic>> getCardDetail(int cardId) async {
    try {
      final response = await _dio.get('/cards/$cardId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> updateCardStatus(
    int cardId,
    String status,
  ) async {
    try {
      final response = await _dio.patch(
        '/cards/$cardId',
        data: {'status': status},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> updateCard(
    int cardId,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.patch('/cards/$cardId', data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> resetCard(int cardId) async {
    try {
      final response = await _dio.post('/cards/$cardId/reset');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Time tracking endpoints
  Future<Map<String, dynamic>> startTimer(int cardId) async {
    try {
      final response = await _dio.post('/cards/$cardId/time');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> stopTimer(int cardId, int timeLogId) async {
    try {
      final response = await _dio.patch('/cards/$cardId/time/$timeLogId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<dynamic>> getTimeLogs(int cardId) async {
    try {
      final response = await _dio.get('/cards/$cardId/time');
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Comment endpoints
  Future<Map<String, dynamic>> addComment(int cardId, String content) async {
    try {
      final response = await _dio.post(
        '/cards/$cardId/comments',
        data: {'content': content},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<dynamic>> getComments(int cardId) async {
    try {
      final response = await _dio.get('/cards/$cardId/comments');
      return response.data as List<dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Subtask endpoints
  Future<Map<String, dynamic>> addSubtask(
    int cardId,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.post('/cards/$cardId/subtasks', data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> toggleSubtask(int cardId, int subtaskId) async {
    try {
      final response = await _dio.patch(
        '/cards/$cardId/subtasks/$subtaskId/toggle',
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteSubtask(int cardId, int subtaskId) async {
    try {
      await _dio.delete('/cards/$cardId/subtasks/$subtaskId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // FCM Token endpoints
  Future<void> saveFcmToken(String fcmToken) async {
    try {
      await _dio.post('/fcm-token', data: {'fcmToken': fcmToken});
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> removeFcmToken() async {
    try {
      await _dio.delete('/fcm-token');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Token management
  Future<void> saveToken(String token) async {
    await initialize();
    await _prefs!.setString(_tokenKey, token);
  }

  Future<String?> getToken() async {
    await initialize();
    return _prefs!.getString(_tokenKey);
  }

  Future<void> clearToken() async {
    await initialize();
    await _prefs!.remove(_tokenKey);
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      final message = e.response!.data?['message'] ?? 'An error occurred';
      return message.toString();
    }
    return e.message ?? 'Network error occurred';
  }
}

final apiServiceProvider = ApiService();
