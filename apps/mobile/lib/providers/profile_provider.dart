import 'package:flutter/foundation.dart';
import '../models/profile.dart';
import '../services/api_service.dart';

class ProfileProvider with ChangeNotifier {
  Profile? _profile;
  bool _isLoading = false;
  String? _error;
  bool _goalsExist = false;

  Profile? get profile => _profile;
  ProfileGoals? get goals => _profile?.goals;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get goalsExist => _goalsExist;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> fetchProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getProfile();
      
      if (response['data'] != null) {
        _profile = Profile.fromJson(response['data']);
        _goalsExist = true;
      } else {
        _goalsExist = false;
      }
    } catch (e) {
      final errorMessage = e.toString();
      // Check if it's a "not found" error
      if (errorMessage.toLowerCase().contains('not found') ||
          errorMessage.toLowerCase().contains('404')) {
        _goalsExist = false;
        _error = null; // Don't show error for not found
      } else {
        _error = errorMessage;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({
    required int calories,
    required int protein,
    required int carbs,
    required int fats,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.updateProfile(
        goals: {
          'calories': calories,
          'protein': protein,
          'carbs': carbs,
          'fats': fats,
        },
      );

      if (response['data'] != null) {
        _profile = Profile.fromJson(response['data']);
        _goalsExist = true;
      }
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.deleteProfile();
      _profile = null;
      _goalsExist = false;
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

