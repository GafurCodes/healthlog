import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/nutrition_utils.dart';
import '../theme/app_theme.dart';
import '../providers/profile_provider.dart';

class GoalsCalculator extends StatefulWidget {
  final ProfileProvider profileProvider;

  const GoalsCalculator({
    super.key,
    required this.profileProvider,
  });

  @override
  State<GoalsCalculator> createState() => _GoalsCalculatorState();
}

class _GoalsCalculatorState extends State<GoalsCalculator> {
  final _formKey = GlobalKey<FormState>();
  
  // Maintenance calculator form
  String _sex = 'male';
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  final _ageController = TextEditingController();
  String _activityLevel = 'moderate';
  
  // Goal and macros
  String _goal = 'maintain';
  String _mode = 'auto'; // 'auto' or 'custom'
  
  // Results
  Map<String, dynamic>? _result;
  Map<String, int>? _autoMacros;
  
  // Custom macros
  final _customCaloriesController = TextEditingController();
  final _customProteinController = TextEditingController();
  final _customFatController = TextEditingController();
  final _customCarbsController = TextEditingController();
  
  bool _isCalculating = false;
  bool _isSaving = false;
  String? _statusMessage;

  @override
  void dispose() {
    _heightController.dispose();
    _weightController.dispose();
    _ageController.dispose();
    _customCaloriesController.dispose();
    _customProteinController.dispose();
    _customFatController.dispose();
    _customCarbsController.dispose();
    super.dispose();
  }

  Future<void> _calculateMaintenance() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isCalculating = true;
      _statusMessage = null;
    });

    try {
      final result = await ApiService.calculateMaintenanceCalories(
        sex: _sex,
        height: double.parse(_heightController.text),
        weight: double.parse(_weightController.text),
        age: int.parse(_ageController.text),
        activityLevel: _activityLevel,
      );

      setState(() {
        _result = result;
        _updateCaloriesAndMacros(result['tdee'] as int, _goal);
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = 'Failed to calculate: ${e.toString()}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCalculating = false;
        });
      }
    }
  }

  void _updateCaloriesAndMacros(int tdee, String goal) {
    final goalCalories = NutritionUtils.calculateTargetCalories(tdee, goal);
    final macros = NutritionUtils.calculateMacros(goalCalories, goal);
    
    setState(() {
      _autoMacros = {
        'calories': goalCalories,
        'protein': macros['protein']!,
        'fat': macros['fat']!,
        'carbs': macros['carbs']!,
      };
    });
  }

  void _onGoalChanged(String? value) {
    if (value != null) {
      setState(() {
        _goal = value;
      });
      if (_result != null && _result!['tdee'] != null) {
        _updateCaloriesAndMacros(_result!['tdee'] as int, value);
      }
    }
  }

  Future<void> _saveGoals() async {
    setState(() {
      _isSaving = true;
      _statusMessage = null;
    });

    try {
      Map<String, int> payload;
      
      if (_mode == 'auto' && _autoMacros != null) {
        payload = {
          'calories': _autoMacros!['calories']!,
          'protein': _autoMacros!['protein']!,
          'fats': _autoMacros!['fat']!,
          'carbs': _autoMacros!['carbs']!,
        };
      } else {
        payload = {
          'calories': int.parse(_customCaloriesController.text),
          'protein': int.parse(_customProteinController.text),
          'fats': int.parse(_customFatController.text),
          'carbs': int.parse(_customCarbsController.text),
        };
      }

      await widget.profileProvider.updateProfile(
        calories: payload['calories']!,
        protein: payload['protein']!,
        carbs: payload['carbs']!,
        fats: payload['fats']!,
      );

      if (mounted) {
        setState(() {
          _statusMessage = '✅ Goals saved successfully!';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Goals saved successfully!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = '❌ Failed to save goals: ${e.toString()}';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Section 1: Maintenance Calorie Calculator
        _buildSection(
          title: '1️⃣ Maintenance Calorie Calculator',
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildDropdown(
                  label: 'Sex',
                  value: _sex,
                  items: const ['male', 'female'],
                  onChanged: (value) => setState(() => _sex = value!),
                  displayValues: const {
                    'male': 'Male',
                    'female': 'Female',
                  },
                ),
                const SizedBox(height: 16),
                _buildNumberField(
                  controller: _heightController,
                  label: 'Height (cm)',
                  icon: Icons.height,
                ),
                const SizedBox(height: 16),
                _buildNumberField(
                  controller: _weightController,
                  label: 'Weight (kg)',
                  icon: Icons.monitor_weight,
                ),
                const SizedBox(height: 16),
                _buildNumberField(
                  controller: _ageController,
                  label: 'Age',
                  icon: Icons.cake,
                ),
                const SizedBox(height: 16),
                _buildDropdown(
                  label: 'Activity Level',
                  value: _activityLevel,
                  items: const [
                    'sedentary',
                    'light',
                    'moderate',
                    'active',
                    'very_active',
                  ],
                  onChanged: (value) => setState(() => _activityLevel = value!),
                  displayValues: const {
                    'sedentary': 'Sedentary',
                    'light': 'Light',
                    'moderate': 'Moderate',
                    'active': 'Active',
                    'very_active': 'Very Active',
                  },
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isCalculating ? null : _calculateMaintenance,
                  child: _isCalculating
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Calculate Maintenance'),
                ),
                if (_result != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.bgLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'BMR: ${_result!['bmr']} kcal/day',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.text,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'TDEE: ${_result!['tdee']} kcal/day',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.text,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),

        // Section 2: Goal & Macro Setup
        if (_result != null) ...[
          const SizedBox(height: 32),
          _buildSection(
            title: '2️⃣ Goal & Macro Setup',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildDropdown(
                  label: 'Goal Mode',
                  value: _mode,
                  items: const ['auto', 'custom'],
                  onChanged: (value) => setState(() => _mode = value!),
                  displayValues: const {
                    'auto': 'Automatic (Based on Goal)',
                    'custom': 'Custom (Manual Entry)',
                  },
                ),
                const SizedBox(height: 16),
                if (_mode == 'auto') ...[
                  _buildDropdown(
                    label: 'Goal',
                    value: _goal,
                    items: const ['maintain', 'cut', 'bulk'],
                    onChanged: _onGoalChanged,
                    displayValues: const {
                      'maintain': 'Maintain',
                      'cut': 'Cut (Lose Fat)',
                      'bulk': 'Bulk (Gain Muscle)',
                    },
                  ),
                  if (_autoMacros != null) ...[
                    const SizedBox(height: 16),
                    _buildReadOnlyMacroField(
                      label: 'Calories (kcal)',
                      value: _autoMacros!['calories']!.toString(),
                      icon: Icons.local_fire_department,
                    ),
                    const SizedBox(height: 16),
                    _buildReadOnlyMacroField(
                      label: 'Protein (g)',
                      value: _autoMacros!['protein']!.toString(),
                      icon: Icons.fitness_center,
                    ),
                    const SizedBox(height: 16),
                    _buildReadOnlyMacroField(
                      label: 'Fat (g)',
                      value: _autoMacros!['fat']!.toString(),
                      icon: Icons.water_drop,
                    ),
                    const SizedBox(height: 16),
                    _buildReadOnlyMacroField(
                      label: 'Carbs (g)',
                      value: _autoMacros!['carbs']!.toString(),
                      icon: Icons.breakfast_dining,
                    ),
                  ],
                ] else ...[
                  _buildNumberField(
                    controller: _customCaloriesController,
                    label: 'Calories (kcal)',
                    icon: Icons.local_fire_department,
                  ),
                  const SizedBox(height: 16),
                  _buildNumberField(
                    controller: _customProteinController,
                    label: 'Protein (g)',
                    icon: Icons.fitness_center,
                  ),
                  const SizedBox(height: 16),
                  _buildNumberField(
                    controller: _customFatController,
                    label: 'Fat (g)',
                    icon: Icons.water_drop,
                  ),
                  const SizedBox(height: 16),
                  _buildNumberField(
                    controller: _customCarbsController,
                    label: 'Carbs (g)',
                    icon: Icons.breakfast_dining,
                  ),
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _isSaving ? null : _saveGoals,
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Save My Goals'),
                ),
                if (_statusMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _statusMessage!,
                    style: TextStyle(
                      color: _statusMessage!.startsWith('✅')
                          ? AppTheme.success
                          : AppTheme.danger,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSection({
    required String title,
    required Widget child,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.text,
              ),
            ),
            const Divider(height: 24),
            child,
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    Map<String, String>? displayValues,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      items: items.map((item) {
        final displayText = displayValues?[item] ?? item;
        return DropdownMenuItem(
          value: item,
          child: Text(displayText),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildNumberField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.primary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter a value';
        }
        final num = double.tryParse(value);
        if (num == null || num < 0) {
          return 'Please enter a valid number (≥ 0)';
        }
        return null;
      },
    );
  }

  Widget _buildReadOnlyMacroField({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return TextFormField(
      controller: TextEditingController(text: value),
      enabled: false,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.primary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
        ),
        filled: true,
        fillColor: Colors.grey[200],
      ),
    );
  }
}

