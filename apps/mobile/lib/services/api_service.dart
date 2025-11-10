import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.182.159.244:4000/api',
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

  static Future<Map<String, dynamic>> resendVerificationEmail({
    required String email,
  }) async {
    final response = await _request(
      'POST',
      '/auth/resend-verification-email',
      body: {'email': email},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to resend verification email',
        statusCode: response.statusCode,
      );
    }
  }

  // Log endpoints
  static Future<Map<String, dynamic>> getLogs({
    String? type,
    DateTime? startDate,
    DateTime? endDate,
    int page = 1,
    int pageSize = 100,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };

    if (type != null) {
      queryParams['type'] = type;
    }
    if (startDate != null) {
      queryParams['startDate'] = startDate.toIso8601String();
    }
    if (endDate != null) {
      queryParams['endDate'] = endDate.toIso8601String();
    }

    final uri = Uri(path: '/logs', queryParameters: queryParams);
    final endpoint = uri.toString();

    final response = await _request('GET', endpoint);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to fetch logs',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> createLog({
    required String type,
    required Map<String, dynamic> metrics,
    String? notes,
    DateTime? date,
  }) async {
    final body = <String, dynamic>{'type': type, 'metrics': metrics};

    if (notes != null) {
      body['notes'] = notes;
    }
    if (date != null) {
      body['date'] = date.toIso8601String();
    }

    final response = await _request('POST', '/logs', body: body);

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to create log',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> updateLog({
    required String id,
    String? type,
    Map<String, dynamic>? metrics,
    String? notes,
    DateTime? date,
  }) async {
    final body = <String, dynamic>{};

    if (type != null) {
      body['type'] = type;
    }
    if (metrics != null) {
      body['metrics'] = metrics;
    }
    if (notes != null) {
      body['notes'] = notes;
    }
    if (date != null) {
      body['date'] = date.toIso8601String();
    }

    final response = await _request('PUT', '/logs/$id', body: body);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to update log',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<void> deleteLog(String id) async {
    final response = await _request('DELETE', '/logs/$id');

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to delete log',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> getDailyCalories({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final queryParams = <String, String>{
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
    };

    final uri = Uri(path: '/logs/daily-calories', queryParameters: queryParams);
    final endpoint = uri.toString();

    final response = await _request('GET', endpoint);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to fetch daily calories',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>?> getDishInfoFromImage(
    String imageBase64,
  ) async {
    // Send base64 image in request body to avoid URL length limitations
    final endpoint = '/logs/image';

    final response = await _request(
      'POST',
      endpoint,
      body: {'image_b64': imageBase64},
    );

    if (response.statusCode == 200) {
      // The response body might be:
      // 1. null (if dish not found)
      // 2. A JSON string (if Express stringified a string result)
      // 3. A JSON object (if already parsed)
      final responseBody = response.body.trim();

      if (responseBody == 'null' || responseBody.isEmpty) {
        return null;
      }

      try {
        // Parse the response
        final parsed = jsonDecode(responseBody);

        // If the parsed result is null, return null
        if (parsed == null) {
          return null;
        }

        // If the parsed result is a string (JSON string), parse it again
        if (parsed is String) {
          try {
            return jsonDecode(parsed) as Map<String, dynamic>;
          } catch (e) {
            // If parsing fails, return null
            return null;
          }
        }

        // If it's already a Map, return it
        if (parsed is Map<String, dynamic>) {
          return parsed;
        }

        return null;
      } catch (e) {
        // If parsing fails, return null
        return null;
      }
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to get dish info from image',
        statusCode: response.statusCode,
      );
    }
  }

  // Profile endpoints
  static Future<Map<String, dynamic>> getProfile() async {
    final response = await _request('GET', '/profile');

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 404) {
      // Profile not found is a valid state, return empty data
      return {'data': null};
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to fetch profile',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> updateProfile({
    required Map<String, dynamic> goals,
  }) async {
    final response = await _request('PUT', '/profile', body: {'goals': goals});

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to update profile',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<Map<String, dynamic>> deleteProfile() async {
    final response = await _request('DELETE', '/profile');

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to delete profile',
        statusCode: response.statusCode,
      );
    }
  }

  // Food search endpoints
  static Future<Map<String, dynamic>?> searchFood(String query) async {
    final response = await _request('POST', '/food/search', body: {'query': query});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // API returns null if not found, or an object with nutrition data
      if (data == null) {
        return null;
      }
      return data as Map<String, dynamic>;
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to search food',
        statusCode: response.statusCode,
      );
    }
  }

  static Future<List<Map<String, dynamic>>> autocompleteFood(String query) async {
    final response = await _request('POST', '/food/autocomplete', body: {'query': query});

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is List) {
        return List<Map<String, dynamic>>.from(data);
      }
      return [];
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['message'] ?? 'Failed to fetch food suggestions',
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
