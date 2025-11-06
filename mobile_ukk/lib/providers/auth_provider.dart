import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart';
import '../services/api_service.dart';
import '../models/auth_model.dart';

// Auth state model
class AuthState {
  final User? user;
  final String? token;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.token, this.isLoading = false, this.error});

  AuthState copyWith({
    User? user,
    String? token,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Auth notifier
class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    return const AuthState();
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Initialize API service
      await apiServiceProvider.initialize();

      // Call login API
      final response = await apiServiceProvider.login(
        email: email,
        password: password,
      );

      // Save token
      final token = response['token'] as String?;
      if (token != null) {
        await apiServiceProvider.saveToken(token);
      }

      // Extract user data
      final user = User(
        id: response['user']?['id'] as int? ?? 0,
        name: response['user']?['name'] as String? ?? 'User',
        email: email,
        role: response['user']?['globalRole'] as String? ?? 'MEMBER',
      );

      state = state.copyWith(user: user, token: token, isLoading: false);

      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await apiServiceProvider.clearToken();
    state = const AuthState();
  }

  Future<void> checkAuth() async {
    await apiServiceProvider.initialize();
    final token = await apiServiceProvider.getToken();
    if (token != null) {
      state = state.copyWith(token: token);
    }
  }
}

// Auth provider
final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
