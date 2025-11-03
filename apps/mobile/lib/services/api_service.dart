import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api',
  );

  static const String _accessTokenKey = 'accessToken';
  static const String _refreshTokenKey = 'refreshToken';

  static Future<String?> _getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  static Future<void> _setTokens(
    String accessToken,
    String? refreshToken,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    if (refreshToken != null) {
      await prefs.setString(_refreshTokenKey, refreshToken);
    }
  }

  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
  }

  static Future<http.Response> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final headers = <String, String>{'Content-Type': 'application/json'};

    final token = await _getAccessToken();
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
        break;
      case 'POST':
        response = await http.post(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'PUT':
        response = await http.put(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: headers);
        break;
      default:
        throw UnsupportedError('HTTP method $method not supported');
    }

    return response;
  }

  // Auth endpoints
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final response = await _request(
      'POST',
      '/auth/register',
      body: {'email': email, 'password': password, 'name': name},
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Registration failed',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _request(
      'POST',
      '/auth/login',
      body: {'email': email, 'password': password},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tokens = data['tokens'];
      if (tokens != null) {
        await _setTokens(tokens['accessToken'], tokens['refreshToken']);
      }
      return data;
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Login failed',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> verifyEmail({
    required String token,
  }) async {
    final response = await _request(
      'POST',
      '/auth/verify-email',
      body: {'token': token},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Email verification failed',
        statusCode: response.statusCode,
      );
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException({required this.message, required this.statusCode});

  @override
  String toString() => message;
}
