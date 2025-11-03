import 'package:flutter/foundation.dart';
import '../models/health_log.dart';
import '../services/api_service.dart';

class HealthLogProvider with ChangeNotifier {
  List<HealthLog> _logs = [];
  int _dailyCaloriesConsumed = 0;
  bool _isLoading = false;
  String? _error;

  List<HealthLog> get logs => _logs;
  int get dailyCaloriesConsumed => _dailyCaloriesConsumed;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> fetchLogs({
    String? type,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getLogs(
        type: type,
        startDate: startDate,
        endDate: endDate,
      );

      if (response['data'] != null) {
        _logs = (response['data'] as List)
            .map((json) => HealthLog.fromJson(json))
            .toList();
      }
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDailyCalories() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final today = DateTime.now();
      final startOfDay = DateTime(today.year, today.month, today.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final response = await ApiService.getDailyCalories(
        startDate: startOfDay,
        endDate: endOfDay,
      );

      _dailyCaloriesConsumed = response['caloriesConsumed'] ?? 0;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createWorkoutLog({
    required int caloriesBurned,
    String? name,
    int? duration,
    String? workoutType,
    String? intensity,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final metrics = <String, dynamic>{
        'caloriesBurned': caloriesBurned,
      };

      if (name != null) metrics['name'] = name;
      if (duration != null) metrics['duration'] = duration;
      if (workoutType != null) metrics['workoutType'] = workoutType;
      if (intensity != null) metrics['intensity'] = intensity;

      await ApiService.createLog(
        type: 'workout',
        metrics: metrics,
        notes: notes,
      );

      // Refresh logs and daily calories
      await Future.wait([
        fetchLogs(),
        fetchDailyCalories(),
      ]);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshData() async {
    await Future.wait([
      fetchLogs(),
      fetchDailyCalories(),
    ]);
  }
}

