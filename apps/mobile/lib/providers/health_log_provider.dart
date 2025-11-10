import 'package:flutter/foundation.dart';
import '../models/health_log.dart';
import '../services/api_service.dart';

class HealthLogProvider with ChangeNotifier {
  List<HealthLog> _logs = [];
  int _dailyCaloriesConsumed = 0;
  int _dailyCaloriesBurned = 0;
  int _dailyProtein = 0;
  int _dailyCarbs = 0;
  int _dailyFat = 0;
  bool _isLoading = false;
  String? _error;

  List<HealthLog> get logs => _logs;
  int get dailyCaloriesConsumed => _dailyCaloriesConsumed;
  int get dailyCaloriesBurned => _dailyCaloriesBurned;
  int get dailyProtein => _dailyProtein;
  int get dailyCarbs => _dailyCarbs;
  int get dailyFat => _dailyFat;
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
    bool setLoading = true,
  }) async {
    if (setLoading) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

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
      if (setLoading) {
        _error = e.toString();
      }
      if (setLoading) {
        rethrow;
      }
    } finally {
      if (setLoading) {
        _isLoading = false;
        notifyListeners();
      }
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

      // Fetch calories consumed from meals
      final response = await ApiService.getDailyCalories(
        startDate: startOfDay,
        endDate: endOfDay,
      );

      _dailyCaloriesConsumed = response['caloriesConsumed'] ?? 0;
      _dailyProtein = response['protein'] ?? 0;
      _dailyCarbs = response['carbs'] ?? 0;
      _dailyFat = response['fat'] ?? 0;

      // Fetch today's logs to calculate calories burned (without setting loading state)
      await fetchLogs(
        startDate: startOfDay,
        endDate: endOfDay,
        setLoading: false,
      );

      // Calculate calories burned from workout logs
      _dailyCaloriesBurned = _logs
          .where((log) => log.type == 'workout')
          .fold(0, (sum, log) => sum + log.caloriesBurned);
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

  Future<void> createMealLog({
    required int calories,
    String? name,
    int? carbs,
    int? protein,
    int? fat,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final metrics = <String, dynamic>{
        'calories': calories,
      };

      if (name != null) metrics['name'] = name;
      if (carbs != null) metrics['carbs'] = carbs;
      if (protein != null) metrics['protein'] = protein;
      if (fat != null) metrics['fat'] = fat;

      await ApiService.createLog(
        type: 'meal',
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

  Future<Map<String, dynamic>?> getDishInfoFromImage(String imageBase64) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getDishInfoFromImage(imageBase64);
      return response;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateLog({
    required String id,
    String? type,
    Map<String, dynamic>? metrics,
    String? notes,
    DateTime? date,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.updateLog(
        id: id,
        type: type,
        metrics: metrics,
        notes: notes,
        date: date,
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

  Future<void> deleteLog(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.deleteLog(id);

      // Remove from local list immediately for better UX
      _logs.removeWhere((log) => log.id == id);
      notifyListeners();

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
}

